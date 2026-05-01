#!/usr/bin/env bash
set -euo pipefail

# Vertrex OS - Database Backup Script
# Requires: pg_dump (PostgreSQL client tools)
# Usage: ./scripts/backup.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env.local not found at $ENV_FILE"
  exit 1
fi

# shellcheck source=/dev/null
export $(grep -v '^#' "$ENV_FILE" | xargs)

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL not set in .env.local"
  exit 1
fi

if ! command -v pg_dump &> /dev/null; then
  echo "Error: pg_dump is not installed."
  echo "Install it with:"
  echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
  echo "  macOS:         brew install libpq"
  echo "  Arch:          sudo pacman -S postgresql-libs"
  exit 1
fi

BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vertrex_backup_$TIMESTAMP.sql"

echo "Starting Vertrex OS database backup..."
echo "Target: $BACKUP_FILE"

pg_dump \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --verbose \
  "$DATABASE_URL" > "$BACKUP_FILE"

echo "Backup completed successfully: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
