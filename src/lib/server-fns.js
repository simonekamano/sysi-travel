import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-middleware";
import { BOOK_PUBLIC_COLUMNS, DOWNLOAD_DAYS } from "@/lib/boutique";
import { LEGAL_PAGES, LEGAL_SLUGS, findPlaceholders } from "@/lib/legal";
import { sendCommandeEmails, sendDemandeEmails, sendLienTelechargement } from "@/lib/mail";
import { siteUrl } from "@/lib/site-url";
import { parseVideo } from "@/lib/video";

// Supabase answers { data, error }; a server function must throw a plain Error to reach the caller.
const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

const listOrdered = (supabase, table, limit) =>
  supabase.from(table).select("*").order("sort_order").limit(limit).then(unwrap);

const saveRecord = async (supabase, table, { id, ...values }) => {
  unwrap(id ? await supabase.from(table).update(values).eq("id", id) : await supabase.from(table).insert(values));
  return { ok: true };
};

const deleteRecord = async (supabase, table, id) => {
  unwrap(await supabase.from(table).delete().eq("id", id));
  return { ok: true };
};

const idInput = z.object({ id: z.uuid() });
const text = (max) => z.string().trim().max(max);

// --- Public content: read by anyone (row level security: select for anon) ---

export const listDestinations = createServerFn({ method: "GET" }).handler(({ context }) =>
  listOrdered(context.getSupabase(), "destinations", 200),
);

export const listFormules = createServerFn({ method: "GET" }).handler(({ context }) =>
  listOrdered(context.getSupabase(), "formules", 50),
);

export const listFaqs = createServerFn({ method: "GET" }).handler(({ context }) =>
  listOrdered(context.getSupabase(), "faqs", 200),
);

export const getSiteContent = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const supabase = context.getSupabase();
  const [destinations, formules, faqs, reseaux, circuits, sites, videos, livres] = await Promise.all([
    listOrdered(supabase, "destinations", 200),
    listOrdered(supabase, "formules", 50),
    listOrdered(supabase, "faqs", 200),
    listOrdered(supabase, "reseaux_sociaux", 20),
    listPublishedCircuits(supabase),
    supabase.from("sites_touristiques").select("id", { count: "exact", head: true }).eq("published", true),
    // Published only: an admin browsing the site must not see hidden videos.
    supabase.from("videos").select("*").eq("published", true).order("sort_order").limit(100).then(unwrap),
    listPublishedBooks(supabase),
  ]);
  return { destinations, formules, faqs, reseaux, circuits, sitesCount: sites.count ?? 0, videos, livres };
});

// Published books only, without the PDF's place in the private bucket.
const listPublishedBooks = (supabase) =>
  supabase.from("livres").select(BOOK_PUBLIC_COLUMNS).eq("published", true).order("sort_order").limit(200).then(unwrap);

// A book's page, three others to suggest, and what the footer needs. `livre` is null for an
// unknown or hidden book; the route answers 404.
export const getLivrePage = createServerFn({ method: "GET" })
  .validator(z.object({ slug: text(200) }))
  .handler(async ({ data, context }) => {
    const supabase = context.getSupabase();
    const [livres, destinations, reseaux] = await Promise.all([
      listPublishedBooks(supabase),
      listOrdered(supabase, "destinations", 200),
      listOrdered(supabase, "reseaux_sociaux", 20),
    ]);
    const livre = livres.find((item) => item.slug === data.slug) ?? null;
    const others = livres.filter((item) => item.slug !== data.slug).slice(0, 3);
    return { livre, others, destinations, reseaux };
  });

// Published circuits only: an admin browsing the site must not see drafts in the lists.
const listPublishedCircuits = (supabase) =>
  supabase.from("circuits").select("*").eq("published", true).order("sort_order").limit(100).then(unwrap);

