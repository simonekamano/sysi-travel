import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/data/site";

export default function ContactDetails({ className }) {
  return (
    <div className={cn("space-y-6", className)}>
      <a href={CONTACT.phoneHref} className="group flex items-start gap-4">
        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
        <span>
          <span className="label-caps block text-ivory/45">Téléphone</span>
          <span className="mt-1 block text-[1rem] text-ivory transition-colors group-hover:text-gold">
            {CONTACT.phone}
          </span>
        </span>
      </a>

      <a href={`mailto:${CONTACT.email}`} className="group flex items-start gap-4">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
        <span>
          <span className="label-caps block text-ivory/45">E-mail</span>
          <span className="mt-1 block break-all text-[1rem] text-ivory transition-colors group-hover:text-gold">
            {CONTACT.email}
          </span>
        </span>
      </a>

      <div className="flex items-start gap-4">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
        <span>
          <span className="label-caps block text-ivory/45">Adresse</span>
          <span className="mt-1 block text-[1rem] leading-snug text-ivory/85">{CONTACT.address}</span>
        </span>
      </div>

      <div className="flex items-start gap-4">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
        <span>
          <span className="label-caps block text-ivory/45">Horaires</span>
          <span className="mt-1 block text-[1rem] leading-snug text-ivory/85">{CONTACT.hours}</span>
        </span>
      </div>

      <a
        href={CONTACT.whatsapp}
        target="_blank"
        rel="noreferrer"
        className="label-caps inline-flex items-center gap-2 rounded-full border border-ivory/25 px-5 py-3 text-ivory transition-colors hover:border-gold hover:text-gold"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
        Écrire sur WhatsApp
      </a>
    </div>
  );
}