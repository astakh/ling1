"""
Роутер уроков
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import User, UserWordProgress, Sentence, LessonSession, LessonAnswer, Word, WordList
from schemas import (
    LessonStartRequest, LessonStartResponse, LessonCardResponse,
    LessonAnswerRequest, LessonAnswerResponse, LessonFinishResponse,
    WordEvaluation
)
from services.fsrs import fsrs_scheduler, FSRSGrade
from services.gigachat import gigachat_service
from services.tts import tts_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lesson", tags=["lesson"])


async def get_current_user_from_token(
    db: AsyncSession = Depends(get_db),
    # Токен будет извлекаться через Depends в main.py
) -> User:
    """Placeholder - будет заменён реальной авторизацией"""
    pass


@router.post("/start", response_model=LessonStartResponse)
async def start_lesson(
    request: LessonStartRequest,
    user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Начало урока: подбор слов для повторения и генерация предложений
    """
    # 1. Получаем слова, которые нужно повторить сегодня
    result = await db.execute(
        select(UserWordProgress)
        .where(and_(
            UserWordProgress.user_id == user.id,
            UserWordProgress.next_review_at <= datetime.utcnow()
        ))
        .order_by(UserWordProgress.next_review_at)
        .limit(user.intensity_reviews)
    )
    due_words = result.scalars().all()

    if not due_words:
        # Если нет слов на повторение, добавляем новые слова из тематического списка
        result = await db.execute(
            select(Word)
            .join(WordList)
            .where(and_(
                WordList.language_id == user.learning_language,
                WordList.topic == request.topic,
                WordList.cefr_level == user.cefr_level
            ))
            .limit(user.intensity_new_words)
        )
        new_words = result.scalars().all()

        # Создаём прогресс для новых слов
        for word in new_words:
            progress = UserWordProgress(
                user_id=user.id,
                word_id=word.id,
                is_custom=False,
                next_review_at=datetime.utcnow()
            )
            db.add(progress)
        await db.flush()

        # Повторяем запрос
        result = await db.execute(
            select(UserWordProgress)
            .where(and_(
                UserWordProgress.user_id == user.id,
                UserWordProgress.next_review_at <= datetime.utcnow()
            ))
            .order_by(UserWordProgress.next_review_at)
            .limit(user.intensity_reviews)
        )
        due_words = result.scalars().all()

    # 2. Группируем слова и генерируем предложения
    cards = []
    for i, word_progress in enumerate(due_words):
        # Получаем текст слова
        if word_progress.is_custom:
            word_text = word_progress.custom_text
        else:
            result = await db.execute(select(Word).where(Word.id == word_progress.word_id))
            word = result.scalar_one_or_none()
            word_text = word.text if word else "word"

        # Проверяем кэш предложений
        result = await db.execute(
            select(Sentence)
            .where(and_(
                Sentence.language_id == user.learning_language,
                Sentence.cefr_level == user.cefr_level,
                Sentence.topic == request.topic,
                Sentence.target_word_ids.contains([word_progress.word_id or 0])
            ))
            .limit(1)
        )
        cached_sentence = result.scalar_one_or_none()

        if cached_sentence:
            sentence_text = cached_sentence.text
            translation = cached_sentence.translation
            audio_url = cached_sentence.audio_url
        else:
            # Генерируем предложение через GigaChat
            try:
                generated = await gigachat_service.generate_sentence(
                    target_words=[word_text],
                    learning_language=user.learning_language,
                    native_language=user.native_language,
                    cefr_level=user.cefr_level,
                    topic=request.topic
                )
                sentence_text = generated["sentence"]
                translation = generated["translation"]

                # Генерируем аудио через TTS
                audio_url = await tts_service.synthesize(
                    text=sentence_text,
                    language=user.learning_language
                )

                # Сохраняем в кэш
                new_sentence = Sentence(
                    language_id=user.learning_language,
                    cefr_level=user.cefr_level,
                    topic=request.topic,
                    text=sentence_text,
                    translation=translation,
                    audio_url=audio_url,
                    target_word_ids=[word_progress.word_id or 0],
                    source="cached_generated"
                )
                db.add(new_sentence)
                await db.flush()
            except Exception as e:
                logger.error(f"Failed to generate sentence: {e}")
                # Fallback
                sentence_text = f"I like {word_text}."
                translation = f"Мне нравится {word_text}."
                audio_url = ""

        cards.append(LessonCardResponse(
            id=i,
            sentence=sentence_text,
            translation=translation,
            target_words=[word_text],
            audio_url=audio_url
        ))

    # 3. Создаём сессию урока
    session = LessonSession(
        user_id=user.id,
        topic=request.topic,
        total_cards=len(cards),
        plan_snapshot={"due_words": len(due_words)}
    )
    db.add(session)
    await db.flush()

    return LessonStartResponse(
        session_id=session.id,
        topic=request.topic,
        cards=cards,
        total_cards=len(cards)
    )


