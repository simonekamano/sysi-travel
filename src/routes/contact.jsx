import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { CONTACT } from "@/data/site";
import { getSiteContent } from "@/lib/server-fns";

export const Route = createFileRoute("/contact")({
  loader: () => getSiteContent(),
  head: () => ({
    meta: [
      { title: "Contact — SYSI TRAVEL Guinée" },
      {
        name: "description",
        content:
          "Contactez SYSI TRAVEL : téléphone, WhatsApp, e-mail et adresse à Conakry. Réponse sous 72 heures pour votre séjour en Guinée.",
      },
    ],
  }),
  component: ContactPage,
});

const CHANNELS = [
  {
    icon: Phone,
    label: "Téléphone & WhatsApp",
    value: CONTACT.phone,
    href: CONTACT.phoneHref,
  },
  {
    icon: Mail,
    label: "E-mail",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
  },
  { icon: MapPin, label: "Bureau", value: CONTACT.address },
  { icon: Clock, label: "Disponibilité", value: CONTACT.hours },
];

function ContactPage() {
  const { destinations, formules } = Route.useLoaderData();
  const [formule, setFormule] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid />

      <main>
        <section className="bg-background pb-12 pt-36 lg:pb-16 lg:pt-40">
          <div className="mx-auto max-w-[1180px] px-6">
            <BackButton label="Retour" className="mb-8" />
            <p className="eyebrow text-gold-deep">Nous sommes joignables</p>
            <h1 className="mt-4 max-w-3xl text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
              Contactez SYSI TRAVEL
            </h1>
            <p className="mt-6 max-w-2xl text-[1rem] leading-relaxed text-petrol/70">
              Une question sur un circuit, un projet de séjour en famille ou un retour au pays à
              organiser ? Appelez-nous, écrivez-nous ou remplissez le formulaire : un expert vous
              répond sous 72 heures.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CHANNELS.map(({ icon: Icon, label, value, href }) => {
                const content = (
                  <>
                    <Icon className="h-5 w-5 text-gold-deep" strokeWidth={1.6} />
                    <p className="label-caps mt-5 text-petrol/45">{label}</p>
                    <p className="mt-2 text-[0.95rem] leading-snug text-petrol">{value}</p>
                  </>
                );

                return href ? (
                  <a
                    key={label}
                    href={href}
                    className="border border-petrol/15 bg-white p-6 transition-colors hover:border-gold"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={label} className="border border-petrol/15 bg-white p-6">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <ContactForm
          formule={formule}
          setFormule={setFormule}
          destinations={destinations}
          formules={formules}
          showContactDetails={false}
        />
      </main>

      <Footer destinations={destinations} />
      <WhatsAppButton />
    </div>
  );
}