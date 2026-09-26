# Локальная TTS модель (Silero)

## Обзор

Для озвучивания предложений используется **Silero TTS** — бесплатная open-source модель синтеза речи от Сбер.

### Преимущества
- ✅ Полностью бесплатная
- ✅ Работает локально (без внешних API)
- ✅ Поддерживает множество языков
- ✅ Высокое качество голоса
- ✅ Низкие требования к ресурсам

### Поддерживаемые языки

| Язык | Код | Голос | Качество |
|------|-----|-------|----------|
| Русский | ru | ru_0 | Отличное |
| Английский | en | en_0 | Хорошее |
| Немецкий | de | de_0 | Хорошее |
| Французский | fr | fr_0 | Хорошее |
| Испанский | es | es_0 | Хорошее |

## Установка

### 1. Системные зависимости

```bash
# Ubuntu/Debian
sudo apt install -y libsndfile1 python3.11

# macOS
brew install libsndfile
```

### 2. Python зависимости

```bash
pip install torch torchaudio soundfile
```

### 3. Загрузка модели

```bash
cd backend
python setup_tts.py
```

Модель загрузится автоматически при первом вызове (размер ~100 MB).

## Использование

### В коде

```python
from services.tts import tts_service

# Синтез речи
audio_url = await tts_service.synthesize(
    text="Hello, this is a test.",
    language="en"
)
# audio_url = "/audio/abc123def456.wav"
```

### Кэширование

Все аудиофайлы кэшируются в `backend/audio_cache/`.
Повторные запросы с тем же текстом не требуют генерации.

Ключ кэша: `MD5(текст + язык + спикер)`

## Настройка

### Параметры в config.py

```python
TTS_SAMPLE_RATE = 48000  # Частота дискретизации (Hz)
TTS_AUDIO_DIR = "./audio_cache"  # Директория для кэша
```

### Выбор голоса

```python
TTS_VOICES = {
    "en": {"speaker": "en_0", "lang": "en"},
    "de": {"speaker": "de_0", "lang": "de"},
    # ...
}
```

## Производительность

### Требования к серверу

| Параметр | Минимум | Рекомендация |
|----------|---------|--------------|
| CPU | 2 ядра | 4+ ядра |
| RAM | 2 GB | 4+ GB |
| Диск | 1 GB | 10+ GB (для кэша) |

### Скорость генерации

- Среднее предложение (10-15 слов): ~0.5-2 секунды
- Кэшированный запрос: мгновенно

### Оптимизация

1. **Кэширование**: включено по умолчанию
2. **GPU**: модель работает на CPU, но поддерживает CUDA
3. **Batch processing**: для массовой генерации

## Обслуживание

### Очистка кэша

```bash
# Удалить все кэшированные аудиофайлы
rm -rf backend/audio_cache/*

# Удалить файлы старше 30 дней
find backend/audio_cache -type f -mtime +30 -delete
```

### Мониторинг

```bash
# Размер кэша
du -sh backend/audio_cache

# Количество файлов
ls backend/audio_cache | wc -l
```

## Troubleshooting

### Ошибка загрузки модели

```
RuntimeError: Failed to load model
```

Решение:
```bash
# Удалить кэш модели и загрузить заново
rm -rf ~/.cache/torch/hub/snakers4_silero-models*
python setup_tts.py
```

### Ошибка генерации аудио

```
soundfile.LibsndfileError: Error opening...
```

Решение:
```bash
sudo apt install libsndfile1
```

### Медленная генерация

- Проверьте загрузку CPU: `htop`
- Уменьшите `TTS_SAMPLE_RATE` до 24000
- Используйте GPU (если доступен)

## Альтернативные TTS

Если Silero не подходит, можно использовать:

### 1. Piper TTS
- Быстрее Silero
- Больше голосов
- https://github.com/rhasspy/piper

### 2. Coqui TTS
- Высокое качество
- Больше языков
- https://github.com/coqui-ai/TTS

### 3. MMS (Meta)
- 1000+ языков
- https://github.com/facebookresearch/fairseq/tree/main/examples/mms

## Ссылки

- [Silero Models](https://github.com/snakers4/silero-models)
- [Silero TTS Examples](https://github.com/snakers4/silero-models#text-to-speech)
- [PyTorch Audio](https://pytorch.org/audio/stable/index.html)
