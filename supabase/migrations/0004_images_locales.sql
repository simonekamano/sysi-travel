-- Les illustrations hébergées chez Base44 (media.base44.com) sont copiées sur le site,
-- dans public/images/illustrations/ : on remplace leurs adresses dans les destinations et
-- les formules. Seules les anciennes adresses Base44 changent ; une photo choisie depuis
-- l'administration reste telle quelle. Idempotent : rejouée à chaque déploiement.

begin;

create temporary table images_base44 (ancienne text primary key, nouvelle text not null) on commit drop;

insert into images_base44 values
  ('https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/8001a4000_generated_4eab33cf.png', '/images/illustrations/accueil.jpg'),
  ('https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/241672d56_generated_e5e835c9.png', '/images/illustrations/iles-de-loos.jpg'),
  ('https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/a96a29944_generated_d3eea4ba.png', '/images/illustrations/fouta-djallon.jpg'),
  ('https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/3d58d3f65_generated_e938acc8.png', '/images/illustrations/mont-nimba.jpg'),
  ('https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/86144e1f1_generated_df6aa439.png', '/images/illustrations/chutes-de-kinkon.jpg'),
  ('https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/3dfcf3a27_generated_fb507fb0.png', '/images/illustrations/conakry.jpg'),
  ('https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/1a022afe2_generated_081a0a42.png', '/images/illustrations/plage-de-bel-air.jpg'),
  ('https://media.base44.com/images/public/6ae62efa0e580c1fab685af6/6878ea223_generated_d5361e93.png', '/images/illustrations/coucher-de-soleil.jpg');

update public.destinations d set image = i.nouvelle from images_base44 i where d.image = i.ancienne;
update public.formules f set image = i.nouvelle from images_base44 i where f.image = i.ancienne;
update public.destinations d
  set gallery = array(select coalesce(i.nouvelle, g) from unnest(d.gallery) with ordinality as t(g, n)
                      left join images_base44 i on i.ancienne = t.g order by t.n)
  where exists (select 1 from unnest(d.gallery) g join images_base44 i on i.ancienne = g);

commit;
