import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Loader2, Lock, Minus, Plus, ShoppingBag, Truck, UserRound, X } from "lucide-react";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import BookCover from "@/components/boutique/BookCover";
import { CONTACT } from "@/data/site";
import { BOOK_KIND_LABEL, CUSTOM_SIZE, DOWNLOAD_DAYS, articleImages, formatPrice, thumbOf, variantsOf } from "@/lib/boutique";
import { lineKey, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/AuthContext";
import { useLegalLinks } from "@/lib/legal";
import { noindex } from "@/lib/seo";
import { createCommande, getBoutiquePage } from "@/lib/server-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/panier")({
  loader: () => getBoutiquePage(),
  head: () => noindex("Mon panier — Boutique SYSI TRAVEL"),
  component: PanierPage,
});

const inputClass = "border-petrol/25 bg-white text-petrol placeholder:text-petrol/45 focus-visible:ring-gold";
const COUNTRIES = ["France", "Belgique", "Guinée", "Suisse", "Luxembourg", "Canada", "Royaume-Uni", "Allemagne", "Italie", "Espagne", "Sénégal", "Côte d'Ivoire", "États-Unis"];

// An article line of the cart, if it is still for sale in that variant and size.
function resolveLine(line, articles) {
  const article = articles.find((item) => item.id === line.id);
  if (!article) return null;
  const variants = variantsOf(article);
  const variant = variants.find((item) => item.name === line.variante);
  if (variants.length && (!variant || variant.available === false)) return null;
  const sizes = article.custom_made ? [...article.sizes, CUSTOM_SIZE] : article.sizes;
  if (sizes.length ? !sizes.includes(line.taille) : line.taille !== "") return null;
  return { ...line, key: lineKey(line), article, image: articleImages(article, line.variante)[0] };
}

