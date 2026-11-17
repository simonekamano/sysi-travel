import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowRight, Clapperboard, Map as MapIcon, MapPin, MessagesSquare, NotebookPen, Quote, Route as RouteIcon, UsersRound } from "lucide-react";
import BackButton from "@/components/BackButton";
import StoryText from "@/components/histoire/StoryText";
import Footer from "@/components/landing/Footer";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { ACCOMPAGNEMENT, extractQuote, splitStory } from "@/lib/histoire";
import { AGENCY_ID, breadcrumbLd, fitDescription, fitTitle, jsonLd, noindex, pageUrl, seo } from "@/lib/seo";
import { getHistoirePage } from "@/lib/server-fns";
import { absoluteUrl } from "@/data/site";
import { cn } from "@/lib/utils";

const PATH = "/notre-histoire";

export const Route = createFileRoute("/notre-histoire")({
  loader: async () => {
    const data = await getHistoirePage();
    if (!data.histoire) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const histoire = loaderData?.histoire;
    if (!histoire) return noindex("Notre histoire — SYSI TRAVEL");
    const name = histoire.signature || histoire.titre;
    const role = histoire.role ? histoire.role.charAt(0).toLowerCase() + histoire.role.slice(1) : "";
    return seo({
      title: fitTitle(`Notre histoire — ${name} | SYSI TRAVEL`, "Notre histoire | SYSI TRAVEL"),
      description: fitDescription(
        `${[name, role].filter(Boolean).join(", ")}, raconte pourquoi elle a créé SYSI TRAVEL : faire découvrir la Guinée à la diaspora et aux voyageurs.`,
      ),
      path: PATH,
      image: histoire.photo_portrait || undefined,
      imageAlt: name,
      type: "profile",
      links: histoire.photo_portrait ? [{ rel: "preload", as: "image", href: histoire.photo_portrait, fetchPriority: "high" }] : [],
      scripts: [
        breadcrumbLd([["Accueil", "/"], ["Notre histoire", PATH]]),
        jsonLd({
          "@type": "AboutPage",
          url: pageUrl(PATH),
          name: "Notre histoire",
          inLanguage: "fr",
          about: { "@id": AGENCY_ID },
          ...(histoire.signature
            ? {
                mainEntity: {
                  "@type": "Person",
                  name: histoire.signature,
                  ...(histoire.role ? { jobTitle: histoire.role } : {}),
                  ...(histoire.photo_portrait ? { image: absoluteUrl(histoire.photo_portrait) } : {}),
                  worksFor: { "@id": AGENCY_ID },
                },
              }
            : {}),
        }),
      ],
    });
  },
  component: HistoirePage,
});

const ICONS = { avant: MessagesSquare, pendant: UsersRound, apres: NotebookPen };

// What « Bien plus qu'une agence de voyages » talks about, beside the first part that has
// neither photo nor quote.
const DECOUVRIR = [
  { icon: RouteIcon, label: "Circuits & excursions", text: "Explorer ses richesses avec des guides locaux", href: "/circuits" },
  { icon: MapIcon, label: "Explorer la Guinée", text: "La carte des sites, région par région", href: "/explorer" },
  { icon: MapPin, label: "Destinations", text: "Les plus beaux lieux du pays", href: "/destinations" },
  { icon: Clapperboard, label: "Vidéos", text: "La Guinée et nos voyages en images", href: "/videos" },
];

// A sentence of the story, standing large on the right of its part.
function QuoteCard({ quote, author }) {
  return (
    <figure className="rounded-3xl bg-background px-6 pb-7 pt-6 sm:px-5 sm:pb-6 sm:pt-5 lg:px-7 lg:pb-8 lg:pt-7">
      <Quote aria-hidden className="h-7 w-7 fill-gold/25 text-gold" strokeWidth={1.4} />
      <blockquote className="mt-3 font-display text-[1.2rem] italic leading-snug text-petrol sm:text-[1.05rem] md:text-[1.1rem] lg:text-[1.2rem] xl:text-[1.3rem]">
        {quote}
      </blockquote>
      {author ? (
        <figcaption className="label-caps mt-5 flex items-center gap-3 text-[0.7rem] text-gold-deep">
          <span aria-hidden className="h-px w-6 bg-gold" />
          {author}
        </figcaption>
      ) : null}
    </figure>
  );
}

