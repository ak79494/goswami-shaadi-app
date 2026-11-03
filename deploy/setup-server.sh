#!/usr/bin/env bash
# Sets up a new Ubuntu server for GoswamiJodi. Run once, as root. Safe to run again.
# Usage: setup-server.sh <server-ip>
set -euo pipefail
IP="$1"
DOMAIN=goswamijodi.com

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq openjdk-17-jre-headless caddy coturn docker.io docker-compose-v2 ufw unattended-upgrades

# 2 GB of memory is tight for Java and MySQL together, so give them room to breathe.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

ufw allow OpenSSH
ufw allow 80,443/tcp
ufw allow 3478/tcp
ufw allow 3478/udp
ufw allow 49160:49200/udp
ufw --force enable

id goswamijodi >/dev/null 2>&1 || useradd --system --home /opt/goswamijodi --shell /usr/sbin/nologin goswamijodi
mkdir -p /opt/goswamijodi /var/lib/goswamijodi/uploads /var/www/goswamijodi /etc/goswamijodi /var/backups/goswamijodi
chown -R goswamijodi: /opt/goswamijodi /var/lib/goswamijodi
chmod 750 /etc/goswamijodi /var/backups/goswamijodi

# Secrets are made here once and never leave the server.
ENV=/etc/goswamijodi/env
if [ ! -f "$ENV" ]; then
  umask 077
  DB_PASSWORD=$(openssl rand -hex 24)
  TURN_PASSWORD=$(openssl rand -hex 24)
  cat > "$ENV" <<VARS
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:mysql://127.0.0.1:3306/goswami_shaadi?useSSL=false&serverTimezone=Asia/Kolkata&allowPublicKeyRetrieval=true&useUnicode=true&characterEncoding=utf8
DB_USERNAME=root
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$(openssl rand -hex 48)
UPLOAD_DIR=/var/lib/goswamijodi/uploads
MAIL_USERNAME=change-me
MAIL_PASSWORD=change-me
FIREBASE_SERVICE_ACCOUNT_FILE=/etc/goswamijodi/firebase.json
CALL_TURN_URLS=turn:$DOMAIN:3478?transport=udp,turn:$DOMAIN:3478?transport=tcp
CALL_TURN_USERNAME=goswamijodi
CALL_TURN_CREDENTIAL=$TURN_PASSWORD
VARS
  umask 022
fi
chown root:goswamijodi "$ENV"
chmod 640 "$ENV"
set -a; . "$ENV"; set +a

cat > /etc/goswamijodi/mysql-compose.yml <<YAML
services:
  mysql:
    image: mysql:8.4
    container_name: goswamijodi-mysql
    environment:
      MYSQL_DATABASE: goswami_shaadi
      MYSQL_ROOT_PASSWORD: \${DB_PASSWORD}
      TZ: Asia/Kolkata
    command: --innodb-buffer-pool-size=256M --performance-schema=OFF
    ports:
      - "127.0.0.1:3306:3306"
    volumes:
      - /var/lib/goswamijodi/mysql:/var/lib/mysql
    restart: unless-stopped
YAML
docker compose --env-file "$ENV" -f /etc/goswamijodi/mysql-compose.yml up -d

cat > /etc/turnserver.conf <<CONF
listening-port=3478
external-ip=$IP
min-port=49160
max-port=49200
fingerprint
lt-cred-mech
user=goswamijodi:$CALL_TURN_CREDENTIAL
realm=$DOMAIN
no-cli
no-multicast-peers
# Only relays calls to the public internet, never to anything on this server.
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
CONF
sed -i 's/^#\?TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn 2>/dev/null || true
systemctl enable coturn
systemctl restart coturn

cat > /etc/caddy/Caddyfile <<CADDY
$DOMAIN, www.$DOMAIN {
	encode gzip
	@server path /api/* /ws /ws/* /uploads/*
	handle @server {
		reverse_proxy 127.0.0.1:8080
	}
	handle {
		root * /var/www/goswamijodi
		try_files {path} /index.html
		file_server
	}
}

api.$DOMAIN {
	encode gzip
	reverse_proxy 127.0.0.1:8080
}
CADDY
systemctl enable caddy
systemctl reload caddy || systemctl restart caddy

cat > /etc/systemd/system/goswamijodi.service <<UNIT
[Unit]
Description=GoswamiJodi server
After=network-online.target docker.service
Wants=network-online.target

[Service]
User=goswamijodi
WorkingDirectory=/opt/goswamijodi
EnvironmentFile=$ENV
ExecStart=/usr/bin/java -Xms128m -Xmx512m -XX:+ExitOnOutOfMemoryError -jar /opt/goswamijodi/app.jar
Restart=always
RestartSec=5
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable goswamijodi

# A database copy each night, so the server's daily backup always holds a clean one.
cat > /etc/cron.d/goswamijodi-backup <<'CRON'
30 2 * * * root . /etc/goswamijodi/env; docker exec -e MYSQL_PWD="$DB_PASSWORD" goswamijodi-mysql mysqldump -uroot --single-transaction --no-tablespaces goswami_shaadi | gzip > /var/backups/goswamijodi/db-$(date +\%a).sql.gz
CRON

echo "Server is ready for the first deploy."
