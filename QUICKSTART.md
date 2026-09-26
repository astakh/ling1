# LinguaFlow — Быстрый старт на mindroom.ru

## ⚡ Быстрая установка (5 шагов)

### 1. Создание базы данных

```bash
cd /opt/linguaflow/backend
sudo bash create_database.sh
```

### 2. Настройка .env

```bash
sudo nano /opt/linguaflow/backend/.env
```

Замените:
- `SECRET_KEY` → `openssl rand -hex 32`
- `DATABASE_URL` → пароль из шага 1
- `GIGACHAT_AUTH_TOKEN` → токен с https://developers.sber.ru

### 3. Инициализация БД

```bash
cd /opt/linguaflow/backend
sudo -u www-linguaflow bash -c "source venv/bin/activate && python init_db.py"
```

### 4. Настройка Nginx + HTTPS

```bash
# Конфиг уже создан в /etc/nginx/sites-available/linguaflow
sudo ln -sf /etc/nginx/sites-available/linguaflow /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS
sudo certbot --nginx -d mindroom.ru -d www.mindroom.ru
```

### 5. Запуск

```bash
sudo systemctl start linguaflow-backend
sudo systemctl enable linguaflow-backend
```

**Готово!** Откройте https://mindroom.ru

---

## 🔧 Полезные команды

### Статус и логи

```bash
# Статус backend
sudo systemctl status linguaflow-backend

# Логи backend (в реальном времени)
sudo journalctl -u linguaflow-backend -f

# Логи Nginx
sudo tail -f /var/log/nginx/linguaflow_error.log
```

### Перезапуск

```bash
# Перезапуск backend
sudo systemctl restart linguaflow-backend

# Перезапуск Nginx
sudo systemctl restart nginx
```

### Обновление

```bash
cd /opt/linguaflow
bash backend/deploy.sh
```

### Проверка установки

```bash
bash backend/check_installation.sh
```

---

## 📊 Мониторинг

```bash
# Размер БД
sudo -u postgres psql -d linguaflow -c "SELECT pg_size_pretty(pg_database_size('linguaflow'));"

# Размер кэша аудио
du -sh /opt/linguaflow/backend/audio_cache

# Использование ресурсов
htop
```

---

## 🆘 Troubleshooting

### Backend не запускается

```bash
sudo journalctl -u linguaflow-backend -n 50
```

### Ошибка БД

```bash
# Проверка подключения
psql -h localhost -U linguaflow -d linguaflow
```

### Nginx 502

```bash
# Проверьте backend
curl http://localhost:8000/health

# Логи Nginx
sudo tail -n 50 /var/log/nginx/linguaflow_error.log
```

---

## 📚 Документация

- Полная инструкция: `INSTALL.md`
- GigaChat: `backend/docs/GIGACHAT_INTEGRATION.md`
- TTS: `backend/docs/TTS_SETUP.md`
- API: https://mindroom.ru/api/docs

---

## ✅ Чеклист

- [ ] БД создана (`create_database.sh`)
- [ ] `.env` настроен (пароль, GigaChat токен)
- [ ] БД инициализирована (`init_db.py`)
- [ ] Nginx настроен
- [ ] HTTPS работает (certbot)
- [ ] Backend запущен
- [ ] Сайт открывается: https://mindroom.ru