// The « Explorer la Guinée » map: the published tourist sites, with what the contact form and
// footer need.
export const getExplorerPage = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const supabase = context.getSupabase();
  const [sites, destinations, formules, reseaux] = await Promise.all([
    supabase.from("sites_touristiques").select("*").eq("published", true).order("sort_order").limit(500).then(unwrap),
    listOrdered(supabase, "destinations", 200),
    listOrdered(supabase, "formules", 50),
    listOrdered(supabase, "reseaux_sociaux", 20),
  ]);
  return { sites, destinations, formules, reseaux };
});

// A circuit's page, with what the contact form and footer need. A draft is returned to admins
// only (row level security), so they can preview it; `circuit` is null otherwise and the route answers 404.
export const getCircuitPage = createServerFn({ method: "GET" })
  .validator(z.object({ slug: text(200) }))
  .handler(async ({ data, context }) => {
    const supabase = context.getSupabase();
    const [circuit, circuits, destinations, formules, reseaux] = await Promise.all([
      supabase.from("circuits").select("*").eq("slug", data.slug).maybeSingle().then(unwrap),
      listPublishedCircuits(supabase),
      listOrdered(supabase, "destinations", 200),
      listOrdered(supabase, "formules", 50),
      listOrdered(supabase, "reseaux_sociaux", 20),
    ]);
    const others = circuits.filter((item) => item.slug !== data.slug).slice(0, 3);
    return { circuit, others, destinations, formules, reseaux };
  });

// A destination's page: the destination, three others to suggest, and what the contact form lists.
// `destination` is null for an unknown slug; the route answers 404.
export const getDestinationPage = createServerFn({ method: "GET" })
  .validator(z.object({ slug: text(200) }))
  .handler(async ({ data, context }) => {
    const supabase = context.getSupabase();
    const [destinations, formules, reseaux] = await Promise.all([
      listOrdered(supabase, "destinations", 200),
      listOrdered(supabase, "formules", 50),
      listOrdered(supabase, "reseaux_sociaux", 20),
    ]);
    const destination = destinations.find((item) => item.slug === data.slug) ?? null;
    const others = destinations.filter((item) => item.slug !== data.slug).slice(0, 3);
    return { destination, others, destinations, formules, reseaux };
  });

// --- Contact form: anyone may create a request, only admins read them ---

// Each request or order sends two e-mails, so a visitor may send at most `limit` of them per
// `windowMs`. In memory: one Node process serves the site (docker-compose.yml).
function rateLimiter(limit, windowMs, message) {
  const recent = new Map();
  return () => {
    // Nginx sets X-Real-IP to the client address and overwrites any value the client sent.
    const ip = getRequestHeader("x-real-ip") || getRequestIP() || "inconnu";
    const now = Date.now();
    const times = (recent.get(ip) ?? []).filter((time) => now - time < windowMs);
    if (times.length >= limit) throw new Error(message);
    recent.set(ip, [...times, now]);
    if (recent.size > 5000) {
      for (const [key, list] of recent) if (list.every((time) => now - time >= windowMs)) recent.delete(key);
    }
  };
}

// Spam traps of the public forms: the hidden « site web » field, which only robots fill in,
// and the time taken to fill in the form (under 2 seconds: no person types that fast).
const isRobot = (siteWeb, delai) => Boolean(siteWeb) || (delai !== undefined && delai < 2000);

// What a visitor may read of a database error: the database's own limit on requests (see
// supabase/migrations/0012_securite.sql), never its internal messages.
const publicError = (error, fallback) => (/^Trop de /.test(error?.message ?? "") ? error.message : fallback);

const checkDemandeRate = rateLimiter(
  5,
  15 * 60 * 1000,
  "Trop de demandes envoyées. Réessayez dans quelques minutes ou écrivez-nous sur WhatsApp.",
);

