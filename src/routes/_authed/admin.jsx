import { createFileRoute, Outlet } from "@tanstack/react-router";
import AdminFrame from "@/components/admin/AdminFrame";
import AccessDenied from "@/components/admin/AccessDenied";

export const Route = createFileRoute("/_authed/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();

  if (user?.role !== "admin") return <AccessDenied email={user?.email} />;

  return (
    <AdminFrame user={user}>
      <Outlet />
    </AdminFrame>
  );
}