# AGENTS.md

## Project Context

SYSI TRAVEL's website: **TanStack Start** (React 19, plain JavaScript — no TypeScript) with file-based routes, server functions and server routes, server-side rendered on **Node**. Data, accounts and photo storage live in **Supabase** (self-hosted on the production VPS). Treat it as user-owned application code and keep changes focused on the request.

`README.md` covers local setup; `DEPLOIEMENT.md` the VPS deployment (in French, for the owner).

## Key Files

- `supabase/migrations/*.sql`: the schema, row level security and the `images` storage bucket. Change the database only through a new numbered migration (idempotent SQL), never by editing an applied one. `supabase/seed.sql`: starter content. `supabase/config.toml`: the local CLI stack (ports 563xx).
- `src/routes/__root.jsx`: the HTML document and the providers. There is no `index.html`.
- `src/routes/*.jsx`: one page per file. `src/routes/api/*.js`: server routes (raw HTTP endpoints). `src/routeTree.gen.ts` is generated on every dev/build run — never edit or commit it.
- `src/lib/server-fns.js`: server functions (`createServerFn`), the data layer pages call. Declare each server function at module top level (the compiler extracts them), sharing helpers for their bodies.
- `src/start.js` applies `authMiddleware` to every server function and `supabaseRequestMiddleware` to every request, so handlers get `context.getSupabase()`: a per-request Supabase client acting as the caller (their access token, so RLS applies), anonymous when there is none.
- `src/lib/auth-middleware.js`: that client, plus `requireUser` (sets `context.user` = `{ id, email, full_name, role }`), `requireAdmin` and `requireUserRoute`.
- `src/lib/supabase.js`: `browserSupabase()`, the browser client — session (localStorage), auth calls, photo uploads. Browser only.
- `src/lib/AuthContext.jsx`: `useAuth()` (`user`, `isAuthenticated`, `isLoadingAuth`, `refresh`, `logout`, `navigateToLogin`), resolved after hydration as `authQuery` in the router's QueryClient.
- `src/components/auth/`: the auth pages and the login gate. `src/routes/_authed.jsx` gates everything under `src/routes/_authed/`; `src/routes/_authed/admin.jsx` additionally requires `role === "admin"` in `beforeLoad`.
- `src/server.js`: the server entry (TanStack's default handler). `server.mjs`: the production Node server (srvx) serving `dist/client` and `dist/server/server.js`.
- `src/components/ui/`: shadcn/ui kit. `src/index.css` + `tailwind.config.js`: design tokens.

## Roles

`public.profiles.role` is `admin` or `user`; a trigger creates a `user` profile for every new account. No API policy lets anyone change a role — promotion is done in SQL. `public.is_admin()` is the helper every admin RLS policy uses.

## Server Security

- Every server function and server route is a public HTTP endpoint. A page's `beforeLoad`, redirect or hidden button protects nothing on the server.
- Admin server functions add `.middleware([requireAdmin])`; RLS enforces the same rule a second time in the database. Keep both.
- Validate input with `.validator(zodSchema)` and bound every string and array (`.max()`), `z.enum` for choices.
- The app never uses the Supabase `service_role` key. If a task truly needs it, read it in server code only (`process.env.SUPABASE_SERVICE_ROLE_KEY`), after `requireAdmin`.
- Anything under `import.meta.env.VITE_*` is compiled into the browser bundle — only public values (the Supabase URL and anon key) go there.
- Never forward, log or return incoming request headers (they carry the caller's token).
- A route that opts into shared caching (`Cache-Control: public` / `s-maxage`) must render the same HTML for everyone.

## Working Notes

- `npx supabase start` then `npm run dev`. `.env.local` holds the local `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Server code reads `SUPABASE_URL` / `SUPABASE_ANON_KEY` from `process.env` at runtime, falling back to the `VITE_` values.
- `npm run build` emits `dist/client` and `dist/server`; `npm start` serves them. Never commit `dist`.
- Data flows through the router: `loader` + `Route.useLoaderData()` for reads, server-function calls then `router.invalidate()` for writes. The router creates the `QueryClient` per request (`src/router.jsx`); never share one across requests.
- `ssr: false` only on pages that need the signed-in user (everything under `_authed/`) and the auth pages; public pages stay SSR'd.
- Server and first client render must match: read `window`, `document` and browser storage only in effects and handlers, and format dates and numbers with an explicit locale and time zone.
- Run `npm run lint` before finishing code changes. Write JavaScript/JSX only (the generated `src/routeTree.gen.ts` is the sole exception).
