import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFound } from "@/components/NotFound";
import LegalPageView, { legalHead } from "@/components/legal/LegalPageView";
import { getLegalPage } from "@/lib/server-fns";

// A legal page (ORDRE n° 16), written in Administration › Pages légales; 404 while it is a draft.
export const Route = createFileRoute("/mentions-legales")({
  loader: async () => {
    const data = await getLegalPage({ data: { slug: "mentions-legales" } });
    if (!data.page) throw notFound();
    return data;
  },
  head: ({ loaderData }) => legalHead(loaderData?.page),
  notFoundComponent: () => <NotFound />,
  component: LegalRoute,
});

function LegalRoute() {
  return <LegalPageView {...Route.useLoaderData()} />;
}
