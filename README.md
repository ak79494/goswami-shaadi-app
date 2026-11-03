# Goswami Shaadi App

A full-stack matrimonial application inspired by common matchmaking workflows (not a copy of Shaadi.com branding/assets).

## Stack
- Backend: Java 17, Spring Boot 3.3, Spring Security, JWT, JPA/Hibernate, MySQL 8, WebSocket/STOMP
- Web frontend: React 18, Vite, React Router, Axios, STOMP client
- Android/iOS app: Expo SDK 58 (React Native), Expo Router, Reanimated — in `mobile/`
- Storage: Local filesystem for development profile photos (easy to replace with S3/Cloudinary)
- Database: MySQL 8
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
Use MySQL 8:
- database: `goswami_shaadi`
- username: `root`
- password: `root`

Or run it in Docker:
```bash
docker compose up -d mysql
```
If you already have MySQL on port 3306, run the container on 3307 instead (`MYSQL_PORT=3307 docker compose up -d mysql`) and point the backend at it with a `local` profile (below).

### 2. Backend
```bash
cd backend
mvn spring-boot:run
```
Backend: http://localhost:8080

For machine-specific settings (database port, mail credentials), create the gitignored
`backend/src/main/resources/application-local.yml` and run with the `local` profile:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

### 4. Mobile app (Android / iOS)
Needs Node 22+ (`nvm use` inside `mobile/` picks it up from `.nvmrc`).
```bash
cd mobile
npm install
npx expo start
```
Install **Expo Go** from the Play Store, keep the phone on the same Wi-Fi as your computer, and scan the QR code.
The app finds the backend automatically at `http://<your-computer-ip>:8080`. To use another server, set
`EXPO_PUBLIC_API_URL` in `mobile/.env.local`.

### 5. Share the app publicly from this Mac (any phone, any network)
The Android APK (built from `mobile/` with the `preview` profile) talks to a free, permanent ngrok address that
forwards to the backend on this Mac. One-time setup: create a free account at https://ngrok.com, then
`brew install ngrok` and `ngrok config add-authtoken <your token>`. Your `application-local.yml` must also set a
random `app.jwt.secret` — the default one in `application.yml` is public.

Then, whenever you want testers to be able to use the app:
```bash
scripts/start-public.sh
```
It starts MySQL, the backend and the tunnel, keeps the Mac awake, and stops everything on Ctrl+C.
The app only works while this is running and the Mac is online.

### Premium payments, admin and calls
- **Premium**: members pay by UPI (the QR and UPI ID shown in the app) and enter the UPI reference (UTR).
  Nothing is activated until an admin approves it. UPI ID, payee name and optional bank details are under
  `app.payment` in `application.yml` — override them in `application-local.yml`.
- **Admin panel**: give your own account admin rights, then log out and back in. The app's ☰ menu then shows
  **Admin panel**, where you approve or reject payments and follow up on "call me back" help requests.
  ```bash
  scripts/make-admin.sh you@example.com
  ```
- **Contact number**: each member has one mobile number, also used for WhatsApp. It is only sent to active premium
  members, and only as each member's Privacy settings allow.
- **Declined interests** stay in the member's Interests → Declined tab and out of their matches for 7 days
  (`InteractionService.DECLINE_PAUSE_DAYS`); the sender can't send a new interest until then.
- **Blocking** hides two members from each other in search, interests and profiles, and stops messages and calls. Members
  see and undo their blocks under ☰ → **Blocked Members**.
- **Chat** works like WhatsApp: long-press to select messages (reply, copy, info, delete), swipe right to reply, tap a quote
  to jump to the original, one tick when sent, two when delivered, blue when read, and "typing…". **Delete for me** is private
  to that member. **Delete for everyone** wipes the words from the database and is allowed for 8 hours after sending
  (`Message.DELETE_FOR_EVERYONE_HOURS`, and the same number in the app's chat screen).
- **Voice and video calls** run phone-to-phone (WebRTC); the server relays the call set-up. When the two phones can't
  reach each other directly within 10 seconds (strict mobile-carrier networks), both apps switch to relay mode and send
  compressed voice through the server's websocket instead (video pauses in relay mode). In a video call the member's own
  picture can be dragged anywhere above the controls. For better quality on such
  networks, add a TURN relay (e.g. a free metered.ca account): set `app.calls.turn-urls`, `turn-username` and
  `turn-credential` in `application-local.yml` — no new APK needed.
- **Call set-up messages** go over the websocket and are also kept by the server for two minutes, numbered, so an
  app whose connection dropped catches up (`GET /api/calls/signals?after=`) instead of losing an "accept" or "answer".
- **Incoming calls** ring while the app is open or in the background (a notification is shown). A call that rang while
  the phone was briefly offline is picked up when the app reconnects, and unanswered calls leave a "Missed call"
  notification. Ringing a phone whose app is fully closed would need push notifications (Firebase), not set up yet.
- Company details on the About/Help screens (founder, phone, WhatsApp) are under `app.company`.

### Demo data
The database starts empty. To create 11 demo members (6 brides, 5 grooms) with profiles and a couple of interests:
```bash
node scripts/seed-demo.mjs
```
All demo accounts use the password printed by the script.

Three of them are for testing premium. Put them on their plans (they start as free accounts):
```bash
scripts/make-premium.sh gold.demo@goswamishaadi.test GOLD
scripts/make-premium.sh diamond.demo@goswamishaadi.test DIAMOND
scripts/make-premium.sh platinum.demo@goswamishaadi.test PLATINUM_PLUS
```

## Configuration
Backend properties are in `backend/src/main/resources/application.yml`.
- Set `JWT_SECRET` in production to a long random secret.
- Email (password-reset OTPs) reads `MAIL_USERNAME` and `MAIL_PASSWORD` (a Gmail app password) from the
  environment or from `application-local.yml`. Never commit real credentials.

## Production hardening
- Replace local uploads with S3/Cloudinary.
- Put frontend/backend behind HTTPS.
- Use a managed MySQL instance.
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
