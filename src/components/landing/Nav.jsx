import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import CartButton from "@/components/boutique/CartButton";
import { LOGO_INVERSE, NAV_LINKS } from "@/data/site";

// The section currently in the middle band of the screen, for the active link.
function useActiveSection(ids) {
  const [active, setActive] = useState("");

  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

const SECTION_IDS = NAV_LINKS.filter((link) => link.href).map((link) => link.href.slice(1));

// `home`: on the landing page the links are in-page anchors; elsewhere they lead back to its sections.
// `solid`: the opaque bar from the start, for pages without a dark photo at the top.
// `bookingHref`: where « Réserver mon séjour » leads; the /contact page on pages without the form.
export default function Nav({ home = true, solid = false, bookingHref = "#contact" }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(SECTION_IDS);
  const pathname = useLocation({ select: (location) => location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // A page link is active on that page and below it (/circuits, /circuits/…); a section link,
  // on the home page while its section is in view.
  const isActive = (link) => (link.to ? pathname.startsWith(link.to) : home && active === link.href.slice(1));
  const hrefOf = (link) => link.to ?? (home ? link.href : `/${link.href}`);

  return (
    // The header's box also spans the closed mobile menu: it lets clicks through, and only the
    // bar and the open menu take them, so the page under the closed menu stays clickable.
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-auto mx-auto max-w-[82.29rem] px-3 pt-3 lg:px-8 lg:pt-5">
        <div
          className={cn(
            "flex items-center justify-between gap-6 rounded-full px-3 py-2.5 transition-all duration-500 lg:px-5",
            scrolled || open || solid
              ? "bg-petrol/95 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.9)] backdrop-blur-md"
              : "bg-petrol/20 backdrop-blur-[2px]"
          )}
        >
          <a
            href={home ? "#accueil" : "/"}
            aria-label="SYSI TRAVEL Guinée — accueil"
            className="flex shrink-0 items-center px-2"
          >
            <img
              src={LOGO_INVERSE}
              alt="SYSI TRAVEL Guinée"
              width={1000}
              height={463}
              className="block h-[3.77rem] w-auto object-contain lg:h-[4.34rem] xl:h-[3.77rem] 2xl:h-[4.34rem]"
            />
          </a>

          <nav className="hidden items-center gap-4 xl:flex 2xl:gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={hrefOf(link)}
                aria-current={isActive(link) ? "location" : undefined}
                className={cn(
                  "label-caps relative whitespace-nowrap py-1 transition-colors xl:!tracking-[0.1em] 2xl:!tracking-[0.16em] duration-300 hover:text-gold",
                  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-500",
                  isActive(link) ? "text-gold after:scale-x-100" : "text-ivory/80 after:scale-x-0 hover:after:scale-x-100"
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <CartButton />
            <a
              href={bookingHref}
              className="label-caps hidden whitespace-nowrap rounded-full bg-gold px-6 py-3 text-petrol-deep transition-all duration-300 hover:-translate-y-0.5 hover:bg-ivory hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)] sm:inline-flex"
            >
              Réserver mon séjour
            </a>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              aria-controls="menu-mobile"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:text-gold xl:hidden"
            >
              <Menu className={cn("absolute h-5 w-5 transition-all duration-300", open ? "rotate-90 scale-50 opacity-0" : "opacity-100")} />
              <X className={cn("absolute h-5 w-5 transition-all duration-300", open ? "opacity-100" : "-rotate-90 scale-50 opacity-0")} />
            </button>
          </div>
        </div>
      </div>

      <div
        id="menu-mobile"
        inert={!open}
        className={cn(
          "mx-3 mt-2 origin-top rounded-3xl bg-petrol px-6 py-7 shadow-2xl transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] xl:hidden",
          open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-3 scale-[0.98] opacity-0"
        )}
      >
        <nav className="flex flex-col gap-5">
          {NAV_LINKS.map((link, index) => (
            <a
              key={link.label}
              href={hrefOf(link)}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${80 + index * 55}ms` : "0ms" }}
              className={cn(
                "label-caps transition-all duration-500 hover:text-gold",
                isActive(link) ? "text-gold" : "text-ivory/80",
                open ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href={bookingHref}
          onClick={() => setOpen(false)}
          className="label-caps mt-7 flex w-full items-center justify-center rounded-full bg-gold px-6 py-3.5 text-petrol-deep transition-colors hover:bg-ivory"
        >
          Réserver mon séjour
        </a>
      </div>
    </header>
  );
}
