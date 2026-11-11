import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Loader2, Lock, ShoppingBag, X } from "lucide-react";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import BookCover from "@/components/boutique/BookCover";
import { CONTACT } from "@/data/site";
import { BOOK_KIND_LABEL, DOWNLOAD_DAYS, formatPrice } from "@/lib/boutique";
import { useCart } from "@/lib/cart";
import { useLegalLinks } from "@/lib/legal";
import { createCommande, getSiteContent } from "@/lib/server-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/panier")({
  loader: () => getSiteContent(),
  head: () => ({
    meta: [
      { title: "Mon panier — Boutique SYSI TRAVEL" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PanierPage,
});

const inputClass = "border-petrol/25 bg-white text-petrol placeholder:text-petrol/45 focus-visible:ring-gold";

function PanierPage() {
  const { livres, destinations, reseaux } = Route.useLoaderData();
  const cart = useCart();
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", cgv: false, renonciation: false, site_web: "" });
  // The terms of sale must be accepted once the client has published them.
  const legal = useLegalLinks();
  const hasCgv = legal.some((link) => link.slug === "conditions-generales-de-vente");
  const hasRefund = legal.some((link) => link.slug === "remboursement");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  // When the page appeared: a robot orders within a second, a person takes longer.
  const openedAt = useRef(Date.now());
  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  const items = cart.ids.map((id) => livres.find((livre) => livre.id === id)).filter(Boolean);
  const total = items.reduce((sum, livre) => sum + livre.price_cents, 0);

  // A book no longer for sale leaves the cart.
  const unavailable = cart.ids.length - items.length;
  useEffect(() => {
    if (unavailable > 0) cart.keepOnly(livres.map((livre) => livre.id));
  }, [unavailable, cart, livres]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.nom.trim() || !form.email.trim()) {
      setError("Votre nom et votre e-mail sont nécessaires pour recevoir vos livres.");
      return;
    }
    if (hasCgv && !form.cgv) {
      setError("Cochez la case pour accepter les conditions générales de vente.");
      return;
    }
    if (!form.renonciation) {
      setError("Cochez la case pour confirmer la livraison immédiate du contenu numérique.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const result = await createCommande({
        data: {
          nom: form.nom.trim(),
          email: form.email.trim(),
          telephone: form.telephone.trim(),
          livres: items.map((livre) => livre.id),
          cgv: form.cgv,
          renonciation: true,
          site_web: form.site_web,
          delai: Date.now() - openedAt.current,
        },
      });
      setDone({ ...result, email: form.email.trim(), titles: items.map((livre) => livre.title) });
      cart.clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught?.message || "La commande n'a pas pu être envoyée. Réessayez ou écrivez-nous sur WhatsApp.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid bookingHref="/contact" />

      <main className="bg-background pb-20 pt-36 lg:pt-40">
        <div className="mx-auto max-w-site px-6">
          {done ? (
            <Confirmation done={done} />
          ) : (
            <>
              <BackButton label="Continuer mes achats" className="mb-8" />
              <p className="eyebrow text-gold-deep">Boutique</p>
              <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
                Mon panier
              </h1>

              {items.length === 0 ? (
                <div className="mt-10 max-w-xl border border-petrol/15 bg-white p-8">
                  <ShoppingBag className="h-8 w-8 text-gold-deep" strokeWidth={1.5} />
                  <p className="mt-4 text-[1rem] leading-relaxed text-petrol/75">Votre panier est vide.</p>
                  <Link
                    to="/boutique"
                    className="label-caps mt-6 inline-flex items-center gap-2 rounded-full bg-petrol px-6 py-3.5 text-ivory transition-colors hover:bg-petrol-deep"
                  >
                    Voir les livres et guides <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
                  <ul className="divide-y divide-petrol/10 self-start border-y border-petrol/10">
                    {items.map((livre) => (
                      <li key={livre.id} className="flex items-center gap-5 py-5">
                        <Link to="/boutique/$slug" params={{ slug: livre.slug }} className="w-16 shrink-0 sm:w-20">
                          <BookCover book={livre} flat />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="label-caps text-gold-deep">{BOOK_KIND_LABEL[livre.kind]} · PDF</p>
                          <Link
                            to="/boutique/$slug"
                            params={{ slug: livre.slug }}
                            className="mt-1 block font-display text-[1.08rem] font-bold leading-snug text-petrol hover:text-gold-deep"
                          >
                            {livre.title}
                          </Link>
                          {livre.author ? <p className="text-[0.88rem] text-petrol/55">{livre.author}</p> : null}
                        </div>
                        <span className="whitespace-nowrap font-display text-[1.1rem] font-bold text-petrol">{formatPrice(livre.price_cents)}</span>
                        <button
                          type="button"
                          onClick={() => cart.remove(livre.id)}
                          aria-label={`Retirer ${livre.title} du panier`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-petrol/45 transition-colors hover:bg-petrol/5 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <form onSubmit={submit} className="space-y-5 self-start border border-petrol/15 bg-white p-6 lg:sticky lg:top-32">
                    <div className="flex items-baseline justify-between border-b border-petrol/10 pb-4">
                      <span className="label-caps text-petrol/65">
                        Total ({items.length} livre{items.length > 1 ? "s" : ""})
                      </span>
                      <span className="font-display text-[1.7rem] font-extrabold text-petrol">{formatPrice(total)}</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commande-nom" className="label-caps text-petrol/65">
                        Nom et prénom
                      </Label>
                      <Input id="commande-nom" autoComplete="name" value={form.nom} onChange={set("nom")} className={inputClass} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commande-email" className="label-caps text-petrol/65">
                        E-mail (pour recevoir vos livres)
                      </Label>
                      <Input
                        id="commande-email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={set("email")}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commande-telephone" className="label-caps text-petrol/65">
                        Téléphone ou WhatsApp (facultatif)
                      </Label>
                      <Input id="commande-telephone" type="tel" autoComplete="tel" value={form.telephone} onChange={set("telephone")} className={inputClass} />
                    </div>
                    {/* Spam trap: hidden from people, filled in by robots. */}
                    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                      <label htmlFor="commande-site">Site web</label>
                      <input id="commande-site" tabIndex={-1} autoComplete="off" value={form.site_web} onChange={set("site_web")} />
                    </div>

                    {hasCgv ? (
                      <label className="flex items-start gap-3 text-[0.85rem] leading-relaxed text-petrol/70">
                        <input
                          type="checkbox"
                          checked={form.cgv}
                          onChange={set("cgv")}
                          className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--petrol))]"
                        />
                        <span>
                          J'ai lu et j'accepte les{" "}
                          <a href="/conditions-generales-de-vente" target="_blank" rel="noopener" className="text-gold-deep underline underline-offset-4">
                            conditions générales de vente
                          </a>
                          {hasRefund ? (
                            <>
                              {" "}et la{" "}
                              <a href="/remboursement" target="_blank" rel="noopener" className="text-gold-deep underline underline-offset-4">
                                politique de remboursement
                              </a>
                            </>
                          ) : null}
                          .
                        </span>
                      </label>
                    ) : null}

                    <label className="flex items-start gap-3 text-[0.85rem] leading-relaxed text-petrol/70">
                      <input
                        type="checkbox"
                        checked={form.renonciation}
                        onChange={set("renonciation")}
                        className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--petrol))]"
                      />
                      Je demande à recevoir mes livres numériques dès mon paiement reçu, et je renonce
                      ainsi à mon droit de rétractation pour ce contenu.
                    </label>

                    {error ? <p className="text-[0.85rem] text-destructive">{error}</p> : null}

                    <button
                      type="submit"
                      disabled={sending}
                      className="label-caps flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 text-petrol-deep transition-all duration-300 hover:-translate-y-0.5 hover:bg-petrol hover:text-ivory disabled:pointer-events-none disabled:opacity-60"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Commander
                    </button>
                    <p className="text-[0.82rem] leading-relaxed text-petrol/55">
                      Rien n'est payé maintenant : nous vous contactons sous 72 h pour le paiement. Dès
                      qu'il est reçu, votre lien de téléchargement personnel arrive par e-mail, valable{" "}
                      {DOWNLOAD_DAYS} jours.
                    </p>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}

function Confirmation({ done }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-gold-deep">
        <CheckCircle2 className="h-8 w-8" strokeWidth={1.6} />
      </span>
      <p className="eyebrow mt-6 text-gold-deep">Commande {done.reference}</p>
      <h1 className="mt-4 text-[clamp(1.9rem,3.6vw,2.8rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-petrol">
        Merci, votre commande est bien reçue
      </h1>
      <p className="mt-5 text-[1.02rem] leading-relaxed text-petrol/75">
        Un récapitulatif part à <strong className="text-petrol">{done.email}</strong>. Nous vous
        contactons sous 72 h pour le paiement ({formatPrice(done.total_cents)}) ; dès qu'il est reçu,
        votre lien de téléchargement arrive par e-mail.
      </p>
      <ul className="mx-auto mt-8 max-w-md space-y-2 border-y border-petrol/10 py-5 text-left text-[0.95rem] text-petrol/80">
        {done.titles.map((title) => (
          <li key={title} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-deep" /> {title}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={CONTACT.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-6 py-3.5 text-ivory transition-colors hover:bg-petrol-deep"
        >
          Nous écrire sur WhatsApp
        </a>
        <Link
          to="/boutique"
          className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-6 py-3.5 text-petrol transition-colors hover:border-gold"
        >
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
}
