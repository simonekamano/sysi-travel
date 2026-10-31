import { Link } from "@tanstack/react-router";
import { CONTACT_INFO, LOGO } from "@/data/site";

const EXPLORER = [
  { label: "Destinations", to: "/", hash: "destinations" },
  { label: "Circuits", to: "/", hash: "offre" },
  { label: "La plateforme", to: "/", hash: "solution" },
  { label: "Questions", to: "/", hash: "faq" },
];

const SEJOURS = [
  { label: "Escapade Loos", to: "/", hash: "offre" },
  { label: "Signature Fouta", to: "/", hash: "offre" },
  { label: "Grande Traversée", to: "/", hash: "offre" },
  { label: "Page contact", to: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-petrol-deep text-ivory">
      <div className="mx-auto max-w-[1180px] px-6 py-16 lg:py-20">
        <div className="grid gap-12 border-b border-ivory/12 pb-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="inline-flex items-center rounded-sm bg-black px-3 py-2">
              <img src={LOGO} alt="SYSI TRAVEL Guinée" className="block h-11 w-[106px] object-cover" />
            </div>
            <p className="mt-6 max-w-xs text-[0.9rem] leading-relaxed text-ivory/60">
              Plateforme touristique dédiée à la Guinée. Des sites d'exception, des guides locaux
              et un accompagnement pensé pour la diaspora.
            </p>
            <p className="label-caps mt-6 text-ivory/40">Conakry · Guinée</p>
          </div>

          <div>
            <p className="label-caps text-gold">Explorer</p>
            <ul className="mt-5 space-y-3">
              {EXPLORER.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    hash={link.hash}
                    className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-caps text-gold">Nos circuits</p>
            <ul className="mt-5 space-y-3">
              {SEJOURS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    hash={link.hash}
                    className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-caps text-gold">Contact</p>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href={CONTACT_INFO.phoneHref}
                  className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                >
                  {CONTACT_INFO.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                >
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                >
                  Formulaire de contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 text-[0.78rem] text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SYSI TRAVEL — Guinée. Tous droits réservés.</p>
          <p>Conçu pour la diaspora guinéenne, avec fierté.</p>
        </div>
      </div>
    </footer>
  );
}