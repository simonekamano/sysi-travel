import { createFileRoute } from "@tanstack/react-router";
import { noindex } from "@/lib/seo";
import { RegisterPage } from "@/components/auth/RegisterPage";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => noindex("Créer un compte — SYSI TRAVEL"),
  component: RegisterPage,
});