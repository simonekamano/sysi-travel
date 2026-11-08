import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-middleware";
import { sendDemandeEmails } from "@/lib/mail";

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
  const [destinations, formules, faqs, reseaux] = await Promise.all([
    listOrdered(supabase, "destinations", 200),
    listOrdered(supabase, "formules", 50),
    listOrdered(supabase, "faqs", 200),
    listOrdered(supabase, "reseaux_sociaux", 20),
  ]);
  return { destinations, formules, faqs, reseaux };
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

// Each request sends two e-mails, so a visitor may send at most DEMANDE_LIMIT requests per
// DEMANDE_WINDOW_MS. In memory: one Node process serves the site (docker-compose.yml).
const DEMANDE_LIMIT = 5;
const DEMANDE_WINDOW_MS = 15 * 60 * 1000;
const recentDemandes = new Map();

function checkDemandeRate() {
  // Nginx sets X-Real-IP to the client address and overwrites any value the client sent.
  const ip = getRequestHeader("x-real-ip") || getRequestIP() || "inconnu";
  const now = Date.now();
  const times = (recentDemandes.get(ip) ?? []).filter((time) => now - time < DEMANDE_WINDOW_MS);
  if (times.length >= DEMANDE_LIMIT) {
    throw new Error("Trop de demandes envoyées. Réessayez dans quelques minutes ou écrivez-nous sur WhatsApp.");
  }
  recentDemandes.set(ip, [...times, now]);
  if (recentDemandes.size > 5000) {
    for (const [key, list] of recentDemandes) if (list.every((time) => now - time >= DEMANDE_WINDOW_MS)) recentDemandes.delete(key);
  }
}

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
      // Hidden field of the form (spam trap): only robots fill it in.
      site_web: text(500).optional(),
    }),
  )
  .handler(async ({ data: { site_web, ...demande }, context }) => {
    if (site_web) return { ok: true };
    checkDemandeRate();
    unwrap(await context.getSupabase().from("demandes_sejour").insert({ ...demande, statut: "nouveau" }));
    await sendDemandeEmails(demande);
    return { ok: true };
  });

// --- Administration: admin role checked here, and again by row level security ---

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
