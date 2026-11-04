# GoswamiJodi — mobile app

Android/iOS app for GoswamiJodi, built with Expo SDK 58 (React Native 0.88, Expo Router, Reanimated 4).
It talks to the Spring Boot backend in `../backend`.

## Run it on your phone (Expo Go)

1. Start the database and backend (see the root README).
2. Use Node 22+ — `nvm use` picks it up from `.nvmrc`.
3. Start the app:
   ```bash
   npm install
   npx expo start
   ```
4. Install **Expo Go** from the Play Store, connect the phone to the **same Wi-Fi** as this computer,
   and scan the QR code shown in the terminal.

The app reaches the backend at `http://<this-computer's-ip>:8080` automatically. To use a different
server, create `.env.local` with `EXPO_PUBLIC_API_URL=https://your-server`. There is no way to change the server
in an installed app, so a build can only ever talk to the address it was built for.

## Build an installable APK (EAS Build)

```bash
EAS_NO_VCS=1 npx eas-cli build --platform android --profile preview
```

- The build runs on Expo's servers and ends with a link + QR code; open it on the phone to download and install the APK.
- The `preview` profile in `eas.json` bakes in the backend address (`EXPO_PUBLIC_API_URL`): the public ngrok
  address served by `scripts/start-public.sh` (see the root README), so the APK works on any phone and any network
  while that script runs on the Mac.
- The `production` profile builds a Play Store `.aab` for `https://api.goswamijodi.com`. It blocks plain HTTP.

## Ship a change without a new APK (EAS Update)

Screen, text and style changes (anything in `src/`) can go straight to installed apps — testers just close and
reopen the app twice:

```bash
APP_VARIANT=preview EXPO_PUBLIC_API_URL=https://tweak-strobe-varsity.ngrok-free.dev \
  EAS_NO_VCS=1 npx eas-cli update --channel preview --message "What changed"
```

Updates only reach builds with the same app `version` (`runtimeVersion` follows it). Adding a native module or
changing `app.json` needs a new APK: bump `version` and run the build command above.

## Project layout

- `src/app/` — screens (Expo Router: every file is a route)
  - `welcome`, `login`, `register`, `forgot-password` — signed-out screens
  - `delete-account` — required by Google Play; the website has a matching public page
  - `create-profile` — 5-step onboarding wizard
  - `(tabs)/` — Home, Matches, Interests, Chats, Profile
  - `profile/[userId]`, `chat/[userId]`, `call/[userId]`, `edit/[section]`, `photos`, `preferences`, `notifications`, `blocked`
- `modules/call-audio/` — small native Android module that switches call audio between earpiece and loudspeaker
- `src/components/` — shared UI (buttons, fields, cards, animations, opening animation, photo viewer, match section, call engine)
- `src/lib/` — API client, auth session, interests/shortlist state, live websocket (`realtime.tsx`), calls
  (`calls.tsx` routes call signals; `call-engine-html.ts` is the WebRTC/relay page that runs in a WebView)

## Google Play rules this app follows

- **Memberships are sold only on the website.** `premium.tsx` may say so in plain text, but nothing in the app may link
  to a payment page or take a payment. The website pages the app links to (`frontend/src/LegalPages.jsx`) have no site
  menu, so they can't lead on to one either.
- **Accounts can be deleted** in the app and on the website without the app (see `AccountService` on the server).

## Checks

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

A browser preview can't show Android-only problems (text drawing, the native splash, the call screen's WebView).
Before a release, also run the APK on an Android emulator or phone.