export const createDemande = createServerFn({ method: "POST" })
  .validator(
    z.object({
      nom: text(200).min(1),
      email: z.email().max(320),
      telephone: text(50),
      pays: text(100),
      destination: text(200),
      formule: text(200),
      periode: text(200),
      voyageurs: text(10),
      message: text(5000),
      // Airport pick-up on request (supabase/migrations/0006_transfert_aeroport.sql).
      transfert: z.boolean().default(false),
      arrivee: text(200).default(""),
      hebergement: text(300).default(""),
      // Hidden field of the form (spam trap): only robots fill it in.
      site_web: text(500).optional(),
      // Milliseconds between the form's display and its sending (see isRobot).
      delai: z.number().int().min(0).max(1e10).optional(),
    }),
  )
  .handler(async ({ data: { site_web, delai, ...demande }, context }) => {
    // A robot gets the usual answer, so it does not learn that it was spotted.
    if (isRobot(site_web, delai)) return { ok: true };
    checkDemandeRate();
    const { error } = await context.getSupabase().from("demandes_sejour").insert({ ...demande, statut: "nouveau" });
    if (error) throw new Error(publicError(error, "La demande n'a pas pu être enregistrée. Réessayez ou écrivez-nous sur WhatsApp."));
    await sendDemandeEmails(demande);
    return { ok: true };
  });

// --- Shop: anyone may order (prices come from the catalogue, in the database) ---

const checkCommandeRate = rateLimiter(
  5,
  15 * 60 * 1000,
  "Trop de commandes envoyées. Réessayez dans quelques minutes ou écrivez-nous sur WhatsApp.",
);

export const createCommande = createServerFn({ method: "POST" })
  .validator(
    z.object({
      nom: text(200).min(1),
      email: z.email().max(320),
      telephone: text(50),
      livres: z.array(z.uuid()).min(1).max(50),
      // Digital content delivered at once: the buyer waives the withdrawal period.
      renonciation: z.literal(true),
      // Terms of sale accepted: required once the client has published them.
      cgv: z.boolean().default(false),
      // Hidden field of the form (spam trap): only robots fill it in.
      site_web: text(500).optional(),
      delai: z.number().int().min(0).max(1e10).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    if (isRobot(data.site_web, data.delai)) return { reference: "", total_cents: 0 };
    checkCommandeRate();
    const supabase = context.getSupabase();
    if (!data.cgv && (await isLegalPagePublished(supabase, "conditions-generales-de-vente"))) {
      throw new Error("Cochez la case pour accepter les conditions générales de vente.");
    }
    const { data: commande, error } = await supabase.rpc("creer_commande", {
      p_nom: data.nom,
      p_email: data.email,
      p_telephone: data.telephone,
      p_livres: data.livres,
    });
    if (error) {
      throw new Error(
        /plus disponible/.test(error.message)
          ? "Un livre de votre panier n'est plus disponible : retirez-le puis réessayez."
          : publicError(error, "La commande n'a pas pu être enregistrée. Réessayez ou écrivez-nous sur WhatsApp."),
      );
    }
    await sendCommandeEmails({ ...commande, nom: data.nom, email: data.email, telephone: data.telephone });
    return { reference: commande.reference, total_cents: commande.total_cents };
  });

// The /telechargement/<token> page: the order of that link (null for an unknown link).
export const getTelechargement = createServerFn({ method: "GET" })
  .validator(z.object({ token: text(100) }))
  .handler(async ({ data, context }) => {
    if (!/^[a-f0-9]{64}$/.test(data.token)) return null;
    return unwrap(await context.getSupabase().rpc("commande_par_jeton", { p_token: data.token }));
  });

// --- Legal pages (supabase/migrations/0010_pages_legales.sql): published ones only ---

const legalSlug = z.enum(LEGAL_SLUGS);

const isLegalPagePublished = async (supabase, slug) => {
  const { count, error } = await supabase
    .from("pages_legales")
    .select("slug", { count: "exact", head: true })
    .eq("slug", slug)
    .eq("published", true);
  return !error && count > 0;
};

// The published legal pages, in footer order: the root route loads them for every page. An
// error leaves the footer without them rather than breaking the site.
export const getLegalLinks = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { data, error } = await context.getSupabase().from("pages_legales").select("slug").eq("published", true);
  if (error) return [];
  return LEGAL_PAGES.filter((page) => data.some((row) => row.slug === page.slug));
});

