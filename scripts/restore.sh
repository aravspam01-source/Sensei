#!/bin/bash

# Database Restore Script for Sensei
# This script restores a database from a backup file

set -euo pipefail

# Configuration
DB_HOST="postgres"
DB_PORT="5432"
DB_NAME="${POSTGRES_DB:-sensei_db}"
DB_USER="${POSTGRES_USER:-sensei_user}"

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Example: $0 /backups/sensei_backup_20241105_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "⚠️  WARNING: This will completely replace the existing database!"
echo "Database: ${DB_NAME}"
echo "Backup file: ${BACKUP_FILE}"
echo

# Ask for confirmation
read -p "Are you sure you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Extract backup if it's compressed
EXTRACTED_FILE="${BACKUP_FILE}"
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    EXTRACTED_FILE="${BACKUP_FILE%.gz}"
    echo "📦 Extracting backup..."
    gunzip -c "${BACKUP_FILE}" > "${EXTRACTED_FILE}"
    echo "✅ Backup extracted to ${EXTRACTED_FILE}"
fi

echo "🔄 Starting database restore at $(date)"

# Create a backup before restoring
echo "💾 Creating pre-restore backup..."
PRE_RESTORE_BACKUP="/backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --file="${PRE_RESTORE_BACKUP}" || echo "Warning: Pre-restore backup failed"

# Stop the backend service to prevent conflicts
echo "⏹️ Stopping backend service..."
docker-compose stop backend || echo "Backend service was not running"

# Restore the database
echo "📥 Restoring database from backup..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" < "${EXTRACTED_FILE}"

# Clean up extracted file
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    rm -f "${EXTRACTED_FILE}"
fi

# Start the backend service
echo "▶️ Starting backend service..."
docker-compose start backend

# Wait for the backend to be ready
echo "⏳ Waiting for backend service to be ready..."
sleep 10

# Run Prisma migrations to ensure schema is up to date
echo "🔄 Running database migrations..."
docker-compose exec backend npx prisma db push

echo "✅ Database restore completed at $(date)"
echo "📋 Pre-restore backup saved as: ${PRE_RESTORE_BACKUP}"
echo "🚀 Services are restarting..."

echo "All done! 🎉"