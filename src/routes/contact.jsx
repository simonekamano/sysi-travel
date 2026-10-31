import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import ContactDetails from "@/components/landing/ContactDetails";
import ContactForm from "@/components/landing/ContactForm";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SYSI TRAVEL Guinée" },
      {
        name: "description",
        content:
          "Téléphone, e-mail et formulaire : contactez l'équipe SYSI TRAVEL à Conakry pour préparer votre séjour en Guinée.",
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
        <section className="bg-petrol-deep pb-16 pt-32 text-ivory lg:pb-24 lg:pt-40">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div>
              <p className="script-accent text-gold">Nous joindre</p>
              <h1 className="mt-4 text-[clamp(2rem,4vw,3.1rem)] font-medium uppercase leading-[1.08] tracking-[0.05em]">
                Parlons de votre voyage en Guinée
              </h1>
              <p className="mt-6 max-w-md text-[1rem] leading-relaxed text-ivory/70">
                Une question sur un circuit, un devis à préciser ou un projet sur mesure : notre
                équipe à Conakry vous répond directement, en français, du lundi au samedi.
              </p>
              <div className="mt-8 h-px w-16 bg-gold/60" />
              <p className="label-caps mt-8 text-ivory/40">SYSI TRAVEL · Conakry, Guinée</p>
            </div>

            <div className="border border-ivory/15 p-7 sm:p-9">
              <ContactDetails />
            </div>
          </div>
        </section>

        <ContactForm formule={formule} setFormule={setFormule} showDetails={false} />
      </main>
      <Footer isHome={false} />
    </div>
  );
}