@router.post("/answer", response_model=LessonAnswerResponse)
async def submit_answer(
    request: LessonAnswerRequest,
    user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Оценка ответа пользователя через GigaChat
    """
    # Получаем сессию
    result = await db.execute(
        select(LessonSession)
        .where(LessonSession.id == request.session_id)
        .options(selectinload(LessonSession.answers))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Получаем карточку (предложение)
    # В реальном приложении нужно хранить карточки в сессии
    # Для простоты используем индекс
    if request.card_index >= session.total_cards:
        raise HTTPException(status_code=400, detail="Invalid card index")

    # Получаем предложение из кэша
    result = await db.execute(
        select(Sentence)
        .where(Sentence.topic == session.topic)
        .offset(request.card_index)
        .limit(1)
    )
    sentence = result.scalar_one_or_none()
    if not sentence:
        raise HTTPException(status_code=404, detail="Sentence not found")

    # Оцениваем перевод через GigaChat
    try:
        evaluation = await gigachat_service.evaluate_translation(
            original_sentence=sentence.text,
            user_translation=request.user_translation,
            target_words=sentence.target_word_ids,  # В реальности нужно получить тексты слов
            learning_language=user.learning_language,
            native_language=user.native_language
        )
    except Exception as e:
        logger.error(f"Failed to evaluate translation: {e}")
        evaluation = {
            "evaluations": [],
            "overall_score": 0,
            "feedback": "Ошибка оценки"
        }

    # Сохраняем ответ
    answer = LessonAnswer(
        session_id=session.id,
        sentence_id=sentence.id,
        user_translation_text=request.user_translation,
        llm_word_evaluation=evaluation
    )
    db.add(answer)

    # Обновляем FSRS для целевых слов
    for eval_item in evaluation.get("evaluations", []):
        # Находим прогресс слова
        result = await db.execute(
            select(UserWordProgress)
            .where(and_(
                UserWordProgress.user_id == user.id,
                UserWordProgress.word_id.in_(sentence.target_word_ids)
            ))
        )
        word_progress = result.scalars().first()

        if word_progress:
            # Определяем оценку
            grade = FSRSGrade.GOOD if eval_item["correct"] else FSRSGrade.AGAIN

            # Обновляем FSRS
            fsrs_result = fsrs_scheduler.calculate_next_review(
                current_state=word_progress.fsrs_state,
                stability=word_progress.fsrs_stability,
                difficulty=word_progress.fsrs_difficulty,
                last_review=word_progress.last_review_at,
                grade=grade
            )

            word_progress.fsrs_state = fsrs_result["state"]
            word_progress.fsrs_stability = fsrs_result["stability"]
            word_progress.fsrs_difficulty = fsrs_result["difficulty"]
            word_progress.last_review_at = datetime.utcnow()
            word_progress.next_review_at = fsrs_result["next_review"]
            word_progress.review_count += 1
            if grade == FSRSGrade.AGAIN:
                word_progress.lapses += 1

    await db.flush()

    return LessonAnswerResponse(
        evaluations=[WordEvaluation(**e) for e in evaluation.get("evaluations", [])],
        overall_score=evaluation.get("overall_score", 0),
        feedback=evaluation.get("feedback", ""),
        correct_translation=sentence.translation
    )


@router.post("/finish", response_model=LessonFinishResponse)
async def finish_lesson(
    session_id: int,
    user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Завершение урока и обновление статистики
    """
    result = await db.execute(
        select(LessonSession)
        .where(and_(
            LessonSession.id == session_id,
            LessonSession.user_id == user.id
        ))
        .options(selectinload(LessonSession.answers))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Подсчитываем результаты
    correct = 0
    incorrect = 0
    for answer in session.answers:
        eval_data = answer.llm_word_evaluation or {}
        for eval_item in eval_data.get("evaluations", []):
            if eval_item.get("correct"):
                correct += 1
            else:
                incorrect += 1

    total = correct + incorrect
    accuracy = (correct / total * 100) if total > 0 else 0

    # Обновляем сессию
    session.finished_at = datetime.utcnow()
    session.correct_answers = correct
    session.incorrect_answers = incorrect

    # Обновляем streak пользователя
    today = datetime.utcnow().date()
    if user.last_lesson_date:
        last_date = user.last_lesson_date.date()
        if last_date == today:
            pass  # Уже был урок сегодня
        elif last_date == today - timedelta(days=1):
            user.streak += 1
        else:
            user.streak = 1
    else:
        user.streak = 1

    user.last_lesson_date = datetime.utcnow()
    user.total_words_learned += correct

    await db.flush()

    return LessonFinishResponse(
        session_id=session.id,
        total_cards=session.total_cards,
        correct_answers=correct,
        incorrect_answers=incorrect,
        accuracy=accuracy,
        new_streak=user.streak
    )
