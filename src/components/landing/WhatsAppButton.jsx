import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/data/site";

// Floating WhatsApp shortcut, shown once the visitor scrolls past the top of the hero.
export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={CONTACT.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Écrire à SYSI TRAVEL sur WhatsApp"
      tabIndex={visible ? 0 : -1}
      className={cn(
        "group fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full bg-[#25D366] p-4 text-white shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] transition-all duration-500 ease-out hover:bg-[#1ebe5b] sm:bottom-7 sm:right-7",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <span aria-hidden="true" className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-30 [animation-duration:2.4s]" />
      <MessageCircle className="h-6 w-6 shrink-0" strokeWidth={1.8} />
      <span className="label-caps hidden max-w-0 overflow-hidden whitespace-nowrap transition-all duration-500 group-hover:max-w-[12rem] group-hover:pr-1 sm:inline-block">
        WhatsApp
      </span>
    </a>
  );
}
