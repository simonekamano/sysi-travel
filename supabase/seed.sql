-- Contenu de départ du site (destinations, formules, FAQ), repris de src/data/site.js.
-- Chaque bloc n'insère que si la table est vide : rejouer ce script n'écrase rien.
-- Si vous importez vos données Base44 (export CSV), n'exécutez pas ce fichier.

insert into public.destinations (name, region, text, price, image, tags, sort_order)
select * from (values
  ('Îles de Loos', 'Conakry', 'Sable blanc, eau turquoise et mangrove, à vingt minutes de bateau du port de Conakry.', '',
   'https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/241672d56_generated_e5e835c9.png', array['Plage', 'Snorkeling'], 1),
  ('Fouta Djallon', 'Moyenne Guinée', 'Hauts plateaux, villages peuls et brume du matin : la Guinée des grands espaces.', '',
   'https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/a96a29944_generated_d3eea4ba.png', array['Randonnée', 'Culture'], 2),
  ('Mont Nimba', 'Guinée forestière', 'Réserve naturelle classée au patrimoine mondial, forêts primaires et sommets vertigineux.', '',
   'https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/3d58d3f65_generated_e938acc8.png', array['UNESCO', 'Nature'], 3),
  ('Chutes de Kinkon', 'Pita', 'Une cascade spectaculaire au cœur d''un cirque de verdure, à quelques heures de Dalaba.', '',
   'https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/86144e1f1_generated_df6aa439.png', array['Cascade', 'Photo'], 4),
  ('Conakry', 'Presqu''île de Kaloum', 'Corniche, marchés colorés, musique et couchers de soleil sur l''Atlantique.', '',
   'https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/3dfcf3a27_generated_fb507fb0.png', array['Ville', 'Musique'], 5),
  ('Plage de Bel-Air', 'Kindia', 'Sable sombre, cocotiers et horizon ouvert, à deux heures de la capitale.', '',
   'https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/1a022afe2_generated_081a0a42.png', array['Plage', 'Farniente'], 6)
) as v (name, region, text, price, image, tags, sort_order)
where not exists (select 1 from public.destinations);

insert into public.formules (name, price, duration, tagline, features, image, highlight, sort_order)
select * from (values
  ('Escapade Loos', '390', '3 jours / 2 nuits', 'La première bouffée d''air, juste à côté de Conakry.',
   array['Transfert port et bateau', '2 nuits en écolodge', 'Guide local francophone', 'Un dîner les pieds dans le sable'],
   'https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/241672d56_generated_e5e835c9.png', false, 1),
  ('Signature Fouta', '1 190', '8 jours / 7 nuits', 'Le voyage que l''on raconte pendant des années.',
   array['Conakry, Dalaba et le Fouta', 'Hébergements sélectionnés', 'Guide privé et chauffeur', 'Chutes de Kinkon et villages peuls', 'Assistance 7j/7 sur place'],
   'https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/a96a29944_generated_d3eea4ba.png', true, 2),
  ('Grande Traversée', '2 490', '14 jours / 13 nuits', 'La Guinée dans toute sa diversité, d''ouest en est.',
   array['Conakry, Fouta, forêt et Nimba', 'Vols intérieurs inclus', 'Nuits chez l''habitant', 'Photographe sur deux journées', 'Itinéraire 100 % personnalisé'],
   'https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/3d58d3f65_generated_e938acc8.png', false, 3)
) as v (name, price, duration, tagline, features, image, highlight, sort_order)
where not exists (select 1 from public.formules);

insert into public.faqs (question, answer, sort_order)
select * from (values
  ('Faut-il un visa pour venir en Guinée ?',
   'Oui pour la plupart des passeports. Nous vous transmettons la procédure à jour, les justificatifs utiles et la liste des pièces à préparer avant votre départ.', 1),
  ('Les vols internationaux sont-ils inclus dans vos tarifs ?',
   'Nos formules couvrent le séjour sur place. Sur demande, nous réservons également vos vols internationaux et vos correspondances intérieures, au tarif réel du moment.', 2),
  ('Puis-je voyager avec des enfants ?',
   'Oui. Nous adaptons les étapes, le rythme et les hébergements à l''âge des enfants. Les formules en famille prévoient des journées plus courtes et des pauses régulières.', 3),
  ('Comment se passe le paiement ?',
   'Un acompte de 30 % confirme votre réservation en ligne de façon sécurisée. Le solde est réglé quinze jours avant le départ. Chaque paiement est confirmé par écrit.', 4),
  ('Je ne sais pas encore quelles dates choisir, puis-je vous écrire ?',
   'Bien sûr. Décrivez simplement la période envisagée : nous vous proposerons les meilleures fenêtres selon la saison, les fêtes locales et votre budget.', 5)
) as v (question, answer, sort_order)
where not exists (select 1 from public.faqs);
