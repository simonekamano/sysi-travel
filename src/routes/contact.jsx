import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import { CONTACT, LOGO } from "@/data/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SYSI TRAVEL Guinée" },
      {
        name: "description",
        content:
          "Contactez SYSI TRAVEL : téléphone, WhatsApp, e-mail et adresse à Conakry. Réponse sous 24 heures ouvrées pour votre séjour en Guinée.",
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
  const [formule, setFormule] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-petrol/12 bg-background">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-6 py-5">
          <Link to="/" className="flex items-center">
            <img
              src={LOGO}
              alt="SYSI TRAVEL Guinée"
              className="block h-10 w-auto object-contain sm:h-12"
            />
          </Link>
          <Link
            to="/"
            className="label-caps text-petrol/60 transition-colors hover:text-petrol"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </header>

      <main>
        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-[1180px] px-6">
            <p className="script-accent text-gold-deep">Nous sommes joignables</p>
            <h1 className="mt-4 max-w-3xl text-[clamp(2rem,4vw,3.2rem)] font-medium uppercase leading-[1.08] tracking-[0.05em] text-petrol">
              Contactez SYSI TRAVEL
            </h1>
            <p className="mt-6 max-w-2xl text-[1rem] leading-relaxed text-petrol/70">
              Une question sur un circuit, un projet de séjour en famille ou un retour au pays à
              organiser ? Appelez-nous, écrivez-nous ou remplissez le formulaire : un expert vous
              répond sous 24 heures ouvrées.
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <ContactForm formule={formule} setFormule={setFormule} showContactDetails={false} />
      </main>

      <Footer />
    </div>
  );
}