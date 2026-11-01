import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  light: "border-ivory/35 text-ivory hover:border-gold hover:text-gold",
  dark: "border-petrol/25 text-petrol hover:border-gold-deep hover:text-gold-deep",
};

/**
 * "← Retour": goes back to the previous page of the site when there is one, otherwise
 * to `to` / `hash` (a visitor who landed here straight from Google or a shared link).
 * `tone`: "light" on pétrole or photos, "dark" on ivory.
 */
export default function BackButton({ to = "/", hash, label = "Retour", tone = "dark", className }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <Link
      to={to}
      hash={hash}
      onClick={(event) => {
        if (!canGoBack) return;
        event.preventDefault();
        router.history.back();
      }}
      className={cn(
        "label-caps group inline-flex items-center gap-2 rounded-full border px-4 py-2.5 transition-colors duration-300",
        TONES[tone],
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={1.8} />
      {label}
    </Link>
  );
}
