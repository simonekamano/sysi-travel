import { createFileRoute } from "@tanstack/react-router";
import { listDestinations } from "@/lib/server-fns";
import DestinationsPanel from "@/components/admin/DestinationsPanel";

export const Route = createFileRoute("/_authed/admin/")({
  loader: () => listDestinations(),
  head: () => ({ meta: [{ title: "Destinations — Administration SYSI TRAVEL" }] }),
  component: AdminDestinationsPage,
});

function AdminDestinationsPage() {
  const destinations = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="script-accent text-gold-deep">Contenu du site</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-medium uppercase leading-tight tracking-[0.05em]">
          Destinations
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Ajoutez ou modifiez les sites présentés sur la page d'accueil : nom, région, description,
          prix indicatif et photo. Les changements sont visibles immédiatement sur le site.
        </p>
      </div>
      <DestinationsPanel destinations={destinations} />
    </div>
  );
}