// Shared by the shop pages, the administration, the e-mails and the server.

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
