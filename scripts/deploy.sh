#!/usr/bin/env bash
# deploy.sh — EarnChain Production Deployment Script
# Usage: ./scripts/deploy.sh [--migrate] [--seed]
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

MIGRATE=false
SEED=false

for arg in "$@"; do
  case $arg in
    --migrate) MIGRATE=true ;;
    --seed)    SEED=true    ;;
  esac
done

# Verify .env exists
[ -f backend/config/.env ] || err "backend/config/.env not found. Copy .env.example and configure it."

log "Pulling latest images / building..."
docker-compose -f docker-compose.prod.yml build --parallel

log "Starting services..."
docker-compose -f docker-compose.prod.yml up -d db redis

log "Waiting for database to be ready..."
sleep 5

docker-compose -f docker-compose.prod.yml up -d backend celery celery-beat

if $MIGRATE; then
  log "Running database migrations..."
  docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate --noinput
fi

if $SEED; then
  warn "Seeding mock data (do NOT run in production with real users!)..."
  docker-compose -f docker-compose.prod.yml exec backend python manage.py loaddata scripts/fixtures/mock_data.json
  docker-compose -f docker-compose.prod.yml exec backend python manage.py seed_mock_users
fi

log "Collecting static files..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

log "Starting frontend and nginx..."
docker-compose -f docker-compose.prod.yml up -d frontend nginx

log "Deployment complete! ✅"
echo ""
echo "  App:    http://your-domain.com"
echo "  API:    http://your-domain.com/api/"
echo "  Admin:  http://your-domain.com/admin/"
echo "  Docs:   http://your-domain.com/api/docs/"
echo ""
log "Run 'docker-compose -f docker-compose.prod.yml logs -f' to tail logs."
