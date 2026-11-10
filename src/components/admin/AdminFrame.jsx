import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { LOGO } from "@/data/site";

const TABS = [
  { to: "/admin", label: "Destinations", exact: true },
  { to: "/admin/circuits", label: "Circuits", exact: false },
  { to: "/admin/sites", label: "Sites de la carte", exact: false },
  { to: "/admin/formules", label: "Formules & prix", exact: false },
  { to: "/admin/faq", label: "FAQ", exact: false },
  { to: "/admin/reseaux", label: "Réseaux sociaux", exact: false },
  { to: "/admin/demandes", label: "Demandes", exact: false },
];

export default function AdminFrame({ user, children }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-petrol">
      <header className="border-b border-petrol/15 bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <img src={LOGO} alt="SYSI TRAVEL Guinée" width={1000} height={463} className="h-[66px] w-auto object-contain" />
            <div>
              <p className="label-caps text-gold-deep">Administration</p>
              <p className="text-[0.82rem] text-petrol/55">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Link
              to="/"
              className="label-caps text-petrol/60 transition-colors hover:text-petrol"
            >
              Voir le site
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="label-caps inline-flex items-center gap-2 text-petrol/60 transition-colors hover:text-petrol"
            >
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1180px] gap-7 overflow-x-auto px-6">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              className="label-caps whitespace-nowrap border-b-2 border-transparent py-3 text-petrol/55 transition-colors hover:text-petrol"
              activeProps={{ className: "border-gold text-petrol" }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1180px] px-6 py-10">{children}</main>
    </div>
  );
}