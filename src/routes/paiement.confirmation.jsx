import { useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, UserRound, XCircle } from "lucide-react";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { CONTACT } from "@/data/site";
import { DOWNLOAD_DAYS, formatPrice } from "@/lib/boutique";
import { useCart } from "@/lib/cart";
import { noindex } from "@/lib/seo";
import { getPaiementConfirmation } from "@/lib/server-fns";

// Back from Stripe's payment page (?session_id=cs_…): the server asks Stripe whether it is paid
// and records the payment (src/lib/paiement.js), then this page says what happens next.
export const Route = createFileRoute("/paiement/confirmation")({
  validateSearch: (search) => ({ session_id: typeof search.session_id === "string" ? search.session_id : "" }),
  loaderDeps: ({ search }) => ({ sessionId: search.session_id }),
  loader: ({ deps }) => (/^cs_[A-Za-z0-9_]+$/.test(deps.sessionId) ? getPaiementConfirmation({ data: { session_id: deps.sessionId } }) : null),
  head: () => noindex("Paiement — SYSI TRAVEL"),
  component: ConfirmationPage,
});

const buttonClass =
  "label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-2.5 text-ivory transition-colors hover:bg-petrol-deep";
const outlineClass =
  "label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-5 py-2.5 text-petrol transition-colors hover:border-gold";

function ConfirmationPage() {
  const result = Route.useLoaderData();
  const cart = useCart();
  const paid = result?.statut === "payee";

  // An order paid: its cart is emptied (it stays filled while the payment is not confirmed).
  useEffect(() => {
    if (paid && result.type === "commande") cart.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid bookingHref="/contact" />
      <main className="bg-background pb-16 pt-32 lg:pt-36">
        <div className="mx-auto max-w-2xl px-6 text-center">
          {!result ? <Unknown /> : paid ? <Paid result={result} /> : result.statut === "annulee" ? <Failed result={result} /> : <Pending result={result} />}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function Heading({ icon: Icon, tone = "gold", eyebrow, title }) {
  return (
    <>
      <span
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${tone === "gold" ? "bg-gold/20 text-gold-deep" : "bg-petrol/10 text-petrol"}`}
      >
        <Icon className="h-8 w-8" strokeWidth={1.6} />
      </span>
      {eyebrow ? <p className="eyebrow mt-6 text-gold-deep">{eyebrow}</p> : null}
      <h1 className="mt-4 text-[clamp(1.9rem,3.6vw,2.8rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-petrol [text-wrap:balance]">
        {title}
      </h1>
    </>
  );
}

const Text = ({ children }) => <p className="mt-5 text-[1.02rem] leading-relaxed text-petrol/75">{children}</p>;

function Paid({ result }) {
  if (result.type === "reservation") {
    return (
      <>
        <Heading icon={CheckCircle2} eyebrow={`Réservation ${result.reference}`} title="Merci, votre réservation est confirmée" />
        <Text>
          Votre paiement de <strong className="text-petrol">{formatPrice(result.montant_cents)}</strong> pour « {result.circuit} » est bien
          reçu.
          {result.reste_cents > 0 ? ` Le solde (${formatPrice(result.reste_cents)}) se règle avant le départ.` : ""} Nous vous contactons sous
          72 heures pour confirmer la date et organiser votre voyage. Un e-mail de confirmation vient de partir.
        </Text>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/circuits" className={buttonClass}>
            Voir les autres voyages
          </Link>
          <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className={outlineClass}>
            Nous écrire sur WhatsApp
          </a>
        </div>
      </>
    );
  }
  return (
    <>
      <Heading icon={CheckCircle2} eyebrow={`Commande ${result.reference}`} title="Merci, votre paiement est bien reçu" />
      <Text>
        Paiement de <strong className="text-petrol">{formatPrice(result.montant_cents)}</strong> reçu.{" "}
        {result.livraison
          ? "Nous préparons votre commande et vous écrivons à chaque étape : préparation, expédition, livraison."
          : `Vos livres viennent de partir par e-mail, avec votre lien de téléchargement personnel (valable ${DOWNLOAD_DAYS} jours).`}
      </Text>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href="/compte" className={buttonClass}>
          <UserRound className="h-4 w-4" /> Suivre ma commande
        </a>
        <Link to="/boutique" className={outlineClass}>
          Continuer mes achats
        </Link>
      </div>
      <p className="mx-auto mt-4 max-w-md text-[0.85rem] text-petrol/55">
        Pas encore de compte ? Créez-le avec la même adresse e-mail : vos commandes y apparaîtront.
      </p>
    </>
  );
}

function Pending({ result }) {
  return (
    <>
      <Heading icon={Clock} tone="petrol" eyebrow={`${result.type === "reservation" ? "Réservation" : "Commande"} ${result.reference}`} title="Votre paiement est en cours de validation" />
      <Text>
        Votre banque n'a pas encore confirmé le paiement. Dès qu'il est validé, vous recevez un e-mail de confirmation : vous n'avez rien
        d'autre à faire. Si rien n'arrive d'ici quelques heures, écrivez-nous.
      </Text>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonClass}>
          Nous écrire sur WhatsApp
        </a>
      </div>
    </>
  );
}

function Failed({ result }) {
  return (
    <>
      <Heading icon={XCircle} tone="petrol" eyebrow={`${result.type === "reservation" ? "Réservation" : "Commande"} ${result.reference}`} title="Ce paiement n'a pas abouti" />
      <Text>Rien n'a été débité. Vous pouvez recommencer quand vous voulez, ou nous écrire pour régler autrement.</Text>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to={result.type === "reservation" ? "/circuits" : "/panier"} className={buttonClass}>
          {result.type === "reservation" ? "Revenir aux voyages" : "Revenir au panier"}
        </Link>
        <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className={outlineClass}>
          Nous écrire sur WhatsApp
        </a>
      </div>
    </>
  );
}

function Unknown() {
  return (
    <>
      <Heading icon={Clock} tone="petrol" eyebrow="Paiement" title="Nous ne retrouvons pas ce paiement" />
      <Text>
        Si vous venez de payer, un e-mail de confirmation vous arrive dans quelques minutes. Sinon, écrivez-nous : nous vérifions tout de
        suite.
      </Text>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonClass}>
          Nous écrire sur WhatsApp
        </a>
        <Link to="/" className={outlineClass}>
          Retour à l'accueil
        </Link>
      </div>
    </>
  );
}
