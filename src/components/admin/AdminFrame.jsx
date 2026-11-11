import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  Clapperboard,
  ExternalLink,
  HelpCircle,
  Inbox,
  LogOut,
  Map as MapIcon,
  MapPin,
  Menu,
  Receipt,
  Route,
  Scale,
  Share2,
  Shirt,
  Tags,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { LOGO_INVERSE, SYMBOL } from "@/data/site";
import { cn } from "@/lib/utils";

// The administration's sections, grouped as in the sidebar. `exact`: /admin itself.
const GROUPS = [
  {
    title: "Suivi",
    links: [
      { to: "/admin/demandes", label: "Demandes", icon: Inbox },
      { to: "/admin/commandes", label: "Commandes", icon: Receipt },
    ],
  },
  {
    title: "Boutique",
    links: [
      { to: "/admin/articles", label: "Articles", icon: Shirt },
      { to: "/admin/livres", label: "Livres & guides", icon: BookOpen },
    ],
  },
  {
    title: "Voyages",
    links: [
      { to: "/admin", label: "Destinations", icon: MapPin, exact: true },
      { to: "/admin/circuits", label: "Circuits", icon: Route },
      { to: "/admin/formules", label: "Formules & prix", icon: Tags },
      { to: "/admin/sites", label: "Sites de la carte", icon: MapIcon },
    ],
  },
  {
    title: "Contenus",
    links: [
      { to: "/admin/videos", label: "Vidéos", icon: Clapperboard },
      { to: "/admin/faq", label: "FAQ", icon: HelpCircle },
    ],
  },
  {
    title: "Réglages",
    links: [
      { to: "/admin/reseaux", label: "Réseaux sociaux", icon: Share2 },
      { to: "/admin/pages-legales", label: "Pages légales", icon: Scale },
    ],
  },
];

const LINKS = GROUPS.flatMap((group) => group.links);

const isActive = (link, pathname) =>
  link.exact ? pathname === link.to || pathname === `${link.to}/` : pathname.startsWith(link.to);

// The sidebar's content: sections, then the account and the way out. `onNavigate` closes the
// phone menu after a click.
function SidebarContent({ user, onNavigate }) {
  const { logout } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Administration" className="flex-1 space-y-5 overflow-y-auto px-4 py-5 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="label-caps px-3 text-[0.7rem] leading-4 text-ivory/45">{group.title}</p>
            <ul className="mt-1.5 space-y-0.5">
              {group.links.map((link) => {
                const active = isActive(link, pathname);
                const Icon = link.icon;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-md px-3 py-2 text-[0.93rem] leading-5 transition-colors",
                        active
                          ? "bg-ivory/10 font-semibold text-ivory before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-gold"
                          : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory",
                      )}
                    >
                      <Icon className={cn("h-[1.03rem] w-[1.03rem] shrink-0", active ? "text-gold" : "text-ivory/50")} strokeWidth={1.8} />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-ivory/10 px-4 py-3">
        <p className="truncate px-3 text-[0.8rem] text-ivory/50" title={user?.email}>
          {user?.email}
        </p>
        <div className="mt-1 flex items-center justify-between gap-1 px-1">
          <Link
            to="/"
            onClick={onNavigate}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-2 text-[0.86rem] leading-5 text-ivory/70 transition-colors hover:bg-ivory/5 hover:text-ivory"
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-ivory/50" strokeWidth={1.8} /> Voir le site
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-2 text-[0.86rem] leading-5 text-ivory/70 transition-colors hover:bg-ivory/5 hover:text-ivory"
          >
            <LogOut className="h-4 w-4 shrink-0 text-ivory/50" strokeWidth={1.8} /> Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

// Administration frame: a fixed sidebar on a computer; on a phone, a top bar whose button
// slides the same sidebar in from the left.
export default function AdminFrame({ user, children }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const current = LINKS.find((link) => isActive(link, pathname));

  return (
    <div className="min-h-screen bg-background text-petrol lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Computer: always visible, follows the page. */}
      <aside className="hidden bg-petrol-deep lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-ivory/10 px-7 pb-4 pt-5">
          <Link to="/admin" aria-label="Administration — accueil" className="inline-flex">
            <img src={LOGO_INVERSE} alt="SYSI TRAVEL Guinée" width={1000} height={463} className="block h-[3.77rem] w-auto object-contain" />
          </Link>
          <p className="label-caps mt-2 text-[0.72rem] text-gold">Administration</p>
        </div>
        <div className="min-h-0 flex-1">
          <SidebarContent user={user} />
        </div>
      </aside>

      {/* Phone and tablet: top bar and slide-in menu. */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 bg-petrol-deep px-4 py-3 text-ivory lg:hidden">
          <Link to="/admin" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory">
              <img src={SYMBOL} alt="SYSI TRAVEL" width={326} height={360} className="h-7 w-auto" />
            </span>
            <span className="min-w-0">
              <span className="label-caps block text-[0.68rem] text-gold">Administration</span>
              <span className="block truncate font-display text-[1rem] font-semibold">{current?.label ?? "Accueil"}</span>
            </span>
          </Link>
          <Dialog.Trigger
            aria-label="Ouvrir le menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ivory/25 transition-colors hover:border-gold hover:text-gold"
          >
            <Menu className="h-5 w-5" />
          </Dialog.Trigger>
        </header>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-petrol-deep/60 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 lg:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(88vw,17.14rem)] flex-col bg-petrol-deep shadow-2xl duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left lg:hidden"
          >
            <div className="flex items-start justify-between border-b border-ivory/10 px-6 pb-4 pt-5">
              <div>
                <img src={LOGO_INVERSE} alt="SYSI TRAVEL Guinée" width={1000} height={463} className="block h-[3.77rem] w-auto object-contain" />
                <Dialog.Title className="label-caps mt-2 text-[0.72rem] text-gold">Administration</Dialog.Title>
              </div>
              <Dialog.Close
                aria-label="Fermer le menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ivory/70 transition-colors hover:bg-ivory/10 hover:text-ivory"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarContent user={user} onNavigate={() => setOpen(false)} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main className="min-w-0">
        <div className="mx-auto max-w-site px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
