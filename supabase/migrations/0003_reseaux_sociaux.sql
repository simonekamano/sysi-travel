-- Réseaux sociaux de SYSI TRAVEL : une ligne par réseau, l'adresse saisie depuis
-- l'administration (vide = réseau masqué sur le site). Lecture publique, écriture admin.
-- Idempotent : rejouée à chaque déploiement (deploy/deploy.sh).

create table if not exists public.reseaux_sociaux (
  reseau text primary key check (reseau in ('facebook', 'instagram', 'tiktok', 'youtube', 'x')),
  url text not null default '' check (url = '' or url ~ '^https://'),
  sort_order double precision not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.reseaux_sociaux (reseau, sort_order) values
  ('facebook', 1),
  ('instagram', 2),
  ('tiktok', 3),
  ('youtube', 4),
  ('x', 5)
on conflict (reseau) do nothing;

drop trigger if exists touch_updated_at on public.reseaux_sociaux;
create trigger touch_updated_at before update on public.reseaux_sociaux
  for each row execute function public.touch_updated_at();

alter table public.reseaux_sociaux enable row level security;

drop policy if exists "lecture publique" on public.reseaux_sociaux;
create policy "lecture publique" on public.reseaux_sociaux
  for select to anon, authenticated using (true);

-- Les réseaux sont fixes : l'administration ne fait que modifier leur adresse.
drop policy if exists "modification admin" on public.reseaux_sociaux;
create policy "modification admin" on public.reseaux_sociaux
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.reseaux_sociaux to anon, authenticated;
grant update (url) on public.reseaux_sociaux to authenticated;
