#!/usr/bin/env bash
# Préparation initiale du VPS Ubuntu, une seule fois, en root :
#   bash bootstrap-vps.sh "ssh-ed25519 AAAA… sysitravel_deploy@sysitravel.com"
# Installe Docker, Nginx, certbot, le pare-feu, et crée l'utilisateur « deploy »
# que GitHub Actions utilise (clé publique en argument). Peut être relancé sans risque.
set -euo pipefail

DEPLOY_PUBLIC_KEY="${1:?Usage : bash bootstrap-vps.sh \"<clé publique de déploiement>\"}"
export DEBIAN_FRONTEND=noninteractive

echo "==> Paquets système"
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl git rsync nginx certbot python3-certbot-nginx ufw fail2ban unattended-upgrades

echo "==> Docker"
if ! command -v docker > /dev/null; then
  # Script officiel ; repli sur les paquets Ubuntu s'il ne connaît pas encore cette version.
  curl -fsSL https://get.docker.com | sh || apt-get install -y docker.io docker-compose-v2
fi
systemctl enable --now docker
docker compose version

echo "==> Utilisateur deploy"
id deploy > /dev/null 2>&1 || useradd --create-home --shell /bin/bash deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
grep -qxF "$DEPLOY_PUBLIC_KEY" /home/deploy/.ssh/authorized_keys || echo "$DEPLOY_PUBLIC_KEY" >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
install -d -o deploy -g deploy /opt/sysi-travel /opt/sysi-travel/app

echo "==> Pare-feu (SSH, HTTP, HTTPS uniquement)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Mises à jour de sécurité automatiques"
dpkg-reconfigure -f noninteractive unattended-upgrades
systemctl enable --now fail2ban

echo "Terminé. Étape suivante : Supabase (DEPLOIEMENT.md, § 2)."
