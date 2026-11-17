import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowRight, MessagesSquare, NotebookPen, UsersRound } from "lucide-react";
import BackButton from "@/components/BackButton";
import StoryText from "@/components/histoire/StoryText";
import Footer from "@/components/landing/Footer";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { ACCOMPAGNEMENT, splitStory } from "@/lib/histoire";
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

function Part({ part, photo, alt, children }) {
  const text = (
    <div className="max-w-[40rem]">
      {part.title ? (
        <h2 className="mb-6 font-display text-[clamp(1.5rem,2.6vw,2rem)] font-bold leading-tight text-petrol">{part.title}</h2>
      ) : null}
      <StoryText body={part.body} />
      {children}
    </div>
  );
  if (!photo) return <Reveal>{text}</Reveal>;
  return (
    <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:gap-16">
      <Reveal>{text}</Reveal>
      <Reveal delay={120} className="mx-auto w-full max-w-sm lg:sticky lg:top-32 lg:max-w-none">
        <Photo src={photo} alt={alt} />
      </Reveal>
    </div>
  );
}

function HistoirePage() {
  const { histoire, destinations, reseaux } = Route.useLoaderData();
  const parts = splitStory(histoire.recit);
  const name = histoire.signature || "la fondatrice de SYSI TRAVEL";
  const steps = ACCOMPAGNEMENT.filter((step) => histoire[step.key]);
  // The first story photo goes with the first part, the second with the last one.
  const photoFor = (index) => {
    if (index === 0) return histoire.photo_recit_1;
    if (index === parts.length - 1) return histoire.photo_recit_2;
    return "";
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid bookingHref="/contact" />

      <main>
        <section className="overflow-hidden bg-background pb-16 pt-36 lg:pb-24 lg:pt-40">
          <div className="mx-auto grid max-w-site items-center gap-14 px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
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
              <Photo src={histoire.photo_portrait} alt={name} priority className="mx-auto w-full max-w-md lg:mr-4" />
            ) : null}
          </div>
        </section>

        {parts.length ? (
          <section id="recit" className="scroll-mt-28 border-t border-petrol/10 bg-white py-16 lg:py-24">
            <div className="mx-auto max-w-site space-y-16 px-6 lg:space-y-24">
              {parts.map((part, index) => (
                <Part key={`${index}-${part.title}`} part={part} photo={photoFor(index)} alt={name}>
                  {index === parts.length - 1 && histoire.signature ? (
                    <div className="mt-12 border-t border-petrol/15 pt-6">
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
          <section id="accompagnement" className="scroll-mt-28 bg-petrol py-16 text-ivory lg:py-24">
            <div className="mx-auto max-w-site px-6">
              <Reveal>
                <SectionHeading
                  tone="light"
                  eyebrow="Notre accompagnement"
                  title="Avant, pendant et après le voyage"
                  text="Un voyage qui commence bien avant le départ et qui continue après le retour."
                />
              </Reveal>
              <ol className="mt-12 grid gap-6 md:grid-cols-3">
                {steps.map((step, index) => {
                  const Icon = ICONS[step.key];
                  return (
                    <li key={step.key}>
                      <Reveal delay={index * 110} className="h-full">
                        <div className="h-full rounded-2xl border border-ivory/15 bg-ivory/[0.04] p-7">
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
