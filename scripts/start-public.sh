#!/usr/bin/env bash
# Puts GoswamiJodi online from this Mac so the Android app works on any phone, on any network:
#   MySQL (Docker) -> Spring Boot backend -> ngrok tunnel on your free, permanent ngrok domain.
# Everything stops when you press Ctrl+C or close the terminal. While it runs, the Mac is kept awake.
#
#   scripts/start-public.sh
#
# One-time setup: create a free account at https://ngrok.com, then run
#   ngrok config add-authtoken <your token>
set -euo pipefail
cd "$(dirname "$0")/.."
LOGS="$PWD/.logs"
mkdir -p "$LOGS"

command -v ngrok >/dev/null || { echo "Install ngrok first: brew install ngrok"; exit 1; }
ngrok config check >/dev/null 2>&1 || { echo "Connect ngrok to your account first: ngrok config add-authtoken <your token>"; exit 1; }

# The app's APK is built against this address (mobile/eas.json -> preview -> EXPO_PUBLIC_API_URL).
API_URL=$(node -p 'require("./mobile/eas.json").build.preview.env.EXPO_PUBLIC_API_URL || ""')
DOMAIN=$(printf '%s' "$API_URL" | sed -E 's#^https?://##; s#/.*$##')
case "$DOMAIN" in
  *.ngrok-free.app | *.ngrok-free.dev | *.ngrok.app | *.ngrok.dev) URL_FLAG="--url=https://$DOMAIN" ;;
  *) URL_FLAG="" ;; # first run: ngrok uses the account's free dev domain
esac

cleanup() {
  echo
  echo "Stopping GoswamiJodi..."
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  # spring-boot:run starts the app in a separate Java process; stop that too.
  pkill -f "com.goswami.shaadi.GoswamiShaadiApplication" 2>/dev/null || true
  docker compose stop mysql >/dev/null 2>&1 || true
  echo "Stopped."
}
trap cleanup EXIT

echo "1/3 Starting MySQL..."
docker info >/dev/null 2>&1 || { open -a Docker; until docker info >/dev/null 2>&1; do sleep 2; done; }
MYSQL_PORT=3307 docker compose up -d mysql >/dev/null
until docker exec goswami-shaadi-mysql mysqladmin ping -uroot -proot --silent >/dev/null 2>&1; do sleep 2; done

echo "2/3 Starting backend (log: .logs/backend.log)..."
(cd backend && exec mvn -q spring-boot:run -Dspring-boot.run.profiles=local) >"$LOGS/backend.log" 2>&1 &
BACKEND_PID=$!
until curl -s -o /dev/null -X POST -H 'Content-Type: application/json' -d '{}' http://localhost:8080/api/auth/login; do
  kill -0 "$BACKEND_PID" 2>/dev/null || { echo "Backend failed to start - see .logs/backend.log"; exit 1; }
  sleep 2
done

echo "3/3 Opening the public tunnel..."
caffeinate -dims -w $$ &
# shellcheck disable=SC2086
ngrok http 8080 $URL_FLAG
