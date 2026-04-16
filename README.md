#  Smart Trader MLM Platform

A full-stack multi-level marketing (MLM) web platform where users earn through referrals, watching ads, spinning a reward wheel, and completing tasks. Built with Django (backend), React (frontend), PostgreSQL, and WebSockets for real-time features.

##  Features

- **User System**: Registration, email verification, JWT auth, social login (Google), profile with wallet & referral code
- **Referral System**: 5-level MLM tree with automatic commission calculation
- **Earnings**: Watch YouTube ads, spin wheel, complete tasks, referral commissions
- **Real-Time**: WebSocket-based spin wheel animation and live notifications
- **Admin Panel**: Manage users, rewards, payouts, and commission settings
- **Payments**: M-Pesa STK Push integration for withdrawals
- **Security**: Input validation, rate limiting, CSRF protection, Argon2 password hashing

##  Project Structure

```
mlm-platform/
├── backend/                  # Django REST API
│   ├── mlm_project/          # Django project settings
│   ├── apps/
│   │   ├── users/            # User model, auth, profiles
│   │   ├── earnings/         # Ads, spin wheel, tasks
│   │   ├── referrals/        # MLM tree, commission engine
│   │   ├── admin_panel/      # Admin API views
│   │   └── notifications/    # Email/SMS notifications
│   ├── config/               # Environment config
│   ├── requirements.txt
│   └── manage.py
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route pages
│   │   ├── store/            # Redux Toolkit slices
│   │   ├── hooks/            # Custom React hooks
│   │   └── utils/            # API client, helpers
│   ├── package.json
│   └── vite.config.js
├── nginx/                    # Nginx reverse proxy config
├── scripts/                  # DB seed, deployment scripts
├── docker-compose.yml
└── README.md
```

##  Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Frontend      | React 18, Redux Toolkit, Tailwind CSS, Framer Motion |
| Backend       | Django 4.2, Django REST Framework |
| Database      | PostgreSQL 15                     |
| Auth          | JWT (SimpleJWT) + Google OAuth    |
| Real-time     | Django Channels (WebSockets)      |
| Cache/Queue   | Redis + Celery                    |
| Payments      | M-Pesa Daraja API                 |
| Email         | SMTP (SendGrid)                   |
| Deployment    | Docker + Nginx                    |

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Clone and configure
```bash
git clone <repo-url>
cd mlm-platform
cp backend/config/.env.example backend/config/.env
# Edit .env with your credentials
```

### 2. Start with Docker Compose
```bash
docker-compose up --build
```

This starts:
- Django API on http://localhost:8000
- React dev server on http://localhost:3000
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Run migrations and seed data
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py loaddata scripts/fixtures/mock_data.json
docker-compose exec backend python manage.py createsuperuser
```

### 4. Access the app
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/
- API Docs (Swagger): http://localhost:8000/api/docs/

##  Environment Variables

See backend/config/.env.example for all required variables.

##  MLM Commission Structure

| Level | Relationship        | Commission Rate |
|-------|---------------------|-----------------|
| 1     | Direct referral     | 10%             |
| 2     | Level 2 downline    | 5%              |
| 3     | Level 3 downline    | 3%              |
| 4     | Level 4 downline    | 2%              |
| 5     | Level 5 downline    | 1%              |

##  YouTube Ad Integration Note

The YouTube ad-watching feature uses mock video IDs in development. For production:
1. Register for the YouTube Data API v3
2. Set YOUTUBE_API_KEY in your .env
3. Implement server-side view verification using the YouTube Reporting API
4. See backend/apps/earnings/youtube_service.py for integration points

##  Security Features

- JWT token rotation with refresh tokens
- Password hashing with Argon2
- Rate limiting on auth endpoints (django-ratelimit)
- CORS whitelist
- SQL injection protection (Django ORM)
- XSS / clickjacking protection headers
- Input sanitization on all endpoints

##  M-Pesa Integration

Uses Safaricom Daraja API (STK Push):
1. Configure credentials in .env
2. Users request withdrawal > STK Push sent to phone
3. Callback URL updates transaction status
4. Minimum withdrawal: KES 100

##  Running Tests

```bash
# Backend
docker-compose exec backend python manage.py test

# Frontend
docker-compose exec frontend npm test
```

##  Production Deployment

```bash
docker-compose -f docker-compose.prod.yml up --build -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py collectstatic
```

##  License
This project is licensed under the MIT License. 
