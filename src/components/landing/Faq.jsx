import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

// The questions: the title on the left and its text on the right from 640 px, then the
// questions on two columns from 1024 px, so neither side of the section is left empty.
export default function Faq({ faqs = [] }) {
  const [openIndex, setOpenIndex] = useState(0);
  const half = Math.ceil(faqs.length / 2);
  const columns = [faqs.slice(0, half).map((item, i) => [item, i]), faqs.slice(half).map((item, i) => [item, half + i])];

  const question = ([item, index]) => {
    const isOpen = openIndex === index;
    return (
      <div key={item.id || item.question} className="border-b border-petrol/12 first:border-t">
        <button
          type="button"
          onClick={() => setOpenIndex(isOpen ? -1 : index)}
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between gap-6 py-6 text-left"
        >
          <span className="text-[1.02rem] font-semibold text-petrol">{item.question}</span>
          <ChevronDown
            className={cn("h-5 w-5 shrink-0 text-gold-deep transition-transform duration-300", isOpen && "rotate-180")}
            strokeWidth={1.5}
          />
        </button>
        <div
          className={cn(
            "grid transition-all duration-500 ease-out",
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <p className="pb-6 text-[0.95rem] leading-relaxed text-petrol/70">{item.answer}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="faq" className="bg-background py-10 lg:py-12">
      <div className="mx-auto max-w-site px-6">
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-2 sm:items-center sm:gap-8 md:gap-12">
            <div>
              <p className="eyebrow text-gold-deep">Bon à savoir</p>
              <h2 className="mt-4 text-[clamp(1.9rem,3.6vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.015em] text-petrol">
                Les questions que l'on nous pose
              </h2>
            </div>
            <p className="text-[1.02rem] leading-relaxed text-petrol/70">
              Et si la vôtre n'y figure pas, le formulaire ci-dessous est le moyen le plus rapide d'avoir une
              réponse claire.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100} className="mt-8 grid lg:grid-cols-2 lg:gap-x-12">
          {columns.map((column, i) =>
            column.length ? (
              <div key={i} className={i ? "max-lg:[&>div:first-child]:border-t-0" : undefined}>
                {column.map(question)}
              </div>
            ) : null
          )}
        </Reveal>
      </div>
    </section>
  );
}
