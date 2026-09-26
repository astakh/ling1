"""
Роутер слов и прогресса
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, UserWordProgress, Word
from schemas import CustomWordRequest, WordProgressResponse, StatsResponse

router = APIRouter(prefix="/words", tags=["words"])


async def get_current_user_from_token(
    db: AsyncSession = Depends(get_db),
) -> User:
    """Placeholder"""
    pass


@router.post("/custom", response_model=WordProgressResponse)
async def add_custom_word(
    request: CustomWordRequest,
    user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Добавление пользовательского слова"""
    progress = UserWordProgress(
        user_id=user.id,
        custom_text=request.text,
        custom_translation=request.translation,
        is_custom=True,
        fsrs_state=0,
        fsrs_stability=0.0,
        fsrs_difficulty=5.0,
        next_review_at=datetime.utcnow()
    )
    db.add(progress)
    await db.flush()
    await db.refresh(progress)

    return WordProgressResponse(
        id=progress.id,
        text=request.text,
        translation=request.translation,
        is_custom=True,
        fsrs_state=progress.fsrs_state,
        fsrs_stability=progress.fsrs_stability,
        fsrs_difficulty=progress.fsrs_difficulty,
        last_review_at=progress.last_review_at,
        next_review_at=progress.next_review_at,
        review_count=progress.review_count,
        lapses=progress.lapses
    )


@router.get("/progress", response_model=list[WordProgressResponse])
async def get_word_progress(
    user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Получить прогресс по всем словам пользователя"""
    result = await db.execute(
        select(UserWordProgress)
        .where(UserWordProgress.user_id == user.id)
        .order_by(UserWordProgress.next_review_at)
    )
    progress_list = result.scalars().all()

    responses = []
    for p in progress_list:
        if p.is_custom:
            text = p.custom_text
            translation = p.custom_translation
        else:
            word_result = await db.execute(select(Word).where(Word.id == p.word_id))
            word = word_result.scalar_one_or_none()
            text = word.text if word else "unknown"
            translation = word.translation_hint if word else ""

        responses.append(WordProgressResponse(
            id=p.id,
            text=text,
            translation=translation,
            is_custom=p.is_custom,
            fsrs_state=p.fsrs_state,
            fsrs_stability=p.fsrs_stability,
            fsrs_difficulty=p.fsrs_difficulty,
            last_review_at=p.last_review_at,
            next_review_at=p.next_review_at,
            review_count=p.review_count,
            lapses=p.lapses
        ))

    return responses


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Получить статистику пользователя"""
    result = await db.execute(
        select(UserWordProgress)
        .where(UserWordProgress.user_id == user.id)
    )
    all_progress = result.scalars().all()

    total_words = len(all_progress)
    custom_words = sum(1 for p in all_progress if p.is_custom)
    mastered_words = sum(1 for p in all_progress if p.review_count >= 5)
    learning_words = sum(1 for p in all_progress if 0 < p.review_count < 5)
    new_words = sum(1 for p in all_progress if p.review_count == 0)

    now = datetime.utcnow()
    words_due_today = sum(
        1 for p in all_progress
        if p.next_review_at and p.next_review_at <= now
    )

    # Прогресс по словам
    word_progress_list = []
    for p in all_progress:
        if p.is_custom:
            text = p.custom_text
            translation = p.custom_translation
        else:
            word_result = await db.execute(select(Word).where(Word.id == p.word_id))
            word = word_result.scalar_one_or_none()
            text = word.text if word else "unknown"
            translation = word.translation_hint if word else ""

        word_progress_list.append(WordProgressResponse(
            id=p.id,
            text=text,
            translation=translation,
            is_custom=p.is_custom,
            fsrs_state=p.fsrs_state,
            fsrs_stability=p.fsrs_stability,
            fsrs_difficulty=p.fsrs_difficulty,
            last_review_at=p.last_review_at,
            next_review_at=p.next_review_at,
            review_count=p.review_count,
            lapses=p.lapses
        ))

    return StatsResponse(
        total_words=total_words,
        words_due_today=words_due_today,
        mastered_words=mastered_words,
        learning_words=learning_words,
        new_words=new_words,
        custom_words=custom_words,
        streak=user.streak,
        weekly_activity=[],  # TODO: реализовать
        word_progress=word_progress_list
    )
