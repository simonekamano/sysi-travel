#!/usr/bin/env bash
# Envoi des e-mails Supabase (confirmation, mot de passe oublié, invitation) via Resend.
# À lancer en root sur le VPS, une fois le domaine vérifié dans Resend :
#   bash /opt/sysi-travel/app/deploy/configure-resend.sh [adresse d'expédition]
# La clé API est demandée sans s'afficher et n'est écrite que dans /opt/supabase/.env.
set -euo pipefail

SUPABASE_ENV=/opt/supabase/.env
SENDER="${1:-no-reply@sysitravel.com}"

read -rsp "Clé API Resend (re_…) : " KEY
echo
if [[ ! "$KEY" =~ ^re_[A-Za-z0-9_]+$ ]]; then
  echo "Clé invalide : elle doit commencer par re_." >&2
  exit 1
fi

set_var() {
  if grep -q "^$1=" "$SUPABASE_ENV"; then
    sed -i "s|^$1=.*|$1=$2|" "$SUPABASE_ENV"
  else
    echo "$1=$2" >> "$SUPABASE_ENV"
  fi
}

# Resend en SMTP : utilisateur « resend », mot de passe = clé API, TLS implicite sur 465.
set_var SMTP_ADMIN_EMAIL "$SENDER"
set_var SMTP_HOST smtp.resend.com
set_var SMTP_PORT 465
set_var SMTP_USER resend
set_var SMTP_PASS "$KEY"
set_var SMTP_SENDER_NAME '"SYSI TRAVEL"'
chmod 600 "$SUPABASE_ENV"

cd /opt/supabase
docker compose up -d auth
echo "Resend configuré : les e-mails partent de $SENDER."
