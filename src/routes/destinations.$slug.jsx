import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CalendarDays, Check, MessageCircle, Route as RouteIcon } from "lucide-react";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import Gallery from "@/components/destination/Gallery";
import GuineaMap, { LEAFLET_CSS } from "@/components/map/GuineaMap";
import { NotFound } from "@/components/NotFound";
import { CONTACT, absoluteUrl } from "@/data/site";
import { getDestinationPage } from "@/lib/server-fns";
import { breadcrumbLd, jsonLd, noindex, pageUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/destinations/$slug")({
  loader: async ({ params }) => {
    const data = await getDestinationPage({ data: { slug: params.slug } });
    if (!data.destination) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const destination = loaderData?.destination;
    if (!destination) return noindex("Destination introuvable — SYSI TRAVEL");
    const description = destination.text || `${destination.name}, ${destination.region} : séjour sur mesure en Guinée avec SYSI TRAVEL.`;
    const path = `/destinations/${destination.slug}`;
    const hasPosition = Number.isFinite(destination.latitude) && Number.isFinite(destination.longitude);
    return seo({
      title: `${destination.name} (${destination.region}) : visiter en Guinée | SYSI TRAVEL`,
      description,
      path,
      image: destination.image,
      imageAlt: destination.name,
      type: "article",
      links: [
        { rel: "stylesheet", href: LEAFLET_CSS },
        ...(destination.image ? [{ rel: "preload", as: "image", href: destination.image, fetchPriority: "high" }] : []),
      ],
      scripts: [
        jsonLd({
          "@type": "TouristDestination",
          name: destination.name,
          description: destination.description || description,
          url: pageUrl(path),
          ...(destination.image ? { image: absoluteUrl(destination.image) } : {}),
          containedInPlace: { "@type": "Country", name: "Guinée" },
          ...(hasPosition ? { geo: { "@type": "GeoCoordinates", latitude: destination.latitude, longitude: destination.longitude } } : {}),
          ...(destination.tags?.length ? { touristType: destination.tags } : {}),
        }),
        breadcrumbLd([["Accueil", "/"], ["Destinations", "/destinations"], [destination.name, path]]),
      ],
    });
  },
  notFoundComponent: () => (
    <NotFound>
      Cette destination n'existe pas ou n'est plus proposée.{" "}
      <Link to="/destinations" className="text-gold-deep underline underline-offset-4">
        Voir toutes les destinations
      </Link>
    </NotFound>
  ),
  component: DestinationPage,
});

