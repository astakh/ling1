"""
Сервис TTS на базе Silero TTS (бесплатная локальная модель)
https://github.com/snakers4/silero-models

Silero TTS поддерживает: русский, английский, немецкий, испанский и другие языки.
Модель загружается один раз и работает локально без внешних API.
"""
import hashlib
import logging
import os
from pathlib import Path
from typing import Optional

import torch
from config import settings

logger = logging.getLogger(__name__)


class TTSModel:
    """Обёртка над Silero TTS моделью"""

    def __init__(self):
        self.model = None
        self.sample_rate = settings.TTS_SAMPLE_RATE
        self._initialized = False

    def initialize(self):
        """Загрузка модели Silero TTS"""
        if self._initialized:
            return

        try:
            logger.info("Loading Silero TTS model...")
            device = torch.device("cpu")
            torch.set_num_threads(4)

            # Silero TTS загружается через torch hub
            self.model, _ = torch.hub.load(
                repo_or_dir="snakers4/silero-models",
                model="silero_tts",
                language="multi",  # мультиязычная модель
                speaker="multi_v2",  # мультиязычный спикер
                trust_repo=True,
            )
            self.model.to(device)
            self._initialized = True
            logger.info("Silero TTS model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Silero TTS: {e}")
            raise

    def synthesize(
        self,
        text: str,
        language: str = "en",
        speaker: Optional[str] = None
    ) -> bytes:
        """
        Синтез речи из текста
        
        Args:
            text: текст для озвучивания
            language: код языка (en, de, fr, es, ru)
            speaker: имя спикера (опционально)
            
        Returns:
            WAV audio bytes
        """
        if not self._initialized:
            self.initialize()

        # Определяем спикера для языка
        if speaker is None:
            voice_config = settings.TTS_VOICES.get(language, {"speaker": "en_0"})
            speaker = voice_config["speaker"]

        # Генерация аудио
        audio = self.model.apply_tts(
            text=text,
            speaker=speaker,
            sample_rate=self.sample_rate,
        )

        # Конвертация в WAV bytes
        import io
        import soundfile as sf

        buffer = io.BytesIO()
        sf.write(buffer, audio.numpy(), self.sample_rate, format="WAV", subtype="PCM_16")
        buffer.seek(0)
        return buffer.read()


class TTSService:
    """
    Сервис TTS с кэшированием аудиофайлов
    
    Кэширование работает по хэшу (текст + язык + спикер),
    чтобы избежать повторной генерации для одинаковых запросов.
    """

    def __init__(self):
        self.tts_model = TTSModel()
        self.audio_dir = Path(settings.TTS_AUDIO_DIR)
        self.audio_dir.mkdir(parents=True, exist_ok=True)

    def _get_cache_key(self, text: str, language: str, speaker: Optional[str] = None) -> str:
        """Вычислить хэш для кэширования"""
        key_str = f"{text}|{language}|{speaker or 'default'}"
        return hashlib.md5(key_str.encode()).hexdigest()

    def _get_cache_path(self, cache_key: str) -> Path:
        return self.audio_dir / f"{cache_key}.wav"

    async def synthesize(
        self,
        text: str,
        language: str = "en",
        speaker: Optional[str] = None
    ) -> str:
        """
        Синтез речи с кэшированием
        
        Returns:
            Путь к аудиофайлу (относительный для раздачи через HTTP)
        """
        cache_key = self._get_cache_key(text, language, speaker)
        cache_path = self._get_cache_path(cache_key)

        # Проверяем кэш
        if cache_path.exists():
            logger.debug(f"TTS cache hit: {cache_key}")
            return f"/audio/{cache_key}.wav"

        # Генерируем аудио
        logger.info(f"Generating TTS for: {text[:50]}...")
        try:
            audio_bytes = self.tts_model.synthesize(text, language, speaker)

            # Сохраняем в кэш
            with open(cache_path, "wb") as f:
                f.write(audio_bytes)

            return f"/audio/{cache_key}.wav"
        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            raise

    def initialize(self):
        """Инициализация модели при старте приложения"""
        self.tts_model.initialize()


# Singleton
tts_service = TTSService()
