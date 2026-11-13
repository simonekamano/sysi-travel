import { CONTACT, IMAGES, LOGO, SITE_ORIGIN, absoluteUrl } from "@/data/site";

export const SITE_NAME = "SYSI TRAVEL";

// The address search engines should keep for a page (no query string, no trailing slash).
export const pageUrl = (path = "/") => `${SITE_ORIGIN}${path === "/" ? "/" : path.replace(/\/+$/, "")}`;

// Search engines show a title of up to about 60 characters and a description of 70 to 160;
// beyond that they cut it off, and a shorter description says too little.
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 70;
const DESCRIPTION_MAX = 160;

// The first of the titles, from the most detailed to the shortest, that fits whole.
export const fitTitle = (...titles) => titles.find((title) => title.length <= TITLE_MAX) ?? titles.at(-1);

// A description of the right length: a short one is completed with `more`, a long one is cut
// at the last whole word.
export function fitDescription(text, more = "") {
  let description = String(text || "").replace(/\s+/g, " ").trim();
  if (description.length < DESCRIPTION_MIN && more) {
    description = description ? `${/[.!?…]$/.test(description) ? description : `${description}.`} ${more}` : more;
  }
  if (description.length > DESCRIPTION_MAX) {
    const cut = description.slice(0, DESCRIPTION_MAX);
    description = `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.—–-]+$/, "")}…`;
  }
  return description;
}

// Everything a public page tells search engines and social networks: title, description,
// canonical address, sharing card (Open Graph, X) and, optionally, structured data.
// `links` and `scripts` are the page's own extra head entries.
export function seo({ title, description: text, path, image, imageAlt, type = "website", noindex = false, links = [], scripts = [], meta = [] }) {
  const description = fitDescription(text);
  const url = pageUrl(path);
  const picture = absoluteUrl(image || IMAGES.hero);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : [{ name: "robots", content: "index, follow, max-image-preview:large" }]),
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: picture },
      { property: "og:image:alt", content: imageAlt || title },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: picture },
      ...meta,
    ],
    links: [{ rel: "canonical", href: url }, ...links],
    scripts,
  };
}

// A page that search engines must not list (account, cart, download pages).
export const noindex = (title) => ({ meta: [{ title }, { name: "robots", content: "noindex, nofollow" }] });

// Structured data (schema.org) in a <script type="application/ld+json">. « < » is escaped so a
// text from the database can never close the script tag.
export const jsonLd = (data) => ({
  type: "application/ld+json",
  children: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c"),
});

// The agency itself, referred to by the other structured data.
export const AGENCY_ID = `${SITE_ORIGIN}/#agence`;

export const agencyLd = (sameAs = []) =>
  jsonLd({
    "@type": "TravelAgency",
    "@id": AGENCY_ID,
    name: "SYSI TRAVEL Guinée",
    alternateName: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    logo: absoluteUrl(LOGO),
    image: absoluteUrl(IMAGES.hero),
    description:
      "Plateforme touristique dédiée à la Guinée : destinations, circuits et excursions avec des guides locaux, séjours accompagnés pour la diaspora.",
    telephone: CONTACT.phoneHref.replace("tel:", ""),
    email: CONTACT.email,
    address: { "@type": "PostalAddress", addressLocality: "Conakry", addressRegion: "Kaloum", addressCountry: "GN" },
    areaServed: { "@type": "Country", name: "Guinée" },
    availableLanguage: ["fr", "en"],
    ...(sameAs.length ? { sameAs } : {}),
  });

export const websiteLd = () =>
  jsonLd({
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#site`,
    url: `${SITE_ORIGIN}/`,
    name: SITE_NAME,
    inLanguage: "fr",
    publisher: { "@id": AGENCY_ID },
  });

// The trail Accueil › … › page, shown by search engines under the result.
export const breadcrumbLd = (items) =>
  jsonLd({
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: pageUrl(path),
    })),
  });
