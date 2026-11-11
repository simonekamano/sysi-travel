import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Check, Clock, MapPin, MessageCircle, X } from "lucide-react";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import CircuitProgramme from "@/components/circuit/CircuitProgramme";
import { CIRCUIT_KINDS, CONTACT } from "@/data/site";

function Fact({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.6} />
      <div>
        <dt className="label-caps text-petrol/45">{label}</dt>
        <dd className="mt-1 text-[0.95rem] text-petrol">{value}</dd>
      </div>
    </div>
  );
}

// The page of a circuit, shared by the public route (/circuits/$slug) and the admins' preview
// of drafts (/apercu/circuits/$slug), whose data only a signed-in admin can load.
export default function CircuitView({ circuit, others, destinations, formules, reseaux }) {
  // The circuit is offered first in the form's « Formule » list, and preselected.
  const [formule, setFormule] = useState(circuit.id);
  const options = useMemo(
    () => [{ id: circuit.id, name: circuit.title, duration: circuit.duration || CIRCUIT_KINDS[circuit.kind] }, ...formules],
    [circuit, formules],
  );
  const paragraphs = circuit.description.split(/\n\s*\n/).filter(Boolean);
  const programme = circuit.programme || [];

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} />

      <main>
        {!circuit.published ? (
          <p className="fixed inset-x-0 bottom-0 z-40 bg-gold px-6 py-3 text-center text-[0.9rem] font-semibold text-petrol-deep">
            Aperçu d'un brouillon, visible des seuls administrateurs. Cochez « Publié sur le site » pour le montrer.
          </p>
        ) : null}

        <section className="relative isolate flex min-h-[72svh] items-end overflow-hidden bg-petrol-deep">
          {circuit.image ? (
            <img
              src={circuit.image}
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              className="absolute inset-0 -z-20 h-full w-full animate-kenburns object-cover"
            />
          ) : null}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-petrol-deep via-petrol-deep/50 to-petrol-deep/60" />

          <div className="mx-auto w-full max-w-site px-6 pb-14 pt-36 lg:pb-20">
            <BackButton to="/circuits" tone="light" className="mb-6 animate-fade-in" />
            <nav aria-label="Fil d'Ariane" className="label-caps flex flex-wrap gap-2 text-ivory/55 animate-fade-in">
              <Link to="/" className="transition-colors hover:text-gold">Accueil</Link>
              <span aria-hidden="true">/</span>
              <Link to="/circuits" className="transition-colors hover:text-gold">Circuits</Link>
              <span aria-hidden="true">/</span>
              <span className="text-ivory/85">{circuit.title}</span>
            </nav>
            <p className="eyebrow mt-8 text-gold animate-fade-in">{CIRCUIT_KINDS[circuit.kind]}</p>
            <h1 className="mt-3 max-w-4xl animate-fade-up text-[clamp(2.2rem,5.5vw,4.3rem)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ivory">
              {circuit.title}
            </h1>
            {circuit.tagline ? (
              <p className="mt-6 max-w-2xl animate-fade-up text-[1.05rem] leading-relaxed text-ivory/80 [animation-delay:120ms]">
                {circuit.tagline}
              </p>
            ) : null}
            <div className="mt-8 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:220ms]">
              {[circuit.duration, circuit.departure].filter(Boolean).map((item) => (
                <span key={item} className="rounded-full border border-ivory/30 px-4 py-1.5 text-[0.72rem] uppercase tracking-[0.16em] text-ivory/85">
                  {item}
                </span>
              ))}
              {circuit.price ? (
                <span className="label-caps rounded-full bg-gold px-4 py-2 text-petrol-deep">{circuit.price}</span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="py-14 lg:py-20">
          <div className="mx-auto grid max-w-site gap-12 px-6 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <div>
              <Reveal>
                <p className="eyebrow text-gold-deep">Le voyage</p>
                <div className="mt-5 space-y-5 text-[1.02rem] leading-relaxed text-petrol/75">
                  {(paragraphs.length ? paragraphs : [circuit.tagline].filter(Boolean)).map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </Reveal>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <Reveal delay={120}>
                <div className="border border-petrol/15 bg-white p-7 shadow-[0_30px_70px_-50px_rgba(18,61,67,0.7)]">
                  <p className="label-caps text-gold-deep">En bref</p>
                  {circuit.price ? (
                    <p className="mt-4 font-display text-[1.6rem] font-bold leading-tight text-petrol">{circuit.price}</p>
                  ) : (
                    <p className="mt-4 font-display text-[1.25rem] font-bold leading-tight text-petrol">
                      Tarif sur demande
                      <span className="mt-1 block font-body text-[0.88rem] font-normal text-petrol/60">
                        Écrivez-nous : nous vous répondons avec un devis détaillé.
                      </span>
                    </p>
                  )}
                  <dl className="mt-5 space-y-5">
                    <Fact icon={Clock} label="Durée" value={circuit.duration} />
                    <Fact icon={MapPin} label="Départ" value={circuit.departure} />
                    <Fact icon={CalendarDays} label="Dates" value={circuit.dates} />
                  </dl>
                  <a
                    href="#contact"
                    className="label-caps mt-7 flex w-full items-center justify-center rounded-full bg-petrol px-6 py-4 text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:bg-petrol-deep"
                  >
                    Réserver ce circuit
                  </a>
                  <a
                    href={CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-caps mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-petrol/25 px-6 py-3.5 text-petrol transition-colors hover:border-[#25D366] hover:text-[#1a9e4b]"
                  >
                    <MessageCircle className="h-4 w-4" /> Poser une question
                  </a>
                </div>
              </Reveal>
            </aside>
          </div>
        </section>

        {programme.length ? <CircuitProgramme programme={programme} /> : null}

        {circuit.included?.length || circuit.excluded?.length ? (
          <section className="bg-ivory-soft py-14 lg:py-20">
            <div className="mx-auto max-w-site px-6">
              <Reveal>
                <SectionHeading eyebrow="Pour bien préparer" title="Ce qui est compris" />
              </Reveal>
              <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
                {[
                  { title: "Inclus", items: circuit.included, Icon: Check, iconClass: "text-[#1a7f45]" },
                  { title: "Non inclus", items: circuit.excluded, Icon: X, iconClass: "text-petrol/45" },
                ]
                  .filter((list) => list.items?.length)
                  .map(({ title, items, Icon, iconClass }) => (
                    <Reveal key={title}>
                      <div className="h-full border border-petrol/15 bg-white p-7">
                        <p className="label-caps text-gold-deep">{title}</p>
                        <ul className="mt-5 space-y-3">
                          {items.map((item) => (
                            <li key={item} className="flex gap-3 text-[0.95rem] leading-snug text-petrol">
                              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} strokeWidth={2} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Reveal>
                  ))}
              </div>
            </div>
          </section>
        ) : null}

        {others.length ? (
          <section className="py-14 lg:py-20">
            <div className="mx-auto max-w-site px-6">
              <Reveal>
                <SectionHeading eyebrow="Autres idées de voyage" title="Vous aimerez aussi" />
              </Reveal>
              <div className="mt-10 grid gap-6 sm:grid-cols-3">
                {others.map((other, index) => (
                  <Reveal key={other.id} delay={index * 90}>
                    <Link to="/circuits/$slug" params={{ slug: other.slug }} className="group block">
                      <div className="relative aspect-[4/3] overflow-hidden bg-petrol">
                        {other.image ? (
                          <img src={other.image} alt={other.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-petrol-deep/90 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <p className="label-caps text-gold">
                            {CIRCUIT_KINDS[other.kind]}
                            {other.duration ? ` · ${other.duration}` : ""}
                          </p>
                          <p className="mt-1 text-[1.05rem] font-bold text-ivory">
                            {other.title}
                            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                          </p>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <ContactForm
          key={circuit.id}
          formule={formule}
          setFormule={setFormule}
          destinations={destinations}
          formules={options}
        />
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
    </div>
  );
}
