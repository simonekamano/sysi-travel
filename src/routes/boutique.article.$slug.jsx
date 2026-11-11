import { useMemo, useState } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Mail, MessageCircle, Minus, Plus, Ruler, ShoppingBag, Truck } from "lucide-react";
import BackButton from "@/components/BackButton";
import { NotFound } from "@/components/NotFound";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import ArticleCard from "@/components/boutique/ArticleCard";
import { CONTACT, absoluteUrl } from "@/data/site";
import { ARTICLE_CATEGORY_LABEL, CUSTOM_SIZE, articleImages, formatPrice, thumbOf, variantsOf } from "@/lib/boutique";
import { useCart } from "@/lib/cart";
import { AGENCY_ID, breadcrumbLd, jsonLd, noindex, pageUrl, seo } from "@/lib/seo";
import { getArticlePage } from "@/lib/server-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/boutique/article/$slug")({
  loader: async ({ params }) => {
    const data = await getArticlePage({ data: { slug: params.slug } });
    if (!data.article) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const article = loaderData?.article;
    if (!article) return noindex("Article introuvable — SYSI TRAVEL");
    const path = `/boutique/article/${article.slug}`;
    const category = ARTICLE_CATEGORY_LABEL[article.category];
    const images = articleImages(article);
    const description = article.tagline || `${article.name} : ${category.toLowerCase()} de la boutique SYSI TRAVEL.`;
    const available = variantsOf(article).some((variant) => variant.available !== false);
    return seo({
      title: `${article.name} — ${category} | Boutique SYSI TRAVEL`,
      description,
      path,
      image: images[0],
      imageAlt: article.name,
      type: "product",
      links: images[0] ? [{ rel: "preload", as: "image", href: images[0], fetchPriority: "high" }] : [],
      scripts: [
        jsonLd({
          "@type": "Product",
          name: article.name,
          description: article.description || description,
          url: pageUrl(path),
          image: images.slice(0, 6).map(absoluteUrl),
          category,
          brand: { "@id": AGENCY_ID },
          offers: {
            "@type": "Offer",
            price: (article.price_cents / 100).toFixed(2),
            priceCurrency: "EUR",
            availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: pageUrl(path),
            seller: { "@id": AGENCY_ID },
          },
        }),
        breadcrumbLd([
          ["Accueil", "/"],
          ["Boutique", "/boutique"],
          [category, `/boutique?categorie=${article.category}`],
          [article.name, path],
        ]),
      ],
    });
  },
  notFoundComponent: () => (
    <NotFound>
      Cet article n'existe pas ou n'est plus en vente.{" "}
      <Link to="/boutique" className="text-gold-deep underline underline-offset-4">
        Voir la boutique
      </Link>
    </NotFound>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article, others, destinations, reseaux } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid bookingHref="/contact" />
      <main className="pb-16 pt-28 lg:pt-32">
        {/* key: a new article starts with its own choices. */}
        <ArticleDetail key={article.id} article={article} />
        {others.length ? (
          <section className="mx-auto mt-20 max-w-site px-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-petrol/10 pb-4">
              <h2 className="text-[clamp(1.4rem,2.4vw,1.9rem)] font-bold text-petrol">Vous aimerez aussi</h2>
              <Link to="/boutique" className="label-caps inline-flex items-center gap-2 text-gold-deep hover:text-petrol">
                Toute la boutique <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {others.map((other, index) => (
                <Reveal key={other.id} delay={index * 70} className="h-full">
                  <ArticleCard article={other} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}

function ArticleDetail({ article }) {
  const cart = useCart();
  const variants = variantsOf(article);
  const firstAvailable = variants.find((variant) => variant.available !== false) ?? variants[0];
  const [variant, setVariant] = useState(firstAvailable?.name ?? "");
  const [size, setSize] = useState(article.sizes.length === 1 && !article.custom_made ? article.sizes[0] : "");
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const images = useMemo(() => articleImages(article, variant), [article, variant]);
  const current = images[Math.min(photo, images.length - 1)];
  const sizes = article.custom_made ? [...article.sizes, CUSTOM_SIZE] : article.sizes;
  const needsSize = sizes.length > 0;
  const selected = variants.find((item) => item.name === variant);
  const soldOut = selected && selected.available === false;
  const paragraphs = article.description.split(/\n\s*\n/).filter(Boolean);
  const whatsapp = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
    `Bonjour SYSI TRAVEL, j'ai une question sur l'article « ${article.name} »${variant ? ` (${variant})` : ""}.`,
  )}`;

  const chooseVariant = (name) => {
    setVariant(name);
    setPhoto(0);
    setAdded(false);
  };

  const addToCart = () => {
    if (needsSize && !size) {
      setError("Choisissez votre taille.");
      return;
    }
    setError("");
    cart.addLine({ id: article.id, variante: variant, taille: size, quantite: quantity });
    setAdded(true);
  };

  return (
    <div className="mx-auto max-w-site px-6">
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <BackButton to="/boutique" label="Retour" className="px-3.5 py-2 text-[0.7rem]" />
        <nav aria-label="Fil d'Ariane" className="label-caps flex flex-wrap items-center gap-2 text-[0.7rem] text-petrol/50">
          <Link to="/boutique" className="text-gold-deep hover:text-petrol">Boutique</Link>
          <span aria-hidden="true">/</span>
          <Link to="/boutique" search={{ categorie: article.category }} className="text-gold-deep hover:text-petrol">
            {ARTICLE_CATEGORY_LABEL[article.category]}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate">{article.name}</span>
        </nav>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
        {/* Photos of the chosen variant. */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ivory-soft ring-1 ring-petrol/10">
            {current ? (
              <img key={current} src={current} alt={`${article.name}${variant ? ` — ${variant}` : ""}`} className="h-full w-full animate-fade-in object-cover" />
            ) : null}
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setPhoto((value) => (value - 1 + images.length) % images.length)}
                  aria-label="Photo précédente"
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-petrol shadow transition-colors hover:bg-gold"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhoto((value) => (value + 1) % images.length)}
                  aria-label="Photo suivante"
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-petrol shadow transition-colors hover:bg-gold"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="label-caps absolute bottom-3 right-3 rounded-full bg-petrol/80 px-3 py-1 text-[0.62rem] text-ivory">
                  {photo + 1} / {images.length}
                </span>
              </>
            ) : null}
          </div>
          {images.length > 1 ? (
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((src, index) => (
                <li key={src} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setPhoto(index)}
                    aria-label={`Voir la photo ${index + 1}`}
                    aria-current={index === photo ? "true" : undefined}
                    className={cn(
                      "block h-20 w-16 overflow-hidden rounded-xl ring-2 transition-all",
                      index === photo ? "ring-gold" : "ring-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <img src={thumbOf(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <p className="eyebrow text-gold-deep">{ARTICLE_CATEGORY_LABEL[article.category]}</p>
          <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.8rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
            {article.name}
          </h1>
          <p className="mt-4 font-display text-[1.8rem] font-bold text-petrol">{formatPrice(article.price_cents)}</p>
          {article.tagline ? <p className="mt-3 text-[1.02rem] leading-relaxed text-petrol/70">{article.tagline}</p> : null}

          {variants.length > 1 ? (
            <fieldset className="mt-8">
              <legend className="label-caps text-petrol/65">
                Coloris : <span className="text-petrol">{variant}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {variants.map((item) => {
                  const unavailable = item.available === false;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => chooseVariant(item.name)}
                      aria-pressed={variant === item.name}
                      title={unavailable ? `${item.name} : épuisé` : item.name}
                      className={cn(
                        "flex items-center gap-2 rounded-full border py-1 pl-1 pr-4 text-[0.88rem] transition-colors",
                        variant === item.name ? "border-petrol bg-petrol text-ivory" : "border-petrol/20 text-petrol hover:border-gold",
                        unavailable ? "opacity-50" : "",
                      )}
                    >
                      {item.images?.[0] ? <img src={thumbOf(item.images[0])} alt="" className="h-8 w-8 rounded-full object-cover" /> : null}
                      <span className={unavailable ? "line-through" : ""}>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {needsSize ? (
            <fieldset className="mt-7">
              <legend className="label-caps text-petrol/65">Taille</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSize(item);
                      setError("");
                      setAdded(false);
                    }}
                    aria-pressed={size === item}
                    className={cn(
                      "min-w-[3rem] rounded-full border px-4 py-2 text-[0.88rem] font-semibold transition-colors",
                      size === item ? "border-petrol bg-petrol text-ivory" : "border-petrol/20 text-petrol hover:border-gold",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {size === CUSTOM_SIZE ? (
                <p className="mt-3 flex items-start gap-2 text-[0.88rem] leading-relaxed text-petrol/65">
                  <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" /> Vos mesures vous seront demandées après la commande
                  (vous pouvez aussi les indiquer dans le panier).
                </p>
              ) : null}
            </fieldset>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-petrol/20">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Une pièce de moins"
                className="flex h-11 w-10 items-center justify-center text-petrol/70 hover:text-petrol"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span aria-live="polite" className="w-6 text-center font-semibold text-petrol">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(20, value + 1))}
                aria-label="Une pièce de plus"
                className="flex h-11 w-10 items-center justify-center text-petrol/70 hover:text-petrol"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={addToCart}
              disabled={soldOut}
              className="label-caps inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-petrol-deep transition-all duration-300 hover:-translate-y-0.5 hover:bg-petrol hover:text-ivory disabled:pointer-events-none disabled:opacity-50 sm:flex-none"
            >
              <ShoppingBag className="h-4 w-4" /> {soldOut ? "Épuisé" : "Ajouter au panier"}
            </button>
          </div>
          {error ? <p className="mt-3 text-[0.88rem] font-semibold text-destructive">{error}</p> : null}
          {added ? (
            <p role="status" className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-[#1a7f4b]/10 px-4 py-3 text-[0.92rem] text-[#1a7f4b]">
              <Check className="h-4 w-4" /> Ajouté au panier.
              <Link to="/panier" className="label-caps ml-auto inline-flex items-center gap-1.5 text-petrol hover:text-gold-deep">
                Voir mon panier <ArrowRight className="h-4 w-4" />
              </Link>
            </p>
          ) : null}

          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="label-caps mt-5 inline-flex items-center gap-2 text-petrol/70 transition-colors hover:text-[#1a9e4b]"
          >
            <MessageCircle className="h-4 w-4" /> Une question sur cet article ?
          </a>

          {paragraphs.length ? (
            <div className="mt-10 space-y-4 border-t border-petrol/10 pt-8 text-[1rem] leading-relaxed text-petrol/75">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          <ul className="mt-8 space-y-4 rounded-2xl bg-ivory-soft p-6 text-[0.92rem] leading-relaxed text-petrol/75">
            <li className="flex gap-3">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.6} />
              <span>
                <strong className="text-petrol">Livraison suivie</strong> : les frais et le délai vous sont confirmés avant le paiement,
                puis vous suivez chaque étape par e-mail et dans votre compte.
              </span>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.6} />
              <span>
                <strong className="text-petrol">Rien n'est payé en ligne</strong> : nous vous contactons sous 72 h pour régler votre
                commande simplement.
              </span>
            </li>
            {article.custom_made ? (
              <li className="flex gap-3">
                <Ruler className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.6} />
                <span>
                  <strong className="text-petrol">Sur mesure</strong> possible : choisissez « Sur mesure » comme taille.
                </span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
