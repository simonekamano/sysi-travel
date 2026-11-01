#!/usr/bin/env bash
# Mise en ligne sur le VPS, lancée par GitHub Actions après l'envoi du code dans
# /opt/sysi-travel/app (ou à la main : bash /opt/sysi-travel/app/deploy/deploy.sh).
#   1. applique les migrations SQL (idempotentes) sur la base Supabase ;
#   2. reconstruit l'image et redémarre le conteneur ;
#   3. attend que /api/health réponde, sinon affiche les journaux et échoue.
set -euo pipefail

ROOT=/opt/sysi-travel
APP="$ROOT/app"
ENV_FILE="$ROOT/.env"
REVISION="${1:-manuel}"
COMPOSE=(docker compose --project-name sysi-travel --env-file "$ENV_FILE")

cd "$APP"
[ -f "$ENV_FILE" ] || { echo "Configuration absente : $ENV_FILE (voir DEPLOIEMENT.md)"; exit 1; }

echo "==> Migrations SQL"
for migration in supabase/migrations/*.sql; do
  echo "    $migration"
  docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -q -U postgres -d postgres < "$migration"
done

echo "==> Sauvegarde quotidienne de la base (3 h 15)"
BACKUP_JOB="15 3 * * * bash $APP/deploy/backup-db.sh >> $ROOT/backups.log 2>&1"
( crontab -l 2>/dev/null | grep -vF "deploy/backup-db.sh" || true; echo "$BACKUP_JOB" ) | crontab -
# Une première sauvegarde tout de suite, si aucune n'existe encore.
ls "$ROOT"/backups/supabase-*.dump > /dev/null 2>&1 || bash "$APP/deploy/backup-db.sh"

echo "==> Construction et redémarrage ($REVISION)"
"${COMPOSE[@]}" up -d --build --remove-orphans

echo "==> Vérification"
for _ in $(seq 1 45); do
  if curl -fsS http://127.0.0.1:3000/api/health > /dev/null; then
    echo "    En ligne : $REVISION"
    docker image prune -f > /dev/null
    exit 0
  fi
  sleep 2
done

echo "Le site ne répond pas sur /api/health :"
"${COMPOSE[@]}" logs --tail 80 web
exit 1
