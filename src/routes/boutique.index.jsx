import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Compass, Mail, Scissors, Sparkles, Truck } from "lucide-react";
import { breadcrumbLd, seo } from "@/lib/seo";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import ArticleCard from "@/components/boutique/ArticleCard";
import BookCard from "@/components/boutique/BookCard";
import { SHOP_CATEGORIES, VENTE_EN_LIGNE } from "@/lib/boutique";
import { getBoutiquePage } from "@/lib/server-fns";
import { IMAGES } from "@/data/site";
import { cn } from "@/lib/utils";

// The router marks a link « current » only on the very same address (not on ?page=2 for page 1).
const EXACT = { exact: true, includeSearch: true };

// Articles per page in a section (a multiple of 2, 3 and 4: full rows at every width).
const PER_PAGE = 12;

// The shop's sections: the articles' categories, then the books.
const SECTIONS = [...SHOP_CATEGORIES, { key: "livres", label: "Livres & guides", short: "Livres" }];
const SECTION_KEYS = SECTIONS.map((section) => section.key);

const INTRO = {
  "": VENTE_EN_LIGNE
    ? "Mode, sacs et bijoux de créateurs, livres et guides sur la Guinée : commandez en ligne, nous vous accompagnons jusqu'à la livraison."
    : "Mode, sacs et bijoux de créateurs, livres et guides sur la Guinée. La vente en ligne ouvre bientôt : réservez dès maintenant sur WhatsApp.",
  femme: "Robes, kaftans, kimonos et ensembles en wax, bazin, brocart ou pagne tissé, pour les cérémonies comme pour tous les jours.",
  homme: "Chemises, vestes, capes et ensembles en pagne tissé, kente ou wax : des pièces fortes, faciles à porter.",
  sacs: "Sacs à main, cabas et pochettes en pagne, cousus et finis à la main.",
  bijoux: "Boucles d'oreilles en tissu ou dorées, pour une touche de couleur et de lumière.",
  livres: "Guides de voyage et livres sur la Guinée en PDF, à lire sur téléphone, tablette ou ordinateur.",
};

const TITLE = {
  "": "Mode africaine, sacs, bijoux et livres — SYSI TRAVEL",
  femme: "Robes, kaftans et ensembles africains — SYSI TRAVEL",
  homme: "Mode homme africaine : chemises, vestes — SYSI TRAVEL",
  sacs: "Sacs en pagne et wax faits main — Boutique SYSI TRAVEL",
  bijoux: "Boucles d'oreilles en tissu et dorées — Boutique SYSI TRAVEL",
  livres: "Livres et guides sur la Guinée en PDF — Boutique SYSI TRAVEL",
};

const PROMISES = [
  VENTE_EN_LIGNE
    ? { icon: Mail, title: "Paiement accompagné", text: "Rien n'est payé en ligne : nous vous contactons sous 72 h pour régler votre commande simplement." }
    : { icon: Mail, title: "Paiement en ligne bientôt", text: "La vente en ligne ouvre très prochainement, avec un paiement sécurisé. En attendant, réservez sur WhatsApp." },
  { icon: Truck, title: "Livraison suivie", text: "Frais confirmés avant paiement, puis un e-mail à chaque étape : préparation, expédition, livraison." },
  { icon: Scissors, title: "Sur mesure", text: "La plupart des vêtements existent aussi sur mesure : vos mesures vous sont demandées après la commande." },
];

export const Route = createFileRoute("/boutique/")({
  validateSearch: (search) => {
    const page = Number.parseInt(search.page, 10);
    return {
      categorie: SECTION_KEYS.includes(search.categorie) ? search.categorie : undefined,
      page: Number.isFinite(page) && page > 1 ? page : undefined,
    };
  },
  loaderDeps: ({ search }) => ({ categorie: search.categorie }),
  loader: async ({ deps }) => ({ ...(await getBoutiquePage()), categorie: deps.categorie ?? "" }),
  head: ({ loaderData }) => {
    const categorie = loaderData?.categorie ?? "";
    const section = SECTIONS.find((item) => item.key === categorie);
    const path = categorie ? `/boutique?categorie=${categorie}` : "/boutique";
    return seo({
      title: TITLE[categorie],
      description: INTRO[categorie],
      path: "/boutique",
      image: loaderData?.articles?.[0]?.variants?.[0]?.images?.[0],
      scripts: [breadcrumbLd([["Accueil", "/"], ["Boutique", "/boutique"], ...(section ? [[section.label, path]] : [])])],
    });
  },
  component: BoutiquePage,
});

