"""
Конфигурация приложения LinguaFlow
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "LinguaFlow"
    DEBUG: bool = False
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://linguaflow:linguaflow@localhost:5432/linguaflow"
    )

    # GigaChat API
    GIGACHAT_AUTH_TOKEN: str = os.getenv("GIGACHAT_AUTH_TOKEN", "")
    GIGACHAT_SCOPE: str = os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")
    GIGACHAT_MODEL: str = os.getenv("GIGACHAT_MODEL", "GigaChat")
    GIGACHAT_API_BASE: str = "https://gigachat.devices.sberbank.ru/api/v1"
    GIGACHAT_VERIFY_SSL: bool = True  # Для прод; False для тестов с self-signed

    # TTS (Silero)
    TTS_MODEL_DIR: str = os.getenv("TTS_MODEL_DIR", str(Path(__file__).parent / "tts_models"))
    TTS_SAMPLE_RATE: int = 48000
    TTS_AUDIO_DIR: str = os.getenv("TTS_AUDIO_DIR", str(Path(__file__).parent / "audio_cache"))

    # Supported languages with Silero voice mappings
    TTS_VOICES: dict = {
        "en": {"speaker": "en_0", "lang": "en"},
        "de": {"speaker": "de_0", "lang": "de"},
        "fr": {"speaker": "fr_0", "lang": "fr"},
        "es": {"speaker": "es_0", "lang": "es"},
        "ru": {"speaker": "ru_0", "lang": "ru"},
    }

    # FSRS parameters
    FSRS_REQUEST_RETENTION: float = 0.9
    FSRS_MAXIMUM_INTERVAL: int = 36500
    FSRS_W: list = [
        0.4, 0.6, 2.4, 8.1,  # initial stability for again/hard/good/easy
        7.0, 0.5, 0.6, 0.04,  # difficulty params
        1.5, 0.1, 0.9, 0.3,   # stability params
        0.2, 0.05, 0.5, 0.1,  # more params
        0.3, 1.3, 0.1, 0.1,   # more
        0.8, 3.2              # final
    ]

    # Subscription
    TRIAL_DAYS: int = 14

    # CORS
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
