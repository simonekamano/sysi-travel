import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Nav from "@/components/landing/Nav";
import ContactDetails from "@/components/landing/ContactDetails";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import Reveal from "@/components/landing/Reveal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SYSI TRAVEL Guinée" },
      {
        name: "description",
        content:
          "Contactez SYSI TRAVEL : téléphone, adresse e-mail et adresse à Conakry. Un expert vous répond sous 24 heures ouvrées pour organiser votre séjour en Guinée.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [formule, setFormule] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="relative isolate overflow-hidden bg-petrol-deep pb-14 pt-32 text-ivory lg:pb-16 lg:pt-40">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_10%,rgba(230,180,92,0.16),transparent_55%)]"
          />
          <div className="mx-auto max-w-[1180px] px-6">
            <Reveal>
              <p className="script-accent text-gold">Nous joindre</p>
              <h1 className="mt-4 max-w-2xl text-[clamp(2rem,4vw,3.2rem)] font-medium uppercase leading-[1.08] tracking-[0.05em] text-ivory">
                Contactez SYSI TRAVEL
              </h1>
              <p className="mt-5 max-w-xl text-[1rem] leading-relaxed text-ivory/70">
                Une question sur un circuit, un devis, un séjour à organiser depuis l'étranger :
                écrivez-nous ou appelez-nous directement. Nous répondons sous 24 heures ouvrées.
              </p>
            </Reveal>

            <Reveal delay={120} className="mt-11">
              <ContactDetails />
            </Reveal>
          </div>
        </section>

        <ContactForm formule={formule} setFormule={setFormule} />
      </main>
      <Footer />
    </div>
  );
}