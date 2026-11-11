import { createFileRoute } from "@tanstack/react-router";
import { requireSignedIn } from "@/components/auth/AuthGate";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  beforeLoad: requireSignedIn,
  // Administration and previews: never listed by search engines.
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
});
