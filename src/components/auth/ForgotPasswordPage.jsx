import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { browserSupabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthLink, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeReturnTo } from "@/lib/authReturnTo";

// The /forgot-password page. Always ends in the generic "if an account exists"
// message: the UI never reveals whether the e-mail is registered. The e-mail links
// to /reset-password, which must be listed in Supabase's ADDITIONAL_REDIRECT_URLS.
export function ForgotPasswordPage() {
  const returnTo = safeReturnTo();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await browserSupabase().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    } catch {
      // Same outcome either way.
    } finally {
      setBusy(false);
      setSent(true);
    }
  }

  return (
    <AuthLayout icon={Mail} title="Mot de passe oublié" subtitle="Nous vous envoyons un lien pour le réinitialiser">
      {sent ? (
        <p className="text-center text-sm text-foreground">Si un compte existe avec cette adresse, vous allez recevoir un lien de réinitialisation.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Adresse e-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="forgot-email" type="email" autoComplete="email" autoFocus placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" required />
            </div>
          </div>
          <SubmitButton busy={busy} busyLabel="Envoi…">
            Envoyer le lien
          </SubmitButton>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <AuthLink to="/login" returnTo={returnTo}>
          <ArrowLeft className="mr-1 inline h-3 w-3" aria-hidden="true" />
          Retour à la connexion
        </AuthLink>
      </p>
    </AuthLayout>
  );
}
