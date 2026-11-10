-- Pages légales (ORDRE n° 16) : mentions légales, conditions générales de vente, politique de
-- confidentialité et politique de remboursement. Quatre pages fixes dont la Cliente modifie le
-- texte dans Administration › Pages légales.
--
-- Le texte suit une mise en forme simple (« ## Titre », « - liste », « **gras** »,
-- « [lien](/adresse) »). Les passages entre [[ ]] sont à compléter par la Cliente : une page qui en
-- contient encore ne peut pas être publiée. Les quatre brouillons ci-dessous ne sont donc visibles
-- sur le site qu'une fois relus, complétés et publiés par la Cliente.
-- Idempotent : rejouée à chaque déploiement, sans jamais écraser un texte modifié.

create table if not exists public.pages_legales (
  slug text primary key check (slug in ('mentions-legales', 'conditions-generales-de-vente', 'confidentialite', 'remboursement')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 60000),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_legales_publiee_complete check (not published or position('[[' in body) = 0)
);

drop trigger if exists touch_updated_at on public.pages_legales;
create trigger touch_updated_at before update on public.pages_legales
  for each row execute function public.touch_updated_at();

alter table public.pages_legales enable row level security;

drop policy if exists "lecture des pages publiees" on public.pages_legales;
create policy "lecture des pages publiees" on public.pages_legales
  for select to anon, authenticated
  using (published or public.is_admin());

-- Les quatre pages sont fixes : l'administration modifie leur texte, sans en ajouter ni en supprimer.
drop policy if exists "modification admin" on public.pages_legales;
create policy "modification admin" on public.pages_legales
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.pages_legales to anon, authenticated;
grant update (body, published) on public.pages_legales to authenticated;

