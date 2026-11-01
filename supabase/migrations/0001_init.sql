-- SYSI TRAVEL — schéma initial Supabase.
-- Reprend les entités Base44 (Destination, Formule, Faq, DemandeSejour, User.role)
-- avec les mêmes règles d'accès, appliquées par la Row Level Security de Postgres.
-- Idempotent : peut être rejoué sans erreur.

-- ---------------------------------------------------------------------------
-- Profils et rôles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

-- Un profil est créé pour chaque nouveau compte, toujours avec le rôle « user ».
-- Pour promouvoir un administrateur : update public.profiles set role = 'admin' where email = '…';
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Comptes créés avant ce script.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- security definer : lit profiles sans repasser par ses propres règles RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;

drop policy if exists "profiles: lecture de son profil ou admin" on public.profiles;
create policy "profiles: lecture de son profil ou admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Aucune politique d'écriture : personne ne peut changer son propre rôle depuis l'API.

-- ---------------------------------------------------------------------------
-- Contenu du site : destinations, formules, FAQ (lecture publique, écriture admin)
-- ---------------------------------------------------------------------------

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null default '',
  text text not null default '',
  price text not null default '',
  image text not null default '',
  tags text[] not null default '{}',
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price text not null default '',
  duration text not null default '',
  tagline text not null default '',
  features text[] not null default '{}',
  image text not null default '',
  highlight boolean not null default false,
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Demandes de séjour (formulaire de contact) : création publique, gestion admin
-- ---------------------------------------------------------------------------

create table if not exists public.demandes_sejour (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (char_length(nom) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  telephone text not null default '' check (char_length(telephone) <= 50),
  pays text not null default '' check (char_length(pays) <= 100),
  destination text not null default '' check (char_length(destination) <= 200),
  formule text not null default '' check (char_length(formule) <= 200),
  periode text not null default '' check (char_length(periode) <= 200),
  voyageurs text not null default '' check (char_length(voyageurs) <= 10),
  message text not null default '' check (char_length(message) <= 5000),
  statut text not null default 'nouveau' check (statut in ('nouveau', 'en cours', 'traite')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists demandes_sejour_created_at_idx on public.demandes_sejour (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at automatique
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['destinations', 'formules', 'faqs', 'demandes_sejour'] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['destinations', 'formules', 'faqs'] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "lecture publique" on public.%I', t);
    execute format('create policy "lecture publique" on public.%I for select to anon, authenticated using (true)', t);

    execute format('drop policy if exists "ecriture admin" on public.%I', t);
    execute format('create policy "ecriture admin" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end;
$$;

alter table public.demandes_sejour enable row level security;

drop policy if exists "creation publique" on public.demandes_sejour;
create policy "creation publique" on public.demandes_sejour
  for insert to anon, authenticated
  with check (statut = 'nouveau');

drop policy if exists "lecture admin" on public.demandes_sejour;
create policy "lecture admin" on public.demandes_sejour
  for select to authenticated
  using (public.is_admin());

drop policy if exists "modification admin" on public.demandes_sejour;
create policy "modification admin" on public.demandes_sejour
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "suppression admin" on public.demandes_sejour;
create policy "suppression admin" on public.demandes_sejour
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Droits de l'API (PostgREST) : la RLS ci-dessus filtre ensuite ligne par ligne
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on public.destinations, public.formules, public.faqs to anon, authenticated;
grant insert, update, delete on public.destinations, public.formules, public.faqs to authenticated;
grant insert on public.demandes_sejour to anon, authenticated;
grant select, update, delete on public.demandes_sejour to authenticated;
grant select on public.profiles to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Stockage des photos (bucket public « images », envoi réservé aux admins)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "images: envoi admin" on storage.objects;
create policy "images: envoi admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and public.is_admin());

drop policy if exists "images: modification admin" on storage.objects;
create policy "images: modification admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'images' and public.is_admin());

drop policy if exists "images: suppression admin" on storage.objects;
create policy "images: suppression admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and public.is_admin());
