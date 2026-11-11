import { createFileRoute } from "@tanstack/react-router";
import { noindex } from "@/lib/seo";
import { ResetPasswordPage } from "@/components/auth/ResetPasswordPage";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => noindex("Nouveau mot de passe — SYSI TRAVEL"),
  component: ResetPasswordPage,
});