-- Brouillons de départ, à faire valider par la Cliente.
insert into public.pages_legales (slug, title, body) values
('mentions-legales', 'Mentions légales', $md$
## Éditeur du site

Le site **sysitravel.com** est édité par [[nom de l'entreprise et forme juridique, par exemple « SYSI TRAVEL Guinée SARLU »]].

- Siège : [[adresse complète du siège]]
- Immatriculation : [[numéro RCCM en Guinée, ou numéro SIREN en France]]
- Numéro fiscal : [[NIF en Guinée ou numéro de TVA en France ; supprimez cette ligne s'il n'y en a pas]]
- Téléphone et WhatsApp : +33 6 41 96 01 01
- E-mail : [simone.kamano@yahoo.fr](mailto:simone.kamano@yahoo.fr)

Directrice de la publication : Simone KAMANO.

## Hébergement

Le site et ses données sont hébergés sur un serveur situé à Francfort (Allemagne), loué auprès de **Hostinger International Ltd**, 61 Lordou Vironos, 6023 Larnaca, Chypre ([www.hostinger.fr](https://www.hostinger.fr)).

## Conception et réalisation

Kelenix Tech.

## Propriété intellectuelle

Les textes, photos, vidéos, logos, la charte graphique et la structure du site sont protégés par le droit d'auteur et le droit des marques. Ils appartiennent à SYSI TRAVEL ou à leurs auteurs, qui en ont autorisé l'utilisation. Toute reproduction, totale ou partielle, sans autorisation écrite est interdite.

Les fonds de carte proviennent d'[OpenStreetMap](https://www.openstreetmap.org/copyright) et de ses contributeurs, et d'[OpenFreeMap](https://openfreemap.org).

## Liens vers d'autres sites

Le site contient des liens vers d'autres sites : réseaux sociaux, WhatsApp, YouTube, partenaires. SYSI TRAVEL n'a aucun contrôle sur leur contenu et n'en est pas responsable.

La section « Opportunité business » renvoie vers le programme MWR Life. Ces liens ont un caractère commercial : SYSI TRAVEL peut être rémunérée lorsque vous rejoignez ce programme par leur intermédiaire.

## Responsabilité

Les informations du site (sites touristiques, circuits, prix, formalités) sont données à titre indicatif et mises à jour régulièrement. Seuls le devis et la confirmation écrite de votre séjour engagent SYSI TRAVEL. Pour les formalités d'entrée en Guinée (passeport, visa, vaccins), vérifiez toujours auprès des autorités avant votre départ.

## Données personnelles

L'utilisation de vos données est décrite dans notre [politique de confidentialité](/confidentialite).

## Contact

Pour toute question sur le site : [simone.kamano@yahoo.fr](mailto:simone.kamano@yahoo.fr) ou +33 6 41 96 01 01 (WhatsApp).
$md$),

('conditions-generales-de-vente', 'Conditions générales de vente', $md$
Les présentes conditions générales de vente (CGV) s'appliquent à toute réservation de voyage et à toute commande passée auprès de SYSI TRAVEL, sur le site sysitravel.com, par e-mail, par téléphone ou par WhatsApp. Réserver ou commander vaut acceptation des CGV en vigueur à cette date.

## 1. Le vendeur

SYSI TRAVEL Guinée, dont l'identité complète figure dans les [mentions légales](/mentions-legales).

- Licence d'agence de voyage, garantie financière et assurance de responsabilité civile professionnelle : [[numéro de licence ou d'agrément, nom du garant et de l'assureur, numéros de contrat]]
- Contact : [simone.kamano@yahoo.fr](mailto:simone.kamano@yahoo.fr) ou +33 6 41 96 01 01 (WhatsApp), du lundi au samedi de 9 h à 19 h (GMT).

## 2. Les services

- séjours sur mesure et voyages accompagnés en Guinée ;
- circuits, excursions et visites guidées ;
- prise en charge à l'aéroport de Conakry, sur demande ;
- livres et guides numériques (PDF), vendus dans la [boutique](/boutique).

Les vols internationaux ne sont pas inclus, sauf mention contraire sur le devis.

Les photos et les descriptions du site présentent les lieux et les prestations de bonne foi. Le contenu exact de votre séjour est celui du devis que vous acceptez.

## 3. Devis et réservation d'un voyage

1. Vous envoyez votre demande par le formulaire du site ou par WhatsApp. Elle ne vous engage pas.
2. Sous 72 heures, SYSI TRAVEL vous propose un itinéraire et un devis écrit : programme, prestations incluses et non incluses, prix, échéances de paiement et conditions d'annulation. Le devis indique sa durée de validité.
3. La réservation est ferme lorsque vous acceptez le devis par écrit (e-mail ou WhatsApp) et que l'acompte est reçu. SYSI TRAVEL vous la confirme alors par écrit.

## 4. Prix

Les prix sont indiqués en euros, toutes taxes comprises. Les prix affichés sur le site (formules, circuits) sont donnés à titre indicatif : seul le prix du devis accepté fait foi.

Sauf mention sur le devis, ne sont pas compris : les vols internationaux, les frais de visa et de vaccination, les assurances, les dépenses personnelles et les pourboires.

Une fois la réservation confirmée, le prix ne peut changer qu'en cas de hausse des taxes ou du coût du carburant imposée par un tiers, que nous vous justifions, et jamais dans les 20 jours qui précèdent le départ.

## 5. Paiement

- Un acompte de 30 % du prix est versé à la réservation.
- Le solde est réglé au plus tard 15 jours avant le départ. Pour une réservation faite moins de 15 jours avant le départ, le prix total est payé à la réservation.
- Moyens de paiement acceptés : [[moyens de paiement acceptés, par exemple virement bancaire, Orange Money, carte bancaire en ligne]]

Chaque paiement est confirmé par écrit. Si le solde n'est pas réglé à la date prévue, SYSI TRAVEL peut annuler la réservation, avec les frais prévus à l'article 7.

## 6. Modification et cession par le voyageur

Vous pouvez demander à modifier votre séjour (dates, programme, nombre de voyageurs). SYSI TRAVEL vous répond selon les disponibilités de ses partenaires et vous indique les frais éventuels avant que vous n'acceptiez la modification.

Vous pouvez céder votre voyage à une autre personne qui remplit les mêmes conditions, en nous prévenant au moins 7 jours avant le départ. Les frais éventuels de cette cession vous sont facturés.

## 7. Annulation par le voyageur

Vous pouvez annuler votre voyage à tout moment, par écrit (e-mail ou WhatsApp). Les frais d'annulation dépendent de la date à laquelle nous recevons votre annulation :

[[barème des frais d'annulation, par exemple : plus de 60 jours avant le départ, 10 % du prix ; de 60 à 31 jours, 30 % ; de 30 à 15 jours, 50 % ; moins de 15 jours, 100 %]]

Le devis peut prévoir des conditions particulières (billet non remboursable, hébergement en haute saison…) : elles s'appliquent alors à la place de ce barème.

Aucun frais n'est dû si des circonstances exceptionnelles et inévitables survenant à destination (catastrophe naturelle, conflit, épidémie, décision des autorités) empêchent le voyage.

Les remboursements suivent notre [politique de remboursement](/remboursement).

## 8. Annulation ou modification par SYSI TRAVEL

Si SYSI TRAVEL doit annuler votre voyage, vous êtes remboursé de toutes les sommes versées, au plus tard 14 jours après l'annulation.

Si un élément essentiel de votre voyage doit changer avant le départ, nous vous prévenons au plus vite : vous pouvez accepter la modification ou annuler sans frais.

Si une prestation prévue ne peut pas être fournie pendant le séjour, nous vous proposons une solution équivalente sans supplément, ou nous vous remboursons la différence.

## 9. Formalités, santé et assurance

- Il vous appartient d'avoir des documents en règle : passeport valable, visa pour la Guinée et vaccins exigés, notamment contre la fièvre jaune.
- SYSI TRAVEL vous informe des formalités en vigueur au moment du devis. Elle n'est pas responsable d'un refus d'embarquement ou d'entrée dû à un document manquant.
- Nous vous conseillons vivement une assurance voyage couvrant l'annulation, les frais médicaux et le rapatriement.

## 10. Pendant le séjour

Un interlocuteur SYSI TRAVEL est joignable pendant tout votre séjour. Signalez-nous sans attendre tout problème sur place : nous pourrons y remédier plus facilement.

## 11. Responsabilité

SYSI TRAVEL est responsable de la bonne exécution des prestations prévues au devis, qu'elle les assure elle-même ou par ses partenaires. Sa responsabilité n'est pas engagée lorsque le dommage est dû au voyageur, à un tiers étranger aux prestations ou à des circonstances exceptionnelles et inévitables. Les activités que vous réservez vous-même sur place ne relèvent pas de SYSI TRAVEL.

## 12. Livres et guides numériques

- **Commande** : vous choisissez vos livres dans la [boutique](/boutique) et vous commandez depuis votre panier. Rien n'est payé sur le site : nous vous contactons sous 72 heures pour le paiement.
- **Prix** : en euros, toutes taxes comprises, indiqué sur chaque fiche ; le prix retenu est celui affiché au moment de la commande.
- **Livraison** : dès le paiement reçu, vous recevez par e-mail un lien de téléchargement personnel, valable 30 jours et pour 30 téléchargements. Sur simple demande, nous vous en renvoyons un nouveau.
- **Droit de rétractation** : les livres numériques sont fournis dès le paiement reçu. En commandant, vous demandez cette fourniture immédiate et renoncez expressément à votre droit de rétractation de 14 jours, comme la loi le permet pour les contenus numériques.
- **Utilisation** : les fichiers sont réservés à votre usage personnel. Vous ne pouvez pas les copier pour d'autres personnes, les revendre ni les publier.
- **Fichier défectueux** : si un fichier ne s'ouvre pas ou est incomplet, écrivez-nous : nous le remplaçons ou nous vous remboursons.

## 13. Réclamations et médiation

Toute réclamation est à adresser par écrit à [simone.kamano@yahoo.fr](mailto:simone.kamano@yahoo.fr), de préférence dans les 30 jours qui suivent la fin du séjour. Nous vous répondons sous 30 jours.

[[médiateur de la consommation : obligatoire si l'entreprise est établie en France, par exemple Médiation Tourisme et Voyage (www.mtv.travel) ; sinon, supprimez ce paragraphe]]

## 14. Données personnelles

Vos données sont traitées comme l'explique notre [politique de confidentialité](/confidentialite).

## 15. Droit applicable et litiges

Les présentes CGV sont soumises au [[droit applicable et tribunaux compétents, par exemple « droit guinéen ; tribunaux de Conakry », ou « droit français ; tribunaux de … » si l'entreprise est établie en France]]. En cas de litige, une solution amiable est recherchée avant toute action en justice. Si vous résidez dans l'Union européenne, vous gardez la protection des règles impératives de votre pays de résidence et pouvez saisir les tribunaux de votre domicile.
$md$),

('confidentialite', 'Politique de confidentialité', $md$
Cette politique explique quelles données personnelles SYSI TRAVEL recueille sur sysitravel.com, pourquoi, combien de temps elle les conserve et comment exercer vos droits. Elle suit le Règlement général sur la protection des données (RGPD), qui protège notamment les voyageurs résidant dans l'Union européenne.

## 1. Qui est responsable de vos données ?

SYSI TRAVEL Guinée, représentée par Simone KAMANO, dont les coordonnées complètes figurent dans les [mentions légales](/mentions-legales).

Pour toute question sur vos données : [simone.kamano@yahoo.fr](mailto:simone.kamano@yahoo.fr).

## 2. Quelles données, et pourquoi ?

**Demande de voyage ou de contact** (formulaire « Recevoir mon itinéraire ») : nom, e-mail, téléphone ou WhatsApp, pays de résidence, destination, formule, période, nombre de voyageurs, message et, si vous demandez la prise en charge à l'aéroport, votre arrivée (date, heure, vol) et votre lieu de séjour. Elles servent à vous répondre, à préparer votre itinéraire et votre devis, puis à organiser votre séjour.

**Commande de livres et guides** : nom, e-mail, téléphone (facultatif), livres commandés et montant, puis la date du paiement et le nombre de téléchargements. Elles servent à traiter votre commande, à vous envoyer votre lien de téléchargement et à tenir la comptabilité.

**Compte sur le site** : si vous en créez un, votre nom, votre e-mail et votre mot de passe, enregistré sous forme chiffrée.

**Messages WhatsApp, e-mails et appels** : ce que vous choisissez de nous écrire, pour vous répondre.

**Données techniques** : comme tout serveur web, le nôtre enregistre l'adresse IP, la page demandée, la date et le navigateur de chaque visite. Ces journaux servent à la sécurité du site (lutte contre les abus et le spam) et à la correction des pannes.

Le site ne demande jamais vos coordonnées bancaires. Vos données ne sont ni vendues ni utilisées pour de la publicité.

## 3. Sur quelle base ?

- Vos demandes et commandes : les mesures prises à votre demande avant un contrat, puis l'exécution du contrat (RGPD, article 6.1.b).
- La comptabilité : nos obligations légales (article 6.1.c).
- La sécurité du site : notre intérêt légitime à protéger le service (article 6.1.f).

## 4. Qui reçoit vos données ?

- L'équipe SYSI TRAVEL, qui traite votre demande.
- Les partenaires locaux qui réalisent votre séjour (guides, chauffeurs, hébergements), uniquement pour les informations utiles à leur prestation : par exemple, votre nom et votre heure d'arrivée pour le chauffeur.
- Nos prestataires techniques, qui agissent sur nos instructions :
  - **Hostinger**, serveur situé à Francfort (Allemagne) : hébergement du site et de sa base de données ;
  - **Resend**, aux États-Unis : envoi des e-mails du site (accusés de réception, liens de téléchargement). Ce transfert hors de l'Union européenne est encadré par les clauses contractuelles types de la Commission européenne.
- Les autorités, uniquement si la loi l'exige.

## 5. Combien de temps ?

- Demandes de voyage sans suite : 3 ans après notre dernier échange.
- Dossiers de voyage et commandes : le temps de la relation, puis 10 ans pour les pièces comptables.
- Comptes sur le site : jusqu'à leur suppression, à votre demande.
- Journaux techniques du serveur : 14 jours.
- Sauvegardes de la base de données : 14 jours.

## 6. Cookies et stockage dans votre navigateur

Le site n'utilise ni cookie publicitaire ni outil de mesure d'audience. Il enregistre seulement dans votre navigateur :

- le contenu de votre panier de livres, pour le retrouver d'une page à l'autre ;
- votre connexion, si vous vous connectez à un compte.

Ces éléments sont nécessaires au fonctionnement du site : ils ne demandent pas de consentement, et vous pouvez les effacer à tout moment depuis les réglages de votre navigateur.

## 7. Services extérieurs affichés sur le site

Certains contenus viennent d'autres services, qui reçoivent alors votre adresse IP :

- **Vidéos** : le lecteur YouTube (en mode « confidentialité renforcée ») ou Vimeo ne se charge que lorsque vous cliquez sur Lecture. Les images d'aperçu des vidéos YouTube viennent des serveurs de YouTube.
- **Cartes** : les fonds de carte sont chargés depuis OpenStreetMap et OpenFreeMap.
- **WhatsApp et réseaux sociaux** : en suivant ces liens, vous quittez le site ; la politique de confidentialité de ces services s'applique.

## 8. Vos droits

Vous pouvez à tout moment accéder à vos données, les faire corriger ou effacer, vous opposer à leur utilisation, en demander la limitation ou en recevoir une copie dans un format courant. Écrivez à [simone.kamano@yahoo.fr](mailto:simone.kamano@yahoo.fr) : nous vous répondons sous un mois.

Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l'autorité de protection des données de votre pays de résidence (en France : la CNIL, [www.cnil.fr](https://www.cnil.fr)).

## 9. Sécurité

Le site est servi en HTTPS. La base de données n'est accessible qu'aux personnes autorisées, avec des droits limités, et elle est sauvegardée chaque jour. Les livres numériques ne sont remis que par un lien personnel, réservé aux commandes payées.

## 10. Modifications

Cette politique peut évoluer. La date de sa dernière mise à jour figure en haut de cette page.
$md$),

('remboursement', 'Politique de remboursement', $md$
Cette page résume quand et comment vous êtes remboursé. Elle complète nos [conditions générales de vente](/conditions-generales-de-vente).

## Voyages, circuits et excursions

**Vous annulez** : nous vous remboursons les sommes versées, moins les frais d'annulation prévus à l'article 7 des CGV ou par les conditions particulières de votre devis.

**Nous annulons, ou des circonstances exceptionnelles et inévitables empêchent le voyage** : nous vous remboursons toutes les sommes versées, sans frais.

**Une prestation n'a pas pu être fournie sur place** : nous vous proposons une solution équivalente, ou nous vous remboursons la part correspondante.

## Prise en charge à l'aéroport

Si vous l'annulez [[délai pour annuler sans frais, par exemple « au moins 48 heures avant votre arrivée »]], elle vous est remboursée en totalité. Passé ce délai, ou si le chauffeur s'est déjà déplacé, elle reste due.

## Livres et guides numériques

- Avant le paiement, vous pouvez annuler votre commande sans frais : écrivez-nous.
- Une fois le lien de téléchargement envoyé, les livres ne sont ni repris ni remboursés : en commandant, vous avez renoncé à votre droit de rétractation.
- Si un fichier est défectueux (illisible ou incomplet) et que nous ne pouvons pas le remplacer, nous vous le remboursons.
- Si vous avez payé deux fois par erreur, nous vous remboursons le paiement en double.

## Comment demander un remboursement ?

Écrivez à [simone.kamano@yahoo.fr](mailto:simone.kamano@yahoo.fr) ou sur WhatsApp au +33 6 41 96 01 01, avec votre nom, la référence de votre dossier ou de votre commande (par exemple LIV-…) et le motif de votre demande.

## Délai et moyen de remboursement

Le remboursement est fait au plus tard 14 jours après notre accord, par le même moyen que votre paiement, sauf si vous en acceptez un autre. Il ne vous est facturé aucun frais.
$md$)
on conflict (slug) do nothing;
