import { useState } from "react";
import { CheckCircle2, Loader2, Mail, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Reveal from "@/components/landing/Reveal";
import { CONTACT, IMAGES } from "@/data/site";

const EMPTY = {
  nom: "",
  email: "",
  telephone: "",
  pays: "",
  destination: "",
  periode: "",
  voyageurs: "2",
  message: "",
};

const fieldClass =
  "w-full border-b border-petrol/35 bg-transparent py-2.5 text-[0.98rem] text-petrol outline-none transition-colors placeholder:text-petrol/60 focus:border-gold-deep";
const labelClass = "label-caps text-petrol/75";

export default function ContactForm({
  formule,
  setFormule,
  destinations = [],
  formules = [],
  showContactDetails = true,
}) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [sentName, setSentName] = useState("");

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const selected = formules.find((item) => item.id === formule);
      await base44.entities.DemandeSejour.create({
        nom: form.nom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        pays: form.pays.trim(),
        destination: form.destination,
        periode: form.periode.trim(),
        voyageurs: form.voyageurs,
        message: form.message.trim(),
        formule: selected ? selected.name : "",
        statut: "nouveau",
      });
      setSentName(form.nom.trim());
      setForm(EMPTY);
      setFormule("");
      setStatus("done");
    } catch (err) {
      setError("Votre demande n'a pas pu être envoyée. Merci de réessayer dans un instant.");
      setStatus("idle");
    }
  };

  return (
    <section id="contact" className="bg-petrol py-14 text-ivory lg:py-20">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal>
          <div>
            <p className="script-accent text-gold">Prochaine étape</p>
            <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,2.9rem)] font-medium uppercase leading-[1.1] tracking-[0.06em] text-ivory">
              Parlons de votre retour au pays
            </h2>
            <p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-ivory/70">
              Décrivez votre projet en trois minutes. Un expert SYSI TRAVEL vous répond sous
              24 heures ouvrées avec un premier itinéraire et une estimation de budget claire.
            </p>

            <div className="mt-9 h-px w-16 bg-gold/60" />

            <ul className="mt-9 space-y-3 text-[0.92rem] text-ivory/70">
              <li>Aucun engagement, aucun frais de dossier.</li>
              <li>Réponse personnalisée, jamais un message automatique.</li>
              <li>Vos coordonnées restent confidentielles.</li>
            </ul>

            {showContactDetails ? (
              <div className="mt-9 space-y-3 border-t border-ivory/15 pt-7 text-[0.95rem]">
                <a
                  href={CONTACT.phoneHref}
                  className="flex items-center gap-3 text-ivory/85 transition-colors hover:text-gold"
                >
                  <Phone className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.8} />
                  {CONTACT.phone}
                </a>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-3 text-ivory/85 transition-colors hover:text-gold"
                >
                  <Mail className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.8} />
                  {CONTACT.email}
                </a>
              </div>
            ) : null}

            <div className="mt-8 hidden lg:block">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={IMAGES.sunset}
                  alt="Coucher de soleil sur un fleuve en Guinée"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="bg-ivory p-6 text-petrol sm:p-9">
            {status === "done" ? (
              <div className="flex min-h-[420px] flex-col items-start justify-center gap-4">
                <CheckCircle2 className="h-11 w-11 text-gold-deep" strokeWidth={1.4} />
                <h3 className="text-[1.4rem] font-medium text-petrol">
                  Merci {sentName || "à vous"}.
                </h3>
                <p className="max-w-md text-[0.95rem] leading-relaxed text-petrol/70">
                  Votre demande est bien enregistrée. Un expert SYSI TRAVEL revient vers vous sous
                  24 heures ouvrées avec un premier itinéraire et une estimation de budget.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="label-caps mt-2 rounded-full border border-petrol/25 px-6 py-3 text-petrol transition-colors hover:border-petrol hover:bg-petrol hover:text-ivory"
                >
                  Envoyer une autre demande
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="nom">
                    Nom complet
                  </label>
                  <input
                    id="nom"
                    required
                    value={form.nom}
                    onChange={update("nom")}
                    placeholder="Aïssatou Diallo"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={update("email")}
                    placeholder="vous@exemple.com"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="telephone">
                    WhatsApp / téléphone
                  </label>
                  <input
                    id="telephone"
                    value={form.telephone}
                    onChange={update("telephone")}
                    placeholder="+33 6 00 00 00 00"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="pays">
                    Pays de résidence
                  </label>
                  <input
                    id="pays"
                    value={form.pays}
                    onChange={update("pays")}
                    placeholder="France, Canada, Belgique…"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="voyageurs">
                    Voyageurs
                  </label>
                  <input
                    id="voyageurs"
                    type="number"
                    min="1"
                    max="20"
                    value={form.voyageurs}
                    onChange={update("voyageurs")}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="destination">
                    Destination souhaitée
                  </label>
                  <select
                    id="destination"
                    value={form.destination}
                    onChange={update("destination")}
                    className={fieldClass}
                  >
                    <option value="">Je ne sais pas encore</option>
                    {destinations.map((destination) => (
                      <option key={destination.name} value={destination.name}>
                        {destination.name}
                      </option>
                    ))}
                    <option value="Plusieurs régions">Plusieurs régions</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="formule">
                    Formule
                  </label>
                  <select
                    id="formule"
                    value={formule}
                    onChange={(event) => setFormule(event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">À définir ensemble</option>
                    {formules.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {item.duration}
                      </option>
                    ))}
                    <option value="sur-mesure">Séjour sur mesure</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="periode">
                    Période de départ envisagée
                  </label>
                  <input
                    id="periode"
                    value={form.periode}
                    onChange={update("periode")}
                    placeholder="Décembre 2026, vacances d'été…"
                    className={fieldClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="message">
                    Votre projet
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    value={form.message}
                    onChange={update("message")}
                    placeholder="Voyage en famille, envies particulières, budget envisagé…"
                    className={`${fieldClass} resize-none`}
                  />
                </div>

                {error ? (
                  <p className="sm:col-span-2 text-[0.85rem] text-destructive">{error}</p>
                ) : null}

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="label-caps inline-flex w-full items-center justify-center gap-3 rounded-full bg-petrol px-8 py-4 text-ivory transition-colors hover:bg-petrol-deep disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours
                      </>
                    ) : (
                      "Recevoir mon itinéraire"
                    )}
                  </button>
                  <p className="mt-4 text-center text-[0.78rem] leading-relaxed text-petrol/65">
                    En envoyant ce formulaire, vous acceptez d'être contacté par SYSI TRAVEL au
                    sujet de votre voyage.
                  </p>
                </div>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}