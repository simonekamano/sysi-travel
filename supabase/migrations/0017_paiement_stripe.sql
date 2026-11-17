-- Paiement en ligne par Stripe (ORDRE n° 17).
--
-- Les prix restent dans la base, modifiables dans l'administration : au moment de payer, le site
-- envoie à Stripe le nom et le montant de chaque ligne (Stripe Checkout). Rien n'est à créer ni à
-- mettre à jour dans le tableau de bord Stripe quand un prix change.
--
--   1. Circuits : un prix en ligne par personne (vide : « Tarif sur demande », pas de paiement en
--      ligne) et la part payée à la réservation (100 % ou un acompte).
--   2. Réservations de circuits payées en ligne, créées par reserver_circuit() au prix de la base.
--   3. Commandes de la boutique : mode de paiement, session Stripe, frais de livraison.
--   4. Réglages du paiement : les frais de livraison des articles (vide : pas encore fixés).
--
-- Le paiement n'est marqué « payé » que par le serveur, après vérification auprès de Stripe
-- (retour du client ou notification signée de Stripe), avec la clé de service : ni un visiteur ni
-- un client connecté ne peut le faire. La vente de la boutique reste fermée (0014) jusqu'à son
-- ouverture.
-- Idempotent : rejouée à chaque déploiement.

-- 1. Circuits ------------------------------------------------------------------------------------

alter table public.circuits
  add column if not exists prix_en_ligne_cents integer check (prix_en_ligne_cents is null or prix_en_ligne_cents between 100 and 10000000),
  add column if not exists acompte_pourcent integer not null default 100 check (acompte_pourcent between 10 and 100);

-- 2. Réservations ---------------------------------------------------------------------------------

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  -- Le circuit peut être supprimé ensuite : son titre et ses prix restent dans la réservation.
  circuit_id uuid references public.circuits (id) on delete set null,
  circuit_title text not null,
  date_souhaitee text not null default '' check (char_length(date_souhaitee) <= 100),
  voyageurs integer not null check (voyageurs between 1 and 30),
  nom text not null check (char_length(nom) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  telephone text not null default '' check (char_length(telephone) <= 50),
  message text not null default '' check (char_length(message) <= 2000),
  prix_unitaire_cents integer not null check (prix_unitaire_cents >= 0),
  -- Prix total du voyage, et part payée en ligne (totalité ou acompte).
  total_cents integer not null check (total_cents >= 0),
  acompte_pourcent integer not null default 100 check (acompte_pourcent between 10 and 100),
  montant_en_ligne_cents integer not null check (montant_en_ligne_cents >= 0),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'payee', 'annulee')),
  stripe_session_id text unique,
  payee_le timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservations_created_at_idx on public.reservations (created_at desc);

drop trigger if exists touch_updated_at on public.reservations;
create trigger touch_updated_at before update on public.reservations
  for each row execute function public.touch_updated_at();

alter table public.reservations enable row level security;

drop policy if exists "gestion admin" on public.reservations;
create policy "gestion admin" on public.reservations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.reservations from anon;
grant select, update, delete on public.reservations to authenticated;

-- Une réservation en attente de paiement, au prix de la base (jamais celui envoyé par le navigateur).
create or replace function public.reserver_circuit(
  p_circuit_id uuid,
  p_date text,
  p_voyageurs integer,
  p_nom text,
  p_email text,
  p_telephone text,
  p_message text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_circuit public.circuits%rowtype;
  v_reference text;
  v_total integer;
  v_en_ligne integer;
  v_id uuid;
begin
  select * into v_circuit from public.circuits where id = p_circuit_id and published;
  if not found or v_circuit.prix_en_ligne_cents is null then
    raise exception 'Ce circuit ne se réserve pas en ligne.';
  end if;
  if p_voyageurs is null or p_voyageurs < 1 or p_voyageurs > 30 then
    raise exception 'Nombre de voyageurs invalide.';
  end if;

  loop
    v_reference := 'RES-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.reservations where reference = v_reference);
  end loop;

  v_total := v_circuit.prix_en_ligne_cents * p_voyageurs;
  v_en_ligne := round(v_total * v_circuit.acompte_pourcent / 100.0);

  insert into public.reservations (
    reference, circuit_id, circuit_title, date_souhaitee, voyageurs, nom, email, telephone, message,
    prix_unitaire_cents, total_cents, acompte_pourcent, montant_en_ligne_cents
  ) values (
    v_reference, v_circuit.id, v_circuit.title, left(coalesce(p_date, ''), 100), p_voyageurs,
    p_nom, lower(trim(p_email)), coalesce(p_telephone, ''), left(coalesce(p_message, ''), 2000),
    v_circuit.prix_en_ligne_cents, v_total, v_circuit.acompte_pourcent, v_en_ligne
  )
  returning id into v_id;

  return json_build_object(
    'id', v_id,
    'reference', v_reference,
    'circuit_title', v_circuit.title,
    'voyageurs', p_voyageurs,
    'prix_unitaire_cents', v_circuit.prix_en_ligne_cents,
    'total_cents', v_total,
    'acompte_pourcent', v_circuit.acompte_pourcent,
    'montant_en_ligne_cents', v_en_ligne
  );
end;
$$;

revoke all on function public.reserver_circuit(uuid, text, integer, text, text, text, text) from public;
grant execute on function public.reserver_circuit(uuid, text, integer, text, text, text, text) to anon, authenticated;

-- 3. Commandes de la boutique ---------------------------------------------------------------------

alter table public.commandes
  add column if not exists paiement_mode text check (paiement_mode is null or paiement_mode in ('manuel', 'stripe')),
  add column if not exists stripe_session_id text unique,
  add column if not exists frais_livraison_cents integer not null default 0 check (frais_livraison_cents >= 0);

-- 4. Réglages du paiement (une seule ligne) -------------------------------------------------------

create table if not exists public.reglages_paiement (
  id boolean primary key default true check (id),
  -- Frais de livraison des articles, par commande. Vide : pas encore fixés (pas de paiement en
  -- ligne des articles). 0 : livraison offerte.
  livraison_cents integer check (livraison_cents is null or livraison_cents between 0 and 100000),
  updated_at timestamptz not null default now()
);

insert into public.reglages_paiement (id) values (true) on conflict (id) do nothing;

drop trigger if exists touch_updated_at on public.reglages_paiement;
create trigger touch_updated_at before update on public.reglages_paiement
  for each row execute function public.touch_updated_at();

alter table public.reglages_paiement enable row level security;

drop policy if exists "lecture publique" on public.reglages_paiement;
create policy "lecture publique" on public.reglages_paiement
  for select to anon, authenticated
  using (true);

drop policy if exists "modification admin" on public.reglages_paiement;
create policy "modification admin" on public.reglages_paiement
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.reglages_paiement to anon, authenticated;
grant update (livraison_cents) on public.reglages_paiement to authenticated;
