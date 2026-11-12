import { Lock, MessageCircle } from "lucide-react";
import { CONTACT } from "@/data/site";
import { cn } from "@/lib/utils";

// While online sale is closed (VENTE_EN_LIGNE in src/lib/boutique.js): what replaces the cart
// buttons on a book's or an article's page. `item`: what the visitor is looking at, quoted in
// the WhatsApp message.
export default function SaleSoon({ item, className }) {
  const whatsapp = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
    `Bonjour SYSI TRAVEL, je souhaite réserver ${item}.`,
  )}`;

  return (
    <div className={cn("rounded-2xl border border-gold/40 bg-gold/10 p-5", className)}>
      <p className="flex items-center gap-2 font-display text-[1.02rem] font-bold text-petrol">
        <Lock className="h-4 w-4 text-gold-deep" /> Paiement en ligne bientôt disponible
      </p>
      <p className="mt-2 text-[0.92rem] leading-relaxed text-petrol/70">
        La vente en ligne ouvre très prochainement, avec un paiement sécurisé. En attendant, réservez sur WhatsApp : nous vous
        répondons rapidement.
      </p>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="label-caps mt-4 inline-flex items-center gap-2 rounded-full bg-[#1a9e4b] px-5 py-3 text-white transition-colors duration-300 hover:bg-[#15803d]"
      >
        <MessageCircle className="h-4 w-4" /> Réserver sur WhatsApp
      </a>
    </div>
  );
}
