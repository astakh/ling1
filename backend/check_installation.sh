#!/bin/bash
# Скрипт проверки установки LinguaFlow
# Запуск: bash check_installation.sh

echo "=========================================="
echo "LinguaFlow Installation Check"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# 1. Проверка системных пакетов
echo "1. System packages..."
for pkg in python3.11 postgresql nginx libsndfile1; do
    if dpkg -l | grep -q "^ii  $pkg"; then
        echo "   ✓ $pkg installed"
    else
        echo "   ✗ $pkg NOT installed"
        ((ERRORS++))
    fi
done
echo ""

# 2. Проверка PostgreSQL
echo "2. PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    echo "   ✓ PostgreSQL is running"
    
    # Проверяем БД
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw linguaflow; then
        echo "   ✓ Database 'linguaflow' exists"
    else
        echo "   ✗ Database 'linguaflow' NOT found"
        ((ERRORS++))
    fi
    
    # Проверяем пользователя
    if sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = 'linguaflow'" | grep -q 1; then
        echo "   ✓ User 'linguaflow' exists"
    else
        echo "   ✗ User 'linguaflow' NOT found"
        ((ERRORS++))
    fi
else
    echo "   ✗ PostgreSQL is NOT running"
    ((ERRORS++))
fi
echo ""

# 3. Проверка проекта
echo "3. Project files..."
if [ -d "/opt/linguaflow" ]; then
    echo "   ✓ /opt/linguaflow exists"
    
    if [ -d "/opt/linguaflow/backend" ]; then
        echo "   ✓ Backend directory exists"
    else
        echo "   ✗ Backend directory NOT found"
        ((ERRORS++))
    fi
    
    if [ -d "/opt/linguaflow/dist" ]; then
        echo "   ✓ Frontend built (dist/ exists)"
    else
        echo "   ✗ Frontend NOT built (dist/ missing)"
        ((ERRORS++))
    fi
else
    echo "   ✗ /opt/linguaflow NOT found"
    ((ERRORS++))
fi
echo ""

# 4. Проверка backend
echo "4. Backend..."
if [ -f "/opt/linguaflow/backend/venv/bin/activate" ]; then
    echo "   ✓ Virtual environment exists"
else
    echo "   ✗ Virtual environment NOT found"
    ((ERRORS++))
fi

if [ -f "/opt/linguaflow/backend/.env" ]; then
    echo "   ✓ .env file exists"
    
    # Проверяем критичные переменные
    if grep -q "GIGACHAT_AUTH_TOKEN=your-gigachat-token-here" /opt/linguaflow/backend/.env 2>/dev/null; then
        echo "   ⚠ GigaChat token NOT configured"
        ((WARNINGS++))
    elif grep -q "GIGACHAT_AUTH_TOKEN=" /opt/linguaflow/backend/.env; then
        echo "   ✓ GigaChat token configured"
    fi
else
    echo "   ✗ .env file NOT found"
    ((ERRORS++))
fi

if [ -d "/opt/linguaflow/backend/audio_cache" ]; then
    echo "   ✓ Audio cache directory exists"
    AUDIO_COUNT=$(ls /opt/linguaflow/backend/audio_cache 2>/dev/null | wc -l)
    echo "   ℹ Audio files cached: $AUDIO_COUNT"
else
    echo "   ⚠ Audio cache directory NOT found"
    ((WARNINGS++))
fi
echo ""

# 5. Проверка Nginx
echo "5. Nginx..."
if systemctl is-active --quiet nginx; then
    echo "   ✓ Nginx is running"
    
    if [ -L "/etc/nginx/sites-enabled/linguaflow" ]; then
        echo "   ✓ Linguaflow site enabled"
    else
        echo "   ✗ Linguaflow site NOT enabled"
        ((ERRORS++))
    fi
    
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        echo "   ✓ Nginx config is valid"
    else
        echo "   ✗ Nginx config has errors"
        ((ERRORS++))
    fi
else
    echo "   ✗ Nginx is NOT running"
    ((ERRORS++))
fi
echo ""

# 6. Проверка HTTPS
echo "6. HTTPS..."
if [ -d "/etc/letsencrypt/live/mindroom.ru" ]; then
    echo "   ✓ SSL certificate exists"
    
    # Проверяем срок действия
    if sudo openssl x509 -checkend 0 -noout -in /etc/letsencrypt/live/mindroom.ru/fullchain.pem 2>/dev/null; then
        echo "   ✓ Certificate is valid"
    else
        echo "   ⚠ Certificate may be expired"
        ((WARNINGS++))
    fi
else
    echo "   ⚠ SSL certificate NOT found (run certbot)"
    ((WARNINGS++))
fi
echo ""

# 7. Проверка systemd service
echo "7. Backend service..."
if [ -f "/etc/systemd/system/linguaflow-backend.service" ]; then
    echo "   ✓ Service file exists"
    
    if systemctl is-active --quiet linguaflow-backend; then
        echo "   ✓ Service is running"
        
        # Проверяем health endpoint
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "   ✓ Backend API is responding"
        else
            echo "   ⚠ Backend API not responding on localhost:8000"
            ((WARNINGS++))
        fi
    else
        echo "   ✗ Service is NOT running"
        ((ERRORS++))
    fi
else
    echo "   ✗ Service file NOT found"
    ((ERRORS++))
fi
echo ""

# 8. Проверка TTS
echo "8. TTS model..."
if [ -d "$HOME/.cache/torch/hub/snakers4_silero-models_master" ] || [ -d "$HOME/.cache/torch/hub/snakers4_silero-models" ]; then
    echo "   ✓ Silero TTS model downloaded"
else
    echo "   ⚠ Silero TTS model NOT found (run setup_tts.py)"
    ((WARNINGS++))
fi
echo ""

# Итог
echo "=========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✓ All checks passed!"
    echo "=========================================="
    echo ""
    echo "Your LinguaFlow installation is ready!"
    echo "Visit: https://mindroom.ru"
elif [ $ERRORS -eq 0 ]; then
    echo "⚠ Installation mostly OK ($WARNINGS warnings)"
    echo "=========================================="
    echo ""
    echo "Fix warnings for optimal experience."
else
    echo "✗ Installation has issues ($ERRORS errors, $WARNINGS warnings)"
    echo "=========================================="
    echo ""
    echo "Please fix the errors above."
    echo "See INSTALL.md for detailed instructions."
fi
echo ""
