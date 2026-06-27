#!/usr/bin/env bash
set -euo pipefail
cd /mnt/datos/Proyectos/Web/Vertrex-Website
set -a; source .env.local; set +a
npx tsx scripts/telegram-cron.ts >> /tmp/vertrex-telegram-cron.log 2>&1
