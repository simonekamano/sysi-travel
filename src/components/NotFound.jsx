import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import BackButton from "@/components/BackButton";
import { LOGO } from "@/data/site";

export function NotFound({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-8 text-petrol">
      <Link to="/" aria-label="SYSI TRAVEL Guinée — accueil" className="mx-auto inline-flex">
        <img src={LOGO} alt="SYSI TRAVEL Guinée" width={1000} height={463} className="block h-[4rem] w-auto object-contain" />
      </Link>
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-5 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 text-gold-deep">
          <Compass className="h-6 w-6" strokeWidth={1.6} />
        </span>
        <p className="eyebrow text-gold-deep">Erreur 404</p>
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] leading-tight">Cette page s'est égarée en chemin</h1>
        <p className="text-[1rem] leading-relaxed text-petrol/70">
          {children ?? "La page que vous cherchez n'existe pas ou a été déplacée."}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <BackButton />
          <Link
            to="/"
            className="label-caps inline-flex items-center rounded-full bg-petrol px-5 py-2.5 text-ivory transition-colors hover:bg-petrol-deep"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
