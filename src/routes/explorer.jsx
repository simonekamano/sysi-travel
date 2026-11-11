import { useState } from "react";
import { breadcrumbLd, seo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import Explorer from "@/components/explorer/Explorer";
import { MAPLIBRE_CSS } from "@/components/explorer/ExplorerMap";
import { EXPLORER_REGIONS } from "@/data/explorer";
import { getExplorerPage } from "@/lib/server-fns";

export const Route = createFileRoute("/explorer")({
  loader: () => getExplorerPage(),
  head: () =>
    seo({
      title: "Explorer la Guinée : carte des sites touristiques — SYSI TRAVEL",
      description:
        "La carte interactive des quatre régions de Guinée et de leurs sites : cascades, îles, monts, forêts et patrimoine. Visite guidée d'un site à l'autre.",
      path: "/explorer",
      links: [{ rel: "stylesheet", href: MAPLIBRE_CSS }],
      scripts: [breadcrumbLd([["Accueil", "/"], ["Explorer la Guinée", "/explorer"]])],
    }),
  component: ExplorerPage,
});

function ExplorerPage() {
  const { sites, destinations, formules, reseaux } = Route.useLoaderData();
  const [formule, setFormule] = useState("");
  const [destinationChoice, setDestinationChoice] = useState(null);

  // « Demander ce voyage » on a site: the form below, preset with its destination when there is one.
  const requestTrip = (name) => {
    if (name) setDestinationChoice({ name });
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToMap = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid />

      <main>
        <h1 className="sr-only">Explorer la Guinée : carte des régions et des sites touristiques</h1>
        <Explorer sites={sites} destinations={destinations} onRequestTrip={requestTrip} />

        <section className="bg-background py-14 lg:py-20">
          <div className="mx-auto max-w-site px-6">
            <Reveal>
              <SectionHeading
                eyebrow="Quatre régions, quatre paysages"
                title="De l'océan à la forêt"
                text="La Guinée change de visage d'une région à l'autre. Chacune a ses sites, ses saisons et ses traditions : remontez sur la carte pour les découvrir."
              />
            </Reveal>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {EXPLORER_REGIONS.map((region, index) => (
                <Reveal key={region.key} delay={index * 90} className="h-full">
                  <button type="button" onClick={scrollToMap} className="group block h-full w-full text-left">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-petrol">
                      <img
                        src={region.image}
                        alt={region.label}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-petrol-deep/95 via-petrol-deep/30 to-transparent" />
                      <span className="absolute left-5 top-5 h-3 w-3 rounded-full ring-4 ring-white/40" style={{ background: region.color }} />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <p className="label-caps text-gold">
                          {sites.filter((site) => site.region === region.key).length} sites
                        </p>
                        <h3 className="mt-1 text-[1.25rem] font-bold text-ivory">{region.label}</h3>
                        <p className="mt-2 text-[0.85rem] leading-relaxed text-ivory/75">{region.text}</p>
                      </div>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <ContactForm
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
