import { Link } from "@tanstack/react-router";
import { AlertTriangle, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { browserSupabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, SubmitButton, authErrorMessage } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// The /reset-password page. The reset e-mail's link signs the visitor in (Supabase reads
// the tokens from the URL), so the page only has to wait for that session, then set the
// new password with updateUser.
export function ResetPasswordPage() {
  const [state, setState] = useState("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = browserSupabase();
    // An expired or reused link comes back with #error=… instead of tokens.
    const linkError = new URLSearchParams(window.location.hash.slice(1)).get("error");
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setState("ready");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => (prev === "ready" ? prev : session ? "ready" : linkError ? "invalid" : prev));
    });
    // Without a session after a moment, the link is missing or spent.
    const timer = setTimeout(() => setState((prev) => (prev === "checking" ? "invalid" : prev)), 4000);
    return () => {
      clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await browserSupabase().auth.updateUser({ password });
    if (updateError) {
      setError(authErrorMessage(updateError, "La réinitialisation a échoué. Réessayez."));
      setBusy(false);
      return;
    }
    window.location.href = "/";
  }

  if (state === "checking") {
    return (
      <AuthLayout icon={Lock} title="Nouveau mot de passe" subtitle="Vérification du lien…">
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      </AuthLayout>
    );
  }

  if (state === "invalid") {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Lien invalide"
        subtitle="Ce lien de réinitialisation est incomplet ou a expiré"
        footer={
          <Link to="/forgot-password" className="font-semibold text-gold-deep underline-offset-4 hover:underline">
            Demander un nouveau lien
          </Link>
        }
      >
        <p className="text-center text-sm text-foreground">Demandez un nouvel e-mail de réinitialisation et utilisez le lien le plus récent.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Lock} title="Nouveau mot de passe" subtitle="Choisissez votre nouveau mot de passe">
      <AuthError>{error}</AuthError>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-password">Nouveau mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="reset-password" type="password" autoComplete="new-password" autoFocus placeholder="••••••••" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reset-confirm">Confirmer le mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="reset-confirm" type="password" autoComplete="new-password" placeholder="••••••••" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 pl-10" required />
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel="Enregistrement…">
          Enregistrer le mot de passe
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
