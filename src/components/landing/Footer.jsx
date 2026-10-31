import { Link } from "@tanstack/react-router";
import { CONTACT, LOGO } from "@/data/site";

const EXPLORER = [
  { label: "Destinations", hash: "destinations" },
  { label: "La plateforme", hash: "solution" },
  { label: "Notre offre", hash: "offre" },
  { label: "Questions", hash: "faq" },
];

const SEJOURS = [
  { label: "Escapade Loos", hash: "offre" },
  { label: "Signature Fouta", hash: "offre" },
  { label: "Grande Traversée", hash: "offre" },
];

export default function Footer() {
  return (
    <footer className="bg-petrol-deep text-ivory">
      <div className="mx-auto max-w-[1180px] px-6 py-12 lg:py-14">
        <div className="grid gap-10 border-b border-ivory/12 pb-9 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <Link
              to="/"
              className="inline-flex items-center rounded-full bg-ivory px-3 py-2 transition-colors hover:bg-white"
            >
              <img src={LOGO} alt="SYSI TRAVEL Guinée" className="block h-11 w-auto object-contain" />
            </Link>
            <p className="mt-6 max-w-xs text-[0.9rem] leading-relaxed text-ivory/60">
              Plateforme touristique dédiée à la Guinée. Des sites d'exception, des guides locaux
              et un accompagnement pensé pour la diaspora.
            </p>
            <p className="label-caps mt-6 text-ivory/40">{CONTACT.address}</p>
          </div>

          <div>
            <p className="label-caps text-gold">Explorer</p>
            <ul className="mt-5 space-y-3">
              {EXPLORER.map((link) => (
                <li key={link.label}>
                  <Link
                    to="/"
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
            <p className="label-caps text-gold">Nos séjours</p>
            <ul className="mt-5 space-y-3">
              {SEJOURS.map((link) => (
                <li key={link.label}>
                  <Link
                    to="/"
                    hash={link.hash}
                    className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/contact"
                  className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                >
                  Séjour sur mesure
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="label-caps text-gold">Contact</p>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href={CONTACT.phoneHref}
                  className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                >
                  {CONTACT.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                >
                  {CONTACT.email}
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
              <li>
                <Link
                  to="/"
                  hash="faq"
                  className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                >
                  Questions fréquentes
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