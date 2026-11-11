import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, CarFront, Plane } from "lucide-react";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { getSiteContent } from "@/lib/server-fns";

export const Route = createFileRoute("/transfert-aeroport")({
  loader: () => getSiteContent(),
  head: () => ({
    meta: [
      { title: "Prise en charge à l'aéroport de Conakry — SYSI TRAVEL" },
      {
        name: "description",
        content:
          "À votre arrivée à Conakry, un chauffeur SYSI TRAVEL vous attend à l'aéroport et vous conduit jusqu'à votre lieu de séjour. Service à la demande.",
      },
    ],
  }),
  component: TransfertPage,
});

const STEPS = [
  {
    icon: Plane,
    title: "Indiquez votre arrivée",
    text: "Cochez la prise en charge dans le formulaire : date, heure, numéro de vol et lieu de séjour.",
  },
  {
    icon: CalendarCheck,
    title: "Nous confirmons",
    text: "Sous 72 heures, nous vous confirmons le chauffeur, le véhicule et le tarif de votre trajet.",
  },
  {
    icon: CarFront,
    title: "Votre chauffeur vous attend",
    text: "À la sortie de l'aéroport, il vous accueille et vous conduit jusqu'à votre lieu de séjour.",
  },
];

function TransfertPage() {
  const { destinations, formules, reseaux } = Route.useLoaderData();
  const [formule, setFormule] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid />

      <main>
        <section className="bg-background pb-14 pt-36 lg:pb-20 lg:pt-40">
          <div className="mx-auto max-w-site px-6">
            <BackButton label="Retour" className="mb-8" />
            <p className="eyebrow text-gold-deep">Service à la demande</p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
              Prise en charge à l'aéroport
            </h1>
            <p className="mt-6 max-w-2xl text-[1rem] leading-relaxed text-petrol/70">
              Atterrissez à Conakry l'esprit léger : un chauffeur vous attend à votre arrivée et vous
              conduit jusqu'à votre hôtel ou votre lieu de séjour. Le service se réserve seul, ou avec
              un séjour ou un circuit.
            </p>

            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, index) => (
                <li key={title}>
                  <Reveal delay={index * 90} className="h-full">
                    <div className="h-full border border-petrol/15 bg-white p-7">
                      <div className="flex items-center gap-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-petrol text-gold">
                          <Icon className="h-5 w-5" strokeWidth={1.6} />
                        </span>
                        <span className="font-display text-[0.95rem] tracking-[0.3em] text-gold-deep">0{index + 1}</span>
                      </div>
                      <h2 className="mt-5 text-[1.1rem] font-semibold text-petrol">{title}</h2>
                      <p className="mt-2 text-[0.95rem] leading-relaxed text-petrol/70">{text}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>

            <Reveal className="mt-8">
              <p className="max-w-2xl border-l-2 border-gold pl-4 text-[0.95rem] leading-relaxed text-petrol/75">
                <strong className="text-petrol">Tarif :</strong> il dépend de votre lieu de séjour et du
                nombre de voyageurs. Il vous est confirmé avant votre arrivée, sans engagement de votre part.
              </p>
            </Reveal>

            <Reveal className="mt-8">
              <a
                href="#contact"
                className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-7 py-4 text-ivory transition-colors hover:bg-petrol-deep"
              >
                <Plane className="h-4 w-4 text-gold" /> Demander ma prise en charge
              </a>
            </Reveal>
          </div>
        </section>

        <ContactForm
          formule={formule}
          setFormule={setFormule}
          destinations={destinations}
          formules={formules}
          transfertChoice
        />
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}
