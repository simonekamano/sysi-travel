import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Scale } from "lucide-react";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import LegalText from "@/components/legal/LegalText";
import { CONTACT } from "@/data/site";
import { legalDayFormat, useLegalLinks } from "@/lib/legal";
import { cn } from "@/lib/utils";

// <head> of a legal page: its title and the start of its text as description.
export function legalHead(page) {
  if (!page) return { meta: [{ title: "Page introuvable — SYSI TRAVEL" }] };
  const description = page.body
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*(#+|[-*]|\d+\.)\s+/gm, "")
    .replace(/[*`>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 155);
  return {
    meta: [
      { title: `${page.title} — SYSI TRAVEL` },
      { name: "description", content: description },
      { property: "og:title", content: `${page.title} — SYSI TRAVEL` },
    ],
  };
}

// A published legal page (/mentions-legales, /conditions-generales-de-vente, /confidentialite,
// /remboursement): its text, the date of its last change and the other legal pages.
export default function LegalPageView({ page, destinations, reseaux }) {
  const links = useLegalLinks();

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid bookingHref="/contact" />

      <main className="bg-background pb-20 pt-36 lg:pt-40">
        <div className="mx-auto max-w-site px-6">
          <BackButton className="mb-10" />

          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-20">
            <article className="min-w-0 max-w-[46rem]">
              <p className="eyebrow text-gold-deep">Informations légales</p>
              <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
                {page.title}
              </h1>
              <p className="mt-4 text-[0.9rem] text-petrol/55">
                Dernière mise à jour : {legalDayFormat.format(new Date(page.updated_at))}
              </p>
              <LegalText body={page.body} className="mt-10 border-t border-petrol/10 pt-10" />
            </article>

            <aside className="space-y-8 lg:sticky lg:top-32 lg:self-start">
              {links.length > 1 ? (
                <nav aria-label="Informations légales" className="border border-petrol/15 bg-white p-6">
                  <p className="label-caps flex items-center gap-2 text-petrol/60">
                    <Scale className="h-4 w-4 text-gold-deep" strokeWidth={1.7} /> Informations légales
                  </p>
                  <ul className="mt-4 space-y-1">
                    {links.map((link) => (
                      <li key={link.slug}>
                        <Link
                          to={`/${link.slug}`}
                          className={cn(
                            "-mx-3 block rounded-sm px-3 py-2 text-[0.95rem] transition-colors",
                            link.slug === page.slug
                              ? "bg-petrol/5 font-semibold text-petrol"
                              : "text-petrol/70 hover:bg-petrol/5 hover:text-petrol",
                          )}
                          aria-current={link.slug === page.slug ? "page" : undefined}
                        >
                          {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}

              <div className="border border-petrol/15 bg-white p-6">
                <p className="font-display text-[1.05rem] font-bold text-petrol">Une question ?</p>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-petrol/65">
                  Écrivez-nous, nous vous répondons sous 72 heures.
                </p>
                <div className="mt-5 space-y-3 text-[0.92rem]">
                  <a
                    href={CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-petrol/80 transition-colors hover:text-gold-deep"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.7} /> WhatsApp
                  </a>
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="flex items-center gap-3 break-all text-petrol/80 transition-colors hover:text-gold-deep"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.7} /> {CONTACT.email}
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}