function DestinationPage() {
  const { destination, others, destinations, formules, reseaux } = Route.useLoaderData();
  const [formule, setFormule] = useState("");
  // Preset the form with this destination, following navigation from one destination to another.
  const destinationChoice = useMemo(() => ({ name: destination.name }), [destination.name]);
  const paragraphs = destination.description.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} />

      <main>
        <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-petrol-deep">
          {destination.image ? (
            <img
              src={destination.image}
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              className="absolute inset-0 -z-20 h-full w-full animate-kenburns object-cover"
            />
          ) : null}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-petrol-deep via-petrol-deep/45 to-petrol-deep/60" />

          <div className="mx-auto w-full max-w-site px-6 pb-14 pt-36 lg:pb-20">
            <BackButton to="/destinations" tone="light" className="mb-6 animate-fade-in" />
            <nav aria-label="Fil d'Ariane" className="label-caps flex flex-wrap gap-2 text-ivory/55 animate-fade-in">
              <Link to="/" className="transition-colors hover:text-gold">Accueil</Link>
              <span aria-hidden="true">/</span>
              <Link to="/destinations" className="transition-colors hover:text-gold">Destinations</Link>
              <span aria-hidden="true">/</span>
              <span className="text-ivory/85">{destination.name}</span>
            </nav>
            <p className="eyebrow mt-8 text-gold animate-fade-in">{destination.region}</p>
            <h1 className="mt-3 max-w-4xl animate-fade-up text-[clamp(2.3rem,6vw,4.6rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-ivory">
              {destination.name}
            </h1>
            {destination.text ? (
              <p className="mt-6 max-w-2xl animate-fade-up text-[1.05rem] leading-relaxed text-ivory/80 [animation-delay:120ms]">
                {destination.text}
              </p>
            ) : null}
            <div className="mt-8 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:220ms]">
              {(destination.tags || []).map((tag) => (
                <span key={tag} className="rounded-full border border-ivory/30 px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-ivory/80">
                  {tag}
                </span>
              ))}
              {destination.price ? (
                <span className="label-caps rounded-full bg-gold px-4 py-2 text-petrol-deep">{destination.price}</span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="py-14 lg:py-20">
          <div className="mx-auto grid max-w-site gap-12 px-6 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <div>
              <Reveal>
                <p className="eyebrow text-gold-deep">Pourquoi y aller</p>
                <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-tight tracking-[-0.015em] text-petrol">
                  {destination.name}, en quelques mots
                </h2>
                <div className="mt-6 space-y-5 text-[1.02rem] leading-relaxed text-petrol/75">
                  {(paragraphs.length ? paragraphs : [destination.text]).map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </Reveal>

              {destination.highlights?.length ? (
                <Reveal delay={80}>
                  <h3 className="label-caps mt-12 text-gold-deep">Les temps forts</h3>
                  <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                    {destination.highlights.map((item) => (
                      <li key={item} className="flex gap-3 border-l-2 border-gold/60 bg-white px-4 py-3.5 text-[0.95rem] leading-snug text-petrol">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={2} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <Reveal delay={120}>
                <div className="border border-petrol/15 bg-white p-7 shadow-[0_30px_70px_-50px_rgba(18,61,67,0.7)]">
                  <p className="label-caps text-gold-deep">Préparer le voyage</p>
                  <dl className="mt-5 space-y-5">
                    {destination.best_period ? (
                      <div className="flex gap-3">
                        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.6} />
                        <div>
                          <dt className="label-caps text-petrol/45">Meilleure période</dt>
                          <dd className="mt-1 text-[0.95rem] text-petrol">{destination.best_period}</dd>
                        </div>
                      </div>
                    ) : null}
                    {destination.access ? (
                      <div className="flex gap-3">
                        <RouteIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.6} />
                        <div>
                          <dt className="label-caps text-petrol/45">Accès</dt>
                          <dd className="mt-1 text-[0.95rem] text-petrol">{destination.access}</dd>
                        </div>
                      </div>
                    ) : null}
                  </dl>
                  <a
                    href="#contact"
                    className="label-caps mt-7 flex w-full items-center justify-center rounded-full bg-petrol px-5 py-3 text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:bg-petrol-deep"
                  >
                    Demander mon itinéraire
                  </a>
                  <a
                    href={CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-caps mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-petrol/25 px-5 py-2.5 text-petrol transition-colors hover:border-[#25D366] hover:text-[#1a9e4b]"
                  >
                    <MessageCircle className="h-4 w-4" /> Poser une question
                  </a>
                </div>
                <GuineaMap points={[destination]} single className="mt-5 aspect-[4/3]" />
              </Reveal>
            </aside>
          </div>
        </section>

        {destination.gallery?.length ? (
          <section className="bg-ivory-soft py-14 lg:py-20">
            <div className="mx-auto max-w-site px-6">
              <Reveal>
                <SectionHeading eyebrow="En images" title={`${destination.name} en photos`} />
              </Reveal>
              <div className="mt-10">
                <Gallery images={destination.gallery} name={destination.name} />
              </div>
            </div>
          </section>
        ) : null}

        {others.length ? (
          <section className="py-14 lg:py-20">
            <div className="mx-auto max-w-site px-6">
              <Reveal>
                <SectionHeading eyebrow="Prolonger le voyage" title="À combiner avec" />
              </Reveal>
              <div className="mt-10 grid gap-6 sm:grid-cols-3">
                {others.map((other, index) => (
                  <Reveal key={other.id} delay={index * 90}>
                    <Link to="/destinations/$slug" params={{ slug: other.slug }} className="group block">
                      <div className="relative aspect-[4/3] overflow-hidden bg-petrol">
                        {other.image ? (
                          <img src={other.image} alt={other.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-petrol-deep/90 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <p className="label-caps text-gold">{other.region}</p>
                          <p className="mt-1 text-[1.05rem] font-bold text-ivory">
                            {other.name}
                            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                          </p>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <ContactForm
          key={destination.id}
          formule={formule}
          setFormule={setFormule}
          destinations={destinations}
          formules={formules}
          destinationChoice={destinationChoice}
        />
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}
