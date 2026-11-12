-- Avant l'ouverture au public : rien de fictif ni de trompeur sur le site.
--   1. Les 6 livres d'exemple (0013, fichier « exemple.pdf » qui n'existe pas) ne sont plus en
--      vitrine. La Cliente peut les supprimer dans Administration › Livres & guides ; un livre
--      auquel elle joint un vrai PDF n'est plus concerné.
--   2. La réponse de la FAQ sur le paiement ne promet plus un acompte réglé « en ligne de façon
--      sécurisée » : il n'y a pas encore de paiement en ligne. Seulement si la Cliente n'a pas
--      déjà modifié cette réponse dans l'administration.
-- Idempotent : rejouée à chaque déploiement (deploy/deploy.sh).

update public.livres
set published = false
where file_path = 'exemple.pdf' and published;

update public.faqs
set answer = 'Après votre demande, nous vous envoyons un devis détaillé. Les modalités de paiement (acompte, solde et moyens acceptés) vous sont confirmées par écrit avant toute réservation.'
where question = 'Comment se passe le paiement ?'
  and answer = 'Un acompte de 30 % confirme votre réservation en ligne de façon sécurisée. Le solde est réglé quinze jours avant le départ. Chaque paiement est confirmé par écrit.';
