import { getRouteApi } from "@tanstack/react-router";

// The four legal pages (supabase/migrations/0010_pages_legales.sql, ORDRE n° 16), in footer
// order. Each one lives at /<slug>; `short` is its footer label.
export const LEGAL_PAGES = [
  { slug: "mentions-legales", title: "Mentions légales", short: "Mentions légales" },
  { slug: "conditions-generales-de-vente", title: "Conditions générales de vente", short: "CGV" },
  { slug: "confidentialite", title: "Politique de confidentialité", short: "Confidentialité" },
  { slug: "remboursement", title: "Politique de remboursement", short: "Remboursement" },
];

export const LEGAL_SLUGS = LEGAL_PAGES.map((page) => page.slug);

// A passage the client still has to fill in: [[what to write]], on one line. A page that has
// one cannot be published (the database refuses it too).
export const PLACEHOLDER = /\[\[([^\]\n]+)\]\]/g;

export const findPlaceholders = (body = "") => [...body.matchAll(PLACEHOLDER)].map((match) => match[1].trim());

// The published legal pages ({ slug, title, short }), loaded once by the root route for the
// footer, the order form and the contact form.
const rootApi = getRouteApi("__root__");

export function useLegalLinks() {
  return rootApi.useLoaderData() ?? [];
}

export const legalDayFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Africa/Conakry" });
