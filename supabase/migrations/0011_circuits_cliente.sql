-- Les circuits et excursions remis par la Cliente (novembre 2026), avec leurs photos, et les
-- photos de lieux touristiques qu'elle a fournies pour la carte « Explorer la Guinée ».
-- Les prix viendront plus tard : la Cliente les saisit dans Administration › Circuits ; sans prix,
-- le site affiche « Tarif sur demande ».
--
-- Import unique : cette migration est rejouée à chaque déploiement (deploy/deploy.sh), mais son
-- contenu n'est importé qu'une fois (table contenus_importes). Ensuite, l'administration est seule
-- maître : un circuit modifié ou supprimé n'est jamais rétabli par un déploiement.

create table if not exists public.contenus_importes (
  cle text primary key,
  importe_le timestamptz not null default now()
);
-- Table interne : aucun accès par l'API publique.
alter table public.contenus_importes enable row level security;
revoke all on public.contenus_importes from anon, authenticated;

do $import$
begin
  if exists (select 1 from public.contenus_importes where cle = '0011_circuits_cliente') then
    return;
  end if;

  -- 1. Les six circuits, publiés.
  insert into public.circuits
    (slug, title, kind, tagline, duration, price, departure, dates, image, description, included, excluded, programme, published, sort_order)
  select v.*
  from (values
    (
      'conakry-coeur-battant',
      'Conakry Cœur Battant',
      'visite',
      'Du Musée national au marché Niger, une journée pour sentir battre le cœur de la capitale.',
      '1 journée, de 10 h à 18 h',
      '',
      'Prise en charge à votre hôtel, à Conakry',
      'Tous les jours, sur réservation',
      '/images/circuits/palais-du-peuple.jpg',
      'Avec un guide qui la connaît par cœur, Conakry se raconte autrement : son histoire au Musée national, ses grands lieux de mémoire comme la place des Martyrs et le Palais du Peuple, puis toute l''énergie du marché Niger.' || chr(10) || chr(10) ||
      'La journée se termine au calme, entre les allées du jardin du 2 Octobre et les rives du lac Gbassikolo, avant le retour à votre hôtel.',
      array[
        'Chauffeur privé, prise en charge et retour à l''hôtel',
        'Guide francophone et/ou anglophone expérimenté',
        'Musée national, place des Martyrs, Palais du Peuple, marché Niger, jardin du 2 Octobre et lac Gbassikolo',
        'Repas ou collation'
      ],
      array['Vols internationaux', 'Boissons et dépenses personnelles'],
      jsonb_build_array(
        jsonb_build_object(
          'title', 'Conakry, d''un lieu de mémoire à l''autre',
          'description', '10 h : prise en charge à votre hôtel par votre chauffeur privé et votre guide. Visite du Musée national, de la place des Martyrs et du Palais du Peuple, puis découverte du marché Niger. Repas ou collation. Promenade au jardin du 2 Octobre et au lac Gbassikolo. 18 h : retour à votre hôtel.',
          'place', 'Conakry',
          'latitude', 9.512, 'longitude', -13.71,
          'image', '/images/circuits/jardin-du-2-octobre.jpg'
        )
      ),
      true,
      1
    ),
    (
      'escale-turquoise',
      'Escale Turquoise',
      'excursion',
      'Une île au choix parmi les îles de Loos : Kassa, Roume ou Tamara. Bateau, plage et baignade à deux pas de Conakry.',
      '1 journée, de 10 h à 18 h',
      '',
      'Prise en charge à votre hôtel, à Conakry',
      'Tous les jours, sur réservation',
      '/images/circuits/iles-de-loos.jpg',
      'Embarquez au port de Conakry pour l''archipel des îles de Loos. C''est vous qui choisissez votre île : Kassa, Roume ou Tamara.' || chr(10) || chr(10) ||
      'Sur place, la journée est à vous : plage, baignade et repas sur l''île, avec votre guide à vos côtés, avant la traversée du retour.',
      array[
        'Chauffeur privé, prise en charge et retour à l''hôtel',
        'Guide francophone et/ou anglophone expérimenté',
        'Traversée en bateau aller-retour vers l''île de votre choix',
        'Repas sur place'
      ],
      array['Vols internationaux', 'Boissons et dépenses personnelles'],
      jsonb_build_array(
        jsonb_build_object(
          'title', 'Cap sur l''île de votre choix',
          'description', '10 h : prise en charge à votre hôtel par votre chauffeur privé et votre guide, puis transfert au port. Traversée en bateau vers l''île de votre choix : Kassa, Roume ou Tamara. Plage, baignade et repas sur place. Traversée du retour. 18 h : retour à votre hôtel.',
          'place', 'Îles de Loos',
          'latitude', 9.458, 'longitude', -13.835,
          'image', '/images/circuits/plage-iles-de-loos.jpg'
        )
      ),
      true,
      2
    ),
    (
      'le-voile-de-la-mariee',
      'Le Voile de la Mariée',
      'excursion',
      'À Kindia, la cascade de Kilissi tombe comme un voile de mariée. Randonnée, fraîcheur et déjeuner en pleine nature.',
      '1 journée, de 10 h à 18 h',
      '',
      'Prise en charge à votre hôtel, à Conakry',
      'Tous les jours, sur réservation',
      '/images/circuits/voile-de-la-mariee.jpg',
      'Direction Kindia, à l''intérieur des terres. Votre guide vous fait découvrir la ville, puis vous emmène jusqu''à la cascade de Kilissi, que l''on surnomme le Voile de la Mariée pour la finesse de sa chute.' || chr(10) || chr(10) ||
      'Une randonnée vous mène au plus près de l''eau, avant un déjeuner bien mérité et le retour à Conakry.',
      array[
        'Chauffeur privé, prise en charge et retour à l''hôtel',
        'Guide francophone et/ou anglophone expérimenté',
        'Visite guidée de Kindia',
        'Visite de la cascade de Kilissi et randonnée',
        'Déjeuner'
      ],
      array['Vols internationaux', 'Boissons et dépenses personnelles'],
      jsonb_build_array(
        jsonb_build_object(
          'title', 'Kindia et la cascade de Kilissi',
          'description', '10 h : prise en charge à votre hôtel par votre chauffeur privé et votre guide. Route vers Kindia et visite guidée de la ville. Visite de la cascade de Kilissi, dite le Voile de la Mariée, et randonnée. Déjeuner. 18 h : retour à votre hôtel.',
          'place', 'Voile de la Mariée, Kindia',
          'latitude', 10.058, 'longitude', -12.9,
          'image', ''
        )
      ),
      true,
      3
    ),
    (
      'djembe-au-soleil-couchant',
      'Djembé au Soleil Couchant',
      'excursion',
      'Artisans, atelier de percussion et coucher de soleil sur la plage de Camayenne : Conakry côté créatif.',
      '1 journée, de 10 h au coucher du soleil',
      '',
      'Prise en charge à votre hôtel, à Conakry',
      'Tous les jours, sur réservation',
      '/images/illustrations/coucher-de-soleil.jpg',
      'Une journée pour mettre la main à la pâte. Vous découvrez le travail des artisans, puis vous prenez place pour un atelier de percussion.' || chr(10) || chr(10) ||
      'Après le déjeuner et un passage au centre commercial pour vos achats, la journée se termine face à l''océan, sur la plage de Camayenne, au moment où le soleil se couche.',
      array[
        'Chauffeur privé, prise en charge et retour à l''hôtel',
        'Guide francophone et/ou anglophone expérimenté',
        'Visite artisanale',
        'Atelier de percussion',
        'Déjeuner',
        'Coucher du soleil sur la plage de Camayenne'
      ],
      array['Vols internationaux', 'Achats personnels', 'Boissons'],
      jsonb_build_array(
        jsonb_build_object(
          'title', 'Artisanat, percussions et coucher de soleil',
          'description', '10 h : prise en charge à votre hôtel par votre chauffeur privé et votre guide. Visite artisanale, puis atelier de percussion. Déjeuner. Visite d''un centre commercial. Coucher du soleil sur la plage de Camayenne, puis retour à votre hôtel.',
          'place', 'Plage de Camayenne, Conakry',
          'latitude', 9.535, 'longitude', -13.688,
          'image', '/images/produits/pagnes-teints.jpg'
        )
      ),
      true,
      4
    ),
    (
      'echappee-verte-maferinya',
      'L''Échappée Verte de Maferinya',
      'excursion',
      'Parc animalier, balade à dos d''âne et piscine : une journée au grand air à Maferinya, idéale en famille.',
      '1 journée, de 10 h à 18 h',
      '',
      'Prise en charge à votre hôtel, à Conakry',
      'Tous les jours, sur réservation',
      '/images/circuits/maferinya.jpg',
      'À Maferinya, la nature se vit en famille. Votre guide vous fait découvrir un parc animalier et agricole, ses animaux et ses cultures.' || chr(10) || chr(10) ||
      'Au programme aussi : une balade à dos d''âne, puis la piscine et le terrain de jeu, avec un déjeuner sur place avant le retour à Conakry.',
      array[
        'Chauffeur privé, prise en charge et retour à l''hôtel',
        'Guide francophone et/ou anglophone expérimenté',
        'Visite guidée du parc animalier et agricole',
        'Balade à dos d''âne',
        'Accès à la piscine et au terrain de jeu',
        'Déjeuner'
      ],
      array['Vols internationaux', 'Boissons et dépenses personnelles'],
      jsonb_build_array(
        jsonb_build_object(
          'title', 'Une journée au grand air à Maferinya',
          'description', '10 h : prise en charge à votre hôtel par votre chauffeur privé et votre guide. Visite guidée du parc animalier et agricole, balade à dos d''âne, accès à la piscine et au terrain de jeu. Déjeuner sur place. 18 h : retour à votre hôtel.',
          'place', 'Maferinya',
          'latitude', 9.55, 'longitude', -13.283,
          'image', ''
        )
      ),
      true,
      5
    ),
    (
      'echappee-bleue-koba',
      'L''Échappée Bleue de Koba',
      'excursion',
      'Deux jours entre la ferme de Maferinya et le lac de Koba : animaux, piscine, dîner festif et balade en pirogue.',
      '2 jours / 1 nuit',
      '',
      'Prise en charge à votre hôtel, à Conakry, à 7 h',
      'Sur réservation',
      '/images/illustrations/plage-de-bel-air.jpg',
      'Une escapade de deux jours, de la verdure de Maferinya aux eaux calmes du lac de Koba, à Boffa.' || chr(10) || chr(10) ||
      'Le premier jour, vous découvrez Maff Village et son parc animalier et agricole, puis vous rejoignez Koba pour une soirée de détente autour d''un dîner festif. Le lendemain matin, une balade en pirogue sur le lac vous attend avant le retour à Conakry.',
      array[
        'Chauffeur privé, départ et retour à l''hôtel',
        'Guide expérimenté',
        'Visite guidée de Maff Village et du parc animalier et agricole',
        'Balade à dos d''âne et accès au terrain de jeux',
        'Déjeuner du premier jour',
        'Dîner festif et petit déjeuner à Koba',
        'Accès à la piscine',
        'Balade en pirogue sur le lac de Koba'
      ],
      array['Vols internationaux', 'Boissons et dépenses personnelles'],
      jsonb_build_array(
        jsonb_build_object(
          'title', 'De Conakry à Maferinya, puis Koba',
          'description', '7 h : départ de votre hôtel avec votre chauffeur privé et votre guide. Visite guidée de Maff Village et de son parc animalier et agricole, accès au terrain de jeux et balade à dos d''âne. Déjeuner sur place. 15 h : départ pour Koba (Boffa). Arrivée à Koba : détente et découverte, baignade, piscine et dîner festif.',
          'place', 'Maferinya',
          'latitude', 9.55, 'longitude', -13.283,
          'image', '/images/circuits/maferinya.jpg'
        ),
        jsonb_build_object(
          'title', 'Le lac de Koba en pirogue',
          'description', 'Petit déjeuner, puis balade en pirogue sur le lac de Koba. 14 h : départ de Koba pour Conakry. Retour à votre hôtel en fin d''après-midi.',
          'place', 'Koba, Boffa',
          'latitude', 9.95, 'longitude', -13.9,
          'image', ''
        )
      ),
      true,
      6
    )
  ) as v (slug, title, kind, tagline, duration, price, departure, dates, image, description, included, excluded, programme, published, sort_order)
  where not exists (select 1 from public.circuits c where c.slug = v.slug);

  -- 2. Photos fournies pour des lieux de la carte qui n'en avaient pas.
  update public.sites_touristiques s
  set image = v.image
  from (values
    ('fort-de-boke', '/images/sites/fort-de-boke.jpg'),
    ('iles-tristao', '/images/sites/iles-tristao.jpg'),
    ('sources-de-koffara', '/images/sites/sources-de-koffara.jpg'),
    ('echelles-de-djinkan', '/images/sites/echelles-de-djinkan.jpg'),
    ('confluence-niger-tinkisso', '/images/sites/confluence-niger-tinkisso.jpg'),
    ('mosquee-de-dinguiraye', '/images/sites/dinguiraye.jpg'),
    ('vestiges-de-samory-toure', '/images/sites/tata-de-samory-toure.jpg'),
    ('confluences-des-cours-d-eau', '/images/sites/confluence-makona-lua.jpg'),
    ('voile-de-la-mariee', '/images/circuits/voile-de-la-mariee.jpg')
  ) as v (slug, image)
  where s.slug = v.slug and s.image = '';

  -- 3. Nouveaux lieux, d'après les photos fournies. Positions indicatives, autour de leur ville.
  insert into public.sites_touristiques
    (slug, name, region, category, town, description, image, latitude, longitude, approximate, destination_slug, sort_order)
  select v.*
  from (values
    ('musee-national-de-sandervalia', 'Musée national de Sandervalia', 'basse', 'culture', 'Conakry', 'Le musée national de Guinée, dans le quartier de Sandervalia : masques, instruments et objets qui racontent l''histoire du pays.', '/images/sites/musee-national.jpg', 9.5135, -13.7085, true, '', 60),
    ('palais-du-peuple', 'Palais du Peuple', 'basse', 'culture', 'Conakry', 'Le grand palais de Kaloum, au cœur de la vie politique et culturelle de la capitale.', '/images/circuits/palais-du-peuple.jpg', 9.5205, -13.7005, true, '', 61),
    ('jardin-botanique-de-camayenne', 'Jardin botanique de Camayenne', 'basse', 'nature', 'Conakry', 'Un jardin ombragé du quartier de Camayenne, pour une promenade parmi les arbres tropicaux.', '/images/sites/jardin-botanique-de-camayenne.jpg', 9.5365, -13.6845, true, '', 62),
    ('chutes-de-tabouna', 'Chutes de Tabouna', 'basse', 'nature', 'Kindia', 'Des chutes d''eau entourées de forêt, dans la région de Kindia.', '/images/sites/chutes-de-tabouna.jpg', 10.085, -12.81, true, '', 63),
    ('villa-syli', 'Villa Syli', 'moyenne', 'culture', 'Dalaba', 'Une villa historique de Dalaba, la ville d''altitude du Fouta-Djalon.', '/images/sites/villa-syli.jpg', 10.695, -12.245, true, '', 64),
    ('plateaux-de-tougue', 'Plateaux de Tougué', 'moyenne', 'nature', 'Tougué', 'Les grands plateaux de la région de Tougué, entre savane et falaises.', '/images/sites/plateaux-de-tougue.jpg', 11.45, -11.66, true, '', 65),
    ('fleuve-niger-a-siguiri', 'Le fleuve Niger à Siguiri', 'haute', 'nature', 'Siguiri', 'Les rives du fleuve Niger à Siguiri, entre pirogues et vie au bord de l''eau.', '/images/sites/fleuve-niger-siguiri.jpg', 11.42, -9.165, true, '', 66),
    ('pont-de-lianes-de-yomou', 'Pont de lianes de Yomou', 'forestiere', 'culture', 'Yomou', 'Un pont traditionnel tressé de lianes, au-dessus d''une rivière de Guinée forestière.', '/images/sites/pont-de-lianes-de-yomou.jpg', 7.57, -9.26, true, '', 67)
  ) as v (slug, name, region, category, town, description, image, latitude, longitude, approximate, destination_slug, sort_order)
  where not exists (select 1 from public.sites_touristiques s where s.slug = v.slug);

  insert into public.contenus_importes (cle) values ('0011_circuits_cliente');
end;
$import$;
