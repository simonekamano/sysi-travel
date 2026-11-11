-- Boutique d'articles (vêtements, sacs, bijoux), commandes mixtes livres + articles avec
-- livraison, et lecture de ses propres commandes par le client connecté (« Mon compte »).
--   * articles            : le catalogue, géré dans Administration › Articles ; chaque article a
--                           ses variantes (coloris, tissu…) avec leurs photos, et ses tailles.
--   * commande_articles   : les articles d'une commande (nom, variante, taille, quantité, prix
--                           figés au moment de la commande).
--   * commandes.livraison : suivi de l'envoi, à part du paiement (commandes.statut), pour ne
--                           pas toucher aux liens de téléchargement des livres.
--   * passer_commande()   : un visiteur commande ; les prix viennent du catalogue, jamais du
--                           navigateur.
-- Contenu de départ (import unique, table contenus_importes) : 49 articles de la Cliente et
-- 6 livres d'exemple, à supprimer dans l'administration.
-- Idempotent : rejouée à chaque déploiement (deploy/deploy.sh).

-- 1. Catalogue ---------------------------------------------------------------------------------

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null check (char_length(name) between 1 and 200),
  category text not null default 'femme' check (category in ('femme', 'homme', 'sacs', 'bijoux')),
  tagline text not null default '' check (char_length(tagline) <= 300),
  description text not null default '' check (char_length(description) <= 10000),
  -- Prix en centimes d'euro : de 1 € à 10 000 €.
  price_cents integer not null check (price_cents between 100 and 1000000),
  -- Tailles proposées (vide : pas de taille à choisir).
  sizes text[] not null default '{}' check (cardinality(sizes) <= 20),
  -- « Sur mesure » proposé en plus des tailles.
  custom_made boolean not null default false,
  -- [{ "name": "Bleu indigo", "images": ["/images/…"], "available": true }]
  variants jsonb not null default '[]'::jsonb check (jsonb_typeof(variants) = 'array'),
  published boolean not null default false,
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists articles_slug_key on public.articles (slug);
create index if not exists articles_sort_order_idx on public.articles (sort_order);

-- Slug calculé depuis le nom quand l'administration le laisse vide ; suffixé s'il est déjà pris.
create or replace function public.articles_set_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := public.slugify(coalesce(nullif(trim(new.slug), ''), new.name));
  if new.slug = '' then
    new.slug := left(new.id::text, 8);
  end if;
  if exists (select 1 from public.articles where slug = new.slug and id <> new.id) then
    new.slug := new.slug || '-' || left(new.id::text, 6);
  end if;
  return new;
end;
$$;

drop trigger if exists articles_set_slug on public.articles;
create trigger articles_set_slug
  before insert or update of slug, name on public.articles
  for each row execute function public.articles_set_slug();

drop trigger if exists touch_updated_at on public.articles;
create trigger touch_updated_at before update on public.articles
  for each row execute function public.touch_updated_at();

alter table public.articles enable row level security;

drop policy if exists "lecture des articles publies" on public.articles;
create policy "lecture des articles publies" on public.articles
  for select to anon, authenticated
  using (published or public.is_admin());

drop policy if exists "ecriture admin" on public.articles;
create policy "ecriture admin" on public.articles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

-- 2. Commandes : livraison et articles ----------------------------------------------------------

alter table public.commandes
  add column if not exists adresse text not null default '' check (char_length(adresse) <= 600),
  add column if not exists pays text not null default '' check (char_length(pays) <= 100),
  add column if not exists message text not null default '' check (char_length(message) <= 2000),
  add column if not exists livraison text not null default 'sans'
    check (livraison in ('sans', 'a_preparer', 'en_preparation', 'expediee', 'livree')),
  add column if not exists livraison_maj_le timestamptz;

create table if not exists public.commande_articles (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references public.commandes (id) on delete cascade,
  -- Le nom, la variante et le prix restent dans la commande si l'article est supprimé.
  article_id uuid references public.articles (id) on delete set null,
  name text not null,
  variante text not null default '',
  taille text not null default '',
  quantite integer not null check (quantite between 1 and 20),
  price_cents integer not null check (price_cents >= 0)
);

create index if not exists commande_articles_commande_idx on public.commande_articles (commande_id);
create index if not exists commande_articles_article_idx on public.commande_articles (article_id);

alter table public.commande_articles enable row level security;

drop policy if exists "gestion admin" on public.commande_articles;
create policy "gestion admin" on public.commande_articles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, update, delete on public.commande_articles to authenticated;

