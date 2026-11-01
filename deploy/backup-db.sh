#!/usr/bin/env bash
# Sauvegarde quotidienne de la base Supabase (contenu du site, demandes, comptes, fichiers
# référencés), installée dans la crontab de « deploy » par deploy.sh. Garde 14 jours.
# Restauration : docker exec -i supabase-db pg_restore -U supabase_admin -d postgres --clean --if-exists < fichier.dump
set -euo pipefail

DIR=/opt/sysi-travel/backups
KEEP_DAYS=14

install -d -m 700 "$DIR"
FILE="$DIR/supabase-$(date +%Y-%m-%d_%H%M).dump"

docker exec supabase-db pg_dump -U supabase_admin -d postgres \
  --schema=public --schema=auth --schema=storage -Fc > "$FILE.tmp"
mv "$FILE.tmp" "$FILE"
chmod 600 "$FILE"

find "$DIR" -name 'supabase-*.dump' -mtime +"$KEEP_DAYS" -delete
echo "Sauvegarde : $FILE ($(du -h "$FILE" | cut -f1))"
