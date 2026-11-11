-- Sécurité de la base, avant l'ouverture du site au public.
--   1. Limite d'envois des formulaires publics (demandes de séjour, commandes), appliquée par la
--      base elle-même : un robot qui appelle directement l'API (api.sysitravel.com) avec la clé
--      publique, sans passer par le site, est arrêté comme les autres.
--   2. Une demande créée par un visiteur commence toujours « nouveau », à son nom (ou anonyme).
--   3. Adresse e-mail au bon format pour toute nouvelle demande ou commande.
--   4. Un administrateur qui a activé la double authentification doit l'avoir validée dans sa
--      session pour lire ou modifier quoi que ce soit (public.is_admin).
-- Idempotent : rejouée à chaque déploiement (deploy/deploy.sh).

-- 1. Limite d'envois ---------------------------------------------------------------------------

-- Journal interne des envois récents (aucun accès par l'API), purgé au fil de l'eau.
create table if not exists public.envois_recents (
  cle text not null,
  cree_le timestamptz not null default now()
);
create index if not exists envois_recents_cle_idx on public.envois_recents (cle, cree_le);
alter table public.envois_recents enable row level security;
revoke all on public.envois_recents from anon, authenticated;

-- Par adresse IP (appels directs à l'API : Nginx fournit l'adresse dans X-Real-IP, qu'un
-- visiteur ne peut pas falsifier), par adresse e-mail, et pour tout le site.
-- Les envois passés par le site arrivent sans X-Real-IP : le site les limite déjà par IP.
create or replace function public.limiter_envois()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text;
  v_message text;
  v_ip text;
  v_addr inet;
  v_email text;
begin
  if public.is_admin() then
    return new;
  end if;
  v_type := tg_argv[0];
  v_message := tg_argv[1];
  v_email := lower(trim(new.email));

  -- Adresse du visiteur ; une adresse interne (le site lui-même, le réseau Docker) ne compte pas.
  begin
    v_addr := nullif(trim(coalesce(current_setting('request.headers', true)::json ->> 'x-real-ip', '')), '')::inet;
  exception when others then
    v_addr := null;
  end;
  if v_addr is not null and family(v_addr) = 4 and (
    v_addr << inet '10.0.0.0/8' or v_addr << inet '172.16.0.0/12' or v_addr << inet '192.168.0.0/16' or v_addr << inet '127.0.0.0/8'
  ) then
    v_addr := null;
  end if;
  if v_addr is not null and family(v_addr) = 6 and (v_addr << inet 'fc00::/7' or v_addr = inet '::1') then
    v_addr := null;
  end if;
  v_ip := host(v_addr);

  delete from public.envois_recents where cree_le < now() - interval '1 day';

  if v_ip is not null and (
    select count(*) from public.envois_recents
    where cle = v_type || ':ip:' || v_ip and cree_le > now() - interval '15 minutes'
  ) >= 5 then
    raise exception '%', v_message;
  end if;

  if (
    select count(*) from public.envois_recents
    where cle = v_type || ':email:' || v_email and cree_le > now() - interval '1 hour'
  ) >= 5 then
    raise exception '%', v_message;
  end if;

  if (
    select count(*) from public.envois_recents
    where cle = v_type || ':site' and cree_le > now() - interval '1 hour'
  ) >= 60 then
    raise exception '%', v_message;
  end if;

  insert into public.envois_recents (cle) values (v_type || ':email:' || v_email), (v_type || ':site');
  if v_ip is not null then
    insert into public.envois_recents (cle) values (v_type || ':ip:' || v_ip);
  end if;
  return new;
end;
$$;

revoke all on function public.limiter_envois() from public, anon, authenticated;

drop trigger if exists limiter_envois on public.demandes_sejour;
create trigger limiter_envois
  before insert on public.demandes_sejour
  for each row execute function public.limiter_envois(
    'demande', 'Trop de demandes envoyées. Réessayez dans quelques minutes ou écrivez-nous sur WhatsApp.'
  );

drop trigger if exists limiter_envois on public.commandes;
create trigger limiter_envois
  before insert on public.commandes
  for each row execute function public.limiter_envois(
    'commande', 'Trop de commandes envoyées. Réessayez dans quelques minutes ou écrivez-nous sur WhatsApp.'
  );

-- 2. Demande créée par un visiteur ----------------------------------------------------------------

create or replace function public.demande_visiteur()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.statut := 'nouveau';
    new.created_by := auth.uid();
    new.created_at := now();
    new.updated_at := now();
  end if;
  return new;
end;
$$;

revoke all on function public.demande_visiteur() from public, anon, authenticated;

drop trigger if exists demande_visiteur on public.demandes_sejour;
create trigger demande_visiteur
  before insert on public.demandes_sejour
  for each row execute function public.demande_visiteur();

-- 3. Format des adresses e-mail (nouvelles lignes seulement : « not valid ») -------------------

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'demandes_sejour_email_format') then
    alter table public.demandes_sejour
      add constraint demandes_sejour_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'commandes_email_format') then
    alter table public.commandes
      add constraint commandes_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') not valid;
  end if;
end;
$$;

-- 4. Administrateur et double authentification ----------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    and (
      coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified')
    );
$$;
