-- Vidéos de présentation de l'entreprise et de la Guinée (ORDRE n° 8), gérées depuis
-- l'administration. Une vidéo est un lien YouTube, Vimeo ou un fichier .mp4 / .webm : le site
-- n'héberge pas les gros fichiers, il les affiche dans son propre lecteur.
-- La première vidéo visible (ordre de l'administration) est mise en avant sur l'accueil.
-- Idempotent : rejouée à chaque déploiement.

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 1000),
  category text not null default 'entreprise' check (category in ('entreprise', 'guinee')),
  -- Lien https:// (YouTube, Vimeo, fichier) ou chemin d'un fichier du site (/videos/…).
  url text not null check (char_length(url) <= 500 and (url ~ '^https://' or url ~ '^/')),
  poster text not null default '' check (char_length(poster) <= 2000),
  duration text not null default '' check (char_length(duration) <= 20),
  vertical boolean not null default false,
  published boolean not null default true,
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists videos_sort_order_idx on public.videos (sort_order);

drop trigger if exists touch_updated_at on public.videos;
create trigger touch_updated_at before update on public.videos
  for each row execute function public.touch_updated_at();

alter table public.videos enable row level security;

drop policy if exists "lecture des videos publiees" on public.videos;
create policy "lecture des videos publiees" on public.videos
  for select to anon, authenticated
  using (published or public.is_admin());

drop policy if exists "ecriture admin" on public.videos;
create policy "ecriture admin" on public.videos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.videos to anon, authenticated;
grant insert, update, delete on public.videos to authenticated;
