// Online payment with Stripe Checkout (ORDRE n° 17). Server only: imported by server functions
// and by the Stripe webhook (src/routes/api/stripe-webhook.js).
//
// The prices stay in the database, editable in the administration: when a customer pays, the
// site sends Stripe the name and amount of each line (`price_data`), so nothing has to be kept
// in step in the Stripe Dashboard. Stripe's page takes the card (and Apple Pay, Google Pay…, as
// set in the Dashboard); the site never sees it.
//
// An order or a booking is only marked paid here, after asking Stripe itself about the session
// (on the customer's return, or on Stripe's signed notification), with the Supabase service key:
// neither a visitor nor a signed-in customer can do it.
//
// Settings, read at run time (.env.example): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and
// SUPABASE_SERVICE_ROLE_KEY. Without the first and the last, online payment is off.
import { createClient } from "@supabase/supabase-js";
import { DOWNLOAD_DAYS } from "@/lib/boutique";
import { sendCommandePayeeAgence, sendLienTelechargement, sendPaiementRecu, sendReservationEmails } from "@/lib/mail";

// How long Stripe's payment page stays open (Stripe accepts 30 minutes to 24 hours). After it,
// the order or booking still waiting is cancelled (webhook « checkout.session.expired »).
const SESSION_MINUTES = 60;

export const paiementActif = () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

// « test » with a test key (sk_test_…, rk_test_…), « live » with a real one, null without.
export function stripeMode() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) return null;
  return /^(sk|rk)_live_/.test(key) ? "live" : "test";
}

let client;
async function stripe() {
  if (!paiementActif()) throw new Error("Le paiement en ligne n'est pas encore disponible. Écrivez-nous sur WhatsApp.");
  if (!client) {
    const { default: Stripe } = await import("stripe");
    client = new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, appInfo: { name: "SYSI TRAVEL" } });
  }
  return client;
}

