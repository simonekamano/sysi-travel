import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Compass, Download, Mail, Smartphone } from "lucide-react";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import BookCard from "@/components/boutique/BookCard";
import { BOOK_KINDS, DOWNLOAD_DAYS } from "@/lib/boutique";
import { getSiteContent } from "@/lib/server-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/boutique/")({
  loader: () => getSiteContent(),
  head: () => ({
    meta: [
      { title: "Livres et guides sur la Guinée — Boutique SYSI TRAVEL" },
      {
        name: "description",
        content:
          "Guides de voyage et livres sur la Guinée en PDF : à lire sur téléphone, tablette ou ordinateur. Commande simple, lien de téléchargement personnel.",
      },
    ],
  }),
  component: BoutiquePage,
});

const PROMISES = [
  { icon: Smartphone, title: "PDF à lire partout", text: "Sur téléphone, tablette ou ordinateur, même hors connexion une fois téléchargé." },
  { icon: Mail, title: "Paiement accompagné", text: "Nous vous contactons sous 72 h pour régler votre commande simplement." },
  { icon: Download, title: "Lien personnel", text: `Dès le paiement reçu, votre lien de téléchargement arrive par e-mail, valable ${DOWNLOAD_DAYS} jours.` },
];

function BoutiquePage() {
  const { livres, destinations, reseaux } = Route.useLoaderData();
  const [kind, setKind] = useState("");
  // Filters only for the types that have at least one book, and only when there are several.
  const kinds = BOOK_KINDS.filter((item) => livres.some((livre) => livre.kind === item.key));
  const visible = kind ? livres.filter((livre) => livre.kind === kind) : livres;

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid bookingHref="/contact" />

      <main>
        <section className="bg-background pb-14 pt-36 lg:pb-20 lg:pt-40">
          <div className="mx-auto max-w-site px-6">
            <BackButton label="Retour" className="mb-8" />
            <p className="eyebrow text-gold-deep">Boutique</p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
              Livres & guides sur la Guinée
            </h1>
            <p className="mt-6 max-w-2xl text-[1rem] leading-relaxed text-petrol/70">
              Préparez votre voyage, découvrez l'histoire et la culture guinéennes : nos guides et
              livres se lisent en PDF, sur tous vos écrans.
            </p>

            {kinds.length > 1 ? (
              <div role="group" aria-label="Filtrer par type" className="mt-10 flex flex-wrap gap-2">
                {[{ key: "", plural: "Tout" }, ...kinds].map((item) => (
                  <button
                    key={item.plural}
                    type="button"
                    aria-pressed={kind === item.key}
                    onClick={() => setKind(item.key)}
                    className={cn(
                      "label-caps rounded-full border px-5 py-2.5 transition-colors duration-300",
                      kind === item.key
                        ? "border-petrol bg-petrol text-ivory"
                        : "border-petrol/20 text-petrol/70 hover:border-gold hover:text-petrol",
                    )}
                  >
                    {item.plural}
                  </button>
                ))}
              </div>
            ) : null}

            {visible.length ? (
              <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visible.map((livre, index) => (
                  <Reveal key={livre.id} delay={(index % 4) * 80} className="h-full">
                    <BookCard book={livre} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="mt-10 max-w-2xl border border-petrol/15 bg-white p-8">
                <p className="label-caps text-gold-deep">Bientôt disponible</p>
                <p className="mt-3 text-[1rem] leading-relaxed text-petrol/75">
                  Nos premiers guides sont en préparation. En attendant, partez à la découverte des
                  sites de Guinée sur notre carte interactive.
                </p>
                <Link
                  to="/explorer"
                  className="label-caps mt-6 inline-flex items-center gap-2 rounded-full bg-petrol px-6 py-3.5 text-ivory transition-colors hover:bg-petrol-deep"
                >
                  <Compass className="h-4 w-4" /> Explorer la Guinée
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-petrol/10 bg-ivory-soft py-14">
          <div className="mx-auto grid max-w-site gap-8 px-6 md:grid-cols-3">
            {PROMISES.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 90}>
                <div className="flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-petrol/15 bg-white text-gold-deep">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <h2 className="font-display text-[1.05rem] font-bold text-petrol">{title}</h2>
                    <p className="mt-1.5 text-[0.92rem] leading-relaxed text-petrol/65">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}