function BoutiquePage() {
  const { articles, livres, destinations, reseaux, categorie } = Route.useLoaderData();
  const { page = 1 } = Route.useSearch();
  const countOf = (key) => (key === "livres" ? livres.length : articles.filter((article) => article.category === key).length);
  const sections = SECTIONS.filter((section) => countOf(section.key) > 0);
  const current = SECTIONS.find((section) => section.key === categorie);

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid bookingHref="/contact" />

      <main>
        <section className="bg-background pb-14 pt-28 lg:pb-20 lg:pt-32">
          <div className="mx-auto max-w-site px-6">
            {/* A compact header: the way back and where we are, then the title beside its text. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <BackButton label="Retour" className="px-3.5 py-2 text-[0.7rem]" />
              <nav aria-label="Fil d'Ariane" className="label-caps flex flex-wrap items-center gap-2 text-[0.7rem] text-gold-deep">
                {current ? (
                  <>
                    <Link to="/boutique" className="transition-colors hover:text-petrol">
                      Boutique
                    </Link>
                    <span aria-hidden="true" className="text-petrol/30">/</span>
                    <span className="text-petrol/55">{current.label}</span>
                  </>
                ) : (
                  <span>Boutique SYSI TRAVEL</span>
                )}
              </nav>
            </div>
            <div className="mt-4 grid gap-x-12 gap-y-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-end">
              <h1 className="text-[clamp(1.9rem,3.4vw,2.7rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
                {current ? current.label : "Mode, sacs, bijoux et livres"}
              </h1>
              <p className="text-[0.98rem] leading-relaxed text-petrol/70 lg:pb-1">{INTRO[categorie]}</p>
            </div>

            {/* Sections of the shop, always in view: one tap to the right shelf. */}
            <nav aria-label="Rayons de la boutique" className="-mx-6 mt-7 overflow-x-auto px-6 [scrollbar-width:none]">
              <ul className="flex w-max gap-2 lg:w-auto lg:flex-wrap">
                <li>
                  <ShelfLink active={!categorie} search={{}}>
                    Tout <span className="opacity-60">({articles.length + livres.length})</span>
                  </ShelfLink>
                </li>
                {sections.map((section) => (
                  <li key={section.key}>
                    <ShelfLink active={categorie === section.key} search={{ categorie: section.key }}>
                      {section.label} <span className="opacity-60">({countOf(section.key)})</span>
                    </ShelfLink>
                  </li>
                ))}
                <li>
                  <a
                    href="/produits"
                    className="label-caps inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-petrol/20 px-5 py-2.5 text-petrol/70 transition-colors duration-300 hover:border-gold hover:text-petrol"
                  >
                    Produits du terroir <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </li>
              </ul>
            </nav>

            {categorie && countOf(categorie) === 0 && articles.length + livres.length > 0 ? (
              // A section with nothing in it yet (the menu always links to « Livres & guides »).
              <div className="mt-10 max-w-2xl border border-petrol/15 bg-white p-8">
                <p className="label-caps text-gold-deep">Bientôt disponible</p>
                <p className="mt-3 text-[1rem] leading-relaxed text-petrol/75">
                  {categorie === "livres"
                    ? "Nos premiers livres et guides sur la Guinée arrivent bientôt. En attendant, découvrez nos créations."
                    : "Les premières pièces de ce rayon arrivent bientôt. En attendant, découvrez le reste de la boutique."}
                </p>
                <Link
                  to="/boutique"
                  className="label-caps mt-6 inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-2.5 text-ivory transition-colors hover:bg-petrol-deep"
                >
                  Voir la boutique <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : categorie ? (
              <Shelf categorie={categorie} articles={articles} livres={livres} page={page} />
            ) : (
              <div className="mt-10 space-y-14">
                {sections.map((section) => (
                  <section key={section.key} aria-labelledby={`rayon-${section.key}`}>
                    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-petrol/10 pb-4">
                      <h2 id={`rayon-${section.key}`} className="text-[clamp(1.4rem,2.4vw,1.9rem)] font-bold text-petrol">
                        {section.label}
                      </h2>
                      <Link
                        to="/boutique"
                        search={{ categorie: section.key }}
                        className="label-caps inline-flex items-center gap-2 text-gold-deep transition-colors hover:text-petrol"
                      >
                        Voir tout ({countOf(section.key)}) <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <Shelf categorie={section.key} articles={articles} livres={livres} limit={4} />
                  </section>
                ))}
                <TerroirBanner />
              </div>
            )}

            {articles.length + livres.length === 0 ? (
              <div className="mt-10 max-w-2xl border border-petrol/15 bg-white p-8">
                <p className="label-caps text-gold-deep">Bientôt disponible</p>
                <p className="mt-3 text-[1rem] leading-relaxed text-petrol/75">
                  Nos premières pièces arrivent. En attendant, partez à la découverte des sites de Guinée.
                </p>
                <Link
                  to="/explorer"
                  className="label-caps mt-6 inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-2.5 text-ivory transition-colors hover:bg-petrol-deep"
                >
                  <Compass className="h-4 w-4" /> Explorer la Guinée
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="border-t border-petrol/10 bg-ivory-soft py-14">
          <div className="mx-auto grid max-w-site gap-8 px-6 md:grid-cols-3">
            {PROMISES.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 90}>
                <div className="flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-petrol/15 bg-white text-gold-deep">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <h2 className="font-display text-[1.05rem] font-bold text-petrol">{title}</h2>
                    <p className="mt-1.5 text-[0.92rem] leading-relaxed text-petrol/65">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}

function ShelfLink({ active, search, children }) {
  return (
    <Link
      to="/boutique"
      search={search}
      activeOptions={EXACT}
      aria-current={active ? "page" : undefined}
      className={cn(
        "label-caps inline-flex items-baseline gap-1.5 whitespace-nowrap rounded-full border px-5 py-2.5 transition-colors duration-300",
        active ? "border-petrol bg-petrol text-ivory" : "border-petrol/20 text-petrol/70 hover:border-gold hover:text-petrol",
      )}
    >
      {children}
    </Link>
  );
}

// The items of one section: articles, or books for « livres ». `limit`: a preview on « Tout »;
// without it, the section is shown PER_PAGE items at a time, with its pages below.
function Shelf({ categorie, articles, livres, limit, page = 1 }) {
  const books = categorie === "livres";
  const items = books ? livres : articles.filter((article) => article.category === categorie);
  const pages = limit ? 1 : Math.max(1, Math.ceil(items.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = limit ? items.slice(0, limit) : items.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <div id={limit ? undefined : "rayon"} className="scroll-mt-28">
      {books ? (
        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((livre, index) => (
            <Reveal key={livre.id} delay={(index % 4) * 70} className="h-full">
              <BookCard book={livre} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {visible.map((article, index) => (
            <Reveal key={article.id} delay={(index % 4) * 70} className="h-full">
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </div>
      )}
      {pages > 1 ? (
        <Pagination categorie={categorie} current={current} pages={pages} total={items.length} books={books} />
      ) : null}
    </div>
  );
}

// « 13–24 sur 35 articles » and the page links. Each link is a real address (?page=2), so a page
// can be shared and the browser's back button returns to the previous one.
function Pagination({ categorie, current, pages, total, books }) {
  const first = (current - 1) * PER_PAGE + 1;
  const last = Math.min(current * PER_PAGE, total);
  const search = (number) => ({ categorie, page: number > 1 ? number : undefined });
  const stepClass =
    "label-caps inline-flex h-10 items-center gap-2 rounded-full border border-petrol/20 px-4 text-petrol transition-colors hover:border-gold";

  return (
    <nav aria-label="Pages du rayon" className="mt-12 flex flex-col items-center gap-4 border-t border-petrol/10 pt-8">
      <p className="text-[0.9rem] text-petrol/60">
        {first}–{last} sur {total} {books ? "livres" : "articles"}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {current > 1 ? (
          <Link to="/boutique" search={search(current - 1)} hash="rayon" activeOptions={EXACT} className={stepClass} aria-label="Page précédente">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Précédente</span>
          </Link>
        ) : null}
        {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
          <Link
            key={number}
            to="/boutique"
            search={search(number)}
            activeOptions={EXACT}
            hash="rayon"
            aria-label={`Page ${number}`}
            aria-current={number === current ? "page" : undefined}
            className={cn(
              "inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-full border px-3 font-display text-[0.95rem] font-bold transition-colors",
              number === current ? "border-petrol bg-petrol text-ivory" : "border-petrol/20 text-petrol hover:border-gold",
            )}
          >
            {number}
          </Link>
        ))}
        {current < pages ? (
          <Link to="/boutique" search={search(current + 1)} hash="rayon" activeOptions={EXACT} className={stepClass} aria-label="Page suivante">
            <span className="hidden sm:inline">Suivante</span> <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

function TerroirBanner() {
  return (
    <a
      href="/produits"
      className="group relative isolate flex min-h-[14rem] items-end overflow-hidden rounded-3xl bg-petrol-deep p-8 sm:p-10"
    >
      <img
        src={IMAGES.textile}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-petrol-deep via-petrol-deep/70 to-transparent" />
      <div className="max-w-lg">
        <p className="label-caps inline-flex items-center gap-2 text-gold">
          <Sparkles className="h-4 w-4" /> Produits du terroir
        </p>
        <p className="mt-3 font-display text-[clamp(1.4rem,2.6vw,2rem)] font-bold leading-tight text-ivory">
          Pagnes, beurre de karité, jarres et calebasses
        </p>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ivory/75">L'artisanat de Guinée, à commander sur WhatsApp.</p>
        <span className="label-caps mt-6 inline-flex items-center gap-2 text-gold">
          Découvrir <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </a>
  );
}
