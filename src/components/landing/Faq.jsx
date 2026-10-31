import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";
export default function Faq({ faqs = [] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="bg-background py-14 lg:py-20">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <div className="lg:sticky lg:top-32">
            <SectionHeading
              align="left"
              eyebrow="Bon à savoir"
              title="Les questions que l'on nous pose"
              text="Et si la vôtre n'y figure pas, le formulaire ci-dessous est le moyen le plus rapide d'avoir une réponse claire."
            />
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div>
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={item.id || item.question} className="border-b border-petrol/12 first:border-t">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="text-[1.02rem] font-medium text-petrol">{item.question}</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-gold-deep transition-transform duration-300",
                        isOpen && "rotate-180"
                      )}
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
                      <p className="max-w-xl pb-6 text-[0.95rem] leading-relaxed text-petrol/70">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}