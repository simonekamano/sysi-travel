-- Prise en charge à l'aéroport, à la demande : le voyageur la coche dans le formulaire et
-- indique son arrivée (date, heure, vol) et son lieu de séjour.
-- Idempotent : rejouée à chaque déploiement (deploy/deploy.sh).

alter table public.demandes_sejour
  add column if not exists transfert boolean not null default false,
  add column if not exists arrivee text not null default '' check (char_length(arrivee) <= 200),
  add column if not exists hebergement text not null default '' check (char_length(hebergement) <= 300);
