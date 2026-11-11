import { useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, RotateCw } from "lucide-react";
import BackButton from "@/components/BackButton";
import { isMissingCodeError, reloadForNewVersion } from "@/lib/app-version";

export function DefaultCatchBoundary({ error }) {
  const router = useRouter();
  if (error) console.error(error);

  // A tab opened before a deployment asked for a code file the new build no longer has:
  // load the page again, from the new version, instead of showing this error.
  useEffect(() => {
    if (isMissingCodeError(error)) reloadForNewVersion();
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-6 py-16 text-petrol">
      <div className="flex max-w-lg flex-col items-center gap-5 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 text-gold-deep">
          <AlertTriangle className="h-6 w-6" strokeWidth={1.6} />
        </span>
        <p className="eyebrow text-gold-deep">Un imprévu</p>
        <h1 className="text-[clamp(1.6rem,3.5vw,2.3rem)] leading-tight">Cette page n'a pas pu s'afficher</h1>
        <p className="text-[1rem] leading-relaxed text-petrol/70">
          Réessayez dans un instant. Si le problème continue, écrivez-nous : nous vous répondons rapidement.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.invalidate()}
            className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-2.5 text-ivory transition-colors hover:bg-petrol-deep"
          >
            <RotateCw className="h-4 w-4" /> Réessayer
          </button>
          <BackButton />
          <Link to="/" className="label-caps inline-flex items-center rounded-full px-5 py-2.5 text-petrol/70 transition-colors hover:text-petrol">
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