function PanierPage() {
  const { articles, livres, destinations, reseaux } = Route.useLoaderData();
  const cart = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    pays: "",
    message: "",
    cgv: false,
    renonciation: false,
    site_web: "",
  });
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

  // A signed-in customer finds their name and e-mail already filled in.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({ ...prev, nom: prev.nom || user.full_name || "", email: prev.email || user.email || "" }));
  }, [user]);

  const books = cart.ids.map((id) => livres.find((livre) => livre.id === id)).filter(Boolean);
  const items = cart.lines.map((line) => resolveLine(line, articles)).filter(Boolean);
  const total = books.reduce((sum, livre) => sum + livre.price_cents, 0) + items.reduce((sum, item) => sum + item.article.price_cents * item.quantite, 0);
  const count = books.length + items.reduce((sum, item) => sum + item.quantite, 0);
  const withDelivery = items.length > 0;

  // What is no longer for sale leaves the cart.
  const unavailable = cart.ids.length - books.length + cart.lines.length - items.length;
  useEffect(() => {
    if (unavailable > 0) {
      cart.keepOnly(
        livres.map((livre) => livre.id),
        (line) => Boolean(resolveLine(line, articles)),
      );
    }
  }, [unavailable, cart, livres, articles]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.nom.trim() || !form.email.trim()) {
      setError("Votre nom et votre e-mail sont nécessaires pour suivre votre commande.");
      return;
    }
    if (withDelivery && (form.adresse.trim().length < 8 || form.pays.trim().length < 2)) {
      setError("Indiquez votre adresse de livraison complète et votre pays.");
      return;
    }
    if (hasCgv && !form.cgv) {
      setError("Cochez la case pour accepter les conditions générales de vente.");
      return;
    }
    if (books.length && !form.renonciation) {
      setError("Cochez la case pour confirmer la livraison immédiate des livres numériques.");
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
          livres: books.map((livre) => livre.id),
          articles: items.map((item) => ({ id: item.id, variante: item.variante, taille: item.taille, quantite: item.quantite })),
          adresse: withDelivery ? form.adresse.trim() : "",
          pays: withDelivery ? form.pays.trim() : "",
          message: form.message.trim(),
          cgv: form.cgv,
          renonciation: books.length > 0 && form.renonciation,
          site_web: form.site_web,
          delai: Date.now() - openedAt.current,
        },
      });
      setDone({
        ...result,
        email: form.email.trim(),
        withDelivery,
        withBooks: books.length > 0,
        titles: [
          ...books.map((livre) => livre.title),
          ...items.map((item) => [item.article.name, item.variante, item.taille].filter(Boolean).join(" · ") + (item.quantite > 1 ? ` × ${item.quantite}` : "")),
        ],
      });
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

      <main className="bg-background pb-20 pt-32 lg:pt-36">
        <div className="mx-auto max-w-site px-6">
          {done ? (
            <Confirmation done={done} signedIn={Boolean(user)} />
          ) : (
            <>
              <BackButton label="Continuer mes achats" className="mb-6" />
              <p className="eyebrow text-gold-deep">Boutique</p>
              <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
                Mon panier
              </h1>

              {count === 0 ? (
                <div className="mt-10 max-w-xl border border-petrol/15 bg-white p-8">
                  <ShoppingBag className="h-8 w-8 text-gold-deep" strokeWidth={1.5} />
                  <p className="mt-4 text-[1rem] leading-relaxed text-petrol/75">Votre panier est vide.</p>
                  <Link
                    to="/boutique"
                    className="label-caps mt-6 inline-flex items-center gap-2 rounded-full bg-petrol px-6 py-3.5 text-ivory transition-colors hover:bg-petrol-deep"
                  >
                    Voir la boutique <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
                  <ul className="divide-y divide-petrol/10 self-start border-y border-petrol/10">
                    {items.map((item) => (
                      <li key={item.key} className="flex gap-4 py-5 sm:items-center sm:gap-5">
                        <Link to="/boutique/article/$slug" params={{ slug: item.article.slug }} className="w-20 shrink-0 sm:w-24">
                          <img src={thumbOf(item.image)} alt="" className="aspect-[4/5] w-full rounded-xl object-cover" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            to="/boutique/article/$slug"
                            params={{ slug: item.article.slug }}
                            className="block font-display text-[1.05rem] font-bold leading-snug text-petrol hover:text-gold-deep"
                          >
                            {item.article.name}
                          </Link>
                          <p className="mt-0.5 text-[0.88rem] text-petrol/60">{[item.variante, item.taille].filter(Boolean).join(" · ")}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-4">
                            <div className="flex items-center rounded-full border border-petrol/20">
                              <button
                                type="button"
                                onClick={() => (item.quantite > 1 ? cart.setQuantity(item.key, item.quantite - 1) : cart.removeLine(item.key))}
                                aria-label="Une pièce de moins"
                                className="flex h-9 w-9 items-center justify-center text-petrol/70 hover:text-petrol"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-5 text-center text-[0.92rem] font-semibold text-petrol">{item.quantite}</span>
                              <button
                                type="button"
                                onClick={() => cart.setQuantity(item.key, item.quantite + 1)}
                                aria-label="Une pièce de plus"
                                className="flex h-9 w-9 items-center justify-center text-petrol/70 hover:text-petrol"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="font-display text-[1.05rem] font-bold text-petrol">
                              {formatPrice(item.article.price_cents * item.quantite)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => cart.removeLine(item.key)}
                          aria-label={`Retirer ${item.article.name} du panier`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-full text-petrol/45 transition-colors hover:bg-petrol/5 hover:text-destructive sm:self-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                    {books.map((livre) => (
                      <li key={livre.id} className="flex items-center gap-5 py-5">
                        <Link to="/boutique/$slug" params={{ slug: livre.slug }} className="w-16 shrink-0 sm:w-20">
                          <BookCover book={livre} flat />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="label-caps text-gold-deep">{BOOK_KIND_LABEL[livre.kind]} · PDF</p>
                          <Link
                            to="/boutique/$slug"
                            params={{ slug: livre.slug }}
                            className="mt-1 block font-display text-[1.05rem] font-bold leading-snug text-petrol hover:text-gold-deep"
                          >
                            {livre.title}
                          </Link>
                          {livre.author ? <p className="text-[0.88rem] text-petrol/55">{livre.author}</p> : null}
                        </div>
                        <span className="whitespace-nowrap font-display text-[1.05rem] font-bold text-petrol">{formatPrice(livre.price_cents)}</span>
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

                  <form onSubmit={submit} className="space-y-5 self-start rounded-2xl border border-petrol/15 bg-white p-6 lg:sticky lg:top-28">
                    <div className="flex items-baseline justify-between border-b border-petrol/10 pb-4">
                      <span className="label-caps text-petrol/65">
                        Total ({count} article{count > 1 ? "s" : ""})
                      </span>
                      <span className="font-display text-[1.7rem] font-extrabold text-petrol">{formatPrice(total)}</span>
                    </div>
                    {withDelivery ? (
                      <p className="flex items-start gap-2 text-[0.85rem] leading-relaxed text-petrol/60">
                        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" /> Frais de livraison en plus, confirmés avec vous avant le paiement.
                      </p>
                    ) : null}

                    {!user ? (
                      <p className="flex items-start gap-2 rounded-xl bg-ivory-soft px-4 py-3 text-[0.85rem] leading-relaxed text-petrol/70">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                        <span>
                          Déjà client ?{" "}
                          <a href="/login?returnTo=/panier" className="font-semibold text-gold-deep underline underline-offset-4">
                            Connectez-vous
                          </a>{" "}
                          pour retrouver vos commandes dans votre compte. Sinon, commandez simplement ci-dessous.
                        </span>
                      </p>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="commande-nom" className="label-caps text-petrol/65">
                        Nom et prénom
                      </Label>
                      <Input id="commande-nom" autoComplete="name" value={form.nom} onChange={set("nom")} className={inputClass} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commande-email" className="label-caps text-petrol/65">
                        E-mail
                      </Label>
                      <Input id="commande-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} className={inputClass} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commande-telephone" className="label-caps text-petrol/65">
                        Téléphone ou WhatsApp {withDelivery ? "" : "(facultatif)"}
                      </Label>
                      <Input id="commande-telephone" type="tel" autoComplete="tel" value={form.telephone} onChange={set("telephone")} className={inputClass} />
                    </div>
                    {withDelivery ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="commande-adresse" className="label-caps text-petrol/65">
                            Adresse de livraison
                          </Label>
                          <Textarea
                            id="commande-adresse"
                            rows={3}
                            autoComplete="street-address"
                            placeholder="Numéro, rue, code postal, ville"
                            value={form.adresse}
                            onChange={set("adresse")}
                            className={`${inputClass} resize-none`}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="commande-pays" className="label-caps text-petrol/65">
                            Pays
                          </Label>
                          <Input id="commande-pays" list="pays-livraison" autoComplete="country-name" value={form.pays} onChange={set("pays")} className={inputClass} required />
                          <datalist id="pays-livraison">
                            {COUNTRIES.map((country) => (
                              <option key={country} value={country} />
                            ))}
                          </datalist>
                        </div>
                      </>
                    ) : null}
                    <div className="space-y-2">
                      <Label htmlFor="commande-message" className="label-caps text-petrol/65">
                        Précisions (facultatif)
                      </Label>
                      <Textarea
                        id="commande-message"
                        rows={2}
                        placeholder={withDelivery ? "Vos mesures pour le sur-mesure, un créneau de livraison…" : "Une question, une précision…"}
                        value={form.message}
                        onChange={set("message")}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                    {/* Spam trap: hidden from people, filled in by robots. */}
                    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                      <label htmlFor="commande-site">Site web</label>
                      <input id="commande-site" tabIndex={-1} autoComplete="off" value={form.site_web} onChange={set("site_web")} />
                    </div>

                    {hasCgv ? (
                      <label className="flex items-start gap-3 text-[0.85rem] leading-relaxed text-petrol/70">
                        <input type="checkbox" checked={form.cgv} onChange={set("cgv")} className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--petrol))]" />
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

                    {books.length ? (
                      <label className="flex items-start gap-3 text-[0.85rem] leading-relaxed text-petrol/70">
                        <input
                          type="checkbox"
                          checked={form.renonciation}
                          onChange={set("renonciation")}
                          className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--petrol))]"
                        />
                        Je demande à recevoir mes livres numériques dès mon paiement reçu, et je renonce ainsi à mon droit de rétractation
                        pour ce contenu.
                      </label>
                    ) : null}

                    {error ? <p className="text-[0.85rem] font-semibold text-destructive">{error}</p> : null}

                    <button
                      type="submit"
                      disabled={sending}
                      className="label-caps flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 text-petrol-deep transition-all duration-300 hover:-translate-y-0.5 hover:bg-petrol hover:text-ivory disabled:pointer-events-none disabled:opacity-60"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Commander
                    </button>
                    <p className="text-[0.82rem] leading-relaxed text-petrol/55">
                      Rien n'est payé maintenant : nous vous contactons sous 72 h pour le paiement
                      {withDelivery ? " et la livraison" : ""}.
                      {books.length ? ` Vos livres arrivent par e-mail dès le paiement reçu (lien valable ${DOWNLOAD_DAYS} jours).` : ""}
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

function Confirmation({ done, signedIn }) {
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
        Un récapitulatif part à <strong className="text-petrol">{done.email}</strong>. Nous vous contactons sous 72 h pour le paiement (
        {formatPrice(done.total_cents)}
        {done.withDelivery ? " hors frais de livraison" : ""}).
        {done.withBooks ? " Dès qu'il est reçu, votre lien de téléchargement arrive par e-mail." : ""}
        {done.withDelivery ? " Vous recevrez ensuite un e-mail à chaque étape de la livraison." : ""}
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
          href={signedIn ? "/compte" : "/register?returnTo=/compte"}
          className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-6 py-3.5 text-ivory transition-colors hover:bg-petrol-deep"
        >
          <UserRound className="h-4 w-4" /> {signedIn ? "Suivre ma commande" : "Créer mon compte pour suivre ma commande"}
        </a>
        <a
          href={CONTACT.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-6 py-3.5 text-petrol transition-colors hover:border-gold"
        >
          Nous écrire sur WhatsApp
        </a>
      </div>
      {!signedIn ? (
        <p className="mx-auto mt-4 max-w-md text-[0.85rem] text-petrol/55">
          Utilisez la même adresse e-mail : toutes vos commandes apparaîtront dans votre compte.
        </p>
      ) : null}
    </div>
  );
}