// A legal page and what the footer needs. `page` is null while the page is a draft (even for an
// admin browsing the site): the route answers 404.
export const getLegalPage = createServerFn({ method: "GET" })
  .validator(z.object({ slug: legalSlug }))
  .handler(async ({ data, context }) => {
    const supabase = context.getSupabase();
    const [page, destinations, reseaux] = await Promise.all([
      supabase
        .from("pages_legales")
        .select("slug, title, body, updated_at")
        .eq("slug", data.slug)
        .eq("published", true)
        .maybeSingle()
        .then(unwrap),
      listOrdered(supabase, "destinations", 200),
      listOrdered(supabase, "reseaux_sociaux", 20),
    ]);
    return { page, destinations, reseaux };
  });

// --- Administration: admin role checked here, and again by row level security ---

export const listLegalPages = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const rows = unwrap(await context.getSupabase().from("pages_legales").select("*"));
    return LEGAL_SLUGS.map((slug) => rows.find((row) => row.slug === slug)).filter(Boolean);
  });

export const saveLegalPage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(z.object({ slug: legalSlug, body: text(60000), published: z.boolean() }))
  .handler(async ({ data, context }) => {
    if (data.published && findPlaceholders(data.body).length) {
      throw new Error("Complétez les passages entre [[ ]] : une page en ligne ne peut pas en contenir.");
    }
    unwrap(
      await context
        .getSupabase()
        .from("pages_legales")
        .update({ body: data.body, published: data.published })
        .eq("slug", data.slug),
    );
    return { ok: true };
  });

const destinationInput = z.object({
  id: z.uuid().optional(),
  name: text(200).min(1),
  region: text(200),
  text: text(2000),
  price: text(100),
  image: text(2000),
  tags: z.array(text(60)).max(20),
  sort_order: z.number(),
  // Empty: the database derives it from the name (supabase/migrations/0002_destination_pages.sql).
  slug: text(120).regex(/^[a-z0-9-]*$/, "Lettres minuscules, chiffres et tirets uniquement"),
  description: text(10000),
  highlights: z.array(text(200)).max(20),
  gallery: z.array(text(2000)).max(24),
  best_period: text(200),
  access: text(300),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
});

const formuleInput = z.object({
  id: z.uuid().optional(),
  name: text(200).min(1),
  price: text(100),
  duration: text(100),
  tagline: text(300),
  image: text(2000),
  highlight: z.boolean(),
  features: z.array(text(300)).max(30),
  sort_order: z.number(),
});

const faqInput = z.object({
  id: z.uuid().optional(),
  question: text(500).min(1),
  answer: text(5000).min(1),
  sort_order: z.number(),
});

export const saveDestination = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(destinationInput)
  .handler(({ data, context }) => saveRecord(context.getSupabase(), "destinations", data));

export const deleteDestination = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(idInput)
  .handler(({ data, context }) => deleteRecord(context.getSupabase(), "destinations", data.id));

export const saveFormule = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(formuleInput)
  .handler(({ data, context }) => saveRecord(context.getSupabase(), "formules", data));

export const deleteFormule = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(idInput)
  .handler(({ data, context }) => deleteRecord(context.getSupabase(), "formules", data.id));

export const saveFaq = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(faqInput)
  .handler(({ data, context }) => saveRecord(context.getSupabase(), "faqs", data));

export const deleteFaq = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(idInput)
  .handler(({ data, context }) => deleteRecord(context.getSupabase(), "faqs", data.id));

