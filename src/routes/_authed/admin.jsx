import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import AdminFrame from "@/components/admin/AdminFrame";
import AccessDenied from "@/components/admin/AccessDenied";

class NotAdminError extends Error {
  constructor(email) {
    super("Accès réservé aux administrateurs");
    this.email = email;
  }
}

export const Route = createFileRoute("/_authed/admin")({
  // Checked before the child loaders, which call admin-only server functions.
  beforeLoad: ({ context }) => {
    if (context.user?.role !== "admin") throw new NotAdminError(context.user?.email);
  },
  errorComponent: ({ error }) =>
    error instanceof NotAdminError ? <AccessDenied email={error.email} /> : <DefaultCatchBoundary error={error} />,
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();

  return (
    <AdminFrame user={user}>
      <Outlet />
    </AdminFrame>
  );
}
