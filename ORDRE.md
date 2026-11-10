# Ordre d'implémentation — SYSI TRAVEL

Feuille de route des fonctionnalités restantes. Elle suit le contrat de prestation (article 2) et son annexe 1 : `Contrat_Prestatio.docx`, version du 7 novembre 2026.

## Règles de suivi

1. On réalise **une fonctionnalité à la fois**, dans l'ordre ci-dessous.
2. Quand elle est en ligne et vérifiée, elle passe à **✅ Terminé**, avec la date.
3. On ne commence la suivante qu'après le **OK** de Lionel.
4. Une **option** (hors contrat) ne démarre qu'après l'accord écrit de la Cliente.
5. Si une fonctionnalité attend des éléments de la Cliente, on peut passer à la suivante avec l'OK de Lionel ; elle reste notée 🔒.

**Statuts :** ⬜ À faire · 🔄 En cours · 🔒 En attente (éléments ou accord) · ✅ Terminé · ⏸️ Non planifié

**Type :** Contrat = inclus dans les 1 600 € · Option = hors contrat, prix de l'annexe 1 (partie 3)

## Phase 1 : Les bases

Ces fonctionnalités sont rapides et débloquent les suivantes.

| N° | Fonctionnalité | Type | Éléments nécessaires | Statut |
|---|---|---|---|---|
| 1 | Activer l'espace d'administration : créer le compte administrateur | Contrat | simonekamano91@gmail.com : compte admin créé, première connexion réussie | ✅ Terminé le 8 novembre 2026 |
| 2 | Liens vers les réseaux sociaux : pied de page de toutes les pages et page contact, gérés dans Administration › Réseaux sociaux | Contrat | Adresses des pages, à saisir par la Cliente (un réseau vide reste masqué) | ✅ Terminé le 8 novembre 2026 |
| 3 | Remplacer les images d'illustration par les vraies photos (destinations, accueil, produits locaux) | Contrat | Photos des lieux et des produits, avec droit de publication : 13 images à remplacer, liste envoyée le 8 novembre 2026 | 🔒 En attente des photos |

## Phase 2 : L'offre de voyage

C'est le cœur de l'activité : ce que les voyageurs viennent acheter.

| N° | Fonctionnalité | Type | Éléments nécessaires | Statut |
|---|---|---|---|---|
| 4 | Circuits et excursions : fiches, programme jour par jour, dates, prix, gérés depuis l'administration | Contrat | Programme, dates, prix et nom de chaque circuit, à saisir par la Cliente dans Administration › Circuits (rien n'est affiché tant qu'aucun circuit n'est publié) | ✅ Terminé le 8 novembre 2026 |
| 5 | Itinéraire interactif des circuits : carte, trajet tracé, étapes jour par jour (jusqu'à 4 circuits) | Option, 150 € | Accord donné le 10 novembre 2026 ; lieu, GPS et photo de chaque étape, à saisir par la Cliente dans le programme du circuit | ✅ Terminé le 10 novembre 2026 |
| 6 | Prise en charge de l'aéroport au lieu de séjour, sur demande : option du formulaire, page /transfert-aeroport | Option, 60 € | Accord donné le 10 novembre 2026. Tarifs, zones, véhicule et prestataire restent à fournir : la page annonce un tarif confirmé avant l'arrivée | ✅ Terminé le 10 novembre 2026 |
| 7 | Demande de billets d'avion : formulaire et suivi dans l'administration | Option, 80 € | Accord écrit ; qui émet les billets ; cadre légal vérifié | 🔒 Accord |

## Phase 3 : Contenus et image

| N° | Fonctionnalité | Type | Éléments nécessaires | Statut |
|---|---|---|---|---|
| 8 | Présentation de l'entreprise et de la Guinée en vidéo | Contrat | Vidéos de la Cliente, ou vidéos créées à partir de ses photos (n° 9) | ⬜ À faire |
| 9 | Vidéos créées à partir des photos (30 à 60 s, téléphone et ordinateur) | Option, 20 € | Accord écrit ; 5 à 10 photos par vidéo, textes | 🔒 Accord |
| 10 | Présentation des partenaires | Contrat | Liste des partenaires, logos, textes, accord de chacun | ⬜ À faire |
| 11 | Formulaire pour ajouter un établissement | Option, 50 € | Accord écrit ; informations demandées, règles de publication | 🔒 Accord |
| 12 | Formations, conférences et événements, dont la journée immersive avec casques de réalité virtuelle | Contrat | Programme, dates, lieux, prix | ⬜ À faire |
| 13 | Galeries photos et vidéos de conférences | Contrat | Photos, vidéos, droits d'utilisation | ⬜ À faire |
| 14 | Articles sur l'histoire de la Guinée (héros, premières dames, présidents), gérés depuis l'administration | Contrat | Textes validés, photos, droits d'utilisation | ⬜ À faire |
| 15 | Visites virtuelles vidéo ou 360°, en accès gratuit | Contrat | Accord pour l'accès gratuit ; photos prises avec une caméra 360° | 🔒 Accord |

## Phase 4 : Vente en ligne

Le paiement suppose que les pages légales existent. Le catalogue a besoin du paiement.

| N° | Fonctionnalité | Type | Éléments nécessaires | Statut |
|---|---|---|---|---|
| 16 | Pages légales : mentions légales, conditions générales de vente, confidentialité, remboursement | Contrat (article 9) | Informations sur l'entreprise ; textes validés par la Cliente | ⬜ À faire |
| 17 | Paiement en ligne des visites, circuits et excursions | Contrat | Compte de paiement au nom de la Cliente (Stripe ou PayPal) | ⬜ À faire |
| 18 | Catalogue de livres et guides : panier, paiement, téléchargements sécurisés | Contrat | Liste des ouvrages, prix, couvertures, fichiers PDF, droits de vente | ⬜ À faire |

## Phase 5 : Partenaires et commissions

Le suivi des commissions a besoin des réservations, des paiements et des partenaires.

| N° | Fonctionnalité | Type | Éléments nécessaires | Statut |
|---|---|---|---|---|
| 19 | Identification des clients, codes partenaires, suivi des réservations et des commissions | Contrat | Accords avec les partenaires, taux de commission, règles d'attribution | ⬜ À faire |
| 20 | Suivi de dossier par les partenaires : accès partenaire aux demandes qui les concernent | Contrat | Liste des partenaires et droits de chacun | ⬜ À faire |

## Hors plan

| N° | Fonctionnalité | Type | Statut |
|---|---|---|---|
| 21 | Achat de billets d'avion en ligne, en temps réel | Sur devis, à partir de 1 000 € | ⏸️ Non planifié |

## Déjà terminé

Ces fonctionnalités sont livrées sur https://sysitravel.com (annexe 1, parties 1 et 2) :

- Présentation de l'entreprise et de son offre ; coordonnées.
- Sites touristiques : 6 fiches détaillées, galeries, informations pratiques, carte interactive.
- Formulaire de demande de réservation et demandes de séjours accompagnés.
- Opportunités d'affaires dans le voyage ; formulaire de questions et de contact, FAQ.
- Notifications e-mail : alerte à la Cliente et accusé de réception au voyageur.
- Migration, hébergement sur le VPS, domaine, HTTPS, sécurisation et tests.
- En plus du contrat : produits locaux, réponse sous 72 h, charte graphique, mise en ligne automatique, sauvegardes quotidiennes, protection anti-spam.
