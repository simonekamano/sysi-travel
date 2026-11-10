-- Boutique de livres et guides numériques (ORDRE n° 18) : catalogue, commandes et
-- téléchargements sécurisés.
--   * livres            : le catalogue, géré dans l'administration ; le PDF est dans le bucket
--                         privé « livres ».
--   * commandes         : créées par les visiteurs via la fonction creer_commande (jamais
--                         d'écriture directe), lues et validées par les admins.
--   * commande_livres   : les livres de chaque commande, avec le titre et le prix au moment
--                         de l'achat.
-- Paiement : l'admin marque la commande « payée » (paiement reçu hors ligne) ; un paiement en
-- ligne (n° 17) pourra faire de même. L'acheteur reçoit alors un lien secret
-- /telechargement/<jeton>, valable 30 jours et limité à 30 téléchargements.
-- Le PDF ne sort du bucket privé que si la requête porte le jeton d'une commande payée qui le
-- contient (en-tête x-download-token, vérifié par la politique de stockage ci-dessous).
-- Idempotent : rejouée à chaque déploiement.

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table if not exists public.livres (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null check (char_length(title) between 1 and 200),
  subtitle text not null default '' check (char_length(subtitle) <= 300),
  author text not null default '' check (char_length(author) <= 200),
  kind text not null default 'guide' check (kind in ('livre', 'guide')),
  description text not null default '' check (char_length(description) <= 10000),
  cover text not null default '' check (char_length(cover) <= 2000),
  -- Prix en centimes d'euro : de 0,50 € à 1 000 €.
  price_cents integer not null check (price_cents between 50 and 100000),
  pages integer check (pages is null or pages between 1 and 5000),
  language text not null default 'Français' check (char_length(language) <= 60),
  -- Chemin du PDF dans le bucket privé « livres » ('' tant qu'aucun fichier n'est envoyé).
  file_path text not null default '' check (char_length(file_path) <= 300),
  file_size bigint not null default 0 check (file_size >= 0),
  published boolean not null default false,
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un livre en vente doit pouvoir être livré.
  constraint livres_publie_avec_fichier check (not published or file_path <> '')
);

create unique index if not exists livres_slug_key on public.livres (slug);
create index if not exists livres_sort_order_idx on public.livres (sort_order);

-- Slug calculé depuis le titre quand l'administration le laisse vide ; suffixé s'il est déjà pris.
create or replace function public.livres_set_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := public.slugify(coalesce(nullif(trim(new.slug), ''), new.title));
  if new.slug = '' then
    new.slug := left(new.id::text, 8);
  end if;
  if exists (select 1 from public.livres where slug = new.slug and id <> new.id) then
    new.slug := new.slug || '-' || left(new.id::text, 6);
  end if;
  return new;
end;
$$;

drop trigger if exists livres_set_slug on public.livres;
create trigger livres_set_slug
  before insert or update of slug, title on public.livres
  for each row execute function public.livres_set_slug();

drop trigger if exists touch_updated_at on public.livres;
create trigger touch_updated_at before update on public.livres
  for each row execute function public.touch_updated_at();

alter table public.livres enable row level security;

drop policy if exists "lecture des livres publies" on public.livres;
create policy "lecture des livres publies" on public.livres
  for select to anon, authenticated
  using (published or public.is_admin());

drop policy if exists "ecriture admin" on public.livres;
create policy "ecriture admin" on public.livres
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.livres to anon, authenticated;
grant insert, update, delete on public.livres to authenticated;

-- ---------------------------------------------------------------------------
-- Commandes
-- ---------------------------------------------------------------------------

create table if not exists public.commandes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  nom text not null check (char_length(nom) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  telephone text not null default '' check (char_length(telephone) <= 50),
  total_cents integer not null check (total_cents >= 0),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'payee', 'annulee')),
  -- Jeton secret du lien de téléchargement (256 bits aléatoires).
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  payee_le timestamptz,
  lien_expire_le timestamptz,
  telechargements integer not null default 0 check (telechargements >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commandes_created_at_idx on public.commandes (created_at desc);

create table if not exists public.commande_livres (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references public.commandes (id) on delete cascade,
  -- Le titre et le prix restent dans la commande si le livre est supprimé du catalogue.
  livre_id uuid references public.livres (id) on delete set null,
  title text not null,
  price_cents integer not null check (price_cents >= 0)
);

create index if not exists commande_livres_commande_idx on public.commande_livres (commande_id);
create index if not exists commande_livres_livre_idx on public.commande_livres (livre_id);

drop trigger if exists touch_updated_at on public.commandes;
create trigger touch_updated_at before update on public.commandes
  for each row execute function public.touch_updated_at();

alter table public.commandes enable row level security;
alter table public.commande_livres enable row level security;

drop policy if exists "gestion admin" on public.commandes;
create policy "gestion admin" on public.commandes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "gestion admin" on public.commande_livres;
create policy "gestion admin" on public.commande_livres
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, update, delete on public.commandes to authenticated;
grant select, update, delete on public.commande_livres to authenticated;

-- Nombre de téléchargements permis par commande, tant que le lien est valable.
create or replace function public.limite_telechargements()
returns integer
language sql
immutable
as $$ select 30 $$;

-- Un visiteur passe commande : les prix viennent du catalogue, jamais du navigateur.
create or replace function public.creer_commande(p_nom text, p_email text, p_telephone text, p_livres uuid[])
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
  v_id uuid;
  v_reference text;
  v_total integer;
  v_count integer;
begin
  p_nom := trim(coalesce(p_nom, ''));
  p_email := lower(trim(coalesce(p_email, '')));
  p_telephone := trim(coalesce(p_telephone, ''));
  if char_length(p_nom) not between 1 and 200 then
    raise exception 'Nom invalide';
  end if;
  if char_length(p_email) > 320 or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Adresse e-mail invalide';
  end if;
  if char_length(p_telephone) > 50 then
    raise exception 'Téléphone invalide';
  end if;

  select array_agg(distinct x) into v_ids from unnest(coalesce(p_livres, '{}')) as x;
  if v_ids is null or cardinality(v_ids) > 50 then
    raise exception 'Panier vide ou trop grand';
  end if;

  select count(*), coalesce(sum(price_cents), 0) into v_count, v_total
  from public.livres
  where id = any (v_ids) and published;
  if v_count <> cardinality(v_ids) then
    raise exception 'Un livre du panier n''est plus disponible';
  end if;

  loop
    v_reference := 'LIV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.commandes where reference = v_reference);
  end loop;

  insert into public.commandes (reference, nom, email, telephone, total_cents)
  values (v_reference, p_nom, p_email, p_telephone, v_total)
  returning id into v_id;

  insert into public.commande_livres (commande_id, livre_id, title, price_cents)
  select v_id, id, title, price_cents
  from public.livres
  where id = any (v_ids)
  order by sort_order;

  return json_build_object(
    'reference', v_reference,
    'total_cents', v_total,
    'lignes', (
      select json_agg(json_build_object('title', title, 'price_cents', price_cents) order by title)
      from public.commande_livres where commande_id = v_id
    )
  );
end;
$$;

-- La page /telechargement/<jeton> : la commande de ce jeton, ses livres, et si le lien marche.
create or replace function public.commande_par_jeton(p_token text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'reference', c.reference,
    'nom', c.nom,
    'statut', c.statut,
    'lien_expire_le', c.lien_expire_le,
    'expire', c.lien_expire_le is not null and c.lien_expire_le <= now(),
    'telechargements', c.telechargements,
    'limite', public.limite_telechargements(),
    'livres', coalesce((
      select json_agg(json_build_object(
        'id', cl.livre_id,
        'title', cl.title,
        'author', coalesce(l.author, ''),
        'cover', coalesce(l.cover, ''),
        'file_size', coalesce(l.file_size, 0),
        'disponible', coalesce(l.file_path, '') <> ''
      ) order by cl.title)
      from public.commande_livres cl
      left join public.livres l on l.id = cl.livre_id
      where cl.commande_id = c.id
    ), '[]'::json)
  )
  from public.commandes c
  where p_token ~ '^[a-f0-9]{64}$' and c.token = p_token;
$$;

-- Avant chaque téléchargement : vérifie le jeton, compte le téléchargement et donne le
-- chemin du PDF (null si le lien ne permet pas ce téléchargement).
create or replace function public.noter_telechargement(p_token text, p_livre uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_commande public.commandes%rowtype;
  v_livre public.livres%rowtype;
begin
  if p_token !~ '^[a-f0-9]{64}$' then
    return null;
  end if;
  select * into v_commande from public.commandes where token = p_token for update;
  if not found or v_commande.statut <> 'payee'
     or (v_commande.lien_expire_le is not null and v_commande.lien_expire_le <= now())
     or v_commande.telechargements >= public.limite_telechargements() then
    return null;
  end if;
  select l.* into v_livre
  from public.livres l
  join public.commande_livres cl on cl.livre_id = l.id
  where cl.commande_id = v_commande.id and l.id = p_livre and l.file_path <> '';
  if not found then
    return null;
  end if;
  update public.commandes set telechargements = telechargements + 1 where id = v_commande.id;
  return json_build_object('file_path', v_livre.file_path, 'slug', v_livre.slug);
end;
$$;

-- Politique de stockage : le PDF d'un livre est lisible avec le jeton d'une commande payée,
-- encore valable, qui contient ce livre. Le jeton arrive dans l'en-tête x-download-token.
create or replace function public.telechargement_autorise(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.commandes c
    join public.commande_livres cl on cl.commande_id = c.id
    join public.livres l on l.id = cl.livre_id
    where c.token = nullif(current_setting('request.headers', true), '')::json ->> 'x-download-token'
      and c.statut = 'payee'
      and (c.lien_expire_le is null or c.lien_expire_le > now())
      and l.file_path = object_name
  );
$$;

revoke all on function public.creer_commande(text, text, text, uuid[]) from public;
revoke all on function public.commande_par_jeton(text) from public;
revoke all on function public.noter_telechargement(text, uuid) from public;
revoke all on function public.telechargement_autorise(text) from public;
grant execute on function public.creer_commande(text, text, text, uuid[]) to anon, authenticated;
grant execute on function public.commande_par_jeton(text) to anon, authenticated;
grant execute on function public.noter_telechargement(text, uuid) to anon, authenticated;
grant execute on function public.telechargement_autorise(text) to anon, authenticated;
grant execute on function public.limite_telechargements() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Stockage des PDF (bucket privé « livres », 50 Mo par fichier)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('livres', 'livres', false, 52428800, array['application/pdf'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "livres: envoi admin" on storage.objects;
create policy "livres: envoi admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'livres' and public.is_admin());

drop policy if exists "livres: lecture admin" on storage.objects;
create policy "livres: lecture admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'livres' and public.is_admin());

drop policy if exists "livres: modification admin" on storage.objects;
create policy "livres: modification admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'livres' and public.is_admin());

drop policy if exists "livres: suppression admin" on storage.objects;
create policy "livres: suppression admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'livres' and public.is_admin());

drop policy if exists "livres: telechargement par jeton" on storage.objects;
create policy "livres: telechargement par jeton" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'livres' and public.telechargement_autorise(name));
