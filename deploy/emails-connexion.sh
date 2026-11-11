#!/usr/bin/env bash
# E-mails du service de connexion (inscription, mot de passe oublié, lien de connexion, changement
# d'adresse, invitation) en français, aux couleurs de SYSI TRAVEL, avec le code à 6 chiffres que
# la page d'inscription demande. Les modèles sont dans le site : public/emails/*.html.
# À lancer en root sur le VPS, dans /opt/sysi-travel/app, une fois le site déployé :
#   bash deploy/emails-connexion.sh            active les modèles du site
#   bash deploy/emails-connexion.sh retirer    revient aux e-mails par défaut de Supabase (anglais)
#
# Rien n'est modifié dans le docker-compose.yml de Supabase : les réglages vont dans un fichier à
# part (docker-compose.sysi-emails.yml), ajouté par COMPOSE_FILE dans /opt/supabase/.env (sauvegardé
# avant tout changement). Si un modèle ne peut pas être lu, Supabase envoie son e-mail par défaut.
set -euo pipefail

SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
SUPABASE_ENV="$SUPABASE_DIR/.env"
EXTRA="docker-compose.sysi-emails.yml"
SITE="${SITE:-https://sysitravel.com}"
# Le site vu depuis le réseau Docker de Supabase (sans repasser par Internet).
INTERNAL="${INTERNAL:-http://sysi-travel-web-1:3000}"
MODE="${1:-activer}"

case "$MODE" in
  activer | retirer) ;;
  *) echo "Usage : bash deploy/emails-connexion.sh [activer|retirer]" >&2; exit 1 ;;
esac

[ -w "$SUPABASE_ENV" ] || { echo "Fichier introuvable ou non modifiable : $SUPABASE_ENV (lancez en root)." >&2; exit 1; }
cd "$SUPABASE_DIR"

get_var() { grep -E "^$1=" "$SUPABASE_ENV" | tail -n 1 | cut -d= -f2- | tr -d '"' || true; }
set_var() {
  if grep -qE "^$1=" "$SUPABASE_ENV"; then
    sed -i "s|^$1=.*|$1=$2|" "$SUPABASE_ENV"
  else
    echo "$1=$2" >> "$SUPABASE_ENV"
  fi
}
compose_files() {
  local current
  current="$(get_var COMPOSE_FILE)"
  if [ -n "$current" ]; then
    printf '%s' "$current"
  elif [ -f docker-compose.override.yml ]; then
    printf '%s' "docker-compose.yml:docker-compose.override.yml"
  else
    printf '%s' "docker-compose.yml"
  fi
}

BACKUP="$SUPABASE_ENV.avant-emails-$(date +%Y%m%d-%H%M%S)"
cp -p "$SUPABASE_ENV" "$BACKUP"
chmod 600 "$BACKUP"

if [ "$MODE" = "activer" ]; then
  # Les modèles doivent être en ligne avec le code (site déployé).
  PAGE="$(curl -fsS "$SITE/emails/confirmation.html" 2>/dev/null || true)"
  [[ "$PAGE" == *'{{ .Token }}'* ]] || {
    echo "Modèles introuvables sur $SITE/emails/ : déployez d'abord le site (git push)." >&2
    exit 1
  }

  # Adresse des modèles pour le service d'authentification : le site en interne s'il répond,
  # sinon son adresse publique.
  BASE="$SITE"
  PAGE="$(docker compose exec -T auth wget -q -O - "$INTERNAL/emails/confirmation.html" 2>/dev/null || true)"
  [[ "$PAGE" == *'{{ .Token }}'* ]] && BASE="$INTERNAL"
  echo "==> Modèles lus depuis $BASE/emails/"

  cat > "$EXTRA" <<YAML
# E-mails du service de connexion en français (SYSI TRAVEL) : deploy/emails-connexion.sh.
services:
  auth:
    environment:
      GOTRUE_MAILER_TEMPLATES_CONFIRMATION: "$BASE/emails/confirmation.html"
      GOTRUE_MAILER_TEMPLATES_RECOVERY: "$BASE/emails/recovery.html"
      GOTRUE_MAILER_TEMPLATES_MAGIC_LINK: "$BASE/emails/magic_link.html"
      GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE: "$BASE/emails/email_change.html"
      GOTRUE_MAILER_TEMPLATES_INVITE: "$BASE/emails/invite.html"
      GOTRUE_MAILER_TEMPLATES_REAUTHENTICATION: "$BASE/emails/reauthentication.html"
      GOTRUE_MAILER_SUBJECTS_CONFIRMATION: "Confirmez votre adresse e-mail · SYSI TRAVEL"
      GOTRUE_MAILER_SUBJECTS_RECOVERY: "Réinitialisez votre mot de passe · SYSI TRAVEL"
      GOTRUE_MAILER_SUBJECTS_MAGIC_LINK: "Votre lien de connexion · SYSI TRAVEL"
      GOTRUE_MAILER_SUBJECTS_EMAIL_CHANGE: "Confirmez votre nouvelle adresse e-mail · SYSI TRAVEL"
      GOTRUE_MAILER_SUBJECTS_INVITE: "Votre invitation · SYSI TRAVEL"
      GOTRUE_MAILER_SUBJECTS_REAUTHENTICATION: "Votre code de confirmation · SYSI TRAVEL"
YAML
  chmod 644 "$EXTRA"
  FILES="$(compose_files)"
  case ":$FILES:" in
    *":$EXTRA:"*) ;;
    *) set_var COMPOSE_FILE "$FILES:$EXTRA" ;;
  esac
else
  FILES="$(compose_files)"
  NEW="$(printf '%s' "$FILES" | tr ':' '\n' | { grep -vxF "$EXTRA" || true; } | paste -sd: -)"
  if [ "$NEW" = "docker-compose.yml" ] || [ "$NEW" = "docker-compose.yml:docker-compose.override.yml" ]; then
    sed -i '/^COMPOSE_FILE=/d' "$SUPABASE_ENV"
  else
    set_var COMPOSE_FILE "$NEW"
  fi
  rm -f "$EXTRA"
fi
chmod 600 "$SUPABASE_ENV"

echo "==> Redémarrage du service d'authentification"
docker compose up -d auth

echo "==> Vérification"
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8000/auth/v1/settings -H "apikey: $(get_var ANON_KEY)" > /dev/null 2>&1; then
    TEMPLATE="$(docker compose exec -T auth printenv GOTRUE_MAILER_TEMPLATES_CONFIRMATION 2>/dev/null || true)"
    if [ "$MODE" = "activer" ]; then
      [ -n "$TEMPLATE" ] || { echo "Le service d'authentification ne voit pas les modèles (COMPOSE_FILE ?)." >&2; exit 1; }
      echo "E-mails en français actifs ($TEMPLATE)."
      echo "Test : sur https://sysitravel.com/register, créez un compte ou cliquez « Renvoyer l'e-mail » :"
      echo "l'e-mail reçu doit être en français, avec le code à 6 chiffres et le bouton."
    else
      [ -z "$TEMPLATE" ] || { echo "Les modèles sont encore actifs." >&2; exit 1; }
      echo "E-mails par défaut de Supabase rétablis."
    fi
    echo "Ancienne configuration sauvegardée : $BACKUP"
    exit 0
  fi
  sleep 2
done

echo "Le service d'authentification ne répond pas. Journaux :" >&2
docker compose logs --tail 40 auth >&2 || true
echo "Pour revenir en arrière : cp -p $BACKUP $SUPABASE_ENV && rm -f $SUPABASE_DIR/$EXTRA && (cd $SUPABASE_DIR && docker compose up -d auth)" >&2
exit 1
