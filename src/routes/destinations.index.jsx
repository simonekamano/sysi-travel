import { useState } from "react";
import { breadcrumbLd, seo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import DestinationCard from "@/components/destination/DestinationCard";
import GuineaMap, { LEAFLET_CSS } from "@/components/map/GuineaMap";
import { getSiteContent } from "@/lib/server-fns";

export const Route = createFileRoute("/destinations/")({
  loader: () => getSiteContent(),
  head: () =>
    seo({
      title: "Destinations en Guinée — SYSI TRAVEL",
      description:
        "Îles de Loos, Fouta Djallon, Mont Nimba, cascades et plages : toutes les destinations de SYSI TRAVEL en Guinée, sur la carte et en détail.",
      path: "/destinations",
      links: [{ rel: "stylesheet", href: LEAFLET_CSS }],
      scripts: [breadcrumbLd([["Accueil", "/"], ["Destinations", "/destinations"]])],
    }),
  component: DestinationsPage,
});

function DestinationsPage() {
  const { destinations, formules, reseaux } = Route.useLoaderData();
  const [formule, setFormule] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid />

      <main>
        <section className="bg-background pb-12 pt-36 lg:pb-16 lg:pt-40">
          <div className="mx-auto max-w-site px-6">
            <BackButton label="Retour" className="mb-8" />
            <p className="eyebrow text-gold-deep">Découvrir la Guinée</p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
              Destinations iconiques
            </h1>
            <p className="mt-6 max-w-2xl text-[1rem] leading-relaxed text-petrol/70">
              Des îles de l'Atlantique aux hauts plateaux du Fouta, des cascades de Pita aux forêts
              classées du Nimba : chaque lieu a sa fiche, ses photos et ses informations pratiques,
              et se visite dans nos circuits avec un guide local.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((destination, index) => (
                <Reveal key={destination.id || destination.name} delay={(index % 3) * 90}>
                  <DestinationCard destination={destination} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ivory-soft py-14 lg:py-20">
          <div className="mx-auto max-w-site px-6">
            <Reveal>
              <div className="grid items-center gap-8 lg:grid-cols-[1fr_2fr]">
                <div>
                  <p className="eyebrow text-gold-deep">Sur la carte</p>
                  <h2 className="mt-3 text-[clamp(1.4rem,2.4vw,2rem)] font-bold leading-tight tracking-[-0.015em] text-petrol">
                    De l'Atlantique à la forêt
                  </h2>
                  <p className="mt-4 text-[0.98rem] leading-relaxed text-petrol/70">
                    Repérez chaque étape et imaginez votre circuit : cliquez sur un repère pour ouvrir
                    la fiche de la destination.
                  </p>
                </div>
                <GuineaMap points={destinations} className="aspect-[4/3] sm:aspect-[16/10]" />
              </div>
            </Reveal>
          </div>
        </section>

        <ContactForm formule={formule} setFormule={setFormule} destinations={destinations} formules={formules} />
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}
