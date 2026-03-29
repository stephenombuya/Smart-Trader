#!/usr/bin/env bash
# setup_local.sh — First-time local development setup
set -euo pipefail

GREEN='\033[0;32m'
NC='\033[0m'
log() { echo -e "${GREEN}[SETUP]${NC} $1"; }

log "Setting up EarnChain locally..."

# Copy env example if not already present
if [ ! -f backend/config/.env ]; then
  cp backend/config/.env.example backend/config/.env
  log ".env created — please edit backend/config/.env with your credentials before continuing."
  echo "Press Enter when done..."
  read -r
fi

log "Building Docker images..."
docker-compose build

log "Starting services..."
docker-compose up -d db redis
sleep 8

log "Running migrations..."
docker-compose run --rm backend python manage.py migrate

log "Loading fixture data..."
docker-compose run --rm backend python manage.py loaddata scripts/fixtures/mock_data.json

log "Seeding mock users..."
docker-compose run --rm backend python manage.py seed_mock_users

log "Creating Django superuser..."
docker-compose run --rm backend python manage.py createsuperuser --email admin@earnchain.com --noinput || true

log "Starting all services..."
docker-compose up -d

echo ""
echo "  ✅ Setup complete!"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:8000/api/"
echo "  API Docs:  http://localhost:8000/api/docs/"
echo "  Django Admin: http://localhost:8000/admin/"
echo ""
echo "  Test logins (password: Test@1234):"
echo "    alice@test.com   — top earner, root of tree"
echo "    bob@test.com     — level 1 referral"
echo "    admin@earnchain.com — superuser (use createsuperuser password)"
