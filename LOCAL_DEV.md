# Локальная разработка в VS Code

## 📋 Требования

### Обязательные
- **Node.js 18+** — для frontend
- **VS Code** — редактор кода
- **Git** — для клонирования проекта

### Опциональные (для полного запуска)
- **Python 3.11+** — для backend
- **PostgreSQL 14+** — база данных
- **Токен GigaChat** — для AI функций

---

## 🚀 Быстрый старт (только frontend, демо-режим)

Самый простой способ проверить UI — запустить frontend в демо-режиме. Backend не требуется.

### 1. Установка Node.js

**Windows/macOS:**
- Скачайте с https://nodejs.org (версия 18.x LTS)
- Установите, следуя инструкциям

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Проверка:**
```bash
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 2. Открытие проекта в VS Code

```bash
# Если проект на GitHub
git clone https://github.com/your-repo/linguaflow.git
cd linguaflow
code .

# Если проект локально
cd /path/to/linguaflow
code .
```

### 3. Установка зависимостей

Откройте терминал в VS Code (`Ctrl+~` или `Terminal → New Terminal`):

```bash
npm install
```

Это установит все необходимые пакеты (React, Tailwind, и т.д.).

### 4. Запуск frontend

```bash
npm run dev
```

Откроется на http://localhost:3000

### 5. Проверка

Откройте браузер: http://localhost:3000

**Демо-вход:**
- Нажмите "Демо-вход" на странице логина
- Или введите любой email/пароль

Вы увидите:
- ✅ Онбординг (выбор языков, уровня)
- ✅ Дашборд с статистикой
- ✅ Выбор темы урока
- ✅ Урок с предложениями
- ✅ Разбор результатов
- ✅ Статистика и настройки

**Примечание:** В демо-режиме данные хранятся в localStorage браузера. AI-функции (GigaChat, TTS) работают через браузерные API (SpeechSynthesis для озвучки).

---

## 🔧 Полный запуск (frontend + backend)

Если хотите проверить backend с реальной БД и AI.

### 1. Установка PostgreSQL

**Windows:**
- Скачайте с https://www.postgresql.org/download/windows/
- Установите, запомните пароль пользователя `postgres`

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu):**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Создание базы данных

**Windows (через pgAdmin или командную строку):**
```bash
# Войдите в psql
psql -U postgres

# В консоли PostgreSQL:
CREATE USER linguaflow WITH PASSWORD 'dev123';
CREATE DATABASE linguaflow OWNER linguaflow;
GRANT ALL PRIVILEGES ON DATABASE linguaflow TO linguaflow;
\q
```

**macOS/Linux:**
```bash
# Войдите в psql
sudo -u postgres psql

# Те же команды:
CREATE USER linguaflow WITH PASSWORD 'dev123';
CREATE DATABASE linguaflow OWNER linguaflow;
GRANT ALL PRIVILEGES ON DATABASE linguaflow TO linguaflow;
\q
```

### 3. Настройка backend

```bash
cd backend

# Создайте виртуальное окружение
python -m venv venv

# Активируйте
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

### 4. Создание .env файла

```bash
# Windows:
copy .env.example .env
# macOS/Linux:
cp .env.example .env
```

Отредактируйте `.env`:

