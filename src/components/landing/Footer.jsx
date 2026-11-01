import { Link } from "@tanstack/react-router";
import { ArrowUp, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { CONTACT, LOGO_INVERSE } from "@/data/site";

const EXPLORER = [
  { label: "Destinations", hash: "destinations" },
  { label: "Produits locaux", hash: "produits" },
  { label: "La plateforme", hash: "solution" },
  { label: "Nos formules", hash: "offre" },
  { label: "Questions fréquentes", hash: "faq" },
];

const linkClass = "text-[0.95rem] text-ivory/75 transition-colors duration-300 hover:text-gold";

function Column({ title, children, className }) {
  return (
    <div className={className}>
      <p className="eyebrow text-gold">{title}</p>
      <ul className="mt-5 space-y-3">{children}</ul>
    </div>
  );
}

// `destinations` (optional): the pages that have them pass their list, so the footer links
// to every destination page; without it, the column points at the home page's section.
export default function Footer({ destinations = [] }) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-petrol-deep text-ivory">
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-8 gap-y-12 px-6 py-14 md:grid-cols-3 lg:grid-cols-12 lg:gap-x-10">
        <div className="col-span-2 md:col-span-3 lg:col-span-4">
          <Link to="/" aria-label="SYSI TRAVEL Guinée — accueil" className="inline-flex items-center">
            <img src={LOGO_INVERSE} alt="SYSI TRAVEL Guinée" width={1000} height={463} className="block h-[86px] w-auto object-contain" />
          </Link>
          <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-ivory/70">
            Plateforme touristique dédiée à la Guinée. Des sites d'exception, des guides locaux
            et un accompagnement pensé pour la diaspora.
          </p>
          <p className="mt-6 font-display text-[1.05rem] font-semibold text-gold">
            Redécouvrez la Guinée, en toute confiance.
          </p>
        </div>

        <Column title="Destinations" className="col-span-1 lg:col-span-3">
          {destinations.length
            ? destinations.slice(0, 7).map((destination) => (
                <li key={destination.id}>
                  <Link to="/destinations/$slug" params={{ slug: destination.slug }} className={linkClass}>
                    {destination.name}
                  </Link>
                </li>
              ))
            : (
                <li>
                  <Link to="/" hash="destinations" className={linkClass}>
                    Toutes les destinations
                  </Link>
                </li>
              )}
        </Column>

        <Column title="Explorer" className="col-span-1 lg:col-span-2">
          {EXPLORER.map((link) => (
            <li key={link.label}>
              <Link to="/" hash={link.hash} className={linkClass}>
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/contact" className={linkClass}>
              Contact
            </Link>
          </li>
        </Column>

        <Column title="Nous joindre" className="col-span-2 md:col-span-1 lg:col-span-3">
          <li>
            <a href={CONTACT.phoneHref} className={`${linkClass} inline-flex items-center gap-3`}>
              <Phone className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.7} /> {CONTACT.phone}
            </a>
          </li>
          <li>
            <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className={`${linkClass} inline-flex items-center gap-3`}>
              <MessageCircle className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.7} /> WhatsApp
            </a>
          </li>
          <li>
            <a href={`mailto:${CONTACT.email}`} className={`${linkClass} inline-flex items-center gap-3`}>
              <Mail className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.7} />
              {/* May wrap only after the @, never inside a word. */}
              <span>
                {CONTACT.email.split("@")[0]}@<wbr />
                {CONTACT.email.split("@")[1]}
              </span>
            </a>
          </li>
          <li className="flex items-start gap-3 text-[0.95rem] text-ivory/75">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold" strokeWidth={1.7} /> {CONTACT.address}
          </li>
          <li className="flex items-start gap-3 text-[0.95rem] text-ivory/75">
            <Clock className="mt-1 h-4 w-4 shrink-0 text-gold" strokeWidth={1.7} /> {CONTACT.hours}
          </li>
        </Column>
      </div>

      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-6 pb-24 pt-6 text-[0.82rem] text-ivory/55 sm:flex-row sm:pb-6 sm:pr-24 sm:items-center sm:justify-between">
          <p>© 2026 SYSI TRAVEL — Guinée. Tous droits réservés.</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="label-caps group inline-flex w-fit items-center gap-2 text-ivory/70 transition-colors hover:text-gold"
          >
            Retour en haut
            <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
