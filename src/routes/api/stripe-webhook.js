import { createFileRoute } from "@tanstack/react-router";
import { traiterNotificationStripe } from "@/lib/paiement";
import { siteUrl } from "@/lib/site-url";

// Stripe's notifications (webhook): « paiement reçu » even when the customer closes the page
// before coming back to the site, and « page de paiement expirée » for an abandoned payment.
// Only a notification signed with STRIPE_WEBHOOK_SECRET is read; the payment is then checked
// again with Stripe itself (src/lib/paiement.js). Address to give in the Stripe Dashboard:
// https://sysitravel.com/api/stripe-webhook (DEPLOIEMENT.md, « Paiement en ligne »).
export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const headers = { "cache-control": "no-store" };
        try {
          // The exact bytes Stripe signed: read as text, never parsed then re-encoded.
          const type = await traiterNotificationStripe(await request.text(), request.headers.get("stripe-signature"), siteUrl(request));
          return Response.json({ received: true, type }, { headers });
        } catch (error) {
          const status = error.status ?? 500;
          if (status === 500) console.error("Notification Stripe :", error);
          return Response.json({ error: status === 400 ? "signature invalide" : "indisponible" }, { status, headers });
        }
      },
    },
  },
});
