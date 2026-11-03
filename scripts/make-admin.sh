#!/usr/bin/env bash
# Gives an existing account access to the in-app Admin panel (verify premium payments, help requests).
#
#   scripts/make-admin.sh founder@example.com          # make admin
#   scripts/make-admin.sh founder@example.com --remove # back to a normal member
#
# The member must log out and back in afterwards. Never make a demo account an admin: their password is public.
set -euo pipefail
EMAIL="${1:-}"
ROLE=ADMIN
[[ "${2:-}" == "--remove" ]] && ROLE=USER
if [[ ! "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  echo "Usage: scripts/make-admin.sh <email> [--remove]"
  exit 1
fi
if [[ "$EMAIL" == *.demo@goswamishaadi.test ]]; then
  echo "Refusing: demo accounts share a public password."
  exit 1
fi
CHANGED=$(docker exec goswami-shaadi-mysql mysql -uroot -proot goswami_shaadi -N -e \
  "UPDATE users SET role='$ROLE' WHERE email='$EMAIL'; SELECT ROW_COUNT();" 2>/dev/null)
if [[ "$CHANGED" == "1" ]]; then
  echo "$EMAIL is now $ROLE. Log out and back in to see the change."
else
  echo "No account found for $EMAIL (or it already had that role)."
fi
