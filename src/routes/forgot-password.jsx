import { createFileRoute } from "@tanstack/react-router";
import { noindex } from "@/lib/seo";
import { ForgotPasswordPage } from "@/components/auth/ForgotPasswordPage";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => noindex("Mot de passe oublié — SYSI TRAVEL"),
  component: ForgotPasswordPage,
});