import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, ChevronRight, Menu, MessageCircle, Phone, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import CartButton from "@/components/boutique/CartButton";
import { GuineaStripe } from "@/components/GuineaFlag";
import { CONTACT, LOGO_INVERSE, NAV_LINKS } from "@/data/site";

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

  // From 1280 px the links are in the bar: a side menu still open (window widened, tablet
  // turned) closes, so it never leaves the page locked behind an invisible menu.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1280px)");
    const onChange = (event) => event.matches && setOpen(false);
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  // A link of the side menu closes it. A link to a section of this page (#contact) waits until
  // the menu has closed and given the page its scrolling back (onCloseAutoFocus), then scrolls.
  const pendingSection = useRef("");
  const follow = (event, href) => {
    if (href.startsWith("#")) {
      event.preventDefault();
      pendingSection.current = href.slice(1);
    }
    setOpen(false);
  };
  const scrollToPendingSection = (event) => {
    const id = pendingSection.current;
    if (!id) return;
    pendingSection.current = "";
    event.preventDefault();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }))
    );
  };

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
    // Below 1280 px the links are in a side menu (Radix dialog: focus kept inside, page scroll
    // locked, closed by Échap, the close button or a click beside it).
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* The header lets clicks through its margins; only the bar takes them. */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        {/* The colours of the flag of Guinea along the top of the screen. */}
        <GuineaStripe className="absolute inset-x-0 top-0" />
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

            <nav className="hidden items-center gap-7 xl:flex 2xl:gap-9">
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
              <Dialog.Trigger
                aria-label="Ouvrir le menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:text-gold xl:hidden"
              >
                <Menu className="h-5 w-5" />
              </Dialog.Trigger>
            </div>
          </div>
        </div>
      </header>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-petrol-deep/60 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 xl:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={scrollToPendingSection}
          className="fixed inset-y-0 right-0 z-[60] flex w-[min(86vw,22rem)] flex-col bg-petrol text-ivory shadow-[-24px_0_60px_-24px_rgba(0,0,0,0.6)] duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right xl:hidden"
        >
          <div className="flex items-center justify-between gap-4 border-b border-ivory/10 px-5 py-4">
            <img src={LOGO_INVERSE} alt="SYSI TRAVEL Guinée" width={1000} height={463} className="block h-10 w-auto object-contain" />
            <Dialog.Title className="sr-only">Menu</Dialog.Title>
            <Dialog.Close
              aria-label="Fermer le menu"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:text-gold"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={hrefOf(link)}
                    onClick={(event) => follow(event, hrefOf(link))}
                    aria-current={isActive(link) ? "location" : undefined}
                    className={cn(
                      "label-caps flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors",
                      isActive(link) ? "bg-ivory/10 text-gold" : "text-ivory/85 hover:bg-ivory/5 hover:text-gold"
                    )}
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 opacity-60" />
                  </a>
                  {link.children ? (
                    <ul className="mb-2 ml-4 mr-3 mt-1 grid grid-cols-2 gap-x-3 border-l border-ivory/15 pl-4">
                      {link.children.map((child) => (
                        <li key={child.label}>
                          <a
                            href={child.href}
                            onClick={(event) => follow(event, child.href)}
                            className="block py-2 text-[0.92rem] leading-snug text-ivory/70 transition-colors hover:text-gold"
                          >
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mx-4 mt-4 border-t border-ivory/10 pt-4">
              <a
                href="/compte"
                onClick={(event) => follow(event, "/compte")}
                className="label-caps -mx-4 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-ivory/85 transition-colors hover:bg-ivory/5 hover:text-gold"
              >
                <UserRound className="h-4 w-4" /> Mon compte
              </a>
            </div>
          </nav>

          <div className="space-y-4 border-t border-ivory/10 px-5 py-5">
            <a
              href={bookingHref}
              onClick={(event) => follow(event, bookingHref)}
              className="label-caps flex w-full items-center justify-center rounded-full bg-gold px-5 py-3 text-petrol-deep transition-colors hover:bg-ivory"
            >
              Réserver mon séjour
            </a>
            <div className="flex items-center justify-center gap-6 text-[0.9rem] text-ivory/70">
              <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-gold">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a href={CONTACT.phoneHref} className="inline-flex items-center gap-2 transition-colors hover:text-gold">
                <Phone className="h-4 w-4" /> Appeler
              </a>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
