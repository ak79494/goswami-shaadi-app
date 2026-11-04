#!/usr/bin/env bash
# Builds the server and website on this Mac and installs them on the live server.
# Usage: deploy/deploy.sh <server-ip>
set -euo pipefail
IP="$1"
KEY="$HOME/.ssh/app_server_deploy"
SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "root@$IP")
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

(cd "$ROOT/backend" && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -DskipTests package)
(cd "$ROOT/frontend" && npm run build)

JAR=$(ls "$ROOT"/backend/target/*.jar | grep -v original | head -1)
scp -i "$KEY" "$JAR" "root@$IP:/opt/goswamijodi/app.jar"
"${SSH[@]}" 'rm -rf /var/www/goswamijodi/* && chown goswamijodi: /opt/goswamijodi/app.jar'
scp -i "$KEY" -r "$ROOT"/frontend/dist/* "root@$IP:/var/www/goswamijodi/"
"${SSH[@]}" 'systemctl restart goswamijodi && chmod -R a+rX /var/www/goswamijodi'
echo "Deployed. Checking the server…"
for _ in $(seq 1 30); do
  if curl -fsS -m 5 "https://api.goswamijodi.com/api/public/app-info" >/dev/null 2>&1; then
    echo "The server is answering at https://api.goswamijodi.com"
    exit 0
  fi
  sleep 3
done
echo "The server did not answer. Check it with: ssh -i $KEY root@$IP journalctl -u goswamijodi -n 50"
exit 1
