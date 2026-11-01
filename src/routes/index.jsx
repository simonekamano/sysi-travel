import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getSiteContent } from "@/lib/server-fns";
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Solution from "@/components/landing/Solution";
import Destinations from "@/components/landing/Destinations";
import LocalProducts from "@/components/landing/LocalProducts";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import Testimonials from "@/components/landing/Testimonials";
import Faq from "@/components/landing/Faq";
import Partner from "@/components/landing/Partner";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { LEAFLET_CSS } from "@/components/map/GuineaMap";
import { IMAGES } from "@/data/site";

export const Route = createFileRoute("/")({
  loader: () => getSiteContent(),
  head: () => ({
    links: [
      { rel: "preload", as: "image", href: IMAGES.hero, fetchPriority: "high" },
      { rel: "stylesheet", href: LEAFLET_CSS },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { destinations, formules, faqs } = Route.useLoaderData();
  const [formule, setFormule] = useState("");

  const selectFormule = (id) => {
    setFormule(id);
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Destinations destinations={destinations} />
        <LocalProducts />
        <HowItWorks />
        <Pricing formules={formules} onSelect={selectFormule} />
        <Testimonials />
        <Faq faqs={faqs} />
        <Partner />
        <ContactForm
          formule={formule}
          setFormule={setFormule}
          destinations={destinations}
          formules={formules}
        />
      </main>
      <Footer destinations={destinations} />
      <WhatsAppButton />
    </div>
  );
}