#!/usr/bin/env bash
# Ouvre (ou referme) les inscriptions des clients de la boutique, pour l'espace « Mon compte ».
# À lancer en root sur le VPS qui sert le site, dans /opt/sysi-travel/app :
#   bash deploy/inscriptions-clients.sh           ouvre les inscriptions
#   bash deploy/inscriptions-clients.sh fermer    les referme
#
# Inscription sûre : par e-mail seulement, adresse confirmée par un lien avant la première
# connexion (e-mails envoyés par Resend : deploy/configure-resend.sh) ; inscription par téléphone
# et comptes anonymes coupés. Un compte créé a le rôle « client » : aucun droit d'administration,
# il ne lit que ses propres commandes (supabase/migrations/0013_boutique_articles.sql).
# Le fichier .env est sauvegardé avant chaque changement (.env.avant-inscriptions-<date>).
set -euo pipefail

SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
SUPABASE_ENV="$SUPABASE_DIR/.env"
MODE="${1:-ouvrir}"

case "$MODE" in
  ouvrir | fermer) ;;
  *) echo "Usage : bash deploy/inscriptions-clients.sh [ouvrir|fermer]" >&2; exit 1 ;;
esac

[ -w "$SUPABASE_ENV" ] || { echo "Fichier introuvable ou non modifiable : $SUPABASE_ENV (lancez en root)." >&2; exit 1; }

get_var() { grep -E "^$1=" "$SUPABASE_ENV" | tail -n 1 | cut -d= -f2- | tr -d '"' || true; }

set_var() {
  if grep -qE "^$1=" "$SUPABASE_ENV"; then
    sed -i "s|^$1=.*|$1=$2|" "$SUPABASE_ENV"
  else
    echo "$1=$2" >> "$SUPABASE_ENV"
  fi
}

if [ "$MODE" = "ouvrir" ]; then
  # Sans envoi d'e-mails réel, personne ne pourrait confirmer son adresse.
  SMTP_HOST="$(get_var SMTP_HOST)"
  if [ -z "$SMTP_HOST" ] || [ "$SMTP_HOST" = "supabase-mail" ] || [ -z "$(get_var SMTP_PASS)" ]; then
    echo "Les e-mails de Supabase ne sont pas configurés (SMTP_HOST=${SMTP_HOST:-vide})." >&2
    echo "Lancez d'abord : bash deploy/configure-resend.sh" >&2
    exit 1
  fi
fi

BACKUP="$SUPABASE_ENV.avant-inscriptions-$(date +%Y%m%d-%H%M%S)"
cp -p "$SUPABASE_ENV" "$BACKUP"
chmod 600 "$BACKUP"

if [ "$MODE" = "ouvrir" ]; then
  set_var DISABLE_SIGNUP false
  set_var ENABLE_EMAIL_SIGNUP true
  # L'adresse doit être confirmée par le lien reçu avant toute connexion.
  set_var ENABLE_EMAIL_AUTOCONFIRM false
  # Pas d'inscription par téléphone (aucun SMS n'est configuré) ni de compte anonyme.
  set_var ENABLE_PHONE_SIGNUP false
  set_var ENABLE_PHONE_AUTOCONFIRM false
  set_var ENABLE_ANONYMOUS_USERS false
  # Le lien de confirmation ramène sur le site.
  [ -n "$(get_var SITE_URL)" ] || set_var SITE_URL https://sysitravel.com
  [ -n "$(get_var ADDITIONAL_REDIRECT_URLS)" ] || set_var ADDITIONAL_REDIRECT_URLS "https://sysitravel.com/**,https://www.sysitravel.com/**"
else
  set_var DISABLE_SIGNUP true
fi
chmod 600 "$SUPABASE_ENV"

echo "==> Redémarrage du service d'authentification"
(cd "$SUPABASE_DIR" && docker compose up -d auth)

echo "==> Vérification"
ANON_KEY="$(get_var ANON_KEY)"
EXPECTED='"disable_signup":false'
[ "$MODE" = "fermer" ] && EXPECTED='"disable_signup":true'
for _ in $(seq 1 30); do
  SETTINGS="$(curl -fsS http://127.0.0.1:8000/auth/v1/settings -H "apikey: $ANON_KEY" 2>/dev/null || true)"
  if printf '%s' "$SETTINGS" | grep -q "$EXPECTED"; then
    if [ "$MODE" = "ouvrir" ]; then
      printf '%s' "$SETTINGS" | grep -q '"mailer_autoconfirm":false' || { echo "Attention : la confirmation de l'e-mail n'est pas active." >&2; exit 1; }
      printf '%s' "$SETTINGS" | grep -q '"phone":false' || echo "Attention : l'inscription par téléphone est encore active (vérifiez docker-compose.yml)." >&2
      echo "Inscriptions ouvertes : https://sysitravel.com/register"
      echo "Test conseillé : créez un compte avec votre adresse, cliquez le lien reçu, puis ouvrez https://sysitravel.com/compte"
    else
      echo "Inscriptions fermées. Les comptes existants peuvent toujours se connecter."
    fi
    echo "Ancienne configuration sauvegardée : $BACKUP"
    exit 0
  fi
  sleep 2
done

echo "Le service d'authentification ne répond pas comme prévu. Journaux :" >&2
(cd "$SUPABASE_DIR" && docker compose logs --tail 40 auth) >&2 || true
echo "Pour revenir en arrière : cp -p $BACKUP $SUPABASE_ENV && (cd $SUPABASE_DIR && docker compose up -d auth)" >&2
exit 1
