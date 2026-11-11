import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Download, FileText, Languages, Mail, Smartphone } from "lucide-react";
import BackButton from "@/components/BackButton";
import { NotFound } from "@/components/NotFound";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import BookCover from "@/components/boutique/BookCover";
import BookCard from "@/components/boutique/BookCard";
import AddToCartButton from "@/components/boutique/AddToCartButton";
import { absoluteUrl } from "@/data/site";
import { BOOK_KIND_LABEL, DOWNLOAD_DAYS, formatPrice, formatSize } from "@/lib/boutique";
import { useCart } from "@/lib/cart";
import { getLivrePage } from "@/lib/server-fns";
import { AGENCY_ID, breadcrumbLd, jsonLd, noindex, pageUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/boutique/$slug")({
  loader: async ({ params }) => {
    const data = await getLivrePage({ data: { slug: params.slug } });
    if (!data.livre) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const livre = loaderData?.livre;
    if (!livre) return noindex("Livre introuvable — SYSI TRAVEL");
    const description =
      livre.subtitle || livre.description.slice(0, 160) || `${BOOK_KIND_LABEL[livre.kind]} en PDF sur la Guinée, par SYSI TRAVEL.`;
    const path = `/boutique/${livre.slug}`;
    return seo({
      title: `${livre.title} — ${BOOK_KIND_LABEL[livre.kind]} PDF | SYSI TRAVEL`,
      description,
      path,
      image: livre.cover,
      imageAlt: livre.title,
      type: "product",
      scripts: [
        jsonLd({
          "@type": ["Book", "Product"],
          name: livre.title,
          description,
          url: pageUrl(path),
          ...(livre.cover ? { image: absoluteUrl(livre.cover) } : {}),
          ...(livre.author ? { author: { "@type": "Person", name: livre.author } } : {}),
          ...(livre.language ? { inLanguage: livre.language } : {}),
          ...(livre.pages ? { numberOfPages: livre.pages } : {}),
          bookFormat: "https://schema.org/EBook",
          publisher: { "@id": AGENCY_ID },
          offers: {
            "@type": "Offer",
            price: ((livre.price_cents ?? 0) / 100).toFixed(2),
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: pageUrl(path),
          },
        }),
        breadcrumbLd([["Accueil", "/"], ["Livres et guides", "/boutique"], [livre.title, path]]),
      ],
    });
  },
  notFoundComponent: () => (
    <NotFound>
      Ce livre n'existe pas ou n'est plus en vente.{" "}
      <Link to="/boutique" className="text-gold-deep underline underline-offset-4">
        Voir la boutique
      </Link>
    </NotFound>
  ),
  component: LivrePage,
});

const STEPS = [
  { icon: Mail, text: "Vous commandez : nous vous contactons sous 72 h pour le paiement." },
  { icon: Download, text: `Paiement reçu : votre lien de téléchargement arrive par e-mail, valable ${DOWNLOAD_DAYS} jours.` },
  { icon: Smartphone, text: "Vous lisez le PDF sur téléphone, tablette ou ordinateur." },
];

function LivrePage() {
  const { livre, others, destinations, reseaux } = Route.useLoaderData();
  const cart = useCart();
  const navigate = useNavigate();
  const paragraphs = livre.description.split(/\n\s*\n/).filter((paragraph) => paragraph.trim());

  const details = [
    { icon: FileText, label: "Format", value: `PDF${livre.file_size ? ` · ${formatSize(livre.file_size)}` : ""}` },
    ...(livre.pages ? [{ icon: FileText, label: "Pages", value: String(livre.pages) }] : []),
    { icon: Languages, label: "Langue", value: livre.language },
  ];

  const orderNow = () => {
    cart.add(livre.id);
    navigate({ to: "/panier" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid bookingHref="/contact" />

      <main>
        <section className="bg-background pb-16 pt-36 lg:pb-24 lg:pt-40">
          <div className="mx-auto max-w-site px-6">
            <BackButton label="Boutique" className="mb-10" />
            <div className="grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
              <div className="book-hover lg:sticky lg:top-32 lg:self-start">
                <BookCover book={livre} eager className="mx-auto w-[min(78%,20.57rem)]" />
              </div>

              <div>
                <p className="eyebrow text-gold-deep">{BOOK_KIND_LABEL[livre.kind]}</p>
                <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
                  {livre.title}
                </h1>
                {livre.subtitle ? <p className="mt-4 text-[1.15rem] leading-relaxed text-petrol/75">{livre.subtitle}</p> : null}
                {livre.author ? <p className="mt-3 text-[0.98rem] text-petrol/60">par {livre.author}</p> : null}

                <div className="mt-8 flex flex-wrap items-center gap-4 border-y border-petrol/10 py-6">
                  <span className="mr-2 font-display text-[2rem] font-extrabold text-petrol">{formatPrice(livre.price_cents)}</span>
                  <AddToCartButton book={livre} size="lg" />
                  {cart.has(livre.id) ? null : (
                    <button
                      type="button"
                      onClick={orderNow}
                      className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-7 py-4 text-petrol transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-petrol-deep"
                    >
                      Commander <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-[0.92rem]">
                  {details.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gold-deep" strokeWidth={1.7} />
                      <dt className="text-petrol/55">{label}</dt>
                      <dd className="font-semibold text-petrol">{value}</dd>
                    </div>
                  ))}
                </dl>

                {paragraphs.length ? (
                  <div className="mt-10 space-y-4 text-[1.02rem] leading-relaxed text-petrol/80">
                    {paragraphs.map((paragraph, index) => (
                      <p key={index} className="whitespace-pre-line">
                        {paragraph.trim()}
                      </p>
                    ))}
                  </div>
                ) : null}

                <div className="mt-12 border border-petrol/15 bg-white p-6">
                  <p className="label-caps text-gold-deep">Comment ça marche</p>
                  <ol className="mt-5 space-y-4">
                    {STEPS.map(({ icon: Icon, text }, index) => (
                      <li key={text} className="flex items-start gap-4 text-[0.95rem] leading-relaxed text-petrol/75">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-petrol text-[0.8rem] font-bold text-gold">
                          {index + 1}
                        </span>
                        <span className="flex items-start gap-2 pt-1.5">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.7} />
                          {text}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {others.length ? (
          <section className="border-t border-petrol/10 bg-ivory-soft py-16">
            <div className="mx-auto max-w-site px-6">
              <h2 className="font-display text-[1.6rem] font-bold text-petrol">À lire aussi</h2>
              <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((other, index) => (
                  <Reveal key={other.id} delay={index * 90} className="h-full">
                    <BookCard book={other} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}
