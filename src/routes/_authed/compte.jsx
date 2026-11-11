import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Download, LogOut, MessageCircle, Package, Settings } from "lucide-react";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { CONTACT } from "@/data/site";
import { ORDER_STEPS, formatPrice, orderStep } from "@/lib/boutique";
import { useAuth } from "@/lib/AuthContext";
import { listMesCommandes } from "@/lib/server-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/compte")({
  loader: () => listMesCommandes(),
  head: () => ({ meta: [{ title: "Mon compte — SYSI TRAVEL" }] }),
  component: ComptePage,
});

const dayFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });

function ComptePage() {
  const commandes = Route.useLoaderData();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid bookingHref="/contact" />
      <main className="pb-20 pt-32 lg:pt-36">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-gold-deep">Mon compte</p>
              <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.8rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
                Bonjour{user?.full_name ? ` ${user.full_name.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-2 text-[0.95rem] text-petrol/60">{user?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user?.role === "admin" ? (
                <a href="/admin" className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/20 px-4 py-2.5 text-petrol/75 hover:border-gold">
                  <Settings className="h-4 w-4" /> Administration
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => logout()}
                className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/20 px-4 py-2.5 text-petrol/75 hover:border-gold"
              >
                <LogOut className="h-4 w-4" /> Se déconnecter
              </button>
            </div>
          </div>

          <h2 className="mt-12 font-display text-[1.3rem] font-bold text-petrol">Mes commandes</h2>
          {commandes.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-petrol/15 bg-white p-8">
              <Package className="h-8 w-8 text-gold-deep" strokeWidth={1.5} />
              <p className="mt-4 text-[1rem] leading-relaxed text-petrol/75">
                Aucune commande avec l'adresse {user?.email} pour l'instant. Les commandes passées avec cette adresse, même avant la
                création de votre compte, apparaissent ici.
              </p>
              <Link
                to="/boutique"
                className="label-caps mt-6 inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-2.5 text-ivory transition-colors hover:bg-petrol-deep"
              >
                Voir la boutique <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-5">
              {commandes.map((commande) => (
                <Commande key={commande.id} commande={commande} />
              ))}
            </ul>
          )}

          <p className="mt-10 flex flex-wrap items-center gap-2 text-[0.92rem] text-petrol/65">
            Une question sur une commande ?
            <a
              href={CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-gold-deep hover:text-petrol"
            >
              <MessageCircle className="h-4 w-4" /> Écrivez-nous sur WhatsApp
            </a>
          </p>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function Commande({ commande }) {
  const cancelled = commande.statut === "annulee";
  const shipped = commande.livraison !== "sans";
  const steps = shipped ? ORDER_STEPS : ORDER_STEPS.slice(0, 2);
  const step = orderStep(commande);
  const linkOpen =
    commande.statut === "payee" && commande.lignes.length > 0 && (!commande.lien_expire_le || new Date(commande.lien_expire_le) > new Date());

  return (
    <li className="rounded-2xl border border-petrol/15 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-[1.1rem] font-bold text-petrol">{commande.reference}</p>
          <p className="text-[0.85rem] text-petrol/55">Passée le {dayFormat.format(new Date(commande.created_at))}</p>
        </div>
        <p className="font-display text-[1.2rem] font-bold text-petrol">{formatPrice(commande.total_cents)}</p>
      </div>

      {cancelled ? (
        <p className="label-caps mt-5 inline-flex rounded-full bg-petrol/10 px-3 py-1.5 text-[0.7rem] text-petrol/60">Commande annulée</p>
      ) : (
        <ol className="mt-6 grid gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((item, index) => {
            const reached = index <= step;
            return (
              <li key={item.key} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                    reached ? "border-[#1a7f4b] bg-[#1a7f4b] text-white" : "border-petrol/20 bg-white text-petrol/30",
                  )}
                >
                  {reached ? <Check className="h-4 w-4" /> : <span className="text-[0.75rem] font-bold">{index + 1}</span>}
                </span>
                <span className={cn("text-[0.75rem] leading-tight sm:text-[0.8rem]", reached ? "font-semibold text-petrol" : "text-petrol/45")}>
                  {item.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <ul className="mt-6 space-y-1.5 border-t border-petrol/10 pt-4 text-[0.92rem] text-petrol/75">
        {commande.articles.map((item, index) => (
          <li key={`a${index}`} className="flex justify-between gap-4">
            <span>
              {[item.name, item.variante, item.taille].filter(Boolean).join(" · ")}
              {item.quantite > 1 ? ` × ${item.quantite}` : ""}
            </span>
            <span className="whitespace-nowrap text-petrol/55">{formatPrice(item.price_cents * item.quantite)}</span>
          </li>
        ))}
        {commande.lignes.map((ligne, index) => (
          <li key={`l${index}`} className="flex justify-between gap-4">
            <span>{ligne.title} (PDF)</span>
            <span className="whitespace-nowrap text-petrol/55">{formatPrice(ligne.price_cents)}</span>
          </li>
        ))}
      </ul>

      {shipped && commande.adresse ? (
        <p className="mt-4 text-[0.85rem] leading-relaxed text-petrol/55">
          Livraison : {commande.adresse.replace(/\n/g, ", ")}
          {commande.pays ? `, ${commande.pays}` : ""}
        </p>
      ) : null}

      {linkOpen ? (
        <a
          href={`/telechargement/${commande.token}`}
          className="label-caps mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-petrol-deep transition-colors hover:bg-petrol hover:text-ivory"
        >
          <Download className="h-4 w-4" /> Télécharger mes livres
        </a>
      ) : null}
    </li>
  );
}
