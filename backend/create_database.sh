#!/bin/bash
# Скрипт быстрого создания базы данных для LinguaFlow
# Запуск: sudo bash create_database.sh

set -e

DB_NAME="linguaflow"
DB_USER="linguaflow"
DB_PASS="YourSecurePassword123!"  # ⚠️ ИЗМЕНИТЕ НА СВОЙ ПАРОЛЬ!

echo "=========================================="
echo "LinguaFlow Database Setup"
echo "=========================================="
echo ""

# Проверка PostgreSQL
echo "1. Checking PostgreSQL..."
if ! systemctl is-active --quiet postgresql; then
    echo "   ✗ PostgreSQL is not running!"
    echo "   Start it with: sudo systemctl start postgresql"
    exit 1
fi
echo "   ✓ PostgreSQL is running"
echo ""

# Создание пользователя
echo "2. Creating database user '$DB_USER'..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
echo "   ✓ User created"
echo ""

# Создание БД
echo "3. Creating database '$DB_NAME'..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
echo "   ✓ Database created"
echo ""

# Права
echo "4. Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
echo "   ✓ Privileges granted"
echo ""

# Проверка
echo "5. Testing connection..."
if PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✓ Connection successful"
else
    echo "   ✗ Connection failed!"
    echo "   Check password and PostgreSQL configuration"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ Database setup complete!"
echo "=========================================="
echo ""
echo "Database credentials:"
echo "  Host:     localhost"
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"
echo "  Password: $DB_PASS"
echo ""
echo "Connection string for .env:"
echo "  DATABASE_URL=postgresql+asyncpg://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
echo ""
echo "⚠️  IMPORTANT: Save these credentials securely!"
echo ""
