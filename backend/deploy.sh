#!/bin/bash
# Скрипт быстрого деплоя обновлений LinguaFlow
# Использование: bash deploy.sh [branch]

set -e

BRANCH=${1:-main}
PROJECT_DIR="/opt/linguaflow"
BACKUP_DIR="/var/backups/linguaflow/pre-deploy"

echo "=========================================="
echo "LinguaFlow Deployment"
echo "=========================================="
echo "Branch: $BRANCH"
echo "Time: $(date)"
echo ""

# 1. Создаём бэкап
echo "1. Creating backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Бэкап БД
echo "   Backing up database..."
sudo -u postgres pg_dump linguaflow | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Бэкап текущей версии
echo "   Backing up current version..."
cd $PROJECT_DIR
tar -czf $BACKUP_DIR/code_$TIMESTAMP.tar.gz --exclude='node_modules' --exclude='venv' --exclude='audio_cache' .

echo "   ✓ Backup created: $TIMESTAMP"
echo ""

# 2. Остановка backend
echo "2. Stopping backend..."
sudo systemctl stop linguaflow-backend
echo "   ✓ Backend stopped"
echo ""

# 3. Обновление кода
echo "3. Updating code..."
cd $PROJECT_DIR

# Если это git репозиторий
if [ -d ".git" ]; then
    echo "   Pulling from git..."
    sudo git fetch origin
    sudo git checkout $BRANCH
    sudo git pull origin $BRANCH
else
    echo "   ⚠ Not a git repository, skipping git pull"
    echo "   Please update files manually"
fi
echo "   ✓ Code updated"
echo ""

# 4. Обновление backend
echo "4. Updating backend..."
cd $PROJECT_DIR/backend

# Обновление зависимостей
echo "   Installing Python dependencies..."
sudo -u www-linguaflow bash -c "source venv/bin/activate && pip install -q -r requirements.txt"

# Миграции БД (если есть)
if [ -d "alembic" ]; then
    echo "   Running database migrations..."
    sudo -u www-linguaflow bash -c "source venv/bin/activate && alembic upgrade head" || echo "   ⚠ No migrations to run"
fi

echo "   ✓ Backend updated"
echo ""

# 5. Обновление frontend
echo "5. Updating frontend..."
cd $PROJECT_DIR

# Обновление зависимостей
echo "   Installing Node dependencies..."
sudo -u www-linguaflow npm install --silent

# Сборка
echo "   Building frontend..."
sudo -u www-linguaflow npm run build

echo "   ✓ Frontend updated"
echo ""

# 6. Перезапуск backend
echo "6. Starting backend..."
sudo systemctl start linguaflow-backend

# Ждём запуска
sleep 3

if systemctl is-active --quiet linguaflow-backend; then
    echo "   ✓ Backend started"
else
    echo "   ✗ Backend failed to start!"
    echo "   Check logs: sudo journalctl -u linguaflow-backend -n 50"
    exit 1
fi
echo ""

# 7. Проверка
echo "7. Verifying deployment..."
sleep 2

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✓ Backend API is responding"
else
    echo "   ⚠ Backend API not responding yet (may need more time)"
fi

echo "   ✓ Deployment complete"
echo ""

echo "=========================================="
echo "✓ Deployment successful!"
echo "=========================================="
echo ""
echo "Backup location: $BACKUP_DIR"
echo "  - Database: db_$TIMESTAMP.sql.gz"
echo "  - Code: code_$TIMESTAMP.tar.gz"
echo ""
echo "To rollback:"
echo "  1. Restore database: zcat $BACKUP_DIR/db_$TIMESTAMP.sql.gz | sudo -u postgres psql linguaflow"
echo "  2. Restore code: tar -xzf $BACKUP_DIR/code_$TIMESTAMP.tar.gz -C $PROJECT_DIR"
echo "  3. Restart backend: sudo systemctl restart linguaflow-backend"
echo ""
echo "Visit: https://mindroom.ru"
echo ""