const circuitInput = z.object({
  id: z.uuid().optional(),
  title: text(200).min(1),
  kind: z.enum(["circuit", "excursion", "visite"]),
  // Empty: the database derives it from the title (supabase/migrations/0005_circuits.sql).
  slug: text(120).regex(/^[a-z0-9-]*$/, "Lettres minuscules, chiffres et tirets uniquement"),
  tagline: text(500),
  duration: text(100),
  price: text(100),
  departure: text(200),
  dates: text(300),
  image: text(2000),
  description: text(10000),
  included: z.array(text(300)).max(40),
  excluded: z.array(text(300)).max(40),
  // One step per day; the place, GPS position and photo (optional) draw the itinerary map.
  programme: z
    .array(
      z.object({
        title: text(200).min(1),
        description: text(3000),
        place: text(200).default(""),
        latitude: z.number().min(-90).max(90).nullable().default(null),
        longitude: z.number().min(-180).max(180).nullable().default(null),
        image: text(2000).default(""),
      }),
    )
    .max(60),
  published: z.boolean(),
  sort_order: z.number(),
});

export const listAllCircuits = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(({ context }) => listOrdered(context.getSupabase(), "circuits", 200));

export const saveCircuit = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(circuitInput)
  .handler(({ data, context }) => saveRecord(context.getSupabase(), "circuits", data));

export const deleteCircuit = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(idInput)
  .handler(({ data, context }) => deleteRecord(context.getSupabase(), "circuits", data.id));

