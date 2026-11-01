import { createClient } from "@supabase/supabase-js";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { browserSupabase } from "@/lib/supabase";

// Server side, read at runtime: SUPABASE_URL may be an internal address (http://kong:8000)
// while the browser bundle uses the public one; both fall back to the build-time values.
const createServerSupabase = (accessToken) => {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
  });
};

const bearerToken = (request) => {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

// Both middlewares hand handlers the same lazy `context.getSupabase()`: a client acting
// as the caller (their access token, so row level security applies), or as an anonymous
// visitor when the request carries no token.
const withSupabase = (next, request = getRequest()) => {
  const accessToken = bearerToken(request);
  let client;
  return next({ context: { accessToken, getSupabase: () => (client ??= createServerSupabase(accessToken)) } });
};

// Applied to every server function by src/start.js: sends the visitor's Supabase access
// token with the call. Anonymous visitors send nothing and get an anonymous client.
export const authMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    let token = null;
    if (typeof window !== "undefined") {
      const { data } = await browserSupabase().auth.getSession();
      token = data.session?.access_token ?? null;
    }
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  })
  .server(({ next }) => withSupabase(next));

// Applied to every request by src/start.js, so a server route handler
// (`server.handlers`) receives the same `context.getSupabase()` as a server function.
export const supabaseRequestMiddleware = createMiddleware({ type: "request" }).server(({ next, request }) =>
  withSupabase(next, request),
);

// Only an auth rejection means "not signed in"; outages propagate as themselves.
const currentUser = async (context) => {
  if (!context.accessToken) return null;
  const supabase = context.getSupabase();
  const { data, error } = await supabase.auth.getUser(context.accessToken);
  if (error) {
    if (error.status >= 400 && error.status < 500) return null;
    throw new Error(error.message);
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  return { id: data.user.id, email: data.user.email, full_name: profile?.full_name ?? null, role: profile?.role ?? "user" };
};

// Neither middleware authenticates anyone. Add this to a server function that
// needs a signed-in caller; it rejects anonymous callers and sets `context.user`:
//   createServerFn().middleware([requireUser]).handler(({ context }) => context.user.id)
export const requireUser = createMiddleware({ type: "function" }).server(async ({ next, context }) => {
  const user = await currentUser(context);
  if (!user) {
    setResponseStatus(401);
    throw Object.assign(new Error("Unauthorized"), { status: 401, code: "UNAUTHORIZED" });
  }
  return next({ context: { user } });
});

// requireUser plus the admin role (public.profiles.role = 'admin').
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireUser])
  .server(({ next, context }) => {
    if (context.user.role !== "admin") {
      setResponseStatus(403);
      throw Object.assign(new Error("Forbidden"), { status: 403, code: "FORBIDDEN" });
    }
    return next();
  });

// The same for a server route: `server: { middleware: [requireUserRoute], handlers }` answers
// anonymous callers with 401 and sets `context.user`. Only on src/routes/api/* files: a route's
// middleware also runs for every route under it, and page navigations carry no token.
export const requireUserRoute = createMiddleware({ type: "request" }).server(async ({ next, context }) => {
  const user = await currentUser(context);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return next({ context: { user } });
});
