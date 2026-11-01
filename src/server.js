// The server entry: TanStack Start's default handler, a standard `fetch(request)`.
// In production server.mjs serves it with srvx, next to the static files in dist/client.
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";

const handler = createStartHandler(defaultStreamHandler);

export default { fetch: handler };
