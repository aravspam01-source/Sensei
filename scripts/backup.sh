#!/bin/bash

# Database Backup Script for Sensei
# This script creates automated backups of the PostgreSQL database

set -euo pipefail

# Configuration
DB_HOST="postgres"
DB_PORT="5432"
DB_NAME="${POSTGRES_DB:-sensei_db}"
DB_USER="${POSTGRES_USER:-sensei_user}"
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sensei_backup_${TIMESTAMP}.sql"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "Starting database backup at $(date)"

# Create the backup
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=custom \
    --compress=9 \
    --file="${BACKUP_FILE}" \
    --lock-wait-timeout=30000

# Verify backup was created
if [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"

    # Create a compressed version
    gzip "${BACKUP_FILE}"
    echo "✅ Backup compressed: ${BACKUP_FILE}.gz"

    # Clean up old backups
    echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
    find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

    # List remaining backups
    echo "📋 Current backups:"
    ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "No backups found"

else
    echo "❌ Backup failed!"
    exit 1
fi

echo "Backup completed at $(date)"

# Optional: Upload to cloud storage (uncomment and configure)
# if command -v aws &> /dev/null; then
#     echo "☁️ Uploading backup to S3..."
#     aws s3 cp "${BACKUP_FILE}.gz" "s3://your-backup-bucket/database-backups/"
#     echo "✅ Backup uploaded to S3"
# fi

echo "All done! 🎉"