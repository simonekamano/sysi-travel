import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { CONTACT_INFO } from "@/data/site";

const ITEMS = [
  { icon: Phone, label: "Téléphone", value: CONTACT_INFO.phone, href: CONTACT_INFO.phoneHref },
  { icon: Mail, label: "Email", value: CONTACT_INFO.email, href: `mailto:${CONTACT_INFO.email}` },
  { icon: MapPin, label: "Adresse", value: CONTACT_INFO.address },
  { icon: Clock, label: "Horaires", value: CONTACT_INFO.hours },
];

export default function ContactDetails() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map(({ icon: Icon, label, value, href }) => {
        const content = (
          <>
            <Icon className="h-4 w-4 text-gold" strokeWidth={1.6} />
            <p className="label-caps mt-4 text-ivory/45">{label}</p>
            <p className="mt-2 text-[0.95rem] leading-snug text-ivory/90">{value}</p>
          </>
        );

        return href ? (
          <a
            key={label}
            href={href}
            className="border border-ivory/15 p-5 transition-colors duration-300 hover:border-gold/70 hover:bg-ivory/5"
          >
            {content}
          </a>
        ) : (
          <div key={label} className="border border-ivory/15 p-5">
            {content}
          </div>
        );
      })}
    </div>
  );
}