import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import DestinationCard from "@/components/destination/DestinationCard";

// How many destinations the home page shows; all of them, with the map, are on /destinations.
const HOME_LIMIT = 3;

export default function Destinations({ destinations = [] }) {
  return (
    <section id="destinations" className="bg-background py-14 lg:py-20">
      <div className="mx-auto max-w-[1180px] px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Découvrir la Guinée"
            title="Destinations iconiques"
            text="Des îles de l'Atlantique aux hauts plateaux du Fouta, des cascades de Pita aux forêts classées du Nimba : voici quelques-uns des lieux qui font la Guinée. Chaque étape est accessible dans nos circuits, avec un guide local."
          />
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.slice(0, HOME_LIMIT).map((destination, index) => (
            <Reveal key={destination.id || destination.name} delay={(index % 3) * 90}>
              <DestinationCard destination={destination} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 flex justify-center">
          <Link
            to="/destinations"
            className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-7 py-4 text-petrol transition-colors duration-300 hover:border-gold hover:bg-petrol hover:text-ivory"
          >
            {destinations.length > HOME_LIMIT ? `Voir les ${destinations.length} destinations` : "Voir les destinations"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
