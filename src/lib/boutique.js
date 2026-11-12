// Shared by the shop pages, the administration, the e-mails and the server.

// Online sale. Off until online payment (Stripe) is connected: the shop is then a catalogue,
// with no cart and no order. The server (createCommande) and the database
// (supabase/migrations/0014_vente_en_ligne_fermee.sql) refuse orders as well. A visitor can
// still reserve a piece on WhatsApp. Turn it on together with the payment page.
export const VENTE_EN_LIGNE = false;

export const BOOK_KINDS = [
  { key: "guide", label: "Guide", plural: "Guides" },
  { key: "livre", label: "Livre", plural: "Livres" },
];

export const BOOK_KIND_LABEL = Object.fromEntries(BOOK_KINDS.map((item) => [item.key, item.label]));

// The columns a visitor may read (the PDF's place in the private bucket stays on the server).
export const BOOK_PUBLIC_COLUMNS =
  "id, slug, title, subtitle, author, kind, description, cover, price_cents, pages, language, file_size, sort_order";

// Downloads allowed per paid order (supabase/migrations/0009_boutique.sql, limite_telechargements).
export const DOWNLOAD_LIMIT = 30;
export const DOWNLOAD_DAYS = 30;

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

// 1290 → « 12,90 € » (narrow no-break spaces replaced, for e-mails and plain text).
const NARROW_NBSP = new RegExp(String.fromCharCode(0x202f), "g");
const NBSP = String.fromCharCode(0xa0);
export const formatPrice = (cents) => euros.format((cents ?? 0) / 100).replace(NARROW_NBSP, NBSP);

// « 12,90 », « 12.9 », « 12 » → 1290 ; null when it is not a price.
export function parsePrice(value) {
  const match = String(value ?? "").trim().replace(/\s|€/g, "").match(/^(\d{1,4})(?:[.,](\d{1,2}))?$/);
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
}

export const priceInput = (cents) => (cents ? (cents / 100).toFixed(2).replace(".", ",") : "");

// 3 450 000 → « 3,3 Mo ».
export function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1).replace(".", ",")} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

export const ORDER_STATUSES = {
  en_attente: "En attente de paiement",
  payee: "Payée",
  annulee: "Annulée",
};

// --- Articles (vêtements, sacs, bijoux: supabase/migrations/0013_boutique_articles.sql) ---

// The shop's sections, in the navbar's order. `livres`: the PDF books; `terroir`: the local
// products ordered on WhatsApp (/produits).
export const SHOP_CATEGORIES = [
  { key: "femme", label: "Mode femme", short: "Femme" },
  { key: "homme", label: "Mode homme", short: "Homme" },
  { key: "sacs", label: "Sacs", short: "Sacs" },
  { key: "bijoux", label: "Bijoux", short: "Bijoux" },
];
export const ARTICLE_CATEGORY_LABEL = Object.fromEntries(SHOP_CATEGORIES.map((item) => [item.key, item.label]));
export const ARTICLE_CATEGORY_KEYS = SHOP_CATEGORIES.map((item) => item.key);

export const CUSTOM_SIZE = "Sur mesure";

// The list-size version of a catalogue photo (made with it, « -640 »); uploaded photos have none.
export const thumbOf = (src) => (src?.startsWith("/images/boutique/") ? src.replace(/\.jpg$/, "-640.jpg") : src);

export const variantsOf = (article) => (Array.isArray(article?.variants) ? article.variants : []);

// The photos of an article: its first variant's, or all of them when asked.
export const articleImages = (article, variantName) => {
  const variants = variantsOf(article);
  const variant = variants.find((item) => item.name === variantName) ?? variants[0];
  return variant?.images?.length ? variant.images : variants.flatMap((item) => item.images ?? []);
};

// Shipping of the items of an order, apart from its payment (commandes.livraison).
export const DELIVERY_STATUSES = {
  sans: "Sans livraison",
  a_preparer: "À préparer",
  en_preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
};

// The steps a customer sees for an order with items to ship.
export const ORDER_STEPS = [
  { key: "recue", label: "Commande reçue" },
  { key: "payee", label: "Paiement reçu" },
  { key: "en_preparation", label: "En préparation" },
  { key: "expediee", label: "Expédiée" },
  { key: "livree", label: "Livrée" },
];

// How far an order has gone, as an index in ORDER_STEPS (books only: received, then paid).
export function orderStep(commande) {
  if (commande.statut !== "payee") return 0;
  const index = ["a_preparer", "en_preparation", "expediee", "livree"].indexOf(commande.livraison);
  return index <= 0 ? 1 : index + 1;
}
