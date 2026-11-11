import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
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
  const isActive = (link) =>
    link.to ? (link.active ?? [link.to]).some((path) => pathname.startsWith(path)) : home && active === link.href.slice(1);
  const hrefOf = (link) => link.to ?? (home ? link.href : `/${link.href}`);
  const linkClass =
    "label-caps relative whitespace-nowrap py-1 transition-colors duration-300 hover:text-gold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-500";
  const activeClass = "text-gold after:scale-x-100";
  const idleClass = "text-ivory/80 after:scale-x-0 hover:after:scale-x-100";

  return (
    // The header's box also spans the closed mobile menu: it lets clicks through, and only the
    // bar and the open menu take them, so the page under the closed menu stays clickable.
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-auto mx-auto max-w-[82.29rem] px-3 pt-3 lg:px-8 lg:pt-4">
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-full px-2.5 py-1.5 transition-all duration-500 lg:px-4",
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
              className="block h-[2.6rem] w-auto object-contain lg:h-[2.85rem]"
            />
          </a>

          <nav className="hidden items-center gap-6 lg:flex xl:gap-9">
            {NAV_LINKS.map((link) =>
              link.children ? (
                // « Boutique » and its sections: the menu opens on hover or keyboard focus.
                <div key={link.label} className="group relative">
                  <a
                    href={hrefOf(link)}
                    aria-current={isActive(link) ? "location" : undefined}
                    aria-haspopup="true"
                    className={cn(linkClass, "inline-flex items-center gap-1.5", isActive(link) ? activeClass : idleClass)}
                  >
                    {link.label}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180 group-focus-within:rotate-180" />
                  </a>
                  <div className="invisible absolute left-1/2 top-full z-10 -translate-x-1/2 pt-4 opacity-0 transition-all duration-300 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="w-56 rounded-2xl bg-petrol p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)] ring-1 ring-ivory/10">
                      {link.children.map((child) => (
                        <li key={child.label}>
                          <a
                            href={child.href}
                            className="block rounded-xl px-4 py-2.5 text-[0.92rem] text-ivory/85 transition-colors hover:bg-ivory/10 hover:text-gold"
                          >
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <a
                  key={link.label}
                  href={hrefOf(link)}
                  aria-current={isActive(link) ? "location" : undefined}
                  className={cn(linkClass, isActive(link) ? activeClass : idleClass)}
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <CartButton />
            <a
              href="/compte"
              aria-label="Mon compte : mes commandes"
              title="Mon compte"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:text-gold"
            >
              <UserRound className="h-[1.1rem] w-[1.1rem]" />
            </a>
            <a
              href={bookingHref}
              className="label-caps hidden whitespace-nowrap rounded-full bg-gold px-5 py-2.5 text-petrol-deep transition-all duration-300 hover:-translate-y-0.5 hover:bg-ivory hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)] sm:inline-flex"
            >
              Réserver mon séjour
            </a>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              aria-controls="menu-mobile"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:text-gold lg:hidden"
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
          "mx-3 mt-2 origin-top rounded-3xl bg-petrol px-6 py-7 shadow-2xl transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] lg:hidden",
          open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-3 scale-[0.98] opacity-0"
        )}
      >
        <nav className="flex flex-col gap-5">
          {NAV_LINKS.map((link, index) => (
            <div
              key={link.label}
              style={{ transitionDelay: open ? `${80 + index * 55}ms` : "0ms" }}
              className={cn("transition-all duration-500", open ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0")}
            >
              <a
                href={hrefOf(link)}
                onClick={() => setOpen(false)}
                className={cn("label-caps transition-colors hover:text-gold", isActive(link) ? "text-gold" : "text-ivory/80")}
              >
                {link.label}
              </a>
              {link.children ? (
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-l border-ivory/15 pl-4">
                  {link.children.map((child) => (
                    <li key={child.label}>
                      <a href={child.href} onClick={() => setOpen(false)} className="text-[0.92rem] text-ivory/70 transition-colors hover:text-gold">
                        {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          <a
            href="/compte"
            onClick={() => setOpen(false)}
            className={cn("label-caps inline-flex items-center gap-2 text-ivory/80 transition-all duration-500 hover:text-gold", open ? "opacity-100" : "opacity-0")}
          >
            <UserRound className="h-4 w-4" /> Mon compte
          </a>
        </nav>
        <a
          href={bookingHref}
          onClick={() => setOpen(false)}
          className="label-caps mt-7 flex w-full items-center justify-center rounded-full bg-gold px-5 py-2.5 text-petrol-deep transition-colors hover:bg-ivory"
        >
          Réserver mon séjour
        </a>
      </div>
    </header>
  );
}
