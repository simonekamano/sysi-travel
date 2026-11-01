import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo } from "react";
import { browserSupabase } from "@/lib/supabase";
import { currentPath, returnToSearch } from "@/lib/authReturnTo";

/**
 * The visitor, resolved once per page load and cached in the router's QueryClient:
 * the login gate (src/components/auth/AuthGate.jsx) reads it with
 * `context.queryClient.ensureQueryData(authQuery)`, components with `useAuth()`.
 * Resolves to `{ user, error }`, with `user` = { id, email, full_name, role } or null.
 * A failed profile read rejects instead, so it is never cached as "signed out".
 */
export const authQuery = queryOptions({
  queryKey: ["auth", "me"],
  queryFn: async () => {
    // The server renders every page anonymously; the session lives in the browser.
    if (typeof window === "undefined") return { user: null, error: null };
    const supabase = browserSupabase();
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) return { user: null, error: null };
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        full_name: profile?.full_name ?? session.user.user_metadata?.full_name ?? null,
        role: profile?.role ?? "user",
      },
      error: null,
    };
  },
  staleTime: Infinity,
  retry: false,
});

const AuthContext = createContext(null);

/**
 * Client-side session state. The server renders every page anonymously and the
 * query only runs in the browser after hydration, so the first client render
 * matches the server markup. Gate user-specific UI on `isLoadingAuth`.
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery(authQuery);

  // Sign-in from an email link (confirmation, password reset) or another tab.
  // Deferred: Supabase holds a lock while it notifies, and the query calls back into it.
  useEffect(() => {
    let subscription;
    try {
      subscription = browserSupabase().auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          setTimeout(() => queryClient.invalidateQueries({ queryKey: authQuery.queryKey }), 0);
        }
      }).data.subscription;
    } catch (err) {
      console.error(err);
    }
    return () => subscription?.unsubscribe();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: data?.user ?? null,
      isAuthenticated: !!data?.user,
      isLoadingAuth: isPending,
      authError: data?.error ?? (error ? { type: "unknown", message: error.message ?? "Failed to load session" } : null),
      refresh: () => queryClient.fetchQuery({ ...authQuery, staleTime: 0 }),
      logout: async () => {
        queryClient.setQueryData(authQuery.queryKey, { user: null, error: null });
        await browserSupabase().auth.signOut();
        window.location.href = "/";
      },
      // Full-page sign-in: /login with the current page as the way back.
      navigateToLogin: () => {
        const search = new URLSearchParams(returnToSearch(currentPath())).toString();
        window.location.href = search ? `/login?${search}` : "/login";
      },
    }),
    [data, error, isPending, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
