# SYSI TRAVEL

Site de SYSI TRAVEL (tourisme en Guinée) : [TanStack Start](https://tanstack.com/start) (React 19, JavaScript),
rendu côté serveur sur Node, avec [Supabase](https://supabase.com) pour la base de données, les comptes et les photos.

Déploiement en production sur un VPS (Hostinger) avec Supabase auto-hébergé : voir **[DEPLOIEMENT.md](DEPLOIEMENT.md)**.

## Démarrer en local

```bash
npm install
npx supabase start     # Supabase local dans Docker (ports 563xx) : migration + données de départ
npm run dev            # http://localhost:3000
```

Créez `.env.local` avec l'URL et la clé `ANON_KEY` affichées par `npx supabase start` :

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:56321
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
```

Pour accéder à `/admin` : créez un compte sur `/register`, puis dans le Studio local (http://127.0.0.1:56323) ou en SQL :
`update public.profiles set role = 'admin' where email = '…';`

## Production

```bash
npm run build   # -> dist/client (fichiers statiques) + dist/server (rendu serveur)
npm start       # node server.mjs, port $PORT (3000 par défaut)
```

Ou avec Docker : `docker compose up -d --build` (voir `.env.example`).

## Organisation

| Élément | Fichier |
| --- | --- |
| Schéma SQL, règles d'accès (RLS), bucket photos | `supabase/migrations/0001_init.sql` |
| Données de départ | `supabase/seed.sql` |
| Lecture/écriture des données (fonctions serveur) | `src/lib/server-fns.js` |
| Client Supabase serveur, contrôle `requireUser` / `requireAdmin` | `src/lib/auth-middleware.js` |
| Client Supabase navigateur (session, envoi de photos) | `src/lib/supabase.js` |
| Session côté navigateur (`useAuth()`) | `src/lib/AuthContext.jsx` |
| Pages | `src/routes/` (admin sous `src/routes/_authed/admin/`) |
| Serveur de production | `server.mjs` |
