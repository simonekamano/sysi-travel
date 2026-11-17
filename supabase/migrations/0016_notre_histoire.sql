-- Page « Notre histoire » (/notre-histoire) : la fondatrice, l'histoire de SYSI TRAVEL Guinée et
-- l'accompagnement avant, pendant et après le voyage. Une seule page, dont la Cliente modifie
-- les textes et les photos dans Administration › Notre histoire.
--
-- Le récit suit une mise en forme simple : « ## Titre » pour chaque partie, une ligne vide entre
-- deux paragraphes, *texte en italique* pour une phrase mise en avant.
-- Idempotent : rejouée à chaque déploiement, sans jamais écraser un texte modifié.

create table if not exists public.notre_histoire (
  id boolean primary key default true check (id),
  titre text not null check (char_length(titre) between 1 and 120),
  role text not null default '' check (char_length(role) <= 120),
  accroche text not null default '' check (char_length(accroche) <= 300),
  signature text not null default '' check (char_length(signature) <= 120),
  photo_portrait text not null default '' check (char_length(photo_portrait) <= 2000),
  photo_recit_1 text not null default '' check (char_length(photo_recit_1) <= 2000),
  photo_recit_2 text not null default '' check (char_length(photo_recit_2) <= 2000),
  recit text not null default '' check (char_length(recit) <= 30000),
  avant text not null default '' check (char_length(avant) <= 1000),
  pendant text not null default '' check (char_length(pendant) <= 1000),
  apres text not null default '' check (char_length(apres) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists touch_updated_at on public.notre_histoire;
create trigger touch_updated_at before update on public.notre_histoire
  for each row execute function public.touch_updated_at();

alter table public.notre_histoire enable row level security;

drop policy if exists "lecture publique" on public.notre_histoire;
create policy "lecture publique" on public.notre_histoire
  for select to anon, authenticated
  using (true);

-- La page est unique : l'administration modifie ses textes, sans en ajouter ni en supprimer.
drop policy if exists "modification admin" on public.notre_histoire;
create policy "modification admin" on public.notre_histoire
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.notre_histoire to anon, authenticated;
grant update (titre, role, accroche, signature, photo_portrait, photo_recit_1, photo_recit_2, recit, avant, pendant, apres)
  on public.notre_histoire to authenticated;

-- Les textes de la Cliente (17 novembre 2026).
insert into public.notre_histoire
  (titre, role, accroche, signature, photo_portrait, photo_recit_1, photo_recit_2, recit, avant, pendant, apres)
values (
  $t$Bonjour, moi c'est Simone.$t$,
  $t$Fondatrice de SYSI TRAVEL Guinée$t$,
  $t$Une femme, une mère, une Guinéenne profondément attachée à ses racines.$t$,
  $t$Simone Nèma KAMANO$t$,
  '/images/notre-histoire/simone-fondatrice.jpg',
  '/images/notre-histoire/simone-paris.jpg',
  '/images/notre-histoire/simone-carnet.jpg',
  $md$
Je m'appelle *Simone Nèma KAMANO*.

Je suis née et j'ai grandi en Guinée, ce magnifique pays d'Afrique de l'Ouest qui occupe une place particulière dans mon cœur.

À l'âge de 12 ans, j'ai quitté ma terre natale pour venir vivre en France.

J'ai grandi, étudié, construit ma vie et fondé ma famille loin du pays qui m'a vue naître.

Mais malgré les années et la distance, *une partie de moi est toujours restée en Guinée.*

## 19 ans plus tard, le retour qui a tout changé

Après 19 années passées loin de mon pays, j'ai enfin eu l'occasion d'y retourner.

Je pensais simplement retrouver des lieux familiers, revoir des visages et renouer avec mes souvenirs d'enfance.

Mais ce voyage a été bien plus profond que je ne l'imaginais.

J'ai retrouvé une Guinée qui avait changé. Des endroits que je reconnaissais à peine, des paysages qui réveillaient mes souvenirs, une culture que je connaissais et que j'avais pourtant besoin de redécouvrir.

J'ai ressenti de la joie, de la nostalgie, de l'émerveillement, mais aussi une prise de conscience.

*On peut aimer profondément son pays d'origine et, avec le temps, avoir le sentiment de ne plus vraiment le connaître.*

Et je me suis posé une question :

Comment transmettre à mes enfants un pays que je dois moi-même réapprendre à découvrir ?

## Mes enfants, ma plus grande source d'inspiration

Aujourd'hui, je suis maman de deux enfants.

Comme beaucoup de parents de la diaspora, je souhaite qu'ils grandissent en sachant d'où ils viennent.

Je veux qu'ils découvrent la Guinée autrement qu'à travers des photographies, des vidéos ou les récits de leurs parents.

Je veux qu'ils puissent entendre ses langues, découvrir ses traditions, rencontrer ses habitants, comprendre son histoire, admirer ses paysages et se sentir liés à cette terre qui fait aussi partie de leur identité.

Je veux qu'ils sachent que leurs racines ne s'arrêtent pas aux frontières du pays dans lequel ils grandissent.

*Parce que je crois profondément qu'un enfant qui connaît ses origines possède une richesse qu'aucune distance ne peut lui enlever.*

C'est en pensant à eux, mais aussi à toutes les familles qui vivent cette même réalité, que l'idée de SYSI TRAVEL Guinée a commencé à prendre forme.

## Pourquoi j'ai créé SYSI TRAVEL Guinée

SYSI TRAVEL Guinée est née d'un désir simple : *créer un pont entre la Guinée et celles et ceux qui souhaitent la découvrir, la retrouver ou y construire une partie de leur avenir.*

Je pense à cette femme qui a quitté la Guinée depuis vingt ans et qui rêve d'y retourner, mais ne sait plus par où commencer.

À ce père qui aimerait faire découvrir son village natal à ses enfants.

À ces jeunes nés en Europe, en Amérique ou ailleurs, qui connaissent la Guinée à travers leurs parents, mais qui souhaitent enfin vivre leur propre expérience.

À ces voyageurs curieux de découvrir un pays riche de ses cultures, de son histoire et de ses paysages.

Et à ces membres de la diaspora qui envisagent de revenir s'installer ou d'investir dans leur pays d'origine.

*Je veux que chacun puisse trouver, à travers SYSI TRAVEL Guinée, une porte d'entrée vers une Guinée à découvrir et à aimer.*

## Bien plus qu'une agence de voyages

À travers SYSI TRAVEL Guinée, je souhaite proposer une expérience qui commence bien avant le départ et qui continue après le retour.

Des livres et des guides pour comprendre le pays.

Des récits et des découvertes culturelles pour éveiller la curiosité.

Des circuits et des excursions pour explorer ses richesses, avec l'appui de partenaires locaux.

Des ressources pratiques pour préparer son séjour, envisager une installation ou mieux connaître les réalités du pays.

Et surtout, une approche humaine qui prend en compte l'histoire, les attentes et les envies de chaque personne.

Car derrière chaque voyage, il y a parfois un rêve, une question, un souvenir ou une histoire familiale qui attend de retrouver sa place.

## Les valeurs qui me guident

Je crois en la famille, en la transmission, en l'authenticité, au respect des cultures et à la richesse des rencontres humaines.

Je crois aussi que nos origines ne doivent jamais être une limite, mais une force.

Ma foi en Dieu fait partie de mon histoire. Je suis reconnaissante envers Jésus-Christ pour le chemin parcouru, les personnes qui m'ont accompagnée et la possibilité de donner vie à ce projet qui me tient profondément à cœur.

Je ne prétends pas tout connaître de la Guinée.

Au contraire, je continue moi aussi à la découvrir, à apprendre et à m'émerveiller.

Et c'est peut-être ce qui nous rapproche déjà.

*Nous avons tous quelque chose à découvrir, à retrouver ou à transmettre.*

## Et si nous écrivions la suite ensemble ?

Que tu sois né en Guinée ou ailleurs, que tu y sois retourné récemment ou que tu rêves d'y aller pour la première fois, je veux te dire une chose :

*Tu as toute ta place dans cette aventure.*

Tu n'as pas besoin de tout connaître de la Guinée pour commencer à la découvrir.

Tu n'as pas besoin d'y avoir grandi pour ressentir le désir de t'en rapprocher.

Et tu n'as pas besoin d'attendre le moment parfait pour commencer à explorer ton histoire.

Alors, bienvenue dans mon univers.

Bienvenue chez *SYSI TRAVEL Guinée*.

Bien plus qu'un voyage, un retour à ses racines, une histoire à transmettre, un avenir à construire.
$md$,
  $t$Un entretien pour comprendre l'histoire du voyageur, sa région familiale d'origine, les lieux qu'il souhaite découvrir et ce qu'il aimerait transmettre à ses enfants.$t$,
  $t$Des rencontres culturelles authentiques, des explications historiques adaptées aux adultes et aux enfants, et des temps de découverte qui ne soient pas uniquement touristiques.$t$,
  $t$Un carnet de souvenirs personnalisé, des photographies autorisées et des ressources pour continuer à découvrir la Guinée.$t$
)
on conflict (id) do nothing;
