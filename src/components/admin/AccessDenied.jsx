import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export default function AccessDenied({ email }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md border border-petrol/15 bg-white p-8 text-petrol">
        <Lock className="h-8 w-8 text-gold-deep" strokeWidth={1.5} />
        <h1 className="mt-4 text-[1.3rem] font-medium uppercase tracking-[0.06em]">
          Accès réservé
        </h1>
        <p className="mt-3 text-[0.92rem] leading-relaxed text-petrol/70">
          Le compte {email || "connecté"} n'a pas les droits d'administration. Connectez-vous avec
          le compte propriétaire du site ou demandez à passer ce compte en administrateur.
        </p>
        <Link
          to="/"
          className="label-caps mt-6 inline-flex rounded-full bg-petrol px-6 py-3 text-ivory transition-colors hover:bg-petrol-deep"
        >
          Retour au site
        </Link>
      </div>
    </div>
  );
}