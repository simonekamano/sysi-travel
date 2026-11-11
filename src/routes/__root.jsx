import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import { UpdateWatcher } from "@/components/UpdateWatcher";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/AuthContext";
import { getLegalLinks } from "@/lib/server-fns";
import { SYMBOL } from "@/data/site";
import appCss from "@/index.css?url";

export const Route = createRootRoute({
  // The published legal pages, for the footer and the forms (src/lib/legal.js, useLegalLinks).
  // Never breaks a page: without them the footer simply omits the links.
  loader: () => getLegalLinks().catch(() => []),
  staleTime: 5 * 60 * 1000,
  // Per-page <title>/meta come from each route's head(); this is the shared base.
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "SYSI TRAVEL — La Guinée comme vous ne l'avez jamais vécue",
      },
      {
        name: "description",
        content:
          "SYSI TRAVEL : plateforme touristique dédiée à la Guinée. Découvrez les plus beaux sites, réservez un circuit authentique et organisez votre séjour avec des partenaires locaux vérifiés.",
      },
      { property: "og:title", content: "SYSI TRAVEL — Voyagez en Guinée autrement" },
      {
        property: "og:description",
        content: "Sites incontournables, circuits authentiques et partenaires locaux vérifiés.",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", href: SYMBOL },
      { rel: "apple-touch-icon", href: SYMBOL },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
      <UpdateWatcher />
    </AuthProvider>
  );
}

// The document. There is no index.html: the server renders <html> from here.
function RootDocument({ children }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}