// The database as the server itself (service key): to write a payment, which no visitor or
// customer may do. Used only here, after Stripe has confirmed the payment.
function serviceSupabase() {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

// --- Stripe's payment page -----------------------------------------------------------------------

// `lines`: [{ name, description?, unit_amount (cents), quantity }]. `type` and `id` come back with
// the payment and tell which order or booking it pays.
export async function createCheckout({ type, id, reference, email, lines, successUrl, cancelUrl }) {
  const stripeClient = await stripe();
  const metadata = { type, id, reference };
  const session = await stripeClient.checkout.sessions.create({
    mode: "payment",
    locale: "fr",
    customer_email: email,
    client_reference_id: reference,
    line_items: lines.map(({ name, description, unit_amount, quantity }) => ({
      quantity,
      price_data: {
        currency: "eur",
        unit_amount,
        product_data: { name: name.slice(0, 250), ...(description ? { description: description.slice(0, 500) } : {}) },
      },
    })),
    metadata,
    payment_intent_data: { metadata, description: `${type === "commande" ? "Commande" : "Réservation"} ${reference}` },
    expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
    success_url: `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
  });
  const table = type === "commande" ? "commandes" : "reservations";
  unwrap(await serviceSupabase().from(table).update({ stripe_session_id: session.id }).eq("id", id));
  return session.url;
}

// An order just created by passer_commande() (supabase/migrations/0013): its lines, at the
// catalogue's prices, plus the articles' shipping. Returns the address of Stripe's page.
export async function checkoutCommande({ reference, email, lignes, fraisLivraisonCents, baseUrl }) {
  const db = serviceSupabase();
  const { id } = unwrap(await db.from("commandes").select("id").eq("reference", reference).single());
  if (fraisLivraisonCents) unwrap(await db.from("commandes").update({ frais_livraison_cents: fraisLivraisonCents }).eq("id", id));
  const lines = lignes.map((ligne) => ({
    name: ligne.title,
    quantity: ligne.quantite,
    unit_amount: Math.round(ligne.price_cents / ligne.quantite),
  }));
  if (fraisLivraisonCents) lines.push({ name: "Livraison", quantity: 1, unit_amount: fraisLivraisonCents });
  return createCheckout({
    type: "commande",
    id,
    reference,
    email,
    lines,
    successUrl: `${baseUrl}/paiement/confirmation`,
    cancelUrl: `${baseUrl}/panier?paiement=annule`,
  });
}

// A booking just created by reserver_circuit(): the travellers at the circuit's price, or the
// deposit share of it. Returns the address of Stripe's page.
export async function checkoutReservation({ reservation, email, slug, baseUrl }) {
  const deposit = reservation.acompte_pourcent < 100;
  const lines = deposit
    ? [{
        name: `${reservation.circuit_title} : acompte de ${reservation.acompte_pourcent} %`,
        description: `${reservation.voyageurs} voyageur${reservation.voyageurs > 1 ? "s" : ""}. Le solde se règle avant le départ.`,
        quantity: 1,
        unit_amount: reservation.montant_en_ligne_cents,
      }]
    : [{ name: reservation.circuit_title, description: "Prix par voyageur", quantity: reservation.voyageurs, unit_amount: reservation.prix_unitaire_cents }];
  return createCheckout({
    type: "reservation",
    id: reservation.id,
    reference: reservation.reference,
    email,
    lines,
    successUrl: `${baseUrl}/paiement/confirmation`,
    cancelUrl: `${baseUrl}/circuits/${slug}?paiement=annule#reserver`,
  });
}

// --- Payment received --------------------------------------------------------------------------

const ORDER_COLUMNS =
  "*, lignes:commande_livres(title, price_cents), articles:commande_articles(name, variante, taille, quantite, price_cents)";

// A paid order: the books' download link opens for DOWNLOAD_DAYS days and is e-mailed; an order
// of articles only gets a « paiement reçu » e-mail. Shared with Administration › Commandes
// (« Paiement reçu », with the admin's own connection). Returns whether the e-mail left.
export async function marquerCommandePayee(supabase, id, payment, baseUrl) {
  const order = unwrap(await supabase.from("commandes").select(ORDER_COLUMNS).eq("id", id).single());
  if (order.lignes.length) {
    const lienExpireLe = new Date(Date.now() + DOWNLOAD_DAYS * 24 * 60 * 60 * 1000).toISOString();
    unwrap(await supabase.from("commandes").update({ ...payment, lien_expire_le: lienExpireLe, telechargements: 0 }).eq("id", id));
    return sendLienTelechargement({ ...order, ...payment }, `${baseUrl}/telechargement/${order.token}`);
  }
  unwrap(await supabase.from("commandes").update(payment).eq("id", id));
  return sendPaiementRecu({ ...order, ...payment });
}

const isPaid = (session) => session.payment_status === "paid" || session.payment_status === "no_payment_required";

// Asks Stripe about a payment session and, once it is paid, marks its order or booking paid and
// sends the e-mails. Safe to call several times (customer's return and webhook): only the first
// call that finds the row still waiting changes it. Returns what the confirmation page shows.
export async function confirmerPaiement(sessionId, baseUrl) {
  const session = await (await stripe()).checkout.sessions.retrieve(sessionId);
  const { type, id } = session.metadata ?? {};
  if (!["commande", "reservation"].includes(type) || !id) return null;
  const db = serviceSupabase();
  const table = type === "commande" ? "commandes" : "reservations";
  const row = unwrap(await db.from(table).select("*").eq("id", id).maybeSingle());
  // The session must be the one created for this row (never another order's payment).
  if (!row || row.stripe_session_id !== session.id) return null;

  const expected = type === "commande" ? row.total_cents + row.frais_livraison_cents : row.montant_en_ligne_cents;
  const summary = {
    type,
    reference: row.reference,
    statut: row.statut,
    montant_cents: session.amount_total ?? expected,
    // Articles to ship (books alone are downloaded).
    livraison: type === "commande" && Boolean((row.adresse ?? "").trim()),
    circuit: type === "reservation" ? row.circuit_title : null,
    reste_cents: type === "reservation" ? row.total_cents - row.montant_en_ligne_cents : 0,
  };
  if (!isPaid(session) || row.statut !== "en_attente") return summary;
  if (session.amount_total !== expected || session.currency !== "eur") {
    console.error(`Paiement ${session.id} : montant ${session.amount_total} ${session.currency}, attendu ${expected} eur (${row.reference}).`);
    return summary;
  }

  const payment = { statut: "payee", payee_le: new Date().toISOString() };
  // Only the first caller moves the row from « en attente » to « payée »: it sends the e-mails.
  const claimed = unwrap(
    await db.from(table).update(type === "commande" ? { ...payment, paiement_mode: "stripe" } : payment).eq("id", id).eq("statut", "en_attente").select("id"),
  );
  if (!claimed.length) return { ...summary, statut: "payee" };

  if (type === "commande") {
    await marquerCommandePayee(db, id, { ...payment, paiement_mode: "stripe" }, baseUrl);
    const order = unwrap(await db.from("commandes").select(ORDER_COLUMNS).eq("id", id).single());
    await sendCommandePayeeAgence(order);
  } else {
    await sendReservationEmails({ ...row, ...payment });
  }
  return { ...summary, statut: "payee" };
}

// A payment page closed without paying (expired, or a bank transfer refused): the order or
// booking still waiting is cancelled.
export async function annulerPaiement(sessionId) {
  const session = await (await stripe()).checkout.sessions.retrieve(sessionId);
  const { type, id } = session.metadata ?? {};
  if (!["commande", "reservation"].includes(type) || !id || isPaid(session)) return;
  const table = type === "commande" ? "commandes" : "reservations";
  unwrap(await serviceSupabase().from(table).update({ statut: "annulee" }).eq("id", id).eq("stripe_session_id", session.id).eq("statut", "en_attente"));
}

// Stripe's signed notification (webhook): checks the signature, then confirms or cancels.
export async function traiterNotificationStripe(rawBody, signature, baseUrl) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw Object.assign(new Error("STRIPE_WEBHOOK_SECRET absente"), { status: 503 });
  let event;
  try {
    event = await (await stripe()).webhooks.constructEventAsync(rawBody, signature ?? "", secret);
  } catch {
    throw Object.assign(new Error("Signature Stripe invalide"), { status: 400 });
  }
  const sessionId = event.data?.object?.object === "checkout.session" ? event.data.object.id : null;
  if (!sessionId) return event.type;
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await confirmerPaiement(sessionId, baseUrl);
  } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    await annulerPaiement(sessionId);
  }
  return event.type;
}
