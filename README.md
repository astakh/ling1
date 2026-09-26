# LinguaFlow

Веб-приложение для изучения иностранных слов методом интервального повторения в контексте предложений.

## 🎯 Особенности

- **Контекстное обучение** — слова изучаются в составе осмысленных предложений, а не изолированно
- **AI-генерация** — предложения генерируются через GigaChat с учётом уровня и тематики
- **Озвучивание** — локальная TTS модель (Silero) для произношения
- **FSRS алгоритм** — оптимальные интервалы повторения
- **Адаптивность** — система подстраивается под ваш прогресс

## 🏗️ Архитектура

```
┌─────────────────┐
│   Frontend      │  React + TypeScript + Tailwind
│   (SPA)         │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│   Backend       │  FastAPI + Python
│   (API)         │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬──────────┐
    ▼         ▼            ▼          ▼
┌────────┐ ┌──────────┐ ┌──────┐ ┌─────────┐
│Postgres│ │ GigaChat │ │Silero│ │  FSRS   │
│   QL   │ │   API    │ │ TTS  │ │Algorithm│
└────────┘ └──────────┘ └──────┘ └─────────┘
```

## 🚀 Быстрый старт

### Frontend (демо-режим)

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка для продакшена
npm run build
```

Frontend будет доступен на http://localhost:5173

**Демо-режим**: фронтенд работает автономно с mock-данными, если backend недоступен.

### Backend (полная версия)

#### 1. Системные требования

- Python 3.11+
- PostgreSQL 14+
- Node.js 18+ (для frontend)

#### 2. Установка backend

```bash
cd backend

# Создать виртуальное окружение
python3.11 -m venv venv
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Настроить конфигурацию
cp .env.example .env
# Отредактировать .env (указать DATABASE_URL, GIGACHAT_AUTH_TOKEN)

# Инициализировать БД
python init_db.py

# Установить TTS модель (опционально)
python setup_tts.py

# Запустить сервер
python main.py
```

Backend будет доступен на http://localhost:8000
API документация: http://localhost:8000/docs

#### 3. Настройка PostgreSQL

```bash
# Создать пользователя и БД
sudo -u postgres psql

CREATE USER linguaflow WITH PASSWORD 'your-password';
CREATE DATABASE linguaflow OWNER linguaflow;
\q
```

#### 4. Получение GigaChat токена

1. Зарегистрируйтесь на https://developers.sber.ru
2. Создайте проект в GigaChat API
3. Получите Authorization Token
4. Укажите токен в `backend/.env`:
   ```
   GIGACHAT_AUTH_TOKEN=your-token-here
   ```

## 📁 Структура проекта

```
linguaflow/
├── src/                    # Frontend (React)
│   ├── pages/             # Страницы приложения
│   ├── store.tsx          # State management
│   ├── api.ts             # API клиент
│   └── App.tsx            # Главный компонент
├── backend/               # Backend (FastAPI)
│   ├── main.py           # Точка входа
│   ├── config.py         # Конфигурация
│   ├── models.py         # SQLAlchemy модели
│   ├── schemas.py        # Pydantic схемы
│   ├── routers/          # API endpoints
│   │   ├── auth.py      # Авторизация
│   │   ├── lesson.py    # Уроки
│   │   └── words.py     # Слова
│   ├── services/         # Бизнес-логика
│   │   ├── fsrs.py      # Алгоритм FSRS
│   │   ├── gigachat.py  # Интеграция с GigaChat
│   │   └── tts.py       # Синтез речи
│   ├── requirements.txt
│   └── README.md
└── README.md              # Этот файл
```

## 🔧 Технологии

### Frontend
- **React 18** — UI фреймворк
- **TypeScript** — типизация
- **Tailwind CSS** — стилизация
- **React Router** — маршрутизация
- **Framer Motion** — анимации
- **Recharts** — графики

### Backend
- **FastAPI** — веб-фреймворк
- **SQLAlchemy 2.0** — ORM
- **PostgreSQL** — база данных
- **GigaChat API** — генерация предложений и оценка переводов
- **Silero TTS** — локальный синтез речи
- **FSRS** — алгоритм интервального повторения

## 📖 API Endpoints

### Авторизация
- `POST /auth/register` — регистрация
- `POST /auth/login` — вход

### Уроки
- `POST /lesson/start` — начать урок
- `POST /lesson/answer` — отправить ответ
- `POST /lesson/finish` — завершить урок

### Слова
- `POST /words/custom` — добавить слово
- `GET /words/progress` — прогресс
- `GET /words/stats` — статистика

## 🎨 Функциональность

### Для пользователей
1. **Регистрация и онбординг** — выбор языков, уровня, интенсивности
2. **Дашборд** — статистика, streak, слова на повторение
3. **Уроки** — перевод предложений с AI-оценкой
4. **Словарь** — добавление своих слов
5. **Статистика** — прогресс, графики, детали FSRS
6. **Настройки** — изменение параметров обучения

### Технические возможности
- **Кэширование предложений** — повторное использование сгенерированных предложений
- **Кэширование аудио** — TTS генерируется один раз
- **FSRS алгоритм** — адаптивные интервалы повторения
- **Демо-режим** — frontend работает без backend

## 🔐 Безопасность

- JWT токены для авторизации
- Хеширование паролей (bcrypt)
- HTTPS для продакшена
- Валидация входных данных
- CORS конфигурация

## 📊 Мониторинг

Backend предоставляет endpoints для мониторинга:
- `GET /health` — проверка здоровья
- `GET /docs` — Swagger документация
- `GET /redoc` — ReDoc документация

## 🚢 Deployment

### Production checklist

- [ ] Настроить PostgreSQL
- [ ] Получить GigaChat токен
- [ ] Установить Silero TTS модель
- [ ] Настроить `.env` файл
- [ ] Настроить systemd service
- [ ] Настроить Nginx reverse proxy
- [ ] Включить HTTPS (Let's Encrypt)
- [ ] Настроить бэкапы БД
- [ ] Настроить логирование

### Systemd service

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

## 📝 Лицензия

MIT

## 👥 Команда

Проект разработан в соответствии с техническим заданием.

## 🔗 Ссылки

- [GigaChat API](https://developers.sber.ru/docs/ru/gigachat/api/overview)
- [Silero TTS](https://github.com/snakers4/silero-models)
- [FSRS Algorithm](https://github.com/open-spaced-repetition/fsrs4anki)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
