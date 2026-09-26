#!/usr/bin/env python3
"""
Скрипт создания тестового пользователя и наполнения БД тестовыми данными
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).parent))

from database import engine, async_session
from models import User, WordList, Word, UserWordProgress
from routers.auth import get_password_hash
from services.fsrs import fsrs_scheduler, FSRSGrade


async def create_test_data():
    """Создать тестовые данные"""
    async with async_session() as session:
        # 1. Создаём тестового пользователя
        print("Creating test user...")
        test_user = User(
            email="test@linguaflow.app",
            password_hash=get_password_hash("test123"),
            native_language="ru",
            learning_language="en",
            cefr_level="B1",
            intensity_new_words=5,
            intensity_reviews=20,
            subscription_status="trial",
            trial_expires_at=datetime.utcnow() + timedelta(days=14),
            streak=5,
            last_lesson_date=datetime.utcnow() - timedelta(days=1),
            total_words_learned=47,
        )
        session.add(test_user)
        await session.flush()
        print(f"   Created user: {test_user.email} (id={test_user.id})")

        # 2. Создаём тематические списки слов
        print("Creating word lists...")
        word_lists = [
            {"language_id": 1, "cefr_level": "B1", "topic": "food", "name": "Еда и рестораны"},
            {"language_id": 1, "cefr_level": "B1", "topic": "travel", "name": "Путешествия"},
            {"language_id": 1, "cefr_level": "B1", "topic": "work", "name": "Работа и бизнес"},
            {"language_id": 1, "cefr_level": "B1", "topic": "family", "name": "Семья и отношения"},
        ]

        created_lists = []
        for wl_data in word_lists:
            wl = WordList(**wl_data)
            session.add(wl)
            await session.flush()
            created_lists.append(wl)
        print(f"   Created {len(created_lists)} word lists")

        # 3. Создаём слова для каждого списка
        print("Creating words...")
        words_data = {
            "food": [
                ("delicious", "восхитительный"),
                ("recipe", "рецепт"),
                ("ingredient", "ингредиент"),
                ("chef", "шеф-повар"),
                ("meal", "блюдо"),
                ("order", "заказывать"),
                ("vegetable", "овощ"),
                ("fruit", "фрукт"),
                ("breakfast", "завтрак"),
                ("cooking", "готовка"),
            ],
            "travel": [
                ("flight", "рейс"),
                ("hotel", "отель"),
                ("suitcase", "чемодан"),
                ("vacation", "отпуск"),
                ("booked", "забронированный"),
                ("located", "расположенный"),
                ("beach", "пляж"),
                ("pack", "паковать"),
                ("trip", "поездка"),
                ("tour", "тур"),
            ],
            "work": [
                ("manager", "менеджер"),
                ("deadline", "дедлайн"),
                ("promotion", "повышение"),
                ("assignment", "задание"),
                ("improve", "улучшать"),
                ("communication", "коммуникация"),
                ("client", "клиент"),
                ("company", "компания"),
                ("competitive", "конкурентный"),
                ("conference", "конференция"),
            ],
            "family": [
                ("grandmother", "бабушка"),
                ("childhood", "детство"),
                ("wonderful", "чудесный"),
                ("children", "дети"),
                ("garden", "сад"),
                ("afternoon", "после полудня"),
                ("celebrate", "праздновать"),
                ("holidays", "праздники"),
                ("brother", "брат"),
                ("university", "университет"),
            ],
        }

        all_words = []
        for wl, words in zip(created_lists, words_data.values()):
            for text, hint in words:
                word = Word(
                    word_list_id=wl.id,
                    language_id=1,
                    text=text,
                    translation_hint=hint,
                )
                session.add(word)
                await session.flush()
                all_words.append(word)

        print(f"   Created {len(all_words)} words")

        # 4. Создаём прогресс FSRS для пользователя
        print("Creating FSRS progress...")
        for i, word in enumerate(all_words[:15]):  # Первые 15 слов
            # Разные состояния для демонстрации
            if i < 5:
                # Слова на повторение сегодня
                next_review = datetime.utcnow() - timedelta(hours=i)
                review_count = i + 1
                state = 2  # REVIEW
            elif i < 10:
                # Слова на повторение завтра
                next_review = datetime.utcnow() + timedelta(days=1)
                review_count = i - 3
                state = 2
            else:
                # Новые слова
                next_review = datetime.utcnow()
                review_count = 0
                state = 0

            progress = UserWordProgress(
                user_id=test_user.id,
                word_id=word.id,
                is_custom=False,
                fsrs_state=state,
                fsrs_stability=2.0 + i * 0.5,
                fsrs_difficulty=3.0 + (i % 5) * 0.5,
                last_review_at=datetime.utcnow() - timedelta(days=i),
                next_review_at=next_review,
                review_count=review_count,
                lapses=i % 3,
            )
            session.add(progress)

        # Добавляем пользовательское слово
        custom_progress = UserWordProgress(
            user_id=test_user.id,
            custom_text="serendipity",
            custom_translation="счастливая случайность",
            is_custom=True,
            fsrs_state=1,
            fsrs_stability=1.5,
            fsrs_difficulty=7.0,
            last_review_at=datetime.utcnow() - timedelta(days=2),
            next_review_at=datetime.utcnow(),
            review_count=1,
            lapses=2,
        )
        session.add(custom_progress)

        await session.commit()
        print(f"   Created {len(all_words[:15]) + 1} word progress entries")

        print()
        print("=" * 60)
        print("✓ Test data created successfully!")
        print("=" * 60)
        print()
        print("Test user credentials:")
        print("  Email: test@linguaflow.app")
        print("  Password: test123")
        print()
        print(f"Created:")
        print(f"  - 1 user")
        print(f"  - {len(created_lists)} word lists")
        print(f"  - {len(all_words)} words")
        print(f"  - {len(all_words[:15]) + 1} word progress entries")
        print()


async def main():
    print("=" * 60)
    print("LinguaFlow Test Data Setup")
    print("=" * 60)
    print()

    try:
        await create_test_data()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
