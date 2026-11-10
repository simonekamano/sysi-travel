-- Sites touristiques de la carte « Explorer la Guinée » (/explorer), gérés depuis l'administration.
-- Contenu de départ : les cartes touristiques fournies par la Cliente (PDF « Guide touristique de
-- Guinée » et « Atlas touristique de la Guinée forestière »). Positions lues sur ces cartes,
-- indicatives ; en Guinée forestière, les sites sont placés autour de leur ville (« approximate »).
-- Idempotent : rejouée à chaque déploiement ; un site déjà présent n'est jamais écrasé.

create table if not exists public.sites_touristiques (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null check (char_length(name) between 1 and 200),
  region text not null check (region in ('basse', 'moyenne', 'haute', 'forestiere')),
  category text not null default 'nature' check (category in ('nature', 'plage', 'culture')),
  town text not null default '',
  description text not null default '',
  image text not null default '',
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  approximate boolean not null default false,
  destination_slug text not null default '',
  published boolean not null default true,
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists sites_touristiques_slug_key on public.sites_touristiques (slug);

-- Slug calculé depuis le nom quand l'administration le laisse vide ; suffixé s'il est déjà pris.
create or replace function public.sites_touristiques_set_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := public.slugify(coalesce(nullif(trim(new.slug), ''), new.name));
  if new.slug = '' then
    new.slug := left(new.id::text, 8);
  end if;
  if exists (select 1 from public.sites_touristiques where slug = new.slug and id <> new.id) then
    new.slug := new.slug || '-' || left(new.id::text, 6);
  end if;
  return new;
end;
$$;

drop trigger if exists sites_touristiques_set_slug on public.sites_touristiques;
create trigger sites_touristiques_set_slug
  before insert or update of slug, name on public.sites_touristiques
  for each row execute function public.sites_touristiques_set_slug();

drop trigger if exists touch_updated_at on public.sites_touristiques;
create trigger touch_updated_at before update on public.sites_touristiques
  for each row execute function public.touch_updated_at();

alter table public.sites_touristiques enable row level security;

drop policy if exists "lecture des sites publies" on public.sites_touristiques;
create policy "lecture des sites publies" on public.sites_touristiques
  for select to anon, authenticated
  using (published or public.is_admin());

drop policy if exists "ecriture admin" on public.sites_touristiques;
create policy "ecriture admin" on public.sites_touristiques
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.sites_touristiques to anon, authenticated;
grant insert, update, delete on public.sites_touristiques to authenticated;

-- 59 sites : basse 17, moyenne 12, haute 10, forestiere 20.
-- Inséré seulement si le slug n'existe pas : le déclencheur suffixerait un slug déjà pris
-- (un « on conflict » ne verrait donc jamais le doublon).
insert into public.sites_touristiques
  (slug, name, region, category, town, description, image, latitude, longitude, approximate, destination_slug, sort_order)
select v.*
from (values
  ('cathedrale-sainte-marie', 'Cathédrale Sainte-Marie', 'basse', 'culture', 'Conakry', 'La cathédrale de Conakry, au cœur du quartier de Kaloum.', '', 9.519, -13.708, false, 'conakry', 1),
  ('iles-de-loos', 'Îles de Loos', 'basse', 'plage', 'Conakry', 'L''archipel face à Conakry : plages, criques et forêt, à quelques minutes de bateau.', '/images/sites/les-iles-de-loos.jpg', 9.458, -13.835, false, 'iles-de-loos', 2),
  ('mosquee-faycal', 'Mosquée Fayçal', 'basse', 'culture', 'Conakry', 'La grande mosquée de Conakry, l''un des plus grands édifices religieux d''Afrique de l''Ouest.', '/images/sites/grande-mosquee-faycal.jpg', 9.543, -13.676, false, 'conakry', 3),
  ('grottes-de-kakimbon', 'Grottes de Kakimbon', 'basse', 'nature', 'Conakry', '', '', 9.637, -13.667, false, 'conakry', 4),
  ('cascades-de-soumba', 'Cascades de Soumba', 'basse', 'nature', 'Dubréka', '', '', 9.817, -13.557, false, '', 5),
  ('mont-kakoulima', 'Mont Kakoulima', 'basse', 'nature', 'Coyah', '', '/images/sites/mont-kakoulima.jpg', 9.83, -13.365, false, '', 6),
  ('voile-de-la-mariee', 'Voile de la Mariée', 'basse', 'nature', 'Kindia', 'Une cascade qui tombe en voile le long de la falaise, près de Kindia.', '', 10.058, -12.9, false, '', 7),
  ('mont-gangan', 'Mont Gangan', 'basse', 'nature', 'Kindia', '', '/images/sites/mont-gangan.jpg', 10.099, -12.818, false, '', 8),
  ('plage-bel-air', 'Plage Bel-Air', 'basse', 'plage', 'Boffa', '', '/images/sites/plage-de-bel-air.jpg', 10.197, -14.1, false, 'plage-de-bel-air', 9),
  ('fort-de-boke', 'Fort de Boké', 'basse', 'culture', 'Boké', '', '', 10.94, -14.296, false, '', 10),
  ('iles-tristao', 'Îles Tristao', 'basse', 'plage', 'Boké', '', '', 10.899, -14.998, false, '', 11),
  ('grottes-de-gueme-sangan', 'Grottes de Guémé-Sangan', 'basse', 'nature', 'Télimélé', '', '', 10.961, -13.08, false, '', 12),
  ('parc-du-badiar', 'Parc du Badiar', 'basse', 'nature', 'Koundara', 'Parc national de savane et de forêts galeries, à la frontière du Sénégal.', '/images/sites/parc-national-du-badiar.jpg', 12.422, -13.3, false, '', 13),
  ('sources-de-koffara', 'Sources de Koffara', 'basse', 'nature', 'Gaoual', '', '', 11.72, -13.149, false, '', 14),
  ('ile-de-roume', 'Île de Roume', 'basse', 'plage', 'Conakry', '', '/images/sites/ile-de-roume.jpg', 9.426, -13.79, true, 'iles-de-loos', 15),
  ('plage-de-soro', 'Plage de Soro', 'basse', 'plage', 'Îles de Loos', '', '/images/sites/plage-de-soro.jpg', 9.47, -13.812, true, 'iles-de-loos', 16),
  ('plage-de-sobane', 'Plage de Sobané', 'basse', 'plage', 'Boffa', '', '/images/sites/plage-de-sobane.jpg', 10.15, -14.06, true, '', 17),
  ('chutes-de-kambadaga', 'Chutes de Kambadaga', 'moyenne', 'nature', 'Pita', '', '', 10.834, -12.5, false, 'fouta-djallon', 18),
  ('chutes-de-kinkon', 'Chutes de Kinkon', 'moyenne', 'nature', 'Pita', '', '', 10.882, -12.42, false, 'chutes-de-kinkon', 19),
  ('falaises-de-doucki', 'Falaises de Doucki', 'moyenne', 'nature', 'Pita', '', '/images/sites/falaises-de-doucki.jpg', 10.953, -12.6, false, 'fouta-djallon', 20),
  ('chutes-de-ditinn', 'Chutes de Ditinn', 'moyenne', 'nature', 'Dalaba', '', '', 10.702, -12.323, false, 'fouta-djallon', 21),
  ('pont-de-dieu', 'Pont de Dieu', 'moyenne', 'nature', 'Dalaba', '', '', 10.664, -12.274, false, 'fouta-djallon', 22),
  ('villa-miriam-makeba', 'Villa Miriam Makeba', 'moyenne', 'culture', 'Dalaba', '', '', 10.709, -12.253, false, 'fouta-djallon', 23),
  ('jardin-chevalier', 'Jardin Chevalier', 'moyenne', 'nature', 'Dalaba', '', '', 10.734, -12.229, false, 'fouta-djallon', 24),
  ('chutes-de-saala', 'Chutes de Saala', 'moyenne', 'nature', 'Labé', '', '', 11.332, -12.351, false, '', 25),
  ('dame-de-mali', 'Dame de Mali', 'moyenne', 'nature', 'Mali', 'Un rocher dont le profil évoque un visage de femme, au nord du Fouta-Djalon.', '/images/sites/dame-de-mali.jpg', 12.055, -12.281, false, '', 26),
  ('fougoumba', 'Fougoumba', 'moyenne', 'culture', 'Tougué', '', '', 11.102, -12.4, false, '', 27),
  ('source-du-fleuve-gambie', 'Source du fleuve Gambie', 'moyenne', 'nature', 'Labé', '', '', 11.453, -12.201, true, '', 28),
  ('echelles-de-djinkan', 'Échelles de Djinkan', 'moyenne', 'nature', 'Lélouma', '', '', 11.203, -12.684, false, '', 29),
  ('grande-mosquee-de-kankan', 'Grande mosquée de Kankan', 'haute', 'culture', 'Kankan', '', '', 10.392, -9.302, false, '', 30),
  ('fleuve-milo', 'Fleuve Milo', 'haute', 'nature', 'Kankan', '', '', 10.332, -9.319, false, '', 31),
  ('sosso-bala', 'Sosso-Bala', 'haute', 'culture', 'Niagassola', 'Le balafon sacré de Niagassola, gardé depuis l''empire du Mali et inscrit au patrimoine immatériel de l''UNESCO.', '', 12.33, -9.08, false, '', 32),
  ('confluence-niger-tinkisso', 'Confluence Niger-Tinkisso', 'haute', 'nature', 'Siguiri', '', '', 11.432, -9.199, false, '', 33),
  ('grottes-de-koulantou', 'Grottes de Koulantou', 'haute', 'nature', 'Siguiri', '', '', 11.351, -9.121, false, '', 34),
  ('mosquee-de-dinguiraye', 'Mosquée de Dinguiraye', 'haute', 'culture', 'Dinguiraye', '', '', 11.312, -10.731, false, '', 35),
  ('source-du-niger', 'Source du Niger', 'haute', 'nature', 'Faranah', 'Le fleuve Niger prend sa source dans les hauteurs du sud de Faranah.', '', 9.08, -10.73, true, '', 36),
  ('parc-du-haut-niger', 'Parc du Haut-Niger', 'haute', 'nature', 'Faranah', '', '/images/sites/parc-national-du-haut-niger.jpg', 10.297, -10.5, false, '', 37),
  ('vestiges-de-samory-toure', 'Vestiges de Samory Touré', 'haute', 'culture', 'Kérouané', '', '', 9.279, -9.018, false, '', 38),
  ('fleuve-sankarani', 'Fleuve Sankarani', 'haute', 'nature', 'Mandiana', '', '', 10.581, -8.7, false, '', 39),
  ('marche-central-et-marches-regionaux', 'Marché central et marchés régionaux', 'forestiere', 'culture', 'Guéckédou', '', '', 8.6073, -10.0711, true, '', 40),
  ('paysages-du-fleuve-makona', 'Paysages du fleuve Makona', 'forestiere', 'nature', 'Guéckédou', '', '', 8.6269, -10.1753, true, '', 41),
  ('confluences-des-cours-d-eau', 'Confluences des cours d''eau', 'forestiere', 'nature', 'Guéckédou', '', '', 8.5227, -10.1949, true, '', 42),
  ('fangamadou-et-environs', 'Fangamadou et environs', 'forestiere', 'nature', 'Guéckédou', '', '', 8.5031, -10.0907, true, '', 43),
  ('grottes-et-chutes-de-yombiro', 'Grottes et chutes de Yombirô', 'forestiere', 'nature', 'Kissidougou', '', '', 9.2273, -10.0381, true, '', 44),
  ('beindou-et-patrimoine-local', 'Beindou et patrimoine local', 'forestiere', 'culture', 'Kissidougou', '', '', 9.2469, -10.1423, true, '', 45),
  ('sites-de-sidikidougou', 'Sites de Sidikidougou', 'forestiere', 'culture', 'Kissidougou', '', '', 9.1427, -10.1619, true, '', 46),
  ('paysages-de-savane-et-foret', 'Paysages de savane et forêt', 'forestiere', 'nature', 'Kissidougou', '', '', 9.1231, -10.0577, true, '', 47),
  ('cathedrale-saint-jean-baptiste', 'Cathédrale Saint-Jean-Baptiste', 'forestiere', 'culture', 'N''Zérékoré', '', '', 7.7983, -8.7561, true, '', 48),
  ('cascades-de-samoe', 'Cascades de Samoé', 'forestiere', 'nature', 'N''Zérékoré', '', '', 7.828, -8.8391, true, '', 49),
  ('lac-sacre-de-gbangbadou', 'Lac sacré de Gbangbadou', 'forestiere', 'culture', 'N''Zérékoré', '', '', 7.7581, -8.893, true, '', 50),
  ('centre-artisanal', 'Centre artisanal', 'forestiere', 'culture', 'N''Zérékoré', '', '', 7.6854, -8.8432, true, '', 51),
  ('koule-et-traditions-locales', 'Koulé et traditions locales', 'forestiere', 'culture', 'N''Zérékoré', '', '', 7.7102, -8.7586, true, '', 52),
  ('reserve-de-biosphere-de-ziama', 'Réserve de biosphère de Ziama', 'forestiere', 'nature', 'Macenta', 'Un massif de forêt dense humide, réserve de biosphère de l''UNESCO, refuge des éléphants de forêt.', '/images/sites/foret-de-ziama.jpg', 8.5853, -9.4101, true, '', 53),
  ('habitat-des-elephants-de-foret', 'Habitat des éléphants de forêt', 'forestiere', 'nature', 'Macenta', '', '', 8.615, -9.4931, true, '', 54),
  ('seredou-et-les-s-urs-sainte-ursule', 'Sérédou et les Sœurs Sainte-Ursule', 'forestiere', 'culture', 'Macenta', '', '', 8.5451, -9.547, true, '', 55),
  ('pont-de-lianes-traditionnel', 'Pont de lianes traditionnel', 'forestiere', 'culture', 'Macenta', '', '', 8.4724, -9.4972, true, '', 56),
  ('paysages-forestiers-de-macenta', 'Paysages forestiers de Macenta', 'forestiere', 'nature', 'Macenta', '', '', 8.4972, -9.4126, true, '', 57),
  ('mont-nimba', 'Mont Nimba', 'forestiere', 'nature', 'Lola', 'Le plus haut sommet de Guinée, au cœur d''une réserve naturelle classée au patrimoine mondial de l''UNESCO.', '/images/sites/mont-nimba.jpg', 7.62, -8.42, false, 'mont-nimba', 58),
  ('chimpanzes-de-bossou', 'Chimpanzés de Bossou', 'forestiere', 'nature', 'Lola', 'Les collines de Bossou abritent une communauté de chimpanzés suivie depuis des décennies.', '/images/sites/chimpanzes-de-bossou.jpg', 7.64, -8.5, false, '', 59)
) as v (slug, name, region, category, town, description, image, latitude, longitude, approximate, destination_slug, sort_order)
where not exists (select 1 from public.sites_touristiques s where s.slug = v.slug);
