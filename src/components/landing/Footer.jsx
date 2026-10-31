import { CONTACT, LOGO } from "@/data/site";

const EXPLORER = [
  { label: "Destinations", href: "#destinations" },
  { label: "La plateforme", href: "#solution" },
  { label: "Notre offre", href: "#offre" },
  { label: "Questions", href: "#faq" },
];

const SEJOURS = [
  { label: "Escapade Loos", href: "#offre" },
  { label: "Signature Fouta", href: "#offre" },
  { label: "Grande Traversée", href: "#offre" },
  { label: "Séjour sur mesure", href: "#contact" },
];

const LIENS = [
  { label: "Page de contact", href: "/contact" },
  { label: "Réserver mon séjour", href: "#contact" },
  { label: "Revenir en haut", href: "#accueil" },
];

export default function Footer({ isHome = true }) {
  const resolve = (href) => (href.startsWith("#") && !isHome ? `/${href}` : href);

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
                  <a
                    href={resolve(link.href)}
                    className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-caps text-gold">Nos séjours</p>
            <ul className="mt-5 space-y-3">
              {SEJOURS.map((link) => (
                <li key={link.label}>
                  <a
                    href={resolve(link.href)}
                    className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
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
              {LIENS.map((link) => (
                <li key={link.label}>
                  <a
                    href={resolve(link.href)}
                    className="text-[0.9rem] text-ivory/65 transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
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