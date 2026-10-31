import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Solution from "@/components/landing/Solution";
import Destinations from "@/components/landing/Destinations";
import HowItWorks from "@/components/landing/HowItWorks";
import Circuits from "@/components/landing/Circuits";
import Testimonials from "@/components/landing/Testimonials";
import Faq from "@/components/landing/Faq";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
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
        <Destinations />
        <HowItWorks />
        <Circuits onSelect={selectFormule} />
        <Testimonials />
        <Faq />
        <ContactForm formule={formule} setFormule={setFormule} />
      </main>
      <Footer />
    </div>
  );
}