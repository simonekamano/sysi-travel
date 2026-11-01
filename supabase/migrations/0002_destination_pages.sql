-- Pages détaillées par destination (/destinations/<slug>) et carte interactive.
-- Ajoute l'adresse de page (slug), le contenu long, la galerie et les coordonnées GPS.
-- Idempotent : peut être rejoué sans erreur.

create extension if not exists unaccent with schema extensions;

alter table public.destinations
  add column if not exists slug text,
  add column if not exists description text not null default '',
  add column if not exists highlights text[] not null default '{}',
  add column if not exists gallery text[] not null default '{}',
  add column if not exists best_period text not null default '',
  add column if not exists access text not null default '',
  add column if not exists latitude double precision check (latitude between -90 and 90),
  add column if not exists longitude double precision check (longitude between -180 and 180);

-- « Îles de Loos » -> « iles-de-loos »
create or replace function public.slugify(value text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

-- Slug calculé depuis le nom quand l'administration le laisse vide ; suffixé s'il est déjà pris.
create or replace function public.destinations_set_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := public.slugify(coalesce(nullif(trim(new.slug), ''), new.name));
  if new.slug = '' then
    new.slug := left(new.id::text, 8);
  end if;
  if exists (select 1 from public.destinations where slug = new.slug and id <> new.id) then
    new.slug := new.slug || '-' || left(new.id::text, 6);
  end if;
  return new;
end;
$$;

drop trigger if exists destinations_set_slug on public.destinations;
create trigger destinations_set_slug
  before insert or update of slug, name on public.destinations
  for each row execute function public.destinations_set_slug();

-- Destinations existantes : le déclencheur calcule leur slug.
update public.destinations set slug = null where slug is null;

alter table public.destinations alter column slug set not null;
create unique index if not exists destinations_slug_key on public.destinations (slug);

-- Contenu de départ des six destinations d'origine (seulement là où il est encore vide).
-- Coordonnées approximatives, à ajuster depuis l'administration.
update public.destinations d set
  description = case when d.description = '' then v.description else d.description end,
  highlights = case when d.highlights = '{}' then v.highlights else d.highlights end,
  best_period = case when d.best_period = '' then v.best_period else d.best_period end,
  access = case when d.access = '' then v.access else d.access end,
  latitude = coalesce(d.latitude, v.latitude),
  longitude = coalesce(d.longitude, v.longitude)
from (values
  ('iles-de-loos',
   E'À quelques encablures du port de Conakry, l''archipel des îles de Loos offre un autre rythme : plages de sable clair, criques bordées de cocotiers et mangroves où l''on glisse en pirogue.\n\nKassa, Room et Fotoba se découvrent à la journée ou le temps d''un week-end : baignade, snorkeling, poisson grillé sur la plage et rencontres avec les pêcheurs. L''escapade idéale pour souffler en arrivant au pays, sans s''éloigner de la capitale.',
   array['Traversée en bateau depuis Conakry', 'Plages et criques préservées', 'Snorkeling et balade en pirogue dans la mangrove', 'Dîner de poisson grillé les pieds dans le sable'],
   'Novembre à mai (saison sèche)', 'Bateau depuis le port de Conakry, environ 20 à 30 minutes', 9.4833, -13.7980),
  ('fouta-djallon',
   E'Le Fouta Djallon, c''est la Guinée des hauteurs : des plateaux verdoyants, des falaises, des rivières et des villages peuls accrochés aux collines. On l''appelle souvent le château d''eau de l''Afrique de l''Ouest, tant les grands fleuves de la région y prennent leur source.\n\nDe Dalaba à Labé en passant par Pita, on randonne de cascade en cascade, on dort au frais et on partage le quotidien des villages, entre champs, artisanat et hospitalité légendaire.',
   array['Randonnées sur les plateaux et les falaises', 'Villages peuls et rencontres authentiques', 'Climat frais d''altitude', 'Cascades et rivières à chaque étape'],
   'Novembre à février pour la fraîcheur, octobre pour les paysages encore verts', 'Route depuis Conakry via Kindia et Mamou, environ 6 à 7 heures jusqu''à Dalaba', 11.0000, -12.3000),
  ('mont-nimba',
   E'Aux confins de la Guinée forestière, les monts Nimba forment l''un des massifs les plus remarquables d''Afrique de l''Ouest. La réserve naturelle intégrale, inscrite au patrimoine mondial de l''UNESCO, abrite des forêts primaires, des prairies d''altitude et une faune unique au monde.\n\nC''est ici que culmine le point le plus haut du pays. Avec un guide local, on part à l''aube à travers la forêt pour gagner les crêtes, avec la brume qui se lève sur trois pays.',
   array['Réserve classée au patrimoine mondial de l''UNESCO', 'Point culminant de la Guinée', 'Forêts primaires et faune endémique', 'Randonnée guidée jusqu''aux crêtes'],
   'Décembre à mars (saison sèche, sentiers praticables)', 'Vol ou route jusqu''à N''Zérékoré, puis route jusqu''à la région de Lola', 7.6167, -8.4167),
  ('chutes-de-kinkon',
   E'Non loin de Pita, la rivière dévale les falaises du Fouta dans un cirque de verdure : les chutes de Kinkon sont l''une des plus belles cascades du pays.\n\nOn y descend par un sentier jusqu''aux bassins, pour profiter du grondement de l''eau, des embruns et de la lumière du matin. Une étape incontournable d''un circuit dans le Fouta, à combiner avec Dalaba et les villages voisins.',
   array['Cascade spectaculaire au cœur du Fouta', 'Sentier jusqu''aux bassins', 'Lumière idéale pour la photo le matin', 'Facile à combiner avec Pita et Dalaba'],
   'Septembre à décembre pour un débit impressionnant', 'Route depuis Pita, puis courte marche', 11.0300, -12.4700),
  ('conakry',
   E'Conakry s''étire sur la presqu''île de Kaloum, entre l''Atlantique et les îles. Une capitale vivante, bruyante et attachante, où l''on vient retrouver les siens et prendre le pouls du pays.\n\nMarchés colorés, Corniche au coucher du soleil, musées, maquis et scène musicale : quelques jours suffisent pour sentir son énergie avant de partir vers l''intérieur, ou pour finir le séjour en douceur.',
   array['Marchés et artisanat local', 'Couchers de soleil sur la Corniche', 'Musique et vie nocturne', 'Point de départ de tous nos circuits'],
   'Toute l''année, idéalement de novembre à mai', 'Aéroport international de Conakry', 9.5092, -13.7122),
  ('plage-de-bel-air',
   E'Une longue plage de sable, des cocotiers à perte de vue et l''horizon de l''Atlantique : Bel-Air est l''adresse des week-ends au calme, loin de l''agitation de la capitale.\n\nBaignade, farniente, promenades au coucher du soleil et poisson frais : le cadre parfait pour terminer un séjour ou se retrouver en famille.',
   array['Grande plage bordée de cocotiers', 'Baignade et farniente', 'Couchers de soleil sur l''Atlantique', 'Idéal en famille'],
   'Novembre à mai (saison sèche)', 'Route depuis Conakry, environ 2 heures', 10.0800, -14.2000)
) as v (slug, description, highlights, best_period, access, latitude, longitude)
where d.slug = v.slug;
