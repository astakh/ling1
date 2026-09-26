#!/bin/bash
# Скрипт начальной настройки сервера для LinguaFlow
# Ubuntu 22.04+

set -e

echo "=========================================="
echo "LinguaFlow Server Setup"
echo "=========================================="
echo ""

# 1. Обновление системы
echo "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Установка системных зависимостей
echo "2. Installing system dependencies..."
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
    curl

# 3. Настройка PostgreSQL
echo "3. Setting up PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE USER linguaflow WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE DATABASE linguaflow OWNER linguaflow;
GRANT ALL PRIVILEGES ON DATABASE linguaflow TO linguaflow;
EOF
echo "   PostgreSQL configured"

# 4. Настройка backend
echo "4. Setting up backend..."
cd /opt/linguaflow/backend || exit 1

python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Копируем .env если его нет
if [ ! -f .env ]; then
    cp .env.example .env
    echo "   IMPORTANT: Edit /opt/linguaflow/backend/.env with your settings!"
fi

# Инициализация БД
python init_db.py

# Установка TTS модели
echo "   Downloading TTS model (this may take a while)..."
python setup_tts.py || echo "   Warning: TTS model download failed, you can run setup_tts.py manually"

# 5. Настройка systemd service
echo "5. Setting up systemd service..."
sudo tee /etc/systemd/system/linguaflow-backend.service > /dev/null <<EOF
[Unit]
Description=LinguaFlow Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/linguaflow/backend
Environment="PATH=/opt/linguaflow/backend/venv/bin"
ExecStart=/opt/linguaflow/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable linguaflow-backend
sudo systemctl start linguaflow-backend

# 6. Настройка Nginx
echo "6. Setting up Nginx..."
sudo tee /etc/nginx/sites-available/linguaflow > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (static files)
    location / {
        root /opt/linguaflow/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api/ {
        rewrite ^/api/(.*) /\$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Audio files (cached TTS)
    location /audio/ {
        alias /opt/linguaflow/backend/audio_cache/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/linguaflow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 7. Настройка HTTPS (опционально)
echo "7. Setting up HTTPS..."
echo "   Run: sudo certbot --nginx -d your-domain.com"

echo ""
echo "=========================================="
echo "✓ Server setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Edit /opt/linguaflow/backend/.env"
echo "     - Set SECRET_KEY"
echo "     - Set GIGACHAT_AUTH_TOKEN"
echo "     - Set DATABASE_URL password"
echo "  2. Build frontend: cd /opt/linguaflow && npm run build"
echo "  3. Update Nginx config with your domain"
echo "  4. Setup HTTPS: sudo certbot --nginx -d your-domain.com"
echo ""
echo "Services:"
echo "  Backend: sudo systemctl status linguaflow-backend"
echo "  Nginx:   sudo systemctl status nginx"
echo "  Logs:    sudo journalctl -u linguaflow-backend -f"
echo ""
