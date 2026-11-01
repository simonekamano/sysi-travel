import { createFileRoute } from "@tanstack/react-router";

// Health check for Docker and monitoring: 200 when the app answers and Supabase is
// reachable (an anonymous read of a public table), 503 otherwise.
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async ({ context }) => {
        const headers = { "cache-control": "no-store" };
        try {
          const { error } = await context.getSupabase().from("faqs").select("id").limit(1);
          if (error) throw new Error(error.message);
          return Response.json({ status: "ok", database: "ok" }, { headers });
        } catch (error) {
          return Response.json({ status: "degraded", database: error.message }, { status: 503, headers });
        }
      },
    },
  },
});
