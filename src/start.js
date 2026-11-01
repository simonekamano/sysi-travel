import { createStart } from "@tanstack/react-start";
import { authMiddleware, supabaseRequestMiddleware } from "@/lib/auth-middleware";

// Every server function and server route gets `context.getSupabase()`, acting as the visitor.
export const startInstance = createStart(() => ({
  requestMiddleware: [supabaseRequestMiddleware],
  functionMiddleware: [authMiddleware],
}));
