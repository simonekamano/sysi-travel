import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import CircuitCard from "@/components/circuit/CircuitCard";
import { CIRCUIT_KINDS, CONTACT } from "@/data/site";
import { getSiteContent } from "@/lib/server-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/circuits/")({
  loader: () => getSiteContent(),
  head: () => ({
    meta: [
      { title: "Circuits et excursions en Guinée — SYSI TRAVEL" },
      {
        name: "description",
        content:
          "Tous les circuits, excursions et visites guidées de SYSI TRAVEL en Guinée : programme jour par jour, itinéraire sur la carte, dates et prix.",
      },
    ],
  }),
  component: CircuitsPage,
});

const FILTER_LABELS = { circuit: "Circuits", excursion: "Excursions", visite: "Visites guidées" };

function CircuitsPage() {
  const { circuits, destinations, formules, reseaux } = Route.useLoaderData();
  const [kind, setKind] = useState("");
  const [formule, setFormule] = useState("");
  // Filters only for the types that have at least one circuit, and only when there are several.
  const kinds = Object.keys(CIRCUIT_KINDS).filter((value) => circuits.some((item) => item.kind === value));
  const visible = kind ? circuits.filter((item) => item.kind === kind) : circuits;

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid />

      <main>
        <section className="bg-background pb-12 pt-36 lg:pb-16 lg:pt-40">
          <div className="mx-auto max-w-site px-6">
            <BackButton label="Retour" className="mb-8" />
            <p className="eyebrow text-gold-deep">Circuits & excursions</p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
              Des voyages prêts à vivre en Guinée
            </h1>
            <p className="mt-6 max-w-2xl text-[1rem] leading-relaxed text-petrol/70">
              Chaque circuit a son programme jour par jour, son itinéraire sur la carte et un prix
              clair. Choisissez-le tel quel, ou demandez-nous de l'adapter à vos dates et à vos envies.
            </p>

            {kinds.length > 1 ? (
              <div role="group" aria-label="Filtrer par type" className="mt-10 flex flex-wrap gap-2">
                {[["", "Tous"], ...kinds.map((value) => [value, FILTER_LABELS[value]])].map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={kind === value}
                    onClick={() => setKind(value)}
                    className={cn(
                      "label-caps rounded-full border px-5 py-2.5 transition-colors duration-300",
                      kind === value
                        ? "border-petrol bg-petrol text-ivory"
                        : "border-petrol/20 text-petrol/70 hover:border-gold hover:text-petrol",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            {visible.length ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((circuit, index) => (
                  <Reveal key={circuit.id} delay={(index % 3) * 90} className="h-full">
                    <CircuitCard circuit={circuit} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="mt-10 max-w-2xl border border-petrol/15 bg-white p-8">
                <p className="label-caps text-gold-deep">Bientôt en ligne</p>
                <p className="mt-3 text-[1rem] leading-relaxed text-petrol/75">
                  Nos circuits sont en préparation. Dites-nous ce qui vous ferait voyager : nous
                  construisons votre itinéraire sur mesure.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#contact"
                    className="label-caps inline-flex items-center rounded-full bg-petrol px-6 py-3.5 text-ivory transition-colors hover:bg-petrol-deep"
                  >
                    Demander un itinéraire
                  </a>
                  <a
                    href={CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-6 py-3.5 text-petrol transition-colors hover:border-[#25D366] hover:text-[#1a9e4b]"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        <ContactForm
          formule={formule}
          setFormule={setFormule}
          destinations={destinations}
          formules={formules}
        />
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}
