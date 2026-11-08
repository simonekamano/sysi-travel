# Déploiement de SYSI TRAVEL sur un VPS Hostinger (avec Supabase auto-hébergé)

Architecture finale, tout sur le même VPS :

```
Internet ──► Nginx (80/443, HTTPS Let's Encrypt)
               ├── sysitravel.com      ──► app SYSI TRAVEL  (Docker, 127.0.0.1:3000)
               └── api.sysitravel.com  ──► Supabase / Kong  (Docker, 127.0.0.1:8000)
                                                 ├── Postgres (base de données)
                                                 ├── Auth (comptes, e-mails)
                                                 ├── Storage (photos du site)
                                                 └── Studio (interface d'administration de la base)
```

Remplacez partout `sysitravel.com` par votre vrai domaine.

---

## 1. Préparer le VPS

**Taille conseillée** : Ubuntu 24.04, au moins **4 Go de RAM** (Supabase lance une dizaine de conteneurs), 2 vCPU, 40 Go de disque.

**DNS** (chez votre registrar ou dans hPanel → Domaines → DNS) : trois enregistrements `A` vers l'IP du VPS :
`sysitravel.com`, `www.sysitravel.com`, `api.sysitravel.com`.

```bash
ssh root@IP_DU_VPS
apt update && apt upgrade -y
apt install -y git nginx certbot python3-certbot-nginx ufw
curl -fsSL https://get.docker.com | sh

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

> ⚠️ Docker contourne `ufw` : un port publié en `0.0.0.0` est ouvert sur Internet même si `ufw` le bloque.
> C'est pourquoi tous les ports ci-dessous sont liés à `127.0.0.1`.

---

## 2. Installer Supabase (auto-hébergé)

```bash
git clone --depth 1 https://github.com/supabase/supabase /opt/supabase-src
mkdir -p /opt/supabase && cp -rf /opt/supabase-src/docker/* /opt/supabase/
cp /opt/supabase-src/docker/.env.example /opt/supabase/.env
cd /opt/supabase
```

### 2.1 Générer les secrets

```bash
sh ./utils/generate-keys.sh   # écrit JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY… dans .env
```

Si ce script n'existe pas dans votre version, générez `JWT_SECRET` (`openssl rand -base64 48`) puis
`ANON_KEY` et `SERVICE_ROLE_KEY` avec le générateur de la documentation Supabase
(« Self-Hosting with Docker → Generate API keys »).

### 2.2 Compléter `/opt/supabase/.env`

| Variable | Valeur |
| --- | --- |
| `POSTGRES_PASSWORD` | mot de passe long et aléatoire (`openssl rand -hex 24`) |
| `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` | identifiants du Studio — **mot de passe fort** |
| `SITE_URL` | `https://sysitravel.com` |
| `ADDITIONAL_REDIRECT_URLS` | `https://sysitravel.com/**,https://www.sysitravel.com/**` |
| `API_EXTERNAL_URL` | `https://api.sysitravel.com` |
| `SUPABASE_PUBLIC_URL` | `https://api.sysitravel.com` |
| `ENABLE_EMAIL_SIGNUP` | `true` |
| `ENABLE_EMAIL_AUTOCONFIRM` | `false` (l'e-mail doit être confirmé) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_ADMIN_EMAIL`, `SMTP_SENDER_NAME` | Resend, voir § 2.2 bis : **obligatoire** pour les e-mails de confirmation et de mot de passe oublié |

### 2.2 bis E-mails avec Resend

1. Sur [resend.com](https://resend.com) : **Domains** → **Add domain** → `sysitravel.com`.
2. Dans hPanel → DNS, ajoutez **exactement** les enregistrements affichés par Resend
   (DKIM `resend._domainkey` en TXT, puis MX et TXT SPF sur `send`), puis cliquez sur **Verify**.
3. **API Keys** → **Create API key**, permission *Sending access*, domaine `sysitravel.com`.
4. Sur le VPS, en root (la clé est demandée sans s'afficher) :

   ```bash
   bash /opt/sysi-travel/app/deploy/configure-resend.sh            # expéditeur no-reply@sysitravel.com
   bash /opt/sysi-travel/app/deploy/configure-resend.sh contact@sysitravel.com
   ```

Le script règle `smtp.resend.com:465`, l'utilisateur `resend`, la clé comme mot de passe, puis
redémarre le service Auth. En cas d'échec : `docker logs supabase-auth --tail 50`.

### 2.3 Ne rien exposer directement sur Internet

Dans `/opt/supabase/docker-compose.yml`, préfixez les ports publiés par `127.0.0.1:` :

```yaml
  kong:
    ports:
      - "127.0.0.1:${KONG_HTTP_PORT}:8000/tcp"
      - "127.0.0.1:${KONG_HTTPS_PORT}:8443/tcp"
  supavisor:            # (selon la version : « pooler »)
    ports:
      - "127.0.0.1:${POSTGRES_PORT}:5432"
      - "127.0.0.1:${POOLER_PROXY_PORT_TRANSACTION}:6543"
```

### 2.4 Démarrer

```bash
cd /opt/supabase
docker compose pull
docker compose up -d
docker compose ps        # tous les services doivent être « healthy »
```

---

## 3. Créer le schéma de la base

Les migrations (`supabase/migrations/*.sql`) sont appliquées automatiquement à chaque
déploiement par `deploy/deploy.sh` (§ 4). Elles sont idempotentes : les rejouer ne casse rien.

Une seule fois, après le premier déploiement, le contenu de départ (destinations, formules,
FAQ) — à sauter si vous importez vos données Base44 (§ 8) :

```bash
docker exec -i supabase-db psql -U postgres -d postgres < /opt/sysi-travel/app/supabase/seed.sql
```

| Table | Lecture | Écriture |
| --- | --- | --- |
| `destinations`, `formules`, `faqs` | tout le monde | administrateurs |
| `demandes_sejour` (formulaire de contact) | administrateurs | création : tout le monde ; suivi/suppression : administrateurs |
| `profiles` (rôle `admin` / `user`) | son propre profil, ou admin | personne via l'API (uniquement en SQL) |
| Storage `images` | public | administrateurs |

---

## 4. L'application et le déploiement automatique (GitHub Actions)

Organisation sur le VPS :

| Chemin | Contenu |
| --- | --- |
| `/opt/supabase` | Supabase (projet Docker `supabase`, réseau `supabase_default`) |
| `/opt/sysi-travel/.env` | configuration de l'app (jamais dans Git, modèle : `.env.example`) |
| `/opt/sysi-travel/app` | le code, envoyé par GitHub Actions à chaque déploiement |

### 4.1 Préparer le VPS (une seule fois, en root)

`deploy/bootstrap-vps.sh` installe Docker, Nginx, certbot, le pare-feu et crée l'utilisateur
`deploy` utilisé par GitHub Actions :

```bash
bash bootstrap-vps.sh "ssh-ed25519 AAAA… sysitravel_deploy@sysitravel.com"
```

### 4.2 Configuration de l'app

```bash
nano /opt/sysi-travel/.env     # modèle : .env.example
chown deploy:deploy /opt/sysi-travel/.env && chmod 600 /opt/sysi-travel/.env
```

```dotenv
VITE_SUPABASE_URL=https://api.sysitravel.com
VITE_SUPABASE_ANON_KEY=<ANON_KEY de /opt/supabase/.env>
VITE_SUPABASE_GOOGLE_ENABLED=false
SUPABASE_URL=http://kong:8000
SUPABASE_ANON_KEY=<la même ANON_KEY>
SITE_URL=https://sysitravel.com
```

> La `SERVICE_ROLE_KEY` n'est **jamais** nécessaire à l'application : ne la mettez pas dans ce fichier.

### 4.3 Secrets GitHub

Dans le dépôt GitHub → **Settings → Secrets and variables → Actions → New repository secret** :

| Secret | Valeur |
| --- | --- |
| `VPS_HOST` | `2.24.51.140` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | contenu complet de la clé **privée** `sysitravel_deploy` |
| `VPS_KNOWN_HOSTS` | sortie de `ssh-keyscan -t ed25519 2.24.51.140` |

### 4.4 Déployer

Chaque push sur `main` lance `.github/workflows/deploy.yml` :

1. **Lint et build** (aussi sur chaque pull request) ;
2. **envoi du code** dans `/opt/sysi-travel/app` (rsync) ;
3. **`deploy/deploy.sh`** sur le VPS : migrations SQL, reconstruction de l'image, redémarrage,
   attente de `/api/health` ;
4. vérification de `https://sysitravel.com/api/health`.

Relancer un déploiement sans nouveau commit : onglet **Actions → CI et déploiement → Run workflow**.
À la main sur le VPS : `sudo -u deploy bash /opt/sysi-travel/app/deploy/deploy.sh`.

---

## 5. Nginx et HTTPS

```bash
cp /opt/sysi-travel/app/deploy/nginx/sysi-travel.conf /etc/nginx/sites-available/sysi-travel
ln -sf /etc/nginx/sites-available/sysi-travel /etc/nginx/sites-enabled/sysi-travel
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

certbot --nginx --redirect -d sysitravel.com -d www.sysitravel.com -d api.sysitravel.com
```

Prérequis : les enregistrements DNS `A` de `sysitravel.com`, `www` et `api` pointent vers `2.24.51.140`.

Le site répond sur `https://sysitravel.com`, le Studio Supabase sur `https://api.sysitravel.com`
(protégé par `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`).

---

## 6. Créer le compte administrateur

1. Ouvrez `https://sysitravel.com/register`, créez le compte et cliquez sur le lien reçu par e-mail.
2. Donnez-lui le rôle admin :

   ```bash
   docker exec -it supabase-db psql -U postgres -d postgres \
     -c "update public.profiles set role = 'admin' where email = 'votre@email.com';"
   ```
3. Connectez-vous sur `https://sysitravel.com/admin`.

Une fois les comptes admin créés, vous pouvez fermer les inscriptions publiques :
`DISABLE_SIGNUP=true` dans `/opt/supabase/.env`, puis `docker compose up -d` dans `/opt/supabase`.

---

## 7. Pages du site et leur connexion à Supabase

| Page | Données | Accès |
| --- | --- | --- |
| `/` | destinations, formules, FAQ (lecture) + formulaire → `demandes_sejour` | public |
| `/contact` | destinations, formules (lecture) + formulaire → `demandes_sejour` | public |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Supabase Auth | public |
| `/admin` | destinations (CRUD + photos dans Storage) | admin |
| `/admin/formules` | formules (CRUD + photos) | admin |
| `/admin/faq` | FAQ (CRUD) | admin |
| `/admin/demandes` | demandes de séjour (lecture, statut, suppression) | admin |
| `/api/health` | test de connexion à la base | public (supervision) |

---

## 8. Reprendre les données de Base44 (si le site était déjà en ligne)

1. Dans le tableau de bord Base44 → **Data**, exportez en CSV : `Destination`, `Formule`, `Faq`, `DemandeSejour`.
2. Dans le Studio Supabase → **Table Editor** → table correspondante → **Import data from CSV**.
   Correspondance des colonnes : `order` → `sort_order` ; `tags` et `features` sont des listes
   (format Postgres `{"Plage","Snorkeling"}`). Ne pas importer les colonnes `id`, `created_date`, `created_by`.
3. **Photos** : les illustrations Base44 sont copiées dans `public/images/illustrations/`
   (migration `0004_images_locales.sql`). Pour les remplacer par de vraies photos : depuis
   l'administration pour les destinations et formules (bouton « Choisir une photo »), ou dans
   `public/images/` puis `src/data/site.js` pour l'accueil, le formulaire et les pages de connexion.

---

## 9. Exploitation

**Mettre à jour le site** : un push (ou une pull request fusionnée) sur `main` suffit, GitHub
Actions déploie (§ 4.4). Une nouvelle migration SQL (`supabase/migrations/000X_….sql`) est
appliquée au passage.

**Journaux de l'app** : `docker compose --project-name sysi-travel logs -f web`.

**Sauvegarde quotidienne de la base** (`crontab -e`) :

```cron
0 3 * * * docker exec supabase-db pg_dump -U postgres -d postgres -Fc > /root/backups/sysi-$(date +\%F).dump && find /root/backups -name 'sysi-*.dump' -mtime +14 -delete
```

(`mkdir -p /root/backups` avant.) Pensez aussi à copier ces fichiers hors du VPS, et à sauvegarder
`/opt/supabase/volumes/storage` (les photos).

**Journaux Supabase** : `docker compose -f /opt/supabase/docker-compose.yml logs -f auth` (e-mails, connexions).

---

## 10. Développement en local

```bash
npm install
npx supabase start     # Supabase local (ports 563xx), applique la migration et le seed
npm run dev            # http://localhost:3000
```

`.env.local` contient l'URL et la clé anon locales (clés de démonstration publiques du CLI Supabase).
Studio local : http://127.0.0.1:57323 · e-mails de test : http://127.0.0.1:57324.
