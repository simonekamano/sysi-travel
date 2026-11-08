-- Circuits, excursions et visites guidées (/circuits/<slug>), gérés depuis l'administration.
-- Le programme est une liste d'étapes jour par jour : [{"title": "...", "description": "..."}].
-- Un circuit non publié (brouillon) n'est visible que des administrateurs.
-- Idempotent : rejouée à chaque déploiement (deploy/deploy.sh).

create table if not exists public.circuits (
  id uuid primary key default gen_random_uuid(),
  slug text,
  title text not null check (char_length(title) between 1 and 200),
  kind text not null default 'circuit' check (kind in ('circuit', 'excursion', 'visite')),
  tagline text not null default '',
  duration text not null default '',
  price text not null default '',
  departure text not null default '',
  dates text not null default '',
  image text not null default '',
  description text not null default '',
  included text[] not null default '{}',
  excluded text[] not null default '{}',
  programme jsonb not null default '[]'::jsonb check (jsonb_typeof(programme) = 'array'),
  published boolean not null default false,
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Slug calculé depuis le titre quand l'administration le laisse vide ; suffixé s'il est déjà pris.
create or replace function public.circuits_set_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := public.slugify(coalesce(nullif(trim(new.slug), ''), new.title));
  if new.slug = '' then
    new.slug := left(new.id::text, 8);
  end if;
  if exists (select 1 from public.circuits where slug = new.slug and id <> new.id) then
    new.slug := new.slug || '-' || left(new.id::text, 6);
  end if;
  return new;
end;
$$;

drop trigger if exists circuits_set_slug on public.circuits;
create trigger circuits_set_slug
  before insert or update of slug, title on public.circuits
  for each row execute function public.circuits_set_slug();

alter table public.circuits alter column slug set not null;
create unique index if not exists circuits_slug_key on public.circuits (slug);
create index if not exists circuits_sort_order_idx on public.circuits (sort_order);

drop trigger if exists touch_updated_at on public.circuits;
create trigger touch_updated_at before update on public.circuits
  for each row execute function public.touch_updated_at();

alter table public.circuits enable row level security;

drop policy if exists "lecture des circuits publies" on public.circuits;
create policy "lecture des circuits publies" on public.circuits
  for select to anon, authenticated
  using (published or public.is_admin());

drop policy if exists "ecriture admin" on public.circuits;
create policy "ecriture admin" on public.circuits
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.circuits to anon, authenticated;
grant insert, update, delete on public.circuits to authenticated;
