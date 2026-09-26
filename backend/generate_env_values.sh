#!/bin/bash
# Генератор безопасных значений для .env файла
# Использование: bash generate_env_values.sh

echo "=========================================="
echo "LinguaFlow Environment Values Generator"
echo "=========================================="
echo ""

# 1. SECRET_KEY
echo "1. SECRET_KEY (для JWT токенов):"
SECRET_KEY=$(openssl rand -hex 32)
echo "   $SECRET_KEY"
echo ""

# 2. Database password
echo "2. Database password (для PostgreSQL):"
DB_PASSWORD=$(openssl rand -base64 16 | tr -d '=+/' | cut -c1-20)
echo "   $DB_PASSWORD"
echo ""

# 3. Connection string
echo "3. DATABASE_URL (для .env):"
echo "   postgresql+asyncpg://linguaflow:$DB_PASSWORD@localhost:5432/linguaflow"
echo ""

# 4. SQL commands
echo "4. SQL commands (выполните в psql):"
echo "   CREATE USER linguaflow WITH PASSWORD '$DB_PASSWORD';"
echo "   CREATE DATABASE linguaflow OWNER linguaflow;"
echo "   GRANT ALL PRIVILEGES ON DATABASE linguaflow TO linguaflow;"
echo ""

# 5. .env template
echo "5. .env template (скопируйте в backend/.env):"
echo "---"
cat << EOF
# Application
SECRET_KEY=$SECRET_KEY
DEBUG=false

# Database
DATABASE_URL=postgresql+asyncpg://linguaflow:$DB_PASSWORD@localhost:5432/linguaflow

# GigaChat API
GIGACHAT_AUTH_TOKEN=your-gigachat-token-here
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_MODEL=GigaChat
GIGACHAT_VERIFY_SSL=true

# TTS
TTS_MODEL_DIR=/opt/linguaflow/backend/tts_models
TTS_AUDIO_DIR=/opt/linguaflow/backend/audio_cache
TTS_SAMPLE_RATE=48000

# CORS
CORS_ORIGINS=["https://mindroom.ru","http://localhost:3000"]
EOF
echo "---"
echo ""

echo "=========================================="
echo "✓ Values generated!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Save these values securely"
echo "  2. Create database with the SQL commands above"
echo "  3. Copy the .env template to backend/.env"
echo "  4. Get GigaChat token from https://developers.sber.ru"
echo "  5. Update GIGACHAT_AUTH_TOKEN in .env"
echo ""
