-- Vente en ligne fermée tant que le paiement en ligne (Stripe) n'est pas branché.
-- Le site n'affiche plus ni panier ni bouton de commande (VENTE_EN_LIGNE dans src/lib/boutique.js)
-- et le serveur refuse les commandes ; ici, la base refuse aussi les appels directs à l'API
-- (api.sysitravel.com) avec la clé publique : plus personne ne peut créer de commande, connecté
-- ou non. Les administrateurs gardent la gestion des commandes existantes.
-- Rejouée à chaque déploiement, après 0009 et 0013 qui accordent ces droits : le retrait l'emporte.
-- À l'ouverture de la vente, une nouvelle migration rendra ces droits avec le paiement.

revoke execute on function public.creer_commande(text, text, text, uuid[]) from anon, authenticated;
revoke execute on function public.passer_commande(text, text, text, text, text, text, uuid[], jsonb) from anon, authenticated;
