#!/usr/bin/env python3
"""
Скрипт инициализации базы данных
Создаёт все таблицы и начальные данные
"""
import asyncio
import sys
from pathlib import Path

# Добавляем backend в path
sys.path.insert(0, str(Path(__file__).parent))

from database import init_db, engine
from models import Language


async def create_initial_data():
    """Создать начальные данные (языки)"""
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select

    languages = [
        {"code": "en", "name": "English", "native_name": "English"},
        {"code": "de", "name": "German", "native_name": "Deutsch"},
        {"code": "fr", "name": "French", "native_name": "Français"},
        {"code": "es", "name": "Spanish", "native_name": "Español"},
        {"code": "it", "name": "Italian", "native_name": "Italiano"},
        {"code": "pt", "name": "Portuguese", "native_name": "Português"},
        {"code": "ja", "name": "Japanese", "native_name": "日本語"},
        {"code": "zh", "name": "Chinese", "native_name": "中文"},
        {"code": "ko", "name": "Korean", "native_name": "한국어"},
        {"code": "ar", "name": "Arabic", "native_name": "العربية"},
        {"code": "ru", "name": "Russian", "native_name": "Русский"},
    ]

    async with engine.begin() as conn:
        # Проверяем, есть ли уже языки
        result = await conn.execute(select(Language).limit(1))
        existing = result.scalar_one_or_none()

        if not existing:
            print("Creating initial languages...")
            for lang_data in languages:
                lang = Language(**lang_data)
                conn.add(lang)
            await conn.commit()
            print(f"Created {len(languages)} languages")
        else:
            print("Languages already exist, skipping")


async def main():
    print("Initializing database...")
    await init_db()
    print("Database tables created")

    await create_initial_data()
    print("Database initialization complete!")


if __name__ == "__main__":
    asyncio.run(main())