-- 3. Le client connecté lit ses propres commandes (même adresse e-mail, vérifiée à l'inscription)

drop policy if exists "lecture par le client" on public.commandes;
create policy "lecture par le client" on public.commandes
  for select to authenticated
  using (coalesce(auth.jwt() ->> 'email', '') <> '' and email = lower(auth.jwt() ->> 'email'));

drop policy if exists "lecture par le client" on public.commande_livres;
create policy "lecture par le client" on public.commande_livres
  for select to authenticated
  using (exists (
    select 1 from public.commandes c
    where c.id = commande_id and coalesce(auth.jwt() ->> 'email', '') <> '' and c.email = lower(auth.jwt() ->> 'email')
  ));

drop policy if exists "lecture par le client" on public.commande_articles;
create policy "lecture par le client" on public.commande_articles
  for select to authenticated
  using (exists (
    select 1 from public.commandes c
    where c.id = commande_id and coalesce(auth.jwt() ->> 'email', '') <> '' and c.email = lower(auth.jwt() ->> 'email')
  ));

-- 4. Passer commande ---------------------------------------------------------------------------

create or replace function public.passer_commande(
  p_nom text,
  p_email text,
  p_telephone text,
  p_adresse text,
  p_pays text,
  p_message text,
  p_livres uuid[],
  p_articles jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
  v_articles jsonb := coalesce(p_articles, '[]'::jsonb);
  v_with_articles boolean;
  v_id uuid;
  v_reference text;
  v_total integer := 0;
  v_count integer;
  v_line jsonb;
  v_article public.articles%rowtype;
  v_article_id uuid;
  v_variant jsonb;
  v_variant_name text;
  v_size text;
  v_qty integer;
begin
  p_nom := trim(coalesce(p_nom, ''));
  p_email := lower(trim(coalesce(p_email, '')));
  p_telephone := trim(coalesce(p_telephone, ''));
  p_adresse := trim(coalesce(p_adresse, ''));
  p_pays := trim(coalesce(p_pays, ''));
  p_message := trim(coalesce(p_message, ''));
  if char_length(p_nom) not between 1 and 200 then
    raise exception 'Nom invalide';
  end if;
  if char_length(p_email) > 320 or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Adresse e-mail invalide';
  end if;
  if char_length(p_telephone) > 50 or char_length(p_adresse) > 600 or char_length(p_pays) > 100 or char_length(p_message) > 2000 then
    raise exception 'Champ trop long';
  end if;
  if jsonb_typeof(v_articles) <> 'array' or jsonb_array_length(v_articles) > 30 then
    raise exception 'Panier invalide';
  end if;

  select array_agg(distinct x) into v_ids from unnest(coalesce(p_livres, '{}')) as x;
  v_with_articles := jsonb_array_length(v_articles) > 0;
  if v_ids is null and not v_with_articles then
    raise exception 'Panier vide';
  end if;
  if v_ids is not null and cardinality(v_ids) > 50 then
    raise exception 'Panier trop grand';
  end if;
  if v_with_articles and (char_length(p_adresse) < 8 or char_length(p_pays) < 2) then
    raise exception 'Adresse de livraison incomplète';
  end if;

  if v_ids is not null then
    select count(*), coalesce(sum(price_cents), 0) into v_count, v_total
    from public.livres
    where id = any (v_ids) and published;
    if v_count <> cardinality(v_ids) then
      raise exception 'Un livre du panier n''est plus disponible';
    end if;
  end if;

  loop
    v_reference := 'CMD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.commandes where reference = v_reference);
  end loop;

  insert into public.commandes (reference, nom, email, telephone, total_cents, adresse, pays, message, livraison)
  values (
    v_reference, p_nom, p_email, p_telephone, 0, p_adresse, p_pays, p_message,
    case when v_with_articles then 'a_preparer' else 'sans' end
  )
  returning id into v_id;

  if v_ids is not null then
    insert into public.commande_livres (commande_id, livre_id, title, price_cents)
    select v_id, id, title, price_cents
    from public.livres
    where id = any (v_ids)
    order by sort_order;
  end if;

  for v_line in select value from jsonb_array_elements(v_articles) loop
    begin
      v_article_id := (v_line ->> 'id')::uuid;
    exception when others then
      raise exception 'Un article du panier n''est plus disponible';
    end;
    select * into v_article from public.articles where id = v_article_id and published;
    if not found then
      raise exception 'Un article du panier n''est plus disponible';
    end if;

    begin
      v_qty := coalesce((v_line ->> 'quantite')::integer, 1);
    exception when others then
      v_qty := 0;
    end;
    if v_qty not between 1 and 20 then
      raise exception 'Quantité invalide';
    end if;

    v_variant_name := trim(coalesce(v_line ->> 'variante', ''));
    if jsonb_array_length(v_article.variants) > 0 then
      select v into v_variant
      from jsonb_array_elements(v_article.variants) as v
      where v ->> 'name' = v_variant_name and coalesce((v ->> 'available')::boolean, true)
      limit 1;
      if not found then
        raise exception 'Un article du panier n''est plus disponible';
      end if;
    else
      v_variant_name := '';
    end if;

    v_size := trim(coalesce(v_line ->> 'taille', ''));
    if v_article.custom_made and v_size = 'Sur mesure' then
      null;
    elsif cardinality(v_article.sizes) > 0 then
      if not (v_size = any (v_article.sizes)) then
        raise exception 'Taille invalide';
      end if;
    else
      v_size := '';
    end if;

    insert into public.commande_articles (commande_id, article_id, name, variante, taille, quantite, price_cents)
    values (v_id, v_article.id, v_article.name, v_variant_name, v_size, v_qty, v_article.price_cents);
    v_total := v_total + v_article.price_cents * v_qty;
  end loop;

  update public.commandes set total_cents = v_total where id = v_id;

  return json_build_object(
    'reference', v_reference,
    'total_cents', v_total,
    'livraison', v_with_articles,
    'lignes', coalesce((
      select json_agg(line)
      from (
        select json_build_object('title', title, 'quantite', 1, 'price_cents', price_cents) as line
        from public.commande_livres where commande_id = v_id
        union all
        select json_build_object(
          'title', name || case when variante <> '' then ' · ' || variante else '' end || case when taille <> '' then ' · ' || taille else '' end,
          'quantite', quantite,
          'price_cents', price_cents * quantite
        )
        from public.commande_articles where commande_id = v_id
      ) as lines
    ), '[]'::json)
  );
end;
$$;

revoke all on function public.passer_commande(text, text, text, text, text, text, uuid[], jsonb) from public;
grant execute on function public.passer_commande(text, text, text, text, text, text, uuid[], jsonb) to anon, authenticated;

-- 5. Contenu de départ (import unique) -----------------------------------------------------------

do $import$
begin
  if not exists (select 1 from public.contenus_importes where cle = '0013_articles_cliente') then
    insert into public.articles
      (slug, name, category, tagline, description, price_cents, sizes, custom_made, variants, published, sort_order)
    select v.*
    from (values
    ('sac-kaloum', 'Sac Kaloum', 'sacs', 'Le sac à main structuré, à anse unique, pour la ville comme pour les soirées.', 'Une silhouette nette, un rabat en pagne et une anse unique : le Sac Kaloum accompagne toutes vos tenues, du bureau au dîner.' || chr(10) || '' || chr(10) || 'Chaque sac est cousu et fini à la main ; le motif du tissu varie légèrement d''une pièce à l''autre.', 6900, '{}'::text[], false, '[{"name":"Noir surpiqué","images":["/images/boutique/sac-kaloum-1-1.jpg"],"available":true},{"name":"Noir et blanc graphique","images":["/images/boutique/sac-kaloum-2-1.jpg"],"available":true}]'::jsonb, true, 1),
    ('sac-bafing', 'Sac Bafing', 'sacs', 'Anses rondes en bois et médaillon central : le sac signature en pagne.', 'Le Sac Bafing marie le pagne imprimé à deux anses rondes en bois et un médaillon cousu au centre. Spacieux, il se porte à la main ou au creux du bras.' || chr(10) || '' || chr(10) || 'Fabriqué à la main : chaque pièce est unique par la découpe du tissu.', 7900, '{}'::text[], false, '[{"name":"Orange solaire","images":["/images/boutique/sac-bafing-1-1.jpg"],"available":true},{"name":"Bleu rayé","images":["/images/boutique/sac-bafing-2-1.jpg"],"available":true},{"name":"Marron","images":["/images/boutique/sac-bafing-3-1.jpg"],"available":true},{"name":"Bleu ciel","images":["/images/boutique/sac-bafing-4-1.jpg","/images/boutique/sac-bafing-4-2.jpg"],"available":true}]'::jsonb, true, 2),
    ('cabas-loos-et-sa-pochette', 'Cabas Loos et sa pochette', 'sacs', 'Un grand cabas en pagne livré avec sa pochette assortie.', 'Le Cabas Loos emporte tout ce qu''il faut pour la journée, et sa pochette assortie se glisse dedans ou se porte seule le soir. Anses longues pour le porter à l''épaule.' || chr(10) || '' || chr(10) || 'Cousu à la main, décor de sandales brodées sur le devant.', 8900, '{}'::text[], false, '[{"name":"Bleu indigo","images":["/images/boutique/cabas-loos-et-sa-pochette-1-1.jpg","/images/boutique/cabas-loos-et-sa-pochette-1-2.jpg"],"available":true},{"name":"Marron","images":["/images/boutique/cabas-loos-et-sa-pochette-2-1.jpg","/images/boutique/cabas-loos-et-sa-pochette-2-2.jpg"],"available":true},{"name":"Rouge et bleu","images":["/images/boutique/cabas-loos-et-sa-pochette-3-1.jpg","/images/boutique/cabas-loos-et-sa-pochette-3-2.jpg"],"available":true},{"name":"Gris et orange","images":["/images/boutique/cabas-loos-et-sa-pochette-4-1.jpg"],"available":true}]'::jsonb, true, 3),
    ('boucles-fleurs-de-pagne', 'Boucles Fleurs de pagne', 'bijoux', 'De grandes fleurs en tissu, légères à porter, pour une touche de couleur.', 'Des boucles d''oreilles en forme de fleur, façonnées dans le tissu. Légères malgré leur volume, elles réveillent une tenue simple comme une robe de cérémonie.', 1900, '{}'::text[], false, '[{"name":"Fuchsia","images":["/images/boutique/boucles-fleurs-de-pagne-1-1.jpg"],"available":true},{"name":"Couleurs assorties","images":["/images/boutique/boucles-fleurs-de-pagne-2-1.jpg"],"available":true}]'::jsonb, true, 4),
    ('boucles-orchidee', 'Boucles Orchidée', 'bijoux', 'Deux orchidées laquées fuchsia, cœur doré.', 'Des boucles d''oreilles en forme d''orchidée, laquées fuchsia avec un cœur doré : un éclat de couleur, léger et lumineux.', 2200, '{}'::text[], false, '[{"name":"Fuchsia","images":["/images/boutique/boucles-orchidee-1-1.jpg"],"available":true}]'::jsonb, true, 5),
    ('boucles-dorees-soleil-de-kankan', 'Boucles dorées Soleil de Kankan', 'bijoux', 'Cinq modèles dorés, du papillon à la rose sertie.', 'Des boucles d''oreilles dorées aux formes sculptées : papillon, éventail, corolle cuivrée, grappe ou rose sertie de strass. Choisissez votre modèle.', 2500, '{}'::text[], false, '[{"name":"Papillon","images":["/images/boutique/boucles-dorees-soleil-de-kankan-1-1.jpg"],"available":true},{"name":"Éventail","images":["/images/boutique/boucles-dorees-soleil-de-kankan-2-1.jpg"],"available":true},{"name":"Corolle cuivrée","images":["/images/boutique/boucles-dorees-soleil-de-kankan-3-1.jpg"],"available":true},{"name":"Rose et strass","images":["/images/boutique/boucles-dorees-soleil-de-kankan-4-1.jpg"],"available":true},{"name":"Grappe","images":["/images/boutique/boucles-dorees-soleil-de-kankan-5-1.jpg"],"available":true}]'::jsonb, true, 6),
    ('kaftan-soleil-de-kindia', 'Kaftan Soleil de Kindia', 'femme', 'Un long kaftan aux couleurs chaudes, souligné de bandes orange.', 'Coupe longue et droite, manches amples et grandes bandes orange qui encadrent l''imprimé : le Kaftan Soleil de Kindia se porte aussi bien en ville qu''aux fêtes de famille.' || chr(10) || '' || chr(10) || 'Taille unique, ample et confortable ; sur mesure sur demande.', 14900, array['Taille unique']::text[], true, '[{"name":"Orange et rose","images":["/images/boutique/kaftan-soleil-de-kindia-1-1.jpg","/images/boutique/kaftan-soleil-de-kindia-1-2.jpg","/images/boutique/kaftan-soleil-de-kindia-1-3.jpg","/images/boutique/kaftan-soleil-de-kindia-1-4.jpg"],"available":true}]'::jsonb, true, 7),
    ('robe-bazin-d-or', 'Robe Bazin d''or', 'femme', 'La robe longue de cérémonie, brocart jaune et foulard assorti.', 'Une robe longue en brocart jaune, manches bouffantes et foulard assorti pour les grands jours : mariages, baptêmes, réceptions.' || chr(10) || '' || chr(10) || 'Réalisée à la commande dans votre taille, ou sur mesure.', 16900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Jaune d''or","images":["/images/boutique/robe-bazin-d-or-1-1.jpg","/images/boutique/robe-bazin-d-or-1-2.jpg","/images/boutique/robe-bazin-d-or-1-3.jpg"],"available":true}]'::jsonb, true, 8),
    ('ensemble-nimba', 'Ensemble Nimba', 'femme', 'Un kimono imprimé bleu et orange sur un pantalon rouille.', 'Le kimono court, imprimé de grandes fleurs bleu et orange, se porte ouvert sur un pantalon large couleur rouille. Un ensemble qui se remarque, facile à dépareiller.', 18900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Bleu et rouille","images":["/images/boutique/ensemble-nimba-1-1.jpg","/images/boutique/ensemble-nimba-1-2.jpg","/images/boutique/ensemble-nimba-1-3.jpg","/images/boutique/ensemble-nimba-1-4.jpg"],"available":true}]'::jsonb, true, 9),
    ('kimono-nuit-d-or', 'Kimono Nuit d''or', 'femme', 'Un long kimono noir tracé de lignes dorées.', 'Long, fluide, ouvert sur le devant : le Kimono Nuit d''or se porte sur une robe simple ou un ensemble pantalon, de jour comme de soir.', 15900, array['Taille unique']::text[], true, '[{"name":"Noir et or","images":["/images/boutique/kimono-nuit-d-or-1-1.jpg","/images/boutique/kimono-nuit-d-or-1-2.jpg","/images/boutique/kimono-nuit-d-or-1-3.jpg"],"available":true}]'::jsonb, true, 10),
    ('ensemble-robe-et-kimono-gala', 'Ensemble Robe et kimono Gala', 'femme', 'Une robe près du corps et son kimono long, pour les soirées.', 'La robe longue, ajustée, se porte seule ou avec son grand kimono imprimé aux manches amples. Un ensemble de défilé, pour les galas et les cérémonies.', 21900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Rouge","images":["/images/boutique/ensemble-robe-et-kimono-gala-1-1.jpg","/images/boutique/ensemble-robe-et-kimono-gala-1-2.jpg","/images/boutique/ensemble-robe-et-kimono-gala-1-3.jpg","/images/boutique/ensemble-robe-et-kimono-gala-1-4.jpg"],"available":true},{"name":"Noir","images":["/images/boutique/ensemble-robe-et-kimono-gala-2-1.jpg","/images/boutique/ensemble-robe-et-kimono-gala-2-2.jpg","/images/boutique/ensemble-robe-et-kimono-gala-2-3.jpg"],"available":true}]'::jsonb, true, 11),
    ('kimono-bogolan', 'Kimono Bogolan', 'femme', 'Un kimono long aux motifs bogolan, bordé de doré.', 'Kimono long à grandes manches, motifs inspirés du bogolan et bordure dorée. Il se porte ouvert ou ceinturé.', 13900, array['Taille unique']::text[], true, '[{"name":"Brun et blanc","images":["/images/boutique/kimono-bogolan-1-1.jpg","/images/boutique/kimono-bogolan-1-2.jpg","/images/boutique/kimono-bogolan-1-3.jpg","/images/boutique/kimono-bogolan-1-4.jpg","/images/boutique/kimono-bogolan-1-5.jpg"],"available":true}]'::jsonb, true, 12),
    ('veste-indigo', 'Veste Indigo', 'femme', 'Une veste courte en tissu indigo, coupe bomber.', 'Une veste courte et ample, coupe bomber, dans un tissu indigo aux motifs géométriques. Elle habille un jean comme une robe.', 11900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], false, '[{"name":"Indigo","images":["/images/boutique/veste-indigo-1-1.jpg","/images/boutique/veste-indigo-1-2.jpg","/images/boutique/veste-indigo-1-3.jpg","/images/boutique/veste-indigo-1-4.jpg","/images/boutique/veste-indigo-1-5.jpg"],"available":true}]'::jsonb, true, 13),
    ('ensemble-safran', 'Ensemble Safran', 'femme', 'Pantalon large et grande veste couleur safran.', 'Un ensemble lumineux : pantalon large et grande veste ouverte couleur safran, à porter sur un haut noir pour faire ressortir les motifs.', 17900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Safran","images":["/images/boutique/ensemble-safran-1-1.jpg","/images/boutique/ensemble-safran-1-2.jpg","/images/boutique/ensemble-safran-1-3.jpg","/images/boutique/ensemble-safran-1-4.jpg"],"available":true}]'::jsonb, true, 14),
    ('robe-kimono-ebene', 'Robe kimono Ébène', 'femme', 'Une robe longue noire aux manches kimono.', 'Robe longue et fluide, manches kimono, dans un noir profond : l''élégance simple, pour toutes les occasions.', 15900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Noir","images":["/images/boutique/robe-kimono-ebene-1-1.jpg","/images/boutique/robe-kimono-ebene-1-2.jpg","/images/boutique/robe-kimono-ebene-1-3.jpg"],"available":true}]'::jsonb, true, 15),
    ('grand-kaftan-mandarine', 'Grand kaftan Mandarine', 'femme', 'Un grand kaftan en brocart orange, ample et majestueux.', 'Le grand kaftan, en brocart orange aux motifs tissés, tombe jusqu''aux chevilles. Une pièce de cérémonie, ample et confortable.', 16900, array['Taille unique']::text[], true, '[{"name":"Mandarine","images":["/images/boutique/grand-kaftan-mandarine-1-1.jpg","/images/boutique/grand-kaftan-mandarine-1-2.jpg"],"available":true}]'::jsonb, true, 16),
    ('pantalon-palazzo-en-wax', 'Pantalon palazzo en wax', 'femme', 'Un pantalon large et fluide, en wax coloré.', 'Taille haute, jambes larges, tissu wax : le palazzo se porte avec une chemise blanche pour la journée ou un haut uni pour le soir.', 7900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Bleu","images":["/images/boutique/pantalon-palazzo-en-wax-1-1.jpg","/images/boutique/pantalon-palazzo-en-wax-1-2.jpg"],"available":true},{"name":"Multicolore","images":["/images/boutique/pantalon-palazzo-en-wax-2-1.jpg","/images/boutique/pantalon-palazzo-en-wax-2-2.jpg","/images/boutique/pantalon-palazzo-en-wax-2-3.jpg"],"available":true}]'::jsonb, true, 17),
    ('veste-tissee-bafata', 'Veste tissée Bafata', 'femme', 'Une veste en pagne tissé, rayures bleu et terre cuite.', 'Une veste droite en pagne tissé à rayures bleu et terre cuite, à porter sur un pantalon large noir pour une allure affirmée.', 13900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Bleu et terre cuite","images":["/images/boutique/veste-tissee-bafata-1-1.jpg","/images/boutique/veste-tissee-bafata-1-2.jpg","/images/boutique/veste-tissee-bafata-1-3.jpg"],"available":true}]'::jsonb, true, 18),
    ('veste-rayee-zebrure', 'Veste rayée Zébrure', 'femme', 'Une veste à rayures noir et blanc, finitions à franges.', 'Veste ample à rayures noir et blanc, terminée de petites franges : elle structure un ensemble noir et se porte toute l''année.', 12900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Noir et blanc","images":["/images/boutique/veste-rayee-zebrure-1-1.jpg","/images/boutique/veste-rayee-zebrure-1-2.jpg"],"available":true}]'::jsonb, true, 19),
    ('top-peplum-de-soiree', 'Top péplum de soirée', 'femme', 'Un haut à basque et manches structurées, en quatre tissus.', 'Manches structurées, basque évasée à la taille : le top péplum se porte avec un pantalon droit ou une jupe longue pour les soirées.', 8900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Émeraude","images":["/images/boutique/top-peplum-de-soiree-1-1.jpg","/images/boutique/top-peplum-de-soiree-1-2.jpg","/images/boutique/top-peplum-de-soiree-1-3.jpg"],"available":true},{"name":"Argent","images":["/images/boutique/top-peplum-de-soiree-2-1.jpg","/images/boutique/top-peplum-de-soiree-2-2.jpg"],"available":true},{"name":"Beige doré","images":["/images/boutique/top-peplum-de-soiree-3-1.jpg","/images/boutique/top-peplum-de-soiree-3-2.jpg"],"available":true},{"name":"Rouge fleuri","images":["/images/boutique/top-peplum-de-soiree-4-1.jpg"],"available":true}]'::jsonb, true, 20),
    ('robe-brocart-ocean', 'Robe brocart Océan', 'femme', 'Une robe longue en brocart bleu argenté, avec son foulard.', 'Robe longue et ample en brocart bleu argenté, manches bouffantes et foulard assorti : une robe de cérémonie lumineuse.', 16900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Bleu argenté","images":["/images/boutique/robe-brocart-ocean-1-1.jpg","/images/boutique/robe-brocart-ocean-1-2.jpg","/images/boutique/robe-brocart-ocean-1-3.jpg","/images/boutique/robe-brocart-ocean-1-4.jpg"],"available":true}]'::jsonb, true, 21),
    ('ensemble-cape-emeraude', 'Ensemble cape Émeraude', 'femme', 'Une grande cape verte bordée de pagne tissé, et son pantalon.', 'Une cape longue vert émeraude, bordée de bandes de pagne tissé, sur un pantalon large assorti. Spectaculaire et facile à porter.', 18900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Émeraude","images":["/images/boutique/ensemble-cape-emeraude-1-1.jpg","/images/boutique/ensemble-cape-emeraude-1-2.jpg","/images/boutique/ensemble-cape-emeraude-1-3.jpg"],"available":true}]'::jsonb, true, 22),
    ('blouse-papillon', 'Blouse Papillon', 'femme', 'Une blouse ample aux manches papillon, encolure brodée.', 'Ample et légère, la Blouse Papillon a des manches volantées et une encolure brodée. Elle se porte sur un jean ou un pantalon uni.', 7900, array['Taille unique']::text[], true, '[{"name":"Or","images":["/images/boutique/blouse-papillon-1-1.jpg","/images/boutique/blouse-papillon-1-2.jpg","/images/boutique/blouse-papillon-1-3.jpg","/images/boutique/blouse-papillon-1-4.jpg"],"available":true},{"name":"Violet et or","images":["/images/boutique/blouse-papillon-2-1.jpg","/images/boutique/blouse-papillon-2-2.jpg"],"available":true}]'::jsonb, true, 23),
    ('robe-longue-cacao', 'Robe longue Cacao', 'femme', 'Une robe longue chocolat, bordée de beige brodé.', 'Robe longue couleur chocolat, bordée de bandes beige brodées sur toute la longueur. Une pièce élégante pour les cérémonies.', 14900, array['Taille unique']::text[], true, '[{"name":"Cacao","images":["/images/boutique/robe-longue-cacao-1-1.jpg","/images/boutique/robe-longue-cacao-1-2.jpg","/images/boutique/robe-longue-cacao-1-3.jpg"],"available":true}]'::jsonb, true, 24),
    ('robe-ambre', 'Robe Ambre', 'femme', 'Une robe longue orange cuivré, en tissu brillant.', 'Robe longue en tissu brillant orange cuivré, à porter avec des accessoires dorés pour les soirées et les défilés.', 15900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Ambre","images":["/images/boutique/robe-ambre-1-1.jpg","/images/boutique/robe-ambre-1-2.jpg","/images/boutique/robe-ambre-1-3.jpg"],"available":true}]'::jsonb, true, 25),
    ('robe-mimosa', 'Robe Mimosa', 'femme', 'Une robe longue jaune, légère et lumineuse.', 'Robe longue et ample, d''un jaune lumineux : l''été en Guinée, à porter du matin au soir.', 13900, array['Taille unique']::text[], true, '[{"name":"Jaune mimosa","images":["/images/boutique/robe-mimosa-1-1.jpg","/images/boutique/robe-mimosa-1-2.jpg"],"available":true}]'::jsonb, true, 26),
    ('ensemble-lilas', 'Ensemble Lilas', 'femme', 'Un grand ensemble en brocart lilas, pour les cérémonies.', 'Tunique ample et pantalon en brocart lilas aux reflets argentés : un ensemble de cérémonie confortable et remarqué.', 19900, array['Taille unique']::text[], true, '[{"name":"Lilas","images":["/images/boutique/ensemble-lilas-1-1.jpg","/images/boutique/ensemble-lilas-1-2.jpg","/images/boutique/ensemble-lilas-1-3.jpg"],"available":true}]'::jsonb, true, 27),
    ('robe-bardot-ebene', 'Robe Bardot Ébène', 'femme', 'Une robe longue noire, encolure bateau drapée.', 'Robe longue noire en tissu texturé, encolure drapée qui dégage les épaules. Chic, sobre et confortable.', 15900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Noir","images":["/images/boutique/robe-bardot-ebene-1-1.jpg","/images/boutique/robe-bardot-ebene-1-2.jpg","/images/boutique/robe-bardot-ebene-1-3.jpg","/images/boutique/robe-bardot-ebene-1-4.jpg"],"available":true}]'::jsonb, true, 28),
    ('robe-hibiscus', 'Robe Hibiscus', 'femme', 'Une robe asymétrique fleurie, épaule rouge drapée.', 'Robe imprimée de grandes fleurs rouges, épaule asymétrique drapée de rouge vif : une robe de fête qui ne passe pas inaperçue.', 16900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Rouge et blanc","images":["/images/boutique/robe-hibiscus-1-1.jpg","/images/boutique/robe-hibiscus-1-2.jpg","/images/boutique/robe-hibiscus-1-3.jpg","/images/boutique/robe-hibiscus-1-4.jpg"],"available":true}]'::jsonb, true, 29),
    ('robe-perle', 'Robe Perle', 'femme', 'Une robe longue blanche, épaules dénudées.', 'Robe longue et fluide, épaules dénudées et manches amples, dans un blanc lumineux : pour les cérémonies et les grandes occasions.', 14900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Blanc","images":["/images/boutique/robe-perle-1-1.jpg","/images/boutique/robe-perle-1-2.jpg","/images/boutique/robe-perle-1-3.jpg","/images/boutique/robe-perle-1-4.jpg"],"available":true}]'::jsonb, true, 30),
    ('robe-bougainvillier', 'Robe Bougainvillier', 'femme', 'Une robe longue imprimée rose et violet, épaule dénudée.', 'Robe longue et ample, imprimée de rose et de violet, épaule dénudée et manches larges : une robe de fête, légère et colorée.', 14900, array['Taille unique']::text[], true, '[{"name":"Rose et violet","images":["/images/boutique/robe-bougainvillier-1-1.jpg","/images/boutique/robe-bougainvillier-1-2.jpg"],"available":true}]'::jsonb, true, 31),
    ('ensemble-amethyste', 'Ensemble Améthyste', 'femme', 'Veste à manches bouffantes et pantalon, en tissu chatoyant.', 'Une veste ceinturée aux manches bouffantes et un pantalon droit, dans un tissu violet et bleu aux reflets changeants. Pour les réceptions.', 18900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Violet et bleu","images":["/images/boutique/ensemble-amethyste-1-1.jpg","/images/boutique/ensemble-amethyste-1-2.jpg","/images/boutique/ensemble-amethyste-1-3.jpg","/images/boutique/ensemble-amethyste-1-4.jpg"],"available":true}]'::jsonb, true, 32),
    ('tailleur-brocart-dore', 'Tailleur brocart doré', 'femme', 'Une veste en brocart doré et son pantalon large.', 'La veste courte en brocart doré se porte sur un pantalon large uni : un tailleur africain moderne, du bureau aux soirées.', 19900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Pantalon noir","images":["/images/boutique/tailleur-brocart-dore-1-1.jpg","/images/boutique/tailleur-brocart-dore-1-2.jpg","/images/boutique/tailleur-brocart-dore-1-3.jpg","/images/boutique/tailleur-brocart-dore-1-4.jpg","/images/boutique/tailleur-brocart-dore-1-5.jpg"],"available":true},{"name":"Pantalon chocolat","images":["/images/boutique/tailleur-brocart-dore-2-1.jpg","/images/boutique/tailleur-brocart-dore-2-2.jpg","/images/boutique/tailleur-brocart-dore-2-3.jpg"],"available":true}]'::jsonb, true, 33),
    ('kimono-long-madina', 'Kimono long Madina', 'femme', 'Le kimono long en pagne, en trois couleurs.', 'Kimono long et ample en pagne imprimé, à porter ouvert sur un ensemble uni. Trois couleurs au choix.', 12900, array['Taille unique']::text[], true, '[{"name":"Multicolore","images":["/images/boutique/kimono-long-madina-1-1.jpg"],"available":true},{"name":"Moutarde","images":["/images/boutique/kimono-long-madina-2-1.jpg"],"available":true},{"name":"Corail","images":["/images/boutique/kimono-long-madina-3-1.jpg"],"available":true}]'::jsonb, true, 34),
    ('boubou-orchidee', 'Boubou Orchidée', 'femme', 'Un boubou ample aux tons violets et verts.', 'Le boubou ample, aux tons violets et verts, se porte avec ou sans foulard : une pièce de fête, légère et colorée.', 16900, array['Taille unique']::text[], true, '[{"name":"Violet et vert","images":["/images/boutique/boubou-orchidee-1-1.jpg","/images/boutique/boubou-orchidee-1-2.jpg","/images/boutique/boubou-orchidee-1-3.jpg","/images/boutique/boubou-orchidee-1-4.jpg","/images/boutique/boubou-orchidee-1-5.jpg"],"available":true}]'::jsonb, true, 35),
    ('kimono-et-jupe-plissee', 'Kimono et jupe plissée', 'femme', 'Un kimono imprimé sur une jupe longue plissée assortie.', 'Le kimono à manches larges, imprimé, s''accorde à une jupe longue plissée de la même couleur. Un ensemble fluide et coloré.', 17900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Rose","images":["/images/boutique/kimono-et-jupe-plissee-1-1.jpg"],"available":true},{"name":"Orange","images":["/images/boutique/kimono-et-jupe-plissee-2-1.jpg"],"available":true},{"name":"Turquoise","images":["/images/boutique/kimono-et-jupe-plissee-3-1.jpg","/images/boutique/kimono-et-jupe-plissee-3-2.jpg"],"available":true},{"name":"Rouge","images":["/images/boutique/kimono-et-jupe-plissee-4-1.jpg","/images/boutique/kimono-et-jupe-plissee-4-2.jpg"],"available":true}]'::jsonb, true, 36),
    ('ensemble-peplum-et-pantalon-large', 'Ensemble péplum et pantalon large', 'femme', 'Un haut à basque et un pantalon large assorti, en cinq tissus.', 'Haut péplum aux manches structurées et pantalon large du même tissu : l''ensemble de cérémonie qui se décline en cinq couleurs.', 18900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Rouge","images":["/images/boutique/ensemble-peplum-et-pantalon-large-1-1.jpg","/images/boutique/ensemble-peplum-et-pantalon-large-1-2.jpg","/images/boutique/ensemble-peplum-et-pantalon-large-1-3.jpg"],"available":true},{"name":"Rose","images":["/images/boutique/ensemble-peplum-et-pantalon-large-2-1.jpg","/images/boutique/ensemble-peplum-et-pantalon-large-2-2.jpg"],"available":true},{"name":"Beige fleuri","images":["/images/boutique/ensemble-peplum-et-pantalon-large-3-1.jpg","/images/boutique/ensemble-peplum-et-pantalon-large-3-2.jpg"],"available":true},{"name":"Wax","images":["/images/boutique/ensemble-peplum-et-pantalon-large-4-1.jpg","/images/boutique/ensemble-peplum-et-pantalon-large-4-2.jpg"],"available":true},{"name":"Bleu","images":["/images/boutique/ensemble-peplum-et-pantalon-large-5-1.jpg"],"available":true}]'::jsonb, true, 37),
    ('jupe-longue-arc-en-ciel', 'Jupe longue Arc-en-ciel', 'femme', 'Une jupe longue et ample, aux couleurs vives.', 'Une jupe longue, ample et légère, aux couleurs vives, à porter avec un haut noir ou une veste courte.', 9900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Rose","images":["/images/boutique/jupe-longue-arc-en-ciel-1-1.jpg","/images/boutique/jupe-longue-arc-en-ciel-1-2.jpg","/images/boutique/jupe-longue-arc-en-ciel-1-3.jpg"],"available":true},{"name":"Bleu et rose","images":["/images/boutique/jupe-longue-arc-en-ciel-2-1.jpg","/images/boutique/jupe-longue-arc-en-ciel-2-2.jpg","/images/boutique/jupe-longue-arc-en-ciel-2-3.jpg"],"available":true},{"name":"Jaune","images":["/images/boutique/jupe-longue-arc-en-ciel-3-1.jpg","/images/boutique/jupe-longue-arc-en-ciel-3-2.jpg"],"available":true}]'::jsonb, true, 38),
    ('ensemble-kimono-raye', 'Ensemble kimono rayé', 'femme', 'Un pantalon fluide et un long kimono rayé à manches larges.', 'Un pantalon fluide et un long kimono ouvert à manches larges, bordé de rayures : un ensemble élégant qui accompagne chaque mouvement.', 19900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Bleu nuit","images":["/images/boutique/ensemble-kimono-raye-1-1.jpg","/images/boutique/ensemble-kimono-raye-1-2.jpg","/images/boutique/ensemble-kimono-raye-1-3.jpg"],"available":true},{"name":"Rose poudré","images":["/images/boutique/ensemble-kimono-raye-2-1.jpg","/images/boutique/ensemble-kimono-raye-2-2.jpg","/images/boutique/ensemble-kimono-raye-2-3.jpg","/images/boutique/ensemble-kimono-raye-2-4.jpg"],"available":true},{"name":"Ivoire et or","images":["/images/boutique/ensemble-kimono-raye-3-1.jpg"],"available":true}]'::jsonb, true, 39),
    ('kaftan-tisse-fouta', 'Kaftan tissé Fouta', 'femme', 'Un kaftan en pagne tissé à rayures, pompons à l''encolure.', 'Le kaftan droit, en pagne tissé à fines rayures, se ferme à l''encolure par deux pompons. Confortable, il se porte toute la journée.', 15900, array['Taille unique']::text[], true, '[{"name":"Vert","images":["/images/boutique/kaftan-tisse-fouta-1-1.jpg","/images/boutique/kaftan-tisse-fouta-1-2.jpg","/images/boutique/kaftan-tisse-fouta-1-3.jpg","/images/boutique/kaftan-tisse-fouta-1-4.jpg","/images/boutique/kaftan-tisse-fouta-1-5.jpg"],"available":true},{"name":"Bordeaux","images":["/images/boutique/kaftan-tisse-fouta-2-1.jpg","/images/boutique/kaftan-tisse-fouta-2-2.jpg"],"available":true}]'::jsonb, true, 40),
    ('ensemble-gilet-aso-oke', 'Ensemble gilet aso oke', 'femme', 'Un long gilet sans manches et son pantalon, en aso oke tissé.', 'Un haut long sans manches, type gilet, et un pantalon assorti, en aso oke tissé à rayures : chic, structuré et confortable.', 20900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Bordeaux rayé","images":["/images/boutique/ensemble-gilet-aso-oke-1-1.jpg","/images/boutique/ensemble-gilet-aso-oke-1-2.jpg","/images/boutique/ensemble-gilet-aso-oke-1-3.jpg"],"available":true},{"name":"Kaki","images":["/images/boutique/ensemble-gilet-aso-oke-2-1.jpg","/images/boutique/ensemble-gilet-aso-oke-2-2.jpg","/images/boutique/ensemble-gilet-aso-oke-2-3.jpg"],"available":true}]'::jsonb, true, 41),
    ('chemise-bicolore-conakry', 'Chemise bicolore Conakry', 'homme', 'Une chemise longue à empiècements contrastés.', 'Chemise longue à empiècements contrastés, col droit et poignets marqués : une pièce graphique, à porter sur un pantalon clair ou à motifs.', 8900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Noir et blanc","images":["/images/boutique/chemise-bicolore-conakry-1-1.jpg","/images/boutique/chemise-bicolore-conakry-1-2.jpg","/images/boutique/chemise-bicolore-conakry-1-3.jpg"],"available":true},{"name":"Brun et crème","images":["/images/boutique/chemise-bicolore-conakry-2-1.jpg","/images/boutique/chemise-bicolore-conakry-2-2.jpg","/images/boutique/chemise-bicolore-conakry-2-3.jpg","/images/boutique/chemise-bicolore-conakry-2-4.jpg"],"available":true}]'::jsonb, true, 42),
    ('chemise-zigzag-kente', 'Chemise Zigzag kente', 'homme', 'Une chemise aux zigzags colorés, col mao.', 'Chemise à col mao, imprimée de zigzags colorés inspirés du kente. Elle se porte sur un pantalon blanc ou gris pour la mettre en valeur.', 9500, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Multicolore","images":["/images/boutique/chemise-zigzag-kente-1-1.jpg","/images/boutique/chemise-zigzag-kente-1-2.jpg","/images/boutique/chemise-zigzag-kente-1-3.jpg","/images/boutique/chemise-zigzag-kente-1-4.jpg","/images/boutique/chemise-zigzag-kente-1-5.jpg","/images/boutique/chemise-zigzag-kente-1-6.jpg"],"available":true}]'::jsonb, true, 43),
    ('pantalon-homme-a-motifs', 'Pantalon homme à motifs', 'homme', 'Un pantalon droit en tissu à motifs, en trois couleurs.', 'Pantalon droit et confortable, coupé dans un tissu à motifs, à porter avec un débardeur ou une chemise unie.', 6900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Bogolan","images":["/images/boutique/pantalon-homme-a-motifs-1-1.jpg","/images/boutique/pantalon-homme-a-motifs-1-2.jpg"],"available":true},{"name":"Turquoise","images":["/images/boutique/pantalon-homme-a-motifs-2-1.jpg","/images/boutique/pantalon-homme-a-motifs-2-2.jpg","/images/boutique/pantalon-homme-a-motifs-2-3.jpg","/images/boutique/pantalon-homme-a-motifs-2-4.jpg"],"available":true},{"name":"Noir et blanc","images":["/images/boutique/pantalon-homme-a-motifs-3-1.jpg","/images/boutique/pantalon-homme-a-motifs-3-2.jpg","/images/boutique/pantalon-homme-a-motifs-3-3.jpg","/images/boutique/pantalon-homme-a-motifs-3-4.jpg"],"available":true}]'::jsonb, true, 44),
    ('veste-kente-a-franges', 'Veste kente à franges', 'homme', 'Une veste en pagne tissé à rayures, bords à franges.', 'Une veste ample en pagne tissé à rayures chaudes, terminée de franges aux manches : la pièce forte d''une tenue simple.', 13900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Rayures chaudes","images":["/images/boutique/veste-kente-a-franges-1-1.jpg","/images/boutique/veste-kente-a-franges-1-2.jpg","/images/boutique/veste-kente-a-franges-1-3.jpg","/images/boutique/veste-kente-a-franges-1-4.jpg","/images/boutique/veste-kente-a-franges-1-5.jpg"],"available":true}]'::jsonb, true, 45),
    ('veste-patchwork-homme', 'Veste patchwork homme', 'homme', 'Une veste en patchwork de tissus rayés et unis.', 'Une veste droite en patchwork de tissus rayés et unis, à porter sur une chemise blanche et un pantalon droit.', 12900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Bleu et brun","images":["/images/boutique/veste-patchwork-homme-1-1.jpg","/images/boutique/veste-patchwork-homme-1-2.jpg","/images/boutique/veste-patchwork-homme-1-3.jpg","/images/boutique/veste-patchwork-homme-1-4.jpg","/images/boutique/veste-patchwork-homme-1-5.jpg"],"available":true}]'::jsonb, true, 46),
    ('ensemble-chemise-et-pantalon-wax', 'Ensemble chemise et pantalon wax', 'homme', 'Une chemise unie à poche en wax et son pantalon imprimé.', 'Chemise ample unie, poche en wax, et pantalon droit imprimé du même tissu : un ensemble décontracté et soigné.', 14900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Chemise moutarde","images":["/images/boutique/ensemble-chemise-et-pantalon-wax-1-1.jpg","/images/boutique/ensemble-chemise-et-pantalon-wax-1-2.jpg","/images/boutique/ensemble-chemise-et-pantalon-wax-1-3.jpg"],"available":true},{"name":"Chemise noire","images":["/images/boutique/ensemble-chemise-et-pantalon-wax-2-1.jpg","/images/boutique/ensemble-chemise-et-pantalon-wax-2-2.jpg","/images/boutique/ensemble-chemise-et-pantalon-wax-2-3.jpg","/images/boutique/ensemble-chemise-et-pantalon-wax-2-4.jpg"],"available":true}]'::jsonb, true, 47),
    ('cape-tissee-homme', 'Cape tissée homme', 'homme', 'La grande cape en pagne tissé, à poser sur une tenue simple.', 'Une cape ample en pagne tissé à rayures, à porter ouverte sur un jean et une chemise : l''allure d''un boubou, la liberté d''une veste.', 15900, array['Taille unique']::text[], true, '[{"name":"Bleu et rouge","images":["/images/boutique/cape-tissee-homme-1-1.jpg","/images/boutique/cape-tissee-homme-1-2.jpg","/images/boutique/cape-tissee-homme-1-3.jpg"],"available":true},{"name":"Bleu et blanc","images":["/images/boutique/cape-tissee-homme-2-1.jpg","/images/boutique/cape-tissee-homme-2-2.jpg","/images/boutique/cape-tissee-homme-2-3.jpg"],"available":true},{"name":"Orange","images":["/images/boutique/cape-tissee-homme-3-1.jpg"],"available":true},{"name":"Ivoire et or","images":["/images/boutique/cape-tissee-homme-4-1.jpg"],"available":true},{"name":"Noir et or","images":["/images/boutique/cape-tissee-homme-5-1.jpg"],"available":true}]'::jsonb, true, 48),
    ('ensemble-aso-oke-tamara', 'Ensemble aso oke Tamara', 'homme', 'Chemise à manches longues et pantalon en aso oke tissé.', 'Une chemise à manches longues et un pantalon assorti en aso oke tissé à rayures, avec sa toque : l''ensemble de cérémonie pour homme.', 18900, array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[], true, '[{"name":"Rayures brunes","images":["/images/boutique/ensemble-aso-oke-tamara-1-1.jpg","/images/boutique/ensemble-aso-oke-tamara-1-2.jpg","/images/boutique/ensemble-aso-oke-tamara-1-3.jpg"],"available":true}]'::jsonb, true, 49)
    ) as v (slug, name, category, tagline, description, price_cents, sizes, custom_made, variants, published, sort_order)
    where not exists (select 1 from public.articles a where a.slug = v.slug);
    insert into public.contenus_importes (cle) values ('0013_articles_cliente');
  end if;

  -- Livres d'exemple : sans vrai PDF (« exemple.pdf » n'existe pas), à ne pas vendre.
  if not exists (select 1 from public.contenus_importes where cle = '0013_livres_exemple') then
    insert into public.livres
      (title, subtitle, author, kind, description, price_cents, pages, language, file_path, published, sort_order)
    values
    ('Guide de la Guinée : l''essentiel pour un premier voyage', 'Formalités, budget, saisons et itinéraires de 7 à 15 jours.', 'SYSI TRAVEL', 'guide', 'Formalités, budget, saisons et itinéraires de 7 à 15 jours.' || chr(10) || '' || chr(10) || 'Livre d''exemple, pour voir comment la boutique présente un ouvrage : à supprimer dans Administration › Livres & guides avant de vendre de vrais livres.', 990, 64, 'Français', 'exemple.pdf', true, 100),
    ('Conakry pas à pas', 'Quartiers, marchés, plages et adresses de la capitale.', 'SYSI TRAVEL', 'guide', 'Quartiers, marchés, plages et adresses de la capitale.' || chr(10) || '' || chr(10) || 'Livre d''exemple, pour voir comment la boutique présente un ouvrage : à supprimer dans Administration › Livres & guides avant de vendre de vrais livres.', 690, 38, 'Français', 'exemple.pdf', true, 101),
    ('Le Fouta-Djalon, château d''eau de l''Afrique de l''Ouest', 'Randonnées, cascades et villages des hauts plateaux.', 'SYSI TRAVEL', 'guide', 'Randonnées, cascades et villages des hauts plateaux.' || chr(10) || '' || chr(10) || 'Livre d''exemple, pour voir comment la boutique présente un ouvrage : à supprimer dans Administration › Livres & guides avant de vendre de vrais livres.', 890, 52, 'Français', 'exemple.pdf', true, 102),
    ('Cuisine de Guinée : 40 recettes de famille', 'Sauce feuille, riz gras, fonio et douceurs.', 'SYSI TRAVEL', 'livre', 'Sauce feuille, riz gras, fonio et douceurs.' || chr(10) || '' || chr(10) || 'Livre d''exemple, pour voir comment la boutique présente un ouvrage : à supprimer dans Administration › Livres & guides avant de vendre de vrais livres.', 1290, 96, 'Français', 'exemple.pdf', true, 103),
    ('Héros et grandes figures de l''histoire guinéenne', 'Des royaumes anciens à l''indépendance.', 'SYSI TRAVEL', 'livre', 'Des royaumes anciens à l''indépendance.' || chr(10) || '' || chr(10) || 'Livre d''exemple, pour voir comment la boutique présente un ouvrage : à supprimer dans Administration › Livres & guides avant de vendre de vrais livres.', 1190, 120, 'Français', 'exemple.pdf', true, 104),
    ('Parler soussou, poular et malinké en voyage', 'Les mots et expressions utiles au quotidien.', 'SYSI TRAVEL', 'guide', 'Les mots et expressions utiles au quotidien.' || chr(10) || '' || chr(10) || 'Livre d''exemple, pour voir comment la boutique présente un ouvrage : à supprimer dans Administration › Livres & guides avant de vendre de vrais livres.', 590, 32, 'Français', 'exemple.pdf', true, 105);
    insert into public.contenus_importes (cle) values ('0013_livres_exemple');
  end if;
end;
$import$;