const siteInput = z.object({
  id: z.uuid().optional(),
  name: text(200).min(1),
  // Empty: the database derives it from the name (supabase/migrations/0007_sites_touristiques.sql).
  slug: text(120).regex(/^[a-z0-9-]*$/, "Lettres minuscules, chiffres et tirets uniquement"),
  region: z.enum(["basse", "moyenne", "haute", "forestiere"]),
  category: z.enum(["nature", "plage", "culture"]),
  town: text(200),
  description: text(2000),
  image: text(2000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  approximate: z.boolean(),
  destination_slug: text(120),
  published: z.boolean(),
  sort_order: z.number(),
});

export const listAllSites = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(({ context }) => listOrdered(context.getSupabase(), "sites_touristiques", 500));

export const saveSite = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(siteInput)
  .handler(({ data, context }) => saveRecord(context.getSupabase(), "sites_touristiques", data));

export const deleteSite = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(idInput)
  .handler(({ data, context }) => deleteRecord(context.getSupabase(), "sites_touristiques", data.id));

const videoInput = z.object({
  id: z.uuid().optional(),
  title: text(200).min(1),
  description: text(1000),
  category: z.enum(["entreprise", "guinee"]),
  url: text(500).refine((url) => parseVideo(url) !== null, "Lien YouTube, Vimeo ou fichier .mp4 attendu"),
  poster: text(2000),
  duration: text(20),
  vertical: z.boolean(),
  published: z.boolean(),
  sort_order: z.number(),
});

export const listAllVideos = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(({ context }) => listOrdered(context.getSupabase(), "videos", 200));

export const saveVideo = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(videoInput)
  .handler(({ data, context }) => saveRecord(context.getSupabase(), "videos", data));

export const deleteVideo = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(idInput)
  .handler(({ data, context }) => deleteRecord(context.getSupabase(), "videos", data.id));

// New order of the videos (administration › Vidéos, arrows): the first visible one leads the home page.
export const reorderVideos = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(z.array(z.object({ id: z.uuid(), sort_order: z.number() })).max(200))
  .handler(async ({ data, context }) => {
    const supabase = context.getSupabase();
    for (const { id, sort_order } of data) {
      unwrap(await supabase.from("videos").update({ sort_order }).eq("id", id));
    }
    return { ok: true };
  });

const livreInput = z.object({
  id: z.uuid().optional(),
  title: text(200).min(1),
  // Empty: the database derives it from the title (supabase/migrations/0009_boutique.sql).
  slug: text(120).regex(/^[a-z0-9-]*$/, "Lettres minuscules, chiffres et tirets uniquement"),
  subtitle: text(300),
  author: text(200),
  kind: z.enum(["livre", "guide"]),
  description: text(10000),
  cover: text(2000),
  price_cents: z.number().int().min(50).max(100000),
  pages: z.number().int().min(1).max(5000).nullable(),
  language: text(60),
  file_path: text(300).regex(/^([\w-]+\.pdf)?$/, "Fichier PDF attendu"),
  file_size: z.number().int().min(0),
  published: z.boolean(),
  sort_order: z.number(),
});

export const listAllLivres = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(({ context }) => listOrdered(context.getSupabase(), "livres", 200));

export const saveLivre = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(livreInput)
  .handler(({ data, context }) => saveRecord(context.getSupabase(), "livres", data));

export const deleteLivre = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(idInput)
  .handler(({ data, context }) => deleteRecord(context.getSupabase(), "livres", data.id));

export const listCommandes = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(({ context }) =>
    context
      .getSupabase()
      .from("commandes")
      .select("*, lignes:commande_livres(title, price_cents)")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(unwrap),
  );

// Opens the download link for DOWNLOAD_DAYS days (counter back to zero) and e-mails it.
async function openDownloadLink(supabase, id, values = {}) {
  const lienExpireLe = new Date(Date.now() + DOWNLOAD_DAYS * 24 * 60 * 60 * 1000).toISOString();
  unwrap(await supabase.from("commandes").update({ ...values, lien_expire_le: lienExpireLe, telechargements: 0 }).eq("id", id));
  const commande = unwrap(
    await supabase.from("commandes").select("*, lignes:commande_livres(title, price_cents)").eq("id", id).single(),
  );
  const url = `${siteUrl(getRequest())}/telechargement/${commande.token}`;
  const emailed = await sendLienTelechargement(commande, url);
  return { ok: true, emailed };
}

// « Payée » opens the download link and sends it to the buyer; « Annulée » or « En attente »
// closes it (the link only works for a paid order).
export const setCommandeStatut = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(z.object({ id: z.uuid(), statut: z.enum(["en_attente", "payee", "annulee"]) }))
  .handler(async ({ data, context }) => {
    const supabase = context.getSupabase();
    if (data.statut === "payee") {
      return openDownloadLink(supabase, data.id, { statut: "payee", payee_le: new Date().toISOString() });
    }
    return saveRecord(supabase, "commandes", data);
  });

// A paid order's link again: 30 more days, counter back to zero, e-mailed once more.
export const renvoyerLienCommande = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(idInput)
  .handler(async ({ data, context }) => {
    const supabase = context.getSupabase();
    const { statut } = unwrap(await supabase.from("commandes").select("statut").eq("id", data.id).single());
    if (statut !== "payee") throw new Error("Seule une commande payée a un lien de téléchargement.");
    return openDownloadLink(supabase, data.id);
  });

export const deleteCommande = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(idInput)
  .handler(({ data, context }) => deleteRecord(context.getSupabase(), "commandes", data.id));

export const listReseauxSociaux = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(({ context }) => listOrdered(context.getSupabase(), "reseaux_sociaux", 20));

// The networks are fixed rows (supabase/migrations/0003_reseaux_sociaux.sql): only their URL changes.
export const saveReseauxSociaux = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    z
      .array(
        z.object({
          reseau: z.enum(["facebook", "instagram", "tiktok", "youtube", "x"]),
          url: text(500).refine((url) => url === "" || /^https:\/\/\S+$/.test(url), "Adresse en https:// attendue"),
        }),
      )
      .max(5),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.getSupabase();
    for (const { reseau, url } of data) {
      unwrap(await supabase.from("reseaux_sociaux").update({ url }).eq("reseau", reseau));
    }
    return { ok: true };
  });

export const listDemandes = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(({ context }) =>
    context
      .getSupabase()
      .from("demandes_sejour")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(unwrap),
  );

export const updateDemandeStatut = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(z.object({ id: z.uuid(), statut: z.enum(["nouveau", "en cours", "traite"]) }))
  .handler(({ data, context }) => saveRecord(context.getSupabase(), "demandes_sejour", data));

export const deleteDemande = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(idInput)
  .handler(({ data, context }) => deleteRecord(context.getSupabase(), "demandes_sejour", data.id));