```env
# Application
SECRET_KEY=dev-secret-key-for-local-development-only
DEBUG=true

# Database
# Windows:
DATABASE_URL=postgresql+asyncpg://linguaflow:dev123@localhost:5432/linguaflow
# macOS/Linux (если другой порт):
# DATABASE_URL=postgresql+asyncpg://linguaflow:dev123@localhost:5432/linguaflow

# GigaChat API (опционально, можно оставить пустым для теста)
GIGACHAT_AUTH_TOKEN=
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_MODEL=GigaChat
GIGACHAT_VERIFY_SSL=false

# TTS
TTS_MODEL_DIR=./tts_models
TTS_AUDIO_DIR=./audio_cache
TTS_SAMPLE_RATE=48000

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

### 5. Инициализация базы данных

```bash
# Убедитесь, что venv активирован
python init_db.py
```

Должно вывести:
```
Initializing database...
Database tables created
Creating initial languages...
Created 11 languages
Database initialization complete!
```

### 6. (Опционально) Создание тестовых данных

```bash
python create_test_data.py
```

Создаст тестового пользователя:
- Email: `test@linguaflow.app`
- Password: `test123`

### 7. Запуск backend

```bash
python main.py
```

Или через uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend запустится на http://localhost:8000

**API документация:** http://localhost:8000/docs

### 8. Настройка frontend для работы с backend

Создайте файл `.env` в корне проекта (рядом с `package.json`):

```bash
# Windows:
echo VITE_API_URL=http://localhost:8000 > .env
# macOS/Linux:
echo "VITE_API_URL=http://localhost:8000" > .env
```

### 9. Перезапуск frontend

```bash
# Остановите (Ctrl+C) и запустите снова
npm run dev
```

Теперь frontend будет работать с реальным backend.

---

## 🧪 Проверка работоспособности

### Frontend (демо-режим)

1. Откройте http://localhost:3000
2. Нажмите "Демо-вход"
3. Пройдите онбординг
4. Выберите тему урока
5. Переведите несколько предложений
6. Проверьте статистику

**Ожидаемое поведение:**
- ✅ Все экраны открываются
- ✅ Можно вводить переводы
- ✅ Озвучка работает (через браузерный SpeechSynthesis)
- ✅ Данные сохраняются в localStorage

### Backend (полный режим)

1. Откройте http://localhost:8000/docs
2. Должна открыться Swagger документация
3. Проверьте endpoints:
   - `GET /health` → `{"status":"healthy"}`
   - `POST /auth/register` → создать пользователя
   - `POST /auth/login` → получить токен

**Тест через curl:**
```bash
# Health check
curl http://localhost:8000/health

# Регистрация
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Вход
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Интеграция frontend + backend

1. Откройте http://localhost:3000
2. Зарегистрируйтесь или войдите
3. Frontend должен работать с реальным backend
4. Проверьте в консоли браузера (F12 → Network) — запросы идут на localhost:8000

---

## 🛠️ Рекомендуемые расширения VS Code

### Обязательные
- **ES7+ React/Redux/React-Native snippets** — сниппеты для React
- **Tailwind CSS IntelliSense** — автодополнение Tailwind
- **TypeScript Vue Plugin (Volar)** — поддержка TypeScript
- **Prettier - Code formatter** — форматирование кода
- **ESLint** — линтер для JavaScript/TypeScript

### Для backend
- **Python** — поддержка Python
- **Pylance** — IntelliSense для Python
- **Python Environment Manager** — управление venv
- **SQLite Viewer** — просмотр БД (опционально)

### Полезные
- **GitLens** — улучшения для Git
- **Auto Rename Tag** — автопереименование HTML тегов
- **Live Share** — совместная работа (опционально)

---

## 📝 Полезные команды VS Code

### Терминал
```bash
# Новый терминал
Ctrl+~

# Переключение между терминалами
Ctrl+PageUp / Ctrl+PageDown

# Разделить терминал
Ctrl+Shift+5
```

### Запуск задач
Создайте `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Frontend: Dev Server",
      "type": "shell",
      "command": "npm run dev",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "Backend: Dev Server",
      "type": "shell",
      "command": "cd backend && python main.py",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "Frontend: Build",
      "type": "shell",
      "command": "npm run build",
      "group": "build",
      "problemMatcher": []
    }
  ]
}
```

Запуск: `Terminal → Run Task` (или `Ctrl+Shift+P` → `Tasks: Run Task`)

---

## 🐛 Типичные проблемы

### Frontend

**Проблема:** `npm install` выдаёт ошибки
```bash
# Решение: очистите кэш
rm -rf node_modules package-lock.json
npm install
```

**Проблема:** Порт 3000 занят
```bash
# Решение: измените порт в vite.config.js
# Или найдите процесс:
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -ti:3000 | xargs kill -9
```

**Проблема:** Белый экран после загрузки
```bash
# Проверьте консоль браузера (F12)
# Убедитесь, что все зависимости установлены
npm install
```

### Backend

