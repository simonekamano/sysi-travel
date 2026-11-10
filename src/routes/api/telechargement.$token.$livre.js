import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

const TOKEN = /^[a-f0-9]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const trimSlash = (url) => String(url ?? "").replace(/\/+$/, "");

// A purchased book's PDF (link from /telechargement/<token>): checks the order and counts the
// download (noter_telechargement), then sends the browser to a signed address valid 2 minutes.
// The private bucket only signs it for a request carrying the token of a paid order holding
// this book (x-download-token, supabase/migrations/0009_boutique.sql): no service key here.
export const Route = createFileRoute("/api/telechargement/$token/$livre")({
  server: {
    handlers: {
      GET: async ({ params, context }) => {
        const headers = { "cache-control": "no-store", "referrer-policy": "no-referrer" };
        if (!TOKEN.test(params.token) || !UUID.test(params.livre)) {
          return new Response("Lien de téléchargement invalide.", { status: 404, headers });
        }
        const back = (reason) =>
          new Response(null, { status: 302, headers: { ...headers, location: `/telechargement/${params.token}?erreur=${reason}` } });

        const { data: file, error } = await context
          .getSupabase()
          .rpc("noter_telechargement", { p_token: params.token, p_livre: params.livre });
        if (error) return back("indisponible");
        if (!file) return back("refuse");

        const internalUrl = trimSlash(process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL);
        const anonKey = process.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
        const storage = createClient(internalUrl, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          global: { headers: { "x-download-token": params.token } },
        }).storage;
        const { data: signed, error: signError } = await storage
          .from("livres")
          .createSignedUrl(file.file_path, 120, { download: `${file.slug}.pdf` });
        if (signError) return back("indisponible");

        // Signed through the internal address (http://kong:8000 in Docker): the browser needs the public one.
        const publicUrl = trimSlash(import.meta.env.VITE_SUPABASE_URL);
        const location = signed.signedUrl.startsWith(internalUrl)
          ? publicUrl + signed.signedUrl.slice(internalUrl.length)
          : signed.signedUrl;
        return new Response(null, { status: 302, headers: { ...headers, location } });
      },
    },
  },
});
