# Инструкция по установке LinguaFlow на сервер Ubuntu

**Домен:** mindroom.ru  
**ОС:** Ubuntu 22.04+  
**База данных:** PostgreSQL (уже установлен)

---

## 📋 Содержание

1. [Подготовка сервера](#1-подготовка-сервера)
2. [Создание базы данных](#2-создание-базы-данных)
3. [Клонирование проекта](#3-клонирование-проекта)
4. [Настройка backend](#4-настройка-backend)
5. [Настройка frontend](#5-настройка-frontend)
6. [Получение токена GigaChat](#6-получение-токена-gigachat)
7. [Установка TTS модели](#7-установка-tts-модели)
8. [Настройка Nginx](#8-настройка-nginx)
9. [Настройка HTTPS](#9-настройка-https)
10. [Запуск и проверка](#10-запуск-и-проверка)
11. [Обслуживание](#11-обслуживание)

---

## 1. Подготовка сервера

### 1.1. Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2. Установка необходимых пакетов

```bash
sudo apt install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    postgresql \
    postgresql-contrib \
    nginx \
    certbot \
    python3-certbot-nginx \
    libsndfile1 \
    git \
    curl \
    build-essential
```

### 1.3. Проверка PostgreSQL

```bash
sudo systemctl status postgresql
```

Должно быть `active (running)`.

---

## 2. Создание базы данных

### 2.1. Создание пользователя и БД

```bash
# Войдите в PostgreSQL
sudo -u postgres psql
```

В консоли PostgreSQL выполните:

```sql
-- Создаём пользователя с паролем
CREATE USER linguaflow WITH PASSWORD 'YourSecurePassword123!';

-- Создаём базу данных
CREATE DATABASE linguaflow OWNER linguaflow;

-- Даём привилегии
GRANT ALL PRIVILEGES ON DATABASE linguaflow TO linguaflow;

-- Подключаемся к БД для дополнительных настроек
\c linguaflow

-- Даём права на схему public
GRANT ALL ON SCHEMA public TO linguaflow;

-- Выход
\q
```

### 2.2. Проверка подключения

```bash
# Попробуйте подключиться
psql -h localhost -U linguaflow -d linguaflow

# Если запросит пароль, введите: YourSecurePassword123!
# Должны увидеть приглашение: linguaflow=>

# Выйдите
\q
```

**⚠️ ВАЖНО:** Запомните пароль `YourSecurePassword123!` — он понадобится для `.env`

---

## 3. Клонирование проекта

### 3.1. Создание директории

```bash
# Создаём директорию для проекта
sudo mkdir -p /opt/linguaflow
cd /opt/linguaflow

# Если проект на GitHub:
# sudo git clone https://github.com/your-repo/linguaflow.git .

# Если проект локально, скопируйте файлы:
# sudo cp -r /path/to/linguaflow/* /opt/linguaflow/
```

### 3.2. Установка прав

```bash
# Создаём пользователя для приложения
sudo useradd -r -s /bin/false www-linguaflow

# Устанавливаем владельца
sudo chown -R www-linguaflow:www-linguaflow /opt/linguaflow
```

---

## 4. Настройка backend

### 4.1. Создание виртуального окружения

```bash
cd /opt/linguaflow/backend

# Создаём venv
sudo -u www-linguaflow python3.11 -m venv venv

# Активируем
sudo -u www-linguaflow bash -c "source venv/bin/activate && pip install --upgrade pip"
```

### 4.2. Установка зависимостей

```bash
sudo -u www-linguaflow bash -c "source venv/bin/activate && pip install -r requirements.txt"
```

### 4.3. Создание .env файла

```bash
sudo -u www-linguaflow nano /opt/linguaflow/backend/.env
```

Вставьте содержимое:

```env
# Application
SECRET_KEY=change-this-to-random-secret-key-at-least-32-chars-long
DEBUG=false

# Database (PostgreSQL)
# ВАЖНО: используйте пароль из шага 2.1
DATABASE_URL=postgresql+asyncpg://linguaflow:YourSecurePassword123!@localhost:5432/linguaflow

# GigaChat API
# Получите токен на https://developers.sber.ru/studio/workspaces
GIGACHAT_AUTH_TOKEN=your-gigachat-token-here
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_MODEL=GigaChat
GIGACHAT_VERIFY_SSL=true

# TTS (Silero)
TTS_MODEL_DIR=/opt/linguaflow/backend/tts_models
TTS_AUDIO_DIR=/opt/linguaflow/backend/audio_cache
TTS_SAMPLE_RATE=48000

# CORS
CORS_ORIGINS=["https://mindroom.ru","http://localhost:3000"]
```

**Замените:**
- `SECRET_KEY` — сгенерируйте случайную строку: `openssl rand -hex 32`
- `YourSecurePassword123!` — пароль из шага 2.1
- `GIGACHAT_AUTH_TOKEN` — токен из GigaChat (см. раздел 6)

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### 4.4. Инициализация базы данных

```bash
cd /opt/linguaflow/backend
sudo -u www-linguaflow bash -c "source venv/bin/activate && python init_db.py"
```

Должно вывести:
```
Initializing database...
Database tables created
Creating initial languages...
Created 11 languages
Database initialization complete!
```

### 4.5. Создание тестовых данных (опционально)

```bash
sudo -u www-linguaflow bash -c "source venv/bin/activate && python create_test_data.py"
```

Это создаст тестового пользователя:
- Email: `test@linguaflow.app`
- Password: `test123`

---

## 5. Настройка frontend

### 5.1. Установка Node.js

```bash
# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 5.2. Установка зависимостей

```bash
cd /opt/linguaflow
sudo -u www-linguaflow npm install
```

### 5.3. Сборка frontend

```bash
sudo -u www-linguaflow npm run build
```

Должно создать директорию `dist/` с собранными файлами.

### 5.4. Создание .env для frontend (опционально)

```bash
sudo -u www-linguaflow nano /opt/linguaflow/.env
```

```env
VITE_API_URL=https://mindroom.ru/api
```

Сохраните.

---

## 6. Получение токена GigaChat

### 6.1. Регистрация

1. Перейдите на https://developers.sber.ru
2. Войдите или зарегистрируйтесь
3. Подтвердите email

### 6.2. Создание проекта

1. В личном кабинете → "Мои проекты" → "Создать проект"
2. Заполните:
   - **Название:** LinguaFlow
   - **Описание:** Приложение для изучения иностранных слов
   - **Тип:** API
3. Нажмите "Создать"

### 6.3. Подключение GigaChat

1. В проекте → "Сервисы" → "Подключить сервис"
2. Выберите "GigaChat"
3. Подтвердите подключение

### 6.4. Получение токена

1. В проекте → "Настройки" → "Авторизация"
2. Нажмите "Создать токен"
3. Выберите тип:
   - **GIGACHAT_API_PERS** — для физического лица (дешевле)
   - **GIGACHAT_API_CORP** — для юридического лица
4. Скопируйте токен (длинная строка)
5. **⚠️ Сохраните токен в безопасном месте!**

### 6.5. Вставка токена в .env

```bash
sudo -u www-linguaflow nano /opt/linguaflow/backend/.env
```

Замените `your-gigachat-token-here` на скопированный токен.

---

## 7. Установка TTS модели

### 7.1. Запуск скрипта установки

```bash
cd /opt/linguaflow/backend
sudo -u www-linguaflow bash -c "source venv/bin/activate && python setup_tts.py"
```

Процесс:
1. Проверит PyTorch
2. Загрузит модель Silero TTS (~100 MB)
3. Протестирует генерацию

Должно вывести:
```
✓ TTS setup complete!
```

**⚠️ Примечание:** Первая загрузка может занять 2-5 минут.

### 7.2. Создание директории для аудио

```bash
sudo mkdir -p /opt/linguaflow/backend/audio_cache
sudo chown -R www-linguaflow:www-linguaflow /opt/linguaflow/backend/audio_cache
```

---

## 8. Настройка Nginx

### 8.1. Создание конфигурации

```bash
sudo nano /etc/nginx/sites-available/linguaflow
```

Вставьте:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name mindroom.ru www.mindroom.ru;

    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mindroom.ru www.mindroom.ru;

    # SSL certificates (будут добавлены certbot)
    # ssl_certificate /etc/letsencrypt/live/mindroom.ru/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/mindroom.ru/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend (React SPA)
    root /opt/linguaflow/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend API docs
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_set_header Host $host;
    }

    location /redoc {
        proxy_pass http://127.0.0.1:8000/redoc;
        proxy_set_header Host $host;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
        proxy_set_header Host $host;
    }

    # Audio files (cached TTS)
    location /audio/ {
        alias /opt/linguaflow/backend/audio_cache/;
        
        # Cache for 1 year
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # CORS for audio
        add_header Access-Control-Allow-Origin *;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_set_header Host $host;
    }

    # Logs
    access_log /var/log/nginx/linguaflow_access.log;
    error_log /var/log/nginx/linguaflow_error.log;
}
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### 8.2. Активация конфигурации

```bash
# Создаём символическую ссылку
sudo ln -sf /etc/nginx/sites-available/linguaflow /etc/nginx/sites-enabled/

# Удаляем дефолтную конфигурацию
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
sudo nginx -t
```

Должно вывести:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 8.3. Перезапуск Nginx

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 9. Настройка HTTPS

### 9.1. Установка SSL сертификата

```bash
sudo certbot --nginx -d mindroom.ru -d www.mindroom.ru
```

Certbot спросит:
1. **Email address:** ваш email для уведомлений
2. **Agree to terms:** Y
3. **Share email with EFF:** N (опционально)

Процесс:
- Проверит домен
- Получит сертификат
- Автоматически обновит Nginx конфиг
- Настроит автообновление

Должно вывести:
```
Congratulations! You have successfully enabled
https://mindroom.ru and https://www.mindroom.ru
```

### 9.2. Проверка автообновления

```bash
sudo certbot renew --dry-run
```

Должно пройти успешно.

---

## 10. Запуск и проверка

### 10.1. Создание systemd service

```bash
sudo nano /etc/systemd/system/linguaflow-backend.service
```

Вставьте:

```ini
[Unit]
Description=LinguaFlow Backend API
Documentation=https://mindroom.ru
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=www-linguaflow
Group=www-linguaflow

WorkingDirectory=/opt/linguaflow/backend
Environment="PATH=/opt/linguaflow/backend/venv/bin"
Environment="PYTHONPATH=/opt/linguaflow/backend"

# Start command
ExecStart=/opt/linguaflow/backend/venv/bin/uvicorn main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --workers 4 \
    --log-level info

# Restart policy
Restart=always
RestartSec=5

# Security
NoNewPrivileges=true
PrivateTmp=true

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=linguaflow-backend

[Install]
WantedBy=multi-user.target
```

Сохраните.

### 10.2. Запуск backend

```bash
# Перезагружаем systemd
sudo systemctl daemon-reload

# Включаем автозапуск
sudo systemctl enable linguaflow-backend

# Запускаем
sudo systemctl start linguaflow-backend

# Проверяем статус
sudo systemctl status linguaflow-backend
```

Должно быть `active (running)`.

### 10.3. Проверка работы

```bash
# Логи backend
sudo journalctl -u linguaflow-backend -f

# В другом терминале проверьте API
curl http://localhost:8000/health
```

Должно вывести:
```json
{"status":"healthy"}
```

### 10.4. Проверка через браузер

Откройте в браузере:

1. **https://mindroom.ru** — frontend
2. **https://mindroom.ru/api/docs** — Swagger документация
3. **https://mindroom.ru/api/health** — health check

### 10.5. Тестовый вход

Используйте тестового пользователя (если создавали в шаге 4.5):
- Email: `test@linguaflow.app`
- Password: `test123`

---

## 11. Обслуживание

### 11.1. Полезные команды

```bash
# Статус backend
sudo systemctl status linguaflow-backend

# Перезапуск backend
sudo systemctl restart linguaflow-backend

# Логи backend (в реальном времени)
sudo journalctl -u linguaflow-backend -f

# Логи Nginx
sudo tail -f /var/log/nginx/linguaflow_access.log
sudo tail -f /var/log/nginx/linguaflow_error.log

# Остановка backend
sudo systemctl stop linguaflow-backend
```

### 11.2. Обновление кода

```bash
cd /opt/linguaflow

# Остановите backend
sudo systemctl stop linguaflow-backend

# Обновите код
sudo git pull  # или скопируйте новые файлы

# Обновите зависимости backend
cd backend
sudo -u www-linguaflow bash -c "source venv/bin/activate && pip install -r requirements.txt"

# Миграции БД (если есть)
# sudo -u www-linguaflow bash -c "source venv/bin/activate && alembic upgrade head"

# Пересоберите frontend
cd /opt/linguaflow
sudo -u www-linguaflow npm install
sudo -u www-linguaflow npm run build

# Запустите backend
sudo systemctl start linguaflow-backend
```

### 11.3. Резервное копирование

```bash
# Создаём скрипт бэкапа
sudo nano /opt/linguaflow/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/linguaflow"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Бэкап БД
sudo -u postgres pg_dump linguaflow | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Бэкап аудио
tar -czf $BACKUP_DIR/audio_$DATE.tar.gz -C /opt/linguaflow/backend audio_cache

# Удалить старые бэкапы (старше 30 дней)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
sudo chmod +x /opt/linguaflow/backup.sh

# Добавляем в cron (ежедневно в 3:00)
sudo crontab -e
```

Добавьте строку:
```
0 3 * * * /opt/linguaflow/backup.sh >> /var/log/linguaflow_backup.log 2>&1
```

### 11.4. Мониторинг

```bash
# Использование ресурсов
htop

# Размер БД
sudo -u postgres psql -d linguaflow -c "SELECT pg_size_pretty(pg_database_size('linguaflow'));"

# Размер кэша аудио
du -sh /opt/linguaflow/backend/audio_cache

# Количество файлов в кэше
ls /opt/linguaflow/backend/audio_cache | wc -l
```

### 11.5. Очистка кэша

```bash
# Удалить аудио старше 30 дней
find /opt/linguaflow/backend/audio_cache -type f -mtime +30 -delete

# Очистить весь кэш
sudo rm -rf /opt/linguaflow/backend/audio_cache/*
sudo mkdir -p /opt/linguaflow/backend/audio_cache
sudo chown www-linguaflow:www-linguaflow /opt/linguaflow/backend/audio_cache
```

---

## 🔧 Troubleshooting

### Backend не запускается

```bash
# Проверьте логи
sudo journalctl -u linguaflow-backend -n 50

# Попробуйте запустить вручную
cd /opt/linguaflow/backend
sudo -u www-linguaflow bash -c "source venv/bin/activate && python main.py"
```

### Ошибка подключения к БД

```bash
# Проверьте PostgreSQL
sudo systemctl status postgresql

# Проверьте .env
cat /opt/linguaflow/backend/.env | grep DATABASE_URL

# Попробуйте подключиться вручную
psql -h localhost -U linguaflow -d linguaflow
```

### Ошибка GigaChat

```bash
# Проверьте токен
cat /opt/linguaflow/backend/.env | grep GIGACHAT_AUTH_TOKEN

# Проверьте логи
sudo journalctl -u linguaflow-backend | grep -i gigachat
```

### Nginx 502 Bad Gateway

```bash
# Проверьте, запущен ли backend
sudo systemctl status linguaflow-backend

# Проверьте порт
sudo netstat -tlnp | grep 8000

# Проверьте логи Nginx
sudo tail -n 50 /var/log/nginx/linguaflow_error.log
```

### TTS не работает

```bash
# Проверьте наличие модели
ls -lh ~/.cache/torch/hub/

# Переустановите модель
sudo -u www-linguaflow bash -c "source /opt/linguaflow/backend/venv/bin/activate && python /opt/linguaflow/backend/setup_tts.py"
```

---

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте логи: `sudo journalctl -u linguaflow-backend -f`
2. Проверьте документацию: `/opt/linguaflow/backend/docs/`
3. Проверьте API: https://mindroom.ru/api/docs

---

## ✅ Чеклист после установки

- [ ] PostgreSQL работает
- [ ] База данных создана
- [ ] Backend запущен (`systemctl status linguaflow-backend`)
- [ ] Frontend собран (директория `dist/` существует)
- [ ] Nginx настроен и перезапущен
- [ ] HTTPS работает (https://mindroom.ru)
- [ ] GigaChat токен настроен
- [ ] TTS модель загружена
- [ ] Тестовый пользователь создан (опционально)
- [ ] Бэкапы настроены
- [ ] API доступен: https://mindroom.ru/api/health

---

**Готово!** Ваше приложение LinguaFlow работает на https://mindroom.ru 🎉
