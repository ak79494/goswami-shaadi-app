# Goswami Shaadi App

A full-stack matrimonial application inspired by common matchmaking workflows (not a copy of Shaadi.com branding/assets).

## Stack
- Backend: Java 17, Spring Boot 3.3, Spring Security, JWT, JPA/Hibernate, PostgreSQL, WebSocket/STOMP
- Frontend: React 18, Vite, React Router, Axios, STOMP client
- Storage: Local filesystem for development profile photos (easy to replace with S3/Cloudinary)
- Database: PostgreSQL
- Optional: Docker Compose

## Features
- Registration/login with JWT
- Matrimonial profile creation and update
- About, education, profession, family, lifestyle and contact/privacy fields
- Partner preferences
- Search/filter profiles
- Send/accept/reject/withdraw interest requests
- Shortlist/favourites
- Block/unblock
- One-to-one messaging with WebSocket + REST fallback
- Notifications
- Up to 10 profile photos per user
- Photo delete/reorder/primary photo
- Profile visibility and privacy controls
- Dashboard and profile completion
- Admin-ready role model and basic moderation endpoints
- Validation, global error handling, pagination and clean layered backend
- Responsive React UI

## Quick start

### 1. Database
Use PostgreSQL:
- database: `goswami_shaadi`
- username: `postgres`
- password: `postgres`

Or:
```bash
docker compose up -d postgres
```

### 2. Backend
```bash
cd backend
mvn spring-boot:run
```
Backend: http://localhost:8080

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

### Demo API credentials
The application starts with an empty database. Register two users from the UI.

## Configuration
Backend properties are in `backend/src/main/resources/application.yml`.
Set `JWT_SECRET` in production to a long random secret.

## Production hardening
- Replace local uploads with S3/Cloudinary.
- Put frontend/backend behind HTTPS.
- Use a managed PostgreSQL instance.
- Add email/SMS OTP provider.
- Add rate limiting and CAPTCHA on registration/login.
- Add antivirus/image-content validation and EXIF stripping.
- Add production monitoring/logging and backups.
- Configure CORS to the production frontend domain only.

## API groups
- `/api/auth/*` authentication
- `/api/profiles/*` profile CRUD/search
- `/api/preferences/*` partner preferences
- `/api/photos/*` profile photos
- `/api/requests/*` interests
- `/api/shortlists/*` favourites
- `/api/blocks/*` block list
- `/api/chats/*` conversations/messages
- `/api/notifications/*` notifications
- `/api/admin/*` moderation/admin operations
