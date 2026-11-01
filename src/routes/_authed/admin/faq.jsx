import { createFileRoute } from "@tanstack/react-router";
import { listFaqs } from "@/lib/server-fns";
import FaqsPanel from "@/components/admin/FaqsPanel";

export const Route = createFileRoute("/_authed/admin/faq")({
  loader: () => listFaqs(),
  head: () => ({ meta: [{ title: "FAQ — Administration SYSI TRAVEL" }] }),
  component: AdminFaqPage,
});

function AdminFaqPage() {
  const faqs = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Questions fréquentes</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          FAQ
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Ajoutez, modifiez ou supprimez les questions affichées dans la section « Bon à savoir » du
          site.
        </p>
      </div>
      <FaqsPanel faqs={faqs} />
    </div>
  );
}