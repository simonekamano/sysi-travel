# Déploiement de SYSI TRAVEL sur un VPS Hostinger (avec Supabase auto-hébergé)

Architecture finale, tout sur le même VPS :

```
Internet ──► Nginx (80/443, HTTPS Let's Encrypt)
               ├── votre-domaine.com      ──► app SYSI TRAVEL  (Docker, 127.0.0.1:3000)
               └── api.votre-domaine.com  ──► Supabase / Kong  (Docker, 127.0.0.1:8000)
                                                 ├── Postgres (base de données)
                                                 ├── Auth (comptes, e-mails)
                                                 ├── Storage (photos du site)
                                                 └── Studio (interface d'administration de la base)
```

Remplacez partout `votre-domaine.com` par votre vrai domaine.

---

## 1. Préparer le VPS

**Taille conseillée** : Ubuntu 24.04, au moins **4 Go de RAM** (Supabase lance une dizaine de conteneurs), 2 vCPU, 40 Go de disque.

**DNS** (chez votre registrar ou dans hPanel → Domaines → DNS) : trois enregistrements `A` vers l'IP du VPS :
`votre-domaine.com`, `www.votre-domaine.com`, `api.votre-domaine.com`.

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
| `SITE_URL` | `https://votre-domaine.com` |
| `ADDITIONAL_REDIRECT_URLS` | `https://votre-domaine.com/**,https://www.votre-domaine.com/**` |
| `API_EXTERNAL_URL` | `https://api.votre-domaine.com` |
| `SUPABASE_PUBLIC_URL` | `https://api.votre-domaine.com` |
| `ENABLE_EMAIL_SIGNUP` | `true` |
| `ENABLE_EMAIL_AUTOCONFIRM` | `false` (l'e-mail doit être confirmé) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_ADMIN_EMAIL`, `SMTP_SENDER_NAME` | un vrai serveur SMTP (Hostinger Mail, Brevo, Resend…) : **obligatoire** pour les e-mails de confirmation et de mot de passe oublié |

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

```bash
git clone <URL_DE_VOTRE_DEPOT> /opt/sysi-travel
cd /opt/sysi-travel

# Tables, règles d'accès (RLS), rôles, bucket « images »
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/0001_init.sql

# Contenu de départ (destinations, formules, FAQ) — à sauter si vous importez vos données Base44 (§ 8)
docker exec -i supabase-db psql -U postgres -d postgres < supabase/seed.sql
```

Le script est idempotent : on peut le relancer sans risque.

| Table | Lecture | Écriture |
| --- | --- | --- |
| `destinations`, `formules`, `faqs` | tout le monde | administrateurs |
| `demandes_sejour` (formulaire de contact) | administrateurs | création : tout le monde ; suivi/suppression : administrateurs |
| `profiles` (rôle `admin` / `user`) | son propre profil, ou admin | personne via l'API (uniquement en SQL) |
| Storage `images` | public | administrateurs |

---

## 4. Lancer l'application

```bash
cd /opt/sysi-travel
cp .env.example .env
nano .env
```

```dotenv
VITE_SUPABASE_URL=https://api.votre-domaine.com
VITE_SUPABASE_ANON_KEY=<ANON_KEY de /opt/supabase/.env>
VITE_SUPABASE_GOOGLE_ENABLED=false
SUPABASE_URL=http://host.docker.internal:8000
SUPABASE_ANON_KEY=<la même ANON_KEY>
PORT=3000
```

> La `SERVICE_ROLE_KEY` n'est **jamais** nécessaire à l'application : ne la mettez pas dans ce fichier.

```bash
docker compose up -d --build
curl http://127.0.0.1:3000/api/health     # {"status":"ok","database":"ok"}
```

---

## 5. Nginx et HTTPS

```bash
cp deploy/nginx/sysi-travel.conf /etc/nginx/sites-available/sysi-travel
sed -i 's/votre-domaine.com/VOTRE_DOMAINE/g' /etc/nginx/sites-available/sysi-travel
ln -s /etc/nginx/sites-available/sysi-travel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

certbot --nginx -d votre-domaine.com -d www.votre-domaine.com -d api.votre-domaine.com
```

Le site répond sur `https://votre-domaine.com`, le Studio Supabase sur `https://api.votre-domaine.com`
(protégé par `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`).

---

## 6. Créer le compte administrateur

1. Ouvrez `https://votre-domaine.com/register`, créez le compte et cliquez sur le lien reçu par e-mail.
2. Donnez-lui le rôle admin :

   ```bash
   docker exec -it supabase-db psql -U postgres -d postgres \
     -c "update public.profiles set role = 'admin' where email = 'votre@email.com';"
   ```
3. Connectez-vous sur `https://votre-domaine.com/admin`.

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
3. **Photos** : les images actuelles sont hébergées sur `media.base44.com` (logo et photos dans `src/data/site.js`,
   et photos des destinations/formules). Pour ne plus dépendre de Base44, ré-envoyez-les depuis
   l'administration (bouton « Choisir une photo ») ou placez-les dans `public/` et mettez à jour `src/data/site.js`.

---

## 9. Exploitation

**Mettre à jour le site**

```bash
cd /opt/sysi-travel && git pull && docker compose up -d --build
```

Une nouvelle migration SQL (`supabase/migrations/000X_….sql`) s'applique de la même façon qu'au § 3.

**Sauvegarde quotidienne de la base** (`crontab -e`) :

```cron
0 3 * * * docker exec supabase-db pg_dump -U postgres -d postgres -Fc > /root/backups/sysi-$(date +\%F).dump && find /root/backups -name 'sysi-*.dump' -mtime +14 -delete
```

(`mkdir -p /root/backups` avant.) Pensez aussi à copier ces fichiers hors du VPS, et à sauvegarder
`/opt/supabase/volumes/storage` (les photos).

**Journaux** : `docker compose logs -f web` (app) · `docker compose -f /opt/supabase/docker-compose.yml logs -f auth` (e-mails, connexions).

---

## 10. Développement en local

```bash
npm install
npx supabase start     # Supabase local (ports 563xx), applique la migration et le seed
npm run dev            # http://localhost:3000
```

`.env.local` contient l'URL et la clé anon locales (clés de démonstration publiques du CLI Supabase).
Studio local : http://127.0.0.1:56323 · e-mails de test : http://127.0.0.1:56324.
