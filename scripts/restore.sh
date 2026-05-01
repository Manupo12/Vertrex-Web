#!/usr/bin/env bash
set -euo pipefail

# Vertrex OS - Database Restore Script
# Usage: ./scripts/restore.sh backups/vertrex_backup_YYYYMMDD_HHMMSS.sql

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

if [ $# -eq 0 ]; then
  echo "Usage: $0 <backup_file.sql>"
  echo "Available backups:"
  ls -1 "$PROJECT_DIR"/backups/*.sql 2>/dev/null || echo "  (none)"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

if ! command -v psql &> /dev/null; then
  echo "Error: psql is not installed. Install postgresql-client."
  exit 1
fi

read -p "This will DROP and recreate the database. Are you sure? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Restoring from $BACKUP_FILE..."
psql "$DATABASE_URL" < "$BACKUP_FILE"
echo "Restore completed."
