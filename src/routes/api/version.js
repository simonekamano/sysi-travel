import { createFileRoute } from "@tanstack/react-router";
import { APP_VERSION } from "@/lib/app-version";

// The id of the build the server is running. Open tabs poll it (UpdateWatcher) and switch to
// the new version of the site after a deployment. Never cached.
export const Route = createFileRoute("/api/version")({
  server: {
    handlers: {
      GET: () => Response.json({ version: APP_VERSION }, { headers: { "cache-control": "no-store" } }),
    },
  },
});
