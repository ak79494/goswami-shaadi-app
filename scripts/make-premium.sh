#!/usr/bin/env bash
# Puts a demo account on a premium plan without a payment, to test what premium members see.
#
#   scripts/make-premium.sh gold.demo@goswamishaadi.test GOLD      # GOLD, DIAMOND or PLATINUM_PLUS
#   scripts/make-premium.sh gold.demo@goswamishaadi.test --remove  # back to a free account
#
# Demo accounts only: real members pay by UPI and an admin approves the payment.
set -euo pipefail
EMAIL="${1:-}"
PLAN="${2:-}"
case "$PLAN" in
  GOLD) MONTHS=3 ;;
  DIAMOND) MONTHS=6 ;;
  PLATINUM_PLUS) MONTHS=12 ;;
  --remove) MONTHS=0 ;;
  *) echo "Usage: scripts/make-premium.sh <demo email> <GOLD|DIAMOND|PLATINUM_PLUS|--remove>"; exit 1 ;;
esac
if [[ ! "$EMAIL" =~ ^[A-Za-z0-9._-]+\.demo@goswamishaadi\.test$ ]]; then
  echo "Refusing: only demo accounts can skip the payment."
  exit 1
fi
if [[ "$PLAN" == "--remove" ]]; then
  SET="premium_member=0, premium_plan=NULL, premium_valid_until=NULL"
else
  SET="premium_member=1, premium_plan='$PLAN', premium_valid_until=DATE_ADD(NOW(), INTERVAL $MONTHS MONTH)"
fi
CHANGED=$(docker exec goswami-shaadi-mysql mysql -uroot -proot goswami_shaadi -N -e \
  "UPDATE users SET $SET WHERE email='$EMAIL'; SELECT ROW_COUNT();" 2>/dev/null)
if [[ "$CHANGED" == "1" ]]; then
  echo "$EMAIL is now ${PLAN/--remove/a free account}."
else
  echo "No account found for $EMAIL (or nothing to change)."
fi
