import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import BookCard from "@/components/boutique/BookCard";

// How many books the home page shows; all of them are on /boutique.
const HOME_LIMIT = 3;

// The shop's books and guides (admin › Livres & guides). Hidden while none is for sale.
export default function Books({ livres = [] }) {
  if (livres.length === 0) return null;

  return (
    <section id="boutique" className="bg-white py-14 lg:py-20">
      <div className="mx-auto max-w-site px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Livres & guides"
            title="Préparez votre voyage en lisant"
            text="Nos guides et livres sur la Guinée, en PDF : à lire sur votre téléphone avant le départ, et à emporter partout une fois sur place."
          />
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-5xl gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {livres.slice(0, HOME_LIMIT).map((livre, index) => (
            <Reveal key={livre.id} delay={index * 90} className="h-full">
              <BookCard book={livre} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 flex justify-center">
          <Link
            to="/boutique"
            className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-7 py-4 text-petrol transition-colors duration-300 hover:border-gold hover:bg-petrol hover:text-ivory"
          >
            {livres.length > HOME_LIMIT ? `Voir les ${livres.length} livres et guides` : "Voir la boutique"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
