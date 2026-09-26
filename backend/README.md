# LinguaFlow Backend

Backend для приложения изучения иностранных слов методом интервального повторения.

## Технологии

- **FastAPI** — веб-фреймворк
- **PostgreSQL** — база данных
- **SQLAlchemy 2.0** — ORM
- **GigaChat API** — генерация предложений и оценка переводов
- **Silero TTS** — локальная модель синтеза речи (бесплатная)
- **FSRS** — алгоритм интервального повторения

## Установка

### 1. Системные зависимости

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip postgresql postgresql-contrib libsndfile1

# Создаём пользователя и БД
sudo -u postgres psql
CREATE USER linguaflow WITH PASSWORD 'your-password';
CREATE DATABASE linguaflow OWNER linguaflow;
\q
```

### 2. Python зависимости

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Конфигурация

```bash
cp .env.example .env
# Отредактируйте .env, укажите:
# - DATABASE_URL
# - GIGACHAT_AUTH_TOKEN (получите на https://developers.sber.ru/studio/workspaces)
# - SECRET_KEY
```

### 4. Запуск

```bash
# Активируйте виртуальное окружение
source venv/bin/activate

# Запустите сервер
python main.py

# Или через uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API будет доступно на http://localhost:8000
Документация Swagger: http://localhost:8000/docs

## Структура проекта

```
backend/
├── main.py              # Точка входа FastAPI
├── config.py            # Конфигурация
├── database.py          # Подключение к БД
├── models.py            # SQLAlchemy модели
├── schemas.py           # Pydantic схемы
├── requirements.txt     # Зависимости
├── .env.example         # Пример конфигурации
├── routers/
│   ├── auth.py         # Авторизация
│   ├── lesson.py       # Уроки
│   └── words.py        # Слова и прогресс
├── services/
│   ├── fsrs.py         # Алгоритм FSRS
│   ├── gigachat.py     # Интеграция с GigaChat
│   └── tts.py          # Синтез речи (Silero)
├── tts_models/          # Модели TTS (создаётся автоматически)
└── audio_cache/         # Кэш аудиофайлов
```

## API Endpoints

### Авторизация
- `POST /auth/register` — регистрация
- `POST /auth/login` — вход, получение JWT токена

### Уроки
- `POST /lesson/start` — начать урок (подбор слов, генерация предложений)
- `POST /lesson/answer` — отправить ответ, получить оценку
- `POST /lesson/finish` — завершить урок

### Слова
- `POST /words/custom` — добавить пользовательское слово
- `GET /words/progress` — получить прогресс по словам
- `GET /words/stats` — получить статистику

## GigaChat интеграция

Для работы с GigaChat необходимо:
1. Зарегистрироваться на https://developers.sber.ru
2. Создать проект и получить Authorization Token
3. Указать токен в `.env` файле

GigaChat используется для:
- Генерации предложений с целевыми словами
- Оценки переводов пользователя

## TTS (Silero)

Silero TTS — бесплатная локальная модель синтеза речи.
- Поддерживает: русский, английский, немецкий, французский, испанский
- Модель загружается автоматически при первом запуске
- Аудио кэшируется в `audio_cache/`

## FSRS алгоритм

Реализован алгоритм FSRS-4.5 (Free Spaced Repetition Scheduler).
Параметры настраиваются в `config.py`:
- `FSRS_REQUEST_RETENTION` — целевая запоминаемость (0.9)
- `FSRS_MAXIMUM_INTERVAL` — максимальный интервал (36500 дней)
- `FSRS_W` — веса алгоритма

## Deployment

### Systemd service

```bash
sudo nano /etc/systemd/system/linguaflow-backend.service
```

```ini
[Unit]
Description=LinguaFlow Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/backend/venv/bin"
ExecStart=/path/to/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable linguaflow-backend
sudo systemctl start linguaflow-backend
```

### Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name api.linguaflow.app;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /audio/ {
        alias /path/to/backend/audio_cache/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Лицензия

MIT
