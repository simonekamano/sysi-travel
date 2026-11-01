import { Lock, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { browserSupabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, GoogleButton, OrDivider, SubmitButton, authErrorMessage } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeReturnTo } from "@/lib/authReturnTo";

// The /login page. ?returnTo= is where the visitor goes after signing in — the login
// gate sends people here with it.
export function LoginPage() {
  const returnTo = safeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error: signInError } = await browserSupabase().auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(authErrorMessage(signInError, "Connexion impossible. Réessayez."));
      setBusy(false);
      return;
    }
    // A hard redirect: the app re-initializes with the new session.
    window.location.href = returnTo;
  }

  return (
    <AuthLayout icon={LogIn} title="Connexion" subtitle="Accédez à votre espace SYSI TRAVEL">
      <GoogleButton returnTo={returnTo} />
      <OrDivider />
      <AuthError>{error}</AuthError>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="login-email" type="email" autoComplete="email" autoFocus placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Mot de passe</Label>
            <AuthLink to="/forgot-password" returnTo={returnTo} className="text-xs text-gold-deep underline-offset-4 hover:underline">
              Mot de passe oublié ?
            </AuthLink>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="login-password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10" required />
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel="Connexion…">
          Se connecter
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <AuthLink to="/register" returnTo={returnTo}>
          Créer un compte
        </AuthLink>
      </p>
    </AuthLayout>
  );
}