**Проблема:** `ModuleNotFoundError: No module named 'fastapi'`
```bash
# Решение: активируйте venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Переустановите зависимости
pip install -r requirements.txt
```

**Проблема:** Ошибка подключения к PostgreSQL
```bash
# Проверьте, запущен ли PostgreSQL
# Windows: services.msc → PostgreSQL
# macOS: brew services list
# Linux: sudo systemctl status postgresql

# Проверьте .env
cat .env | grep DATABASE_URL

# Попробуйте подключиться вручную
psql -h localhost -U linguaflow -d linguaflow
```

**Проблема:** `psycopg2` не устанавливается
```bash
# Windows: используйте asyncpg (уже в requirements.txt)
# macOS:
brew install postgresql
pip install psycopg2-binary

# Linux:
sudo apt install libpq-dev python3-dev
pip install psycopg2-binary
```

**Проблема:** Порт 8000 занят
```bash
# Найдите процесс:
# Windows: netstat -ano | findstr :8000
# macOS/Linux: lsof -ti:8000 | xargs kill -9

# Или измените порт в main.py
```

### Интеграция

**Проблема:** Frontend не видит backend (CORS ошибки)
```bash
# Проверьте .env backend
cat backend/.env | grep CORS_ORIGINS

# Должно быть:
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# Перезапустите backend
```

**Проблема:** Frontend работает в демо-режиме, хотя backend запущен
```bash
# Проверьте .env frontend
cat .env | grep VITE_API_URL

# Должно быть:
VITE_API_URL=http://localhost:8000

# Перезапустите frontend
npm run dev
```

---

## 📊 Отладка

### Frontend

**React DevTools:**
- Установите расширение для Chrome/Firefox
- Откройте DevTools → Components/Profiler

**Console logs:**
```typescript
// Добавьте в код
console.log('Debug:', data);
```

**Network tab:**
- F12 → Network
- Проверяйте запросы к API

### Backend

**Логи:**
```bash
# Backend выводит логи в терминал
# Увеличьте детализацию в main.py:
logging.basicConfig(level=logging.DEBUG)
```

**Swagger UI:**
- Откройте http://localhost:8000/docs
- Тестируйте endpoints напрямую

**Postman/Insomnia:**
- Импортируйте OpenAPI spec: http://localhost:8000/openapi.json

---

## 🎯 Что проверить после запуска

### Чеклист

- [ ] Frontend открывается на http://localhost:3000
- [ ] Можно войти в демо-режиме
- [ ] Онбординг работает (выбор языков, уровня)
- [ ] Дашборд отображается
- [ ] Можно выбрать тему урока
- [ ] Урок открывается с предложениями
- [ ] Можно ввести перевод
- [ ] Озвучка работает (кнопка "Прослушать")
- [ ] Разбор результатов отображается
- [ ] Статистика обновляется
- [ ] Настройки сохраняются

### Если backend запущен

- [ ] Backend отвечает на http://localhost:8000/health
- [ ] Swagger docs открывается на http://localhost:8000/docs
- [ ] Можно зарегистрироваться через API
- [ ] Можно войти и получить токен
- [ ] Frontend работает с реальным backend (проверьте Network tab)
- [ ] Данные сохраняются в PostgreSQL

---

## 📚 Дополнительные ресурсы

- **React Docs:** https://react.dev
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Tailwind CSS:** https://tailwindcss.com
- **TypeScript:** https://www.typescriptlang.org

---

## 💡 Советы по разработке

### Горячая перезагрузка

Frontend автоматически перезагружается при изменении кода (HMR).

Для backend используйте `--reload`:
```bash
uvicorn main:app --reload
```

### Работа с Git

```bash
# Статус
git status

# Коммит
git add .
git commit -m "feat: add new feature"

# Пуш
git push origin main
```

### Переключение между режимами

**Демо-режим (без backend):**
- Удалите `.env` в корне проекта
- Frontend автоматически переключится в демо-режим

**Полный режим (с backend):**
- Создайте `.env` с `VITE_API_URL=http://localhost:8000`
- Запустите backend
- Перезапустите frontend

---

**Готово к разработке!** 🚀

Если возникли проблемы — проверьте раздел "Типичные проблемы" выше.