// The « À découvrir » links, as a band across the width at the end of their part.
function DiscoverBand() {
  return (
    <nav aria-label="À découvrir sur SYSI TRAVEL" className="rounded-3xl bg-petrol p-6 text-ivory sm:p-7">
      <p className="eyebrow text-gold">À découvrir</p>
      <p className="mt-2 font-display text-[1.3rem] font-bold leading-snug">Tout ce qui vous attend sur SYSI TRAVEL</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DECOUVRIR.map(({ icon: Icon, label, text, href }) => (
          <li key={href}>
            <a href={href} className="group flex h-full items-start gap-3 rounded-2xl bg-ivory/[0.06] p-4 transition-colors hover:bg-ivory/10 lg:flex-col">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory/10 text-gold transition-colors group-hover:bg-gold group-hover:text-petrol-deep">
                <Icon className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.7} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-semibold text-ivory transition-colors group-hover:text-gold">
                  {label} <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gold transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-0.5 block text-[0.86rem] leading-snug text-ivory/65">{text}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// A framed photo of the story, standing next to its part on large screens.
function Photo({ src, alt, priority = false, className }) {
  return (
    <figure className={cn("relative", className)}>
      <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 border border-gold/70 sm:translate-x-4 sm:translate-y-4" />
      <img
        src={src}
        alt={alt}
        width={716}
        height={884}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className="relative block aspect-[4/5] w-full bg-petrol/10 object-cover"
      />
    </figure>
  );
}

// A part of the story. From 640 px its photo or quote stands on the right and the text flows
// around it, then under it across the whole width: no empty column. On phones it comes after
// the text (the flex order). `band`: a block across the width that closes the part.
function Part({ part, aside, band, children }) {
  return (
    <Reveal className="flex flex-col sm:flow-root">
      {part.title ? (
        <h2 className="mb-5 font-display text-[clamp(1.5rem,2.6vw,2rem)] font-bold leading-tight text-petrol">{part.title}</h2>
      ) : null}
      {aside ? (
        <div className="order-last mt-8 sm:float-right sm:mb-4 sm:ml-6 sm:mt-1.5 sm:w-56 md:ml-8 md:w-64 lg:ml-10 lg:w-72 xl:w-[18.5rem]">
          {aside}
        </div>
      ) : null}
      <StoryText body={part.body} />
      {band ? <div className="order-last mt-8 sm:clear-both">{band}</div> : null}
      {children}
    </Reveal>
  );
}

function HistoirePage() {
  const { histoire, destinations, reseaux } = Route.useLoaderData();
  const parts = splitStory(histoire.recit);
  const name = histoire.signature || "la fondatrice de SYSI TRAVEL";
  const steps = ACCOMPAGNEMENT.filter((step) => histoire[step.key]);
  // On the right of each part: the first story photo for the first part, the second for the
  // last one; otherwise the part's highlighted sentence, taken out of its text. The first part
  // with neither ends with the « À découvrir » links.
  const photoFor = (index) => {
    if (index === 0) return histoire.photo_recit_1;
    if (index === parts.length - 1) return histoire.photo_recit_2;
    return "";
  };
  const firstWithoutAside = parts.findIndex((part, index) => !photoFor(index) && !extractQuote(part.body).quote);
  const sections = parts.map((part, index) => {
    const photo = photoFor(index);
    if (photo) return { part, aside: <Photo src={photo} alt={name} className="mb-3 mr-3 sm:mb-4 sm:mr-4" /> };
    const { quote, body } = extractQuote(part.body);
    if (quote) return { part: { ...part, body }, aside: <QuoteCard quote={quote} author={histoire.signature} /> };
    return { part, band: index === firstWithoutAside ? <DiscoverBand /> : null };
  });

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid bookingHref="/contact" />

      <main>
        <section className="overflow-hidden bg-background pb-12 pt-32 md:pb-16 lg:pb-24 lg:pt-40">
          <div className="mx-auto grid max-w-site items-center gap-10 px-6 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] sm:gap-8 md:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
            <div>
              <BackButton label="Retour" className="mb-8" />
              <p className="eyebrow text-gold-deep">Notre histoire</p>
              <h1 className="mt-4 text-[clamp(2.3rem,5vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.02em] text-petrol">
                {histoire.titre}
              </h1>
              {histoire.role ? <p className="label-caps mt-6 text-gold-deep">{histoire.role}</p> : null}
              {histoire.accroche ? (
                <p className="mt-4 max-w-xl font-display text-[clamp(1.2rem,2vw,1.5rem)] leading-snug text-petrol/80">
                  {histoire.accroche}
                </p>
              ) : null}
              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#recit"
                  className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-3 text-ivory transition-colors hover:bg-petrol-deep"
                >
                  Lire mon histoire <ArrowRight className="h-4 w-4 text-gold" />
                </a>
                {steps.length ? (
                  <a
                    href="#accompagnement"
                    className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-5 py-3 text-petrol transition-colors hover:border-gold-deep hover:text-gold-deep"
                  >
                    Notre accompagnement
                  </a>
                ) : null}
              </div>
            </div>
            {histoire.photo_portrait ? (
              <Photo src={histoire.photo_portrait} alt={name} priority className="mx-auto w-full max-w-sm sm:max-w-none lg:mr-4" />
            ) : null}
          </div>
        </section>

        {parts.length ? (
          <section id="recit" className="scroll-mt-28 border-t border-petrol/10 bg-white py-14 lg:py-20">
            <div className="mx-auto max-w-[50rem] space-y-12 px-6 lg:space-y-16 xl:max-w-[54rem]">
              {sections.map(({ part, aside, band }, index) => (
                <Part key={`${index}-${part.title}`} part={part} aside={aside} band={band}>
                  {index === sections.length - 1 && histoire.signature ? (
                    <div className="order-last mt-10 flow-root border-t border-petrol/15 pt-6">
                      <p className="font-display text-[1.6rem] italic leading-tight text-petrol">{histoire.signature}</p>
                      {histoire.role ? <p className="label-caps mt-2 text-gold-deep">{histoire.role}</p> : null}
                    </div>
                  ) : null}
                </Part>
              ))}
            </div>
          </section>
        ) : null}

        {steps.length ? (
          <section id="accompagnement" className="scroll-mt-28 bg-petrol py-14 text-ivory lg:py-20">
            <div className="mx-auto max-w-site px-6">
              <Reveal>
                <SectionHeading
                  tone="light"
                  eyebrow="Notre accompagnement"
                  title="Avant, pendant et après le voyage"
                  text="Un voyage qui commence bien avant le départ et qui continue après le retour."
                />
              </Reveal>
              <ol className="mt-10 grid gap-5 md:grid-cols-3 lg:gap-6">
                {steps.map((step, index) => {
                  const Icon = ICONS[step.key];
                  return (
                    <li key={step.key}>
                      <Reveal delay={index * 110} className="h-full">
                        <div className="h-full rounded-2xl border border-ivory/15 bg-ivory/[0.04] p-6 lg:p-7">
                          <div className="flex items-center gap-4">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-petrol-deep">
                              <Icon className="h-5 w-5" strokeWidth={1.7} />
                            </span>
                            <span className="font-display text-[0.95rem] tracking-[0.3em] text-gold">0{index + 1}</span>
                          </div>
                          <h3 className="mt-6 text-[1.15rem] font-semibold text-ivory">{step.title}</h3>
                          <p className="mt-3 text-[0.97rem] leading-relaxed text-ivory/75">{histoire[step.key]}</p>
                        </div>
                      </Reveal>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        ) : null}

        <section className="bg-background py-16 lg:py-20">
          <Reveal className="mx-auto max-w-3xl px-6 text-center">
            <p className="eyebrow text-gold-deep">Votre voyage</p>
            <h2 className="mt-4 text-[clamp(1.8rem,3.4vw,2.7rem)] font-bold leading-[1.1] tracking-[-0.015em] text-petrol">
              Et si votre histoire continuait en Guinée ?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-relaxed text-petrol/70">
              Racontez-nous ce que vous aimeriez découvrir, retrouver ou transmettre : nous vous
              répondons sous 72 heures avec un itinéraire.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/contact"
                className="label-caps inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-petrol-deep transition-colors hover:bg-petrol hover:text-ivory"
              >
                Préparer mon voyage <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/circuits"
                className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-6 py-3 text-petrol transition-colors hover:border-gold-deep hover:text-gold-deep"
              >
                Voir les circuits
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}
