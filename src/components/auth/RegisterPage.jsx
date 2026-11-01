import { Lock, Mail, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { browserSupabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, GoogleButton, OrDivider, SubmitButton, authErrorMessage } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { safeReturnTo } from "@/lib/authReturnTo";

/**
 * The /register page: signUp → confirmation e-mail → verifyOtp. When Supabase
 * auto-confirms e-mails (ENABLE_EMAIL_AUTOCONFIRM=true) signUp already returns a
 * session and the visitor goes straight back. Otherwise the e-mail carries a link
 * (handled on whichever page it opens) and, if the template includes {{ .Token }},
 * a 6-digit code to type here.
 */
export function RegisterPage() {
  const returnTo = safeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function register(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    const { data, error: signUpError } = await browserSupabase().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + returnTo },
    });
    setBusy(false);
    if (signUpError) {
      setError(authErrorMessage(signUpError, "L'inscription a échoué. Réessayez."));
      return;
    }
    if (data.session) {
      window.location.href = returnTo;
      return;
    }
    setStep("otp");
  }

  async function verify(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error: verifyError } = await browserSupabase().auth.verifyOtp({ email, token: otpCode, type: "email" });
    if (verifyError) {
      setError(authErrorMessage(verifyError, "Code invalide ou expiré."));
      setBusy(false);
      return;
    }
    window.location.href = returnTo;
  }

  async function resend() {
    setError("");
    const { error: resendError } = await browserSupabase().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin + returnTo },
    });
    if (resendError) setError(authErrorMessage(resendError, "Impossible de renvoyer l'e-mail."));
    else toast("E-mail renvoyé", { description: "Consultez votre boîte de réception." });
  }

  if (step === "otp") {
    return (
      <AuthLayout icon={UserPlus} title="Confirmez votre e-mail" subtitle="Dernière étape avant d'accéder à votre compte">
        <form onSubmit={verify}>
          <p className="mb-4 text-sm text-muted-foreground">
            Un e-mail a été envoyé à <span className="font-semibold text-foreground">{email}</span>. Cliquez sur le lien qu'il
            contient ou saisissez le code à 6 chiffres ci-dessous.
          </p>
          <AuthError>{error}</AuthError>
          <div className="mb-6 flex justify-center">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <SubmitButton busy={busy} busyLabel="Vérification…" disabled={busy || otpCode.length < 6}>
            Valider
          </SubmitButton>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Rien reçu ?{" "}
            <button type="button" onClick={resend} className="font-semibold text-gold-deep underline-offset-4 hover:underline">
              Renvoyer l'e-mail
            </button>
          </p>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={UserPlus} title="Créer un compte" subtitle="Inscrivez-vous pour commencer">
      <GoogleButton returnTo={returnTo} />
      <OrDivider />
      <AuthError>{error}</AuthError>
      <form onSubmit={register} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-email" type="email" autoComplete="email" autoFocus placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" disabled={busy} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-password" type="password" autoComplete="new-password" placeholder="••••••••" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10" disabled={busy} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-confirm">Confirmer le mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-confirm" type="password" autoComplete="new-password" placeholder="••••••••" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 pl-10" disabled={busy} required />
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel="Création du compte…">
          Créer mon compte
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <AuthLink to="/login" returnTo={returnTo}>
          Se connecter
        </AuthLink>
      </p>
    </AuthLayout>
  );
}
