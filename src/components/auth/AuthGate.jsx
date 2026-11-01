import { redirect } from "@tanstack/react-router";
import { authQuery } from "@/lib/AuthContext";

/**
 * The login gate for a pathless layout route (src/routes/_authed.jsx), which gates
 * every route under src/routes/_authed/ (their URLs carry no "_authed" segment):
 *
 *   createFileRoute("/_authed")({ ssr: false, beforeLoad: requireSignedIn })
 *
 * TanStack Router's authenticated-routes pattern: beforeLoad reads the visitor from the
 * router context (the QueryClient's cached `authQuery`, shared with useAuth()), so a
 * child's loader never runs as an anonymous visitor. Signed out → /login with the way
 * back. Children read the visitor with `Route.useRouteContext().user`. `ssr: false` —
 * the server is anonymous, so these pages render in the browser only, and children inherit that.
 */
export async function requireSignedIn({ context, location }) {
  // A profile read failure is not a sign-out: it rejects here and reaches the error
  // boundary, whose "Try again" asks again (a failed query caches nothing).
  const { user } = await context.queryClient.ensureQueryData(authQuery);
  if (user) return { user };
  // Thrown rather than returned so the children's loaders never run without a user.
  throw redirect({ to: "/login", search: { returnTo: location.href } });
}
