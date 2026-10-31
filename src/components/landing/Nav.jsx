import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOGO, NAV_LINKS } from "@/data/site";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-[1440px] px-3 pt-3 lg:px-8 lg:pt-5">
        <div
          className={cn(
            "flex items-center justify-between gap-6 rounded-full px-3 py-2.5 transition-all duration-500 lg:px-5",
            scrolled
              ? "bg-petrol/95 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.9)] backdrop-blur-md"
              : "bg-petrol/20 backdrop-blur-[2px]"
          )}
        >
          <a href="#accueil" className="flex shrink-0 items-center rounded-sm bg-black px-3 py-1.5">
            <img
              src={LOGO}
              alt="SYSI TRAVEL Guinée"
              className="block h-9 w-[84px] object-cover sm:h-11 sm:w-[104px]"
            />
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="label-caps text-ivory/80 transition-colors duration-300 hover:text-gold"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#contact"
              className="label-caps hidden rounded-full bg-gold px-6 py-3 text-petrol-deep transition-all duration-300 hover:bg-ivory sm:inline-flex"
            >
              Réserver mon séjour
            </a>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:text-gold lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="mx-3 mt-2 rounded-3xl bg-petrol px-6 py-7 shadow-2xl lg:hidden">
          <nav className="flex flex-col gap-5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="label-caps text-ivory/80 transition-colors hover:text-gold"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="label-caps mt-7 flex w-full items-center justify-center rounded-full bg-gold px-6 py-3.5 text-petrol-deep"
          >
            Réserver mon séjour
          </a>
        </div>
      ) : null}
    </header>
  );
}