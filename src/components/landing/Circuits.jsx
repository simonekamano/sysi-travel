import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import CircuitCard from "@/components/circuit/CircuitCard";

// How many circuits the home page shows; all of them are on /circuits.
const HOME_LIMIT = 3;

// Published circuits, excursions and guided tours (admin › Circuits). Hidden while there is none.
export default function Circuits({ circuits = [] }) {
  if (circuits.length === 0) return null;

  return (
    <section id="circuits" className="bg-white py-14 lg:py-20">
      <div className="mx-auto max-w-site px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Circuits & excursions"
            title="Des voyages prêts à vivre"
            text="Un programme jour par jour, un prix clair et un guide local à vos côtés. Choisissez un circuit tel quel, ou demandez-nous de l'adapter à vos envies."
          />
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {circuits.slice(0, HOME_LIMIT).map((circuit, index) => (
            <Reveal key={circuit.id} delay={(index % 3) * 90} className="h-full">
              <CircuitCard circuit={circuit} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 flex justify-center">
          <Link
            to="/circuits"
            className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-7 py-4 text-petrol transition-colors duration-300 hover:border-gold hover:bg-petrol hover:text-ivory"
          >
            {circuits.length > HOME_LIMIT ? `Voir les ${circuits.length} circuits` : "Voir tous les circuits"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
