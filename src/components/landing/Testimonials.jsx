import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import { TESTIMONIALS } from "@/data/site";

export default function Testimonials() {
  return (
    <section className="bg-ivory-soft py-14 lg:py-20">
      <div className="mx-auto max-w-[1180px] px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Ils sont revenus"
            title="Ce que la diaspora en dit"
            text="Des séjours pensés pour retrouver les siens sans renoncer au confort, et pour faire découvrir le pays aux générations suivantes."
          />
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <Reveal key={item.name} delay={index * 90} className="h-full">
              <figure className="flex h-full flex-col justify-between border border-petrol/12 bg-white p-8">
                <blockquote className="text-[0.97rem] leading-relaxed text-petrol/80">
                  « {item.quote} »
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4 border-t border-petrol/10 pt-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-petrol font-display text-[0.9rem] tracking-widest text-gold">
                    {item.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-[0.9rem] font-semibold text-petrol">
                      {item.name} · {item.city}
                    </p>
                    <p className="text-[0.76rem] uppercase tracking-[0.16em] text-petrol/45">
                      {item.detail}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}