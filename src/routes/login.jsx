import { createFileRoute } from "@tanstack/react-router";
import { noindex } from "@/lib/seo";
import { LoginPage } from "@/components/auth/LoginPage";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => noindex("Connexion — SYSI TRAVEL"),
  component: LoginPage,
});