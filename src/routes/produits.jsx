import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { ProductsShowcase } from "@/components/landing/LocalProducts";
import { getSiteContent } from "@/lib/server-fns";

export const Route = createFileRoute("/produits")({
  loader: () => getSiteContent(),
  head: () => ({
    meta: [
      { title: "Produits locaux de Guinée — SYSI TRAVEL" },
      {
        name: "description",
        content:
          "Pagnes, sacs, beurre de karité, jarres, calebasses et chaussures traditionnelles : l'artisanat de Guinée, à commander sur WhatsApp auprès de SYSI TRAVEL.",
      },
    ],
  }),
  component: ProduitsPage,
});

function ProduitsPage() {
  const { destinations, formules, reseaux } = Route.useLoaderData();
  const [formule, setFormule] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid />

      <main>
        <section className="bg-background pb-14 pt-36 lg:pb-20 lg:pt-40">
          <div className="mx-auto max-w-site px-6">
            <BackButton label="Retour" className="mb-8" />
            <p className="eyebrow text-gold-deep">Artisanat de Guinée</p>
            <h1 className="mt-4 max-w-3xl text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
              Produits locaux
            </h1>
            <p className="mt-6 max-w-2xl text-[1rem] leading-relaxed text-petrol/70">
              Pagnes, beurre de karité, jarres, calebasses, chaussures et sacs : ramenez un morceau de
              Guinée chez vous. Cliquez sur un produit pour nous écrire sur WhatsApp : nous vous
              envoyons les modèles disponibles et les prix.
            </p>
            <div className="mt-10">
              <ProductsShowcase />
            </div>
          </div>
        </section>

        <ContactForm formule={formule} setFormule={setFormule} destinations={destinations} formules={formules} />
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}
