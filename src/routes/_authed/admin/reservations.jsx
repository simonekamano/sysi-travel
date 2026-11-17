import { createFileRoute } from "@tanstack/react-router";
import { listReservations } from "@/lib/server-fns";
import ReservationsPanel from "@/components/admin/ReservationsPanel";

export const Route = createFileRoute("/_authed/admin/reservations")({
  loader: () => listReservations(),
  head: () => ({ meta: [{ title: "Réservations - Administration SYSI TRAVEL" }] }),
  component: AdminReservationsPage,
});

function AdminReservationsPage() {
  const reservations = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Voyages</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          Réservations payées en ligne
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Les circuits réservés et payés par carte sur le site. Vous recevez aussi un e-mail à chaque
          réservation payée : appelez le voyageur sous 72 heures pour confirmer la date. Les
          remboursements se font depuis votre tableau de bord Stripe.
        </p>
      </div>
      <ReservationsPanel reservations={reservations} />
    </div>
  );
}
