import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Check, CheckCircle2, CircleDashed, Copy, FlaskConical, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { saveReglagesPaiement } from "@/lib/server-fns";
import { parsePrice, priceInput } from "@/lib/boutique";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/admin/fields";
import { cn } from "@/lib/utils";

// Administration › Paiement en ligne: whether card payment (Stripe) is on, where the prices are
// changed, and the articles' shipping fee. The Stripe keys themselves live on the server
// (DEPLOIEMENT.md, « Paiement en ligne »), never in the database.
export default function PaiementPanel({ reglages }) {
  const { stripe, adresseNotifications } = reglages;
  const router = useRouter();
  const [livraison, setLivraison] = useState(() => (reglages.livraison_cents === 0 ? "0" : priceInput(reglages.livraison_cents)));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const save = async (event) => {
    event.preventDefault();
    const value = livraison.trim() ? parsePrice(livraison) : null;
    if (livraison.trim() && (value === null || value > 100000)) {
      setMessage({ error: true, text: "Montant invalide : indiquez par exemple 8 ou 8,50 (0 pour une livraison offerte)." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveReglagesPaiement({ data: { livraison_cents: value } });
      setMessage({ error: false, text: "Frais de livraison enregistrés." });
      router.invalidate();
    } catch {
      setMessage({ error: true, text: "Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur." });
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(adresseNotifications);
      toast.success("Adresse copiée.");
    } catch {
      toast.error("Copie impossible : sélectionnez l'adresse à la main.");
    }
  };

  const status = !stripe.actif
    ? {
        icon: CircleDashed,
        tone: "bg-petrol/5 text-petrol",
        title: "Paiement par carte pas encore branché",
        text: "Les circuits restent en « Tarif sur demande » et les commandes se règlent comme avant (WhatsApp, Orange Money, virement).",
      }
    : stripe.mode === "test"
      ? {
          icon: FlaskConical,
          tone: "bg-gold/15 text-petrol",
          title: "Paiement par carte en mode test",
          text: "Tout fonctionne comme en vrai, mais aucune carte n'est débitée : les paiements sont simulés avec les cartes de test de Stripe.",
        }
      : {
          icon: CheckCircle2,
          tone: "bg-[#1a7f4b]/10 text-petrol",
          title: "Paiement par carte actif",
          text: "Les voyageurs paient par carte sur la page sécurisée de Stripe. L'argent arrive sur votre compte Stripe, puis sur votre compte bancaire.",
        };
  const StatusIcon = status.icon;

  const checks = [
    ["Clé secrète Stripe", stripe.cleSecrete],
    ["Clé de service Supabase", stripe.cleService],
    ["Notifications Stripe (webhook)", stripe.notifications],
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="space-y-5 border border-petrol/15 bg-white p-6">
        <div className={cn("flex items-start gap-3 rounded-lg px-4 py-4", status.tone)}>
          <StatusIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
          <div>
            <p className="font-semibold">{status.title}</p>
            <p className="mt-1 text-[0.9rem] leading-relaxed text-petrol/70">{status.text}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="label-caps text-petrol/55">Pour le développeur</p>
          <ul className="space-y-2 text-[0.9rem]">
            {checks.map(([label, ok]) => (
              <li key={label} className="flex items-center gap-2 text-petrol/75">
                {ok ? <Check className="h-4 w-4 text-[#1a7f4b]" /> : <X className="h-4 w-4 text-petrol/40" />}
                {label} : {ok ? "présente" : "absente"}
              </li>
            ))}
          </ul>
          <div className="space-y-1.5">
            <p className="text-[0.85rem] text-petrol/60">Adresse des notifications à déclarer dans Stripe :</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-ivory-soft px-3 py-2 text-[0.82rem] text-petrol">{adresseNotifications}</code>
              <button
                type="button"
                onClick={copy}
                aria-label="Copier l'adresse des notifications"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-petrol/20 text-petrol/70 transition-colors hover:border-gold hover:text-petrol"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5 border border-petrol/15 bg-white p-6">
        <div>
          <p className="font-semibold text-petrol">Où changer les prix ?</p>
          <p className="mt-1 text-[0.9rem] leading-relaxed text-petrol/70">
            Ici, dans l'administration du site. Au moment du paiement, le site envoie lui-même le bon montant à Stripe : il n'y a rien à
            créer ni à modifier dans Stripe.
          </p>
          <ul className="mt-3 space-y-1.5 text-[0.9rem] text-petrol/75">
            <li>
              <Link to="/admin/circuits" className="font-semibold text-gold-deep underline underline-offset-4">
                Circuits
              </Link>{" "}
              : « Prix en ligne par personne » et la part payée à la réservation (acompte).
            </li>
            <li>
              <Link to="/admin/articles" className="font-semibold text-gold-deep underline underline-offset-4">
                Articles
              </Link>{" "}
              et{" "}
              <Link to="/admin/livres" className="font-semibold text-gold-deep underline underline-offset-4">
                Livres & guides
              </Link>{" "}
              : le prix de chaque produit.
            </li>
          </ul>
        </div>

        <form onSubmit={save} className="space-y-4 border-t border-petrol/10 pt-5">
          <TextField
            label="Frais de livraison des articles (€)"
            value={livraison}
            onChange={setLivraison}
            placeholder="Par exemple 8,50 · 0 : livraison offerte"
          />
          <p className="text-[0.82rem] leading-relaxed text-petrol/55">
            Ajoutés une fois par commande d'articles (les livres numériques n'en ont pas). Tant que cette case est vide, les articles ne se
            paient pas en ligne.
          </p>
          {message ? <p className={message.error ? "text-[0.85rem] text-destructive" : "text-[0.85rem] text-petrol/70"}>{message.text}</p> : null}
          <Button type="submit" disabled={saving} className="label-caps gap-2 rounded-full bg-petrol px-5 text-ivory hover:bg-petrol-deep">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        </form>
      </section>
    </div>
  );
}
