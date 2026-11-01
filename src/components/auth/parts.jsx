import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "./GoogleIcon";
import { browserSupabase } from "@/lib/supabase";
import { returnToSearch } from "@/lib/authReturnTo";

// Small pieces the auth pages share.

// Google sign-in needs the provider configured in Supabase (GOTRUE_EXTERNAL_GOOGLE_*):
// the button only shows when the build sets VITE_SUPABASE_GOOGLE_ENABLED=true.
export const GOOGLE_ENABLED = import.meta.env.VITE_SUPABASE_GOOGLE_ENABLED === "true";

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
      {children}
    </div>
  );
}

export function SubmitButton({ busy, busyLabel, children, ...props }) {
  return (
    <Button
      type="submit"
      className="label-caps h-12 w-full rounded-full bg-petrol text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:bg-petrol-deep"
      disabled={busy}
      {...props}
    >
      {busy ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          {busyLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function GoogleButton({ returnTo }) {
  if (!GOOGLE_ENABLED) return null;
  const signIn = () =>
    browserSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + returnTo },
    });
  return (
    <Button type="button" variant="outline" className="mb-6 h-12 w-full text-sm font-semibold" onClick={signIn}>
      <GoogleIcon className="mr-2 h-5 w-5" />
      Continuer avec Google
    </Button>
  );
}

export function OrDivider() {
  if (!GOOGLE_ENABLED) return null;
  return (
    <div className="relative mb-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-3 text-muted-foreground">ou</span>
      </div>
    </div>
  );
}

// A link between auth screens that carries the way back (?returnTo=) along.
export function AuthLink({ to, returnTo, className = "font-semibold text-gold-deep underline-offset-4 hover:underline", children }) {
  return (
    <Link to={to} search={returnToSearch(returnTo)} className={className}>
      {children}
    </Link>
  );
}

// Supabase's English auth errors, in the site's language.
export function authErrorMessage(err, fallback) {
  const message = err?.message ?? "";
  if (/invalid login credentials/i.test(message)) return "E-mail ou mot de passe incorrect.";
  if (/email not confirmed/i.test(message)) return "Confirmez d'abord votre adresse e-mail (lien ou code reçu par e-mail).";
  if (/already registered|already exists/i.test(message)) return "Un compte existe déjà avec cette adresse e-mail.";
  if (/password should be at least/i.test(message)) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (/expired|invalid/i.test(message) && /token|otp/i.test(message)) return "Code invalide ou expiré.";
  if (/rate limit|too many/i.test(message)) return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (/signups not allowed|signup is disabled/i.test(message)) return "Les inscriptions sont fermées.";
  return fallback;
}
