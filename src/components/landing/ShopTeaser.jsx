import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import ArticleCard from "@/components/boutique/ArticleCard";
import { VENTE_EN_LIGNE } from "@/lib/boutique";

// The shop on the home page: one article of each section, and the way to all of them.
// Hidden while the shop has no article.
export default function ShopTeaser({ articles = [], count = 0 }) {
  if (articles.length === 0) return null;

  return (
    <section id="boutique" className="bg-white py-14 lg:py-20">
      <div className="mx-auto max-w-site px-6">
        <Reveal>
          <SectionHeading
            eyebrow="La boutique"
            title="Mode, sacs et bijoux de créateurs"
            text={
              VENTE_EN_LIGNE
                ? "Robes, kaftans, ensembles en pagne tissé, sacs en wax faits main : commandez en ligne, nous vous accompagnons jusqu'à la livraison."
                : "Robes, kaftans, ensembles en pagne tissé, sacs en wax faits main. La vente en ligne ouvre bientôt : réservez dès maintenant sur WhatsApp."
            }
          />
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {articles.map((article, index) => (
            <Reveal key={article.id} delay={index * 80} className="h-full">
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/boutique"
            className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-3 text-ivory transition-colors duration-300 hover:bg-petrol-deep"
          >
            Voir les {count} articles <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
