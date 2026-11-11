import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { saveCircuit } from "@/lib/server-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageField, TextAreaField, TextField } from "@/components/admin/fields";
import { CIRCUIT_KINDS } from "@/data/site";
import { formatCoordinates, parseCoordinates } from "@/lib/coordinates";

const EMPTY = {
  title: "",
  kind: "circuit",
  slug: "",
  tagline: "",
  duration: "",
  price: "",
  departure: "",
  dates: "",
  image: "",
  description: "",
  included: "",
  excluded: "",
  programme: [],
  published: false,
};

const toForm = (record) =>
  record
    ? {
        ...EMPTY,
        ...record,
        included: (record.included || []).join("\n"),
        excluded: (record.excluded || []).join("\n"),
        programme: (record.programme || []).map((day) => ({
          title: day.title ?? "",
          description: day.description ?? "",
          place: day.place ?? "",
          coordinates: formatCoordinates(day),
          image: day.image ?? "",
        })),
      }
    : EMPTY;

const NEW_DAY = { title: "", description: "", place: "", coordinates: "", image: "" };

const lines = (value) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

// Same look as the fields of src/components/admin/fields.jsx.
const inputClass = "border-petrol/25 bg-white text-petrol placeholder:text-petrol/45 focus-visible:ring-gold";

function FormSection({ title, hint, children }) {
  return (
    <fieldset className="space-y-5 border-t border-petrol/10 pt-6">
      <div>
        <legend className="label-caps text-petrol">{title}</legend>
        {hint ? <p className="mt-1 text-[0.85rem] text-petrol/55">{hint}</p> : null}
      </div>
      {children}
    </fieldset>
  );
}

// The day-by-day programme: one block per day, which can be moved up or down or removed.
// A place picked among the destinations brings its GPS position, for the itinerary map.
function ProgrammeEditor({ value, onChange, destinations }) {
  const update = (index, key, text) => onChange(value.map((day, i) => (i === index ? { ...day, [key]: text } : day)));
  const updatePlace = (index, place) =>
    onChange(
      value.map((day, i) => {
        if (i !== index) return day;
        const match = destinations.find((item) => item.name.toLowerCase() === place.trim().toLowerCase());
        const position = !day.coordinates.trim() && match ? formatCoordinates(match) : day.coordinates;
        return { ...day, place, coordinates: position };
      }),
    );
  const move = (index, step) => {
    const next = [...value];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {value.length === 0 ? (
        <p className="text-[0.85rem] text-petrol/55">Aucune étape : la section programme est masquée sur la page.</p>
      ) : null}
      <ol className="space-y-4">
        {value.map((day, index) => (
          <li key={index} className="space-y-3 border border-petrol/15 bg-ivory-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="label-caps text-gold-deep">Jour {index + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Monter le jour ${index + 1}`}
                  className="p-2 text-petrol/55 transition-colors hover:text-petrol disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label={`Descendre le jour ${index + 1}`}
                  className="p-2 text-petrol/55 transition-colors hover:text-petrol disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  aria-label={`Supprimer le jour ${index + 1}`}
                  className="p-2 text-petrol/55 transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <Input
              value={day.title}
              placeholder="Titre de la journée, par exemple : Arrivée à Conakry"
              onChange={(event) => update(index, "title", event.target.value)}
              className={inputClass}
            />
            <Textarea
              rows={3}
              value={day.description}
              placeholder="Le déroulé de la journée : visites, repas, nuit…"
              onChange={(event) => update(index, "description", event.target.value)}
              className={`${inputClass} resize-none`}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={day.place}
                list="circuit-places"
                placeholder="Lieu de l'étape, par exemple : Dalaba"
                onChange={(event) => updatePlace(index, event.target.value)}
                className={inputClass}
                aria-label={`Lieu du jour ${index + 1}`}
              />
              <Input
                value={day.coordinates}
                placeholder="GPS pour la carte : 10.6969, -12.2509"
                onChange={(event) => update(index, "coordinates", event.target.value)}
                className={inputClass}
                aria-label={`Coordonnées GPS du jour ${index + 1}`}
              />
            </div>
            <ImageField label="Photo de l'étape (facultatif)" value={day.image} onChange={(url) => update(index, "image", url)} />
          </li>
        ))}
      </ol>
      <datalist id="circuit-places">
        {destinations.map((item) => (
          <option key={item.id} value={item.name} />
        ))}
      </datalist>
      <button
        type="button"
        onClick={() => onChange([...value, NEW_DAY])}
        className="label-caps inline-flex items-center gap-2 border border-petrol/25 px-4 py-2.5 text-petrol transition-colors hover:border-gold hover:bg-petrol/5"
      >
        <Plus className="h-4 w-4" /> Ajouter le jour {value.length + 1}
      </button>
    </div>
  );
}

export default function CircuitForm({ initial, destinations = [], onCancel, onSaved }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Le titre du circuit est obligatoire.");
      return;
    }
    const slug = form.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]*$/.test(slug)) {
      setError("L'adresse de la page ne peut contenir que des lettres minuscules, des chiffres et des tirets.");
      return;
    }
    const days = form.programme.filter((day) => day.title.trim() || day.description.trim());
    if (days.some((day) => !day.title.trim())) {
      setError("Chaque jour du programme doit avoir un titre.");
      return;
    }
    const invalidDay = days.findIndex((day) => !parseCoordinates(day.coordinates));
    if (invalidDay >= 0) {
      setError(`Jour ${invalidDay + 1} : coordonnées GPS invalides. Format attendu : 10.6969, -12.2509`);
      return;
    }
    const programme = days.map((day) => ({
      title: day.title.trim(),
      description: day.description.trim(),
      place: day.place.trim(),
      ...parseCoordinates(day.coordinates),
      image: day.image.trim(),
    }));
    setSaving(true);
    setError("");
    const payload = {
      title: form.title.trim(),
      kind: form.kind,
      slug,
      tagline: form.tagline.trim(),
      duration: form.duration.trim(),
      price: form.price.trim(),
      departure: form.departure.trim(),
      dates: form.dates.trim(),
      image: form.image.trim(),
      description: form.description.trim(),
      included: lines(form.included),
      excluded: lines(form.excluded),
      programme,
      published: form.published,
      sort_order: initial?.sort_order ?? Date.now(),
    };
    try {
      await saveCircuit({ data: { ...payload, id: initial?.id } });
      onSaved();
    } catch {
      setError("Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 border border-petrol/15 bg-white p-6">
      <p className="label-caps text-gold-deep">{initial?.id ? "Modifier le circuit" : "Nouveau circuit"}</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Titre" value={form.title} onChange={set("title")} placeholder="Conakry, la capitale autrement" />
        <div className="space-y-2">
          <label htmlFor="circuit-kind" className="label-caps text-petrol/65">
            Type
          </label>
          <select
            id="circuit-kind"
            value={form.kind}
            onChange={(event) => set("kind")(event.target.value)}
            className="h-10 w-full border border-petrol/25 bg-white px-3 text-[0.95rem] text-petrol outline-none focus:border-gold"
          >
            {Object.entries(CIRCUIT_KINDS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <TextField label="Durée" value={form.duration} onChange={set("duration")} placeholder="7 jours / 6 nuits" />
        <TextField label="Prix affiché" value={form.price} onChange={set("price")} placeholder="À partir de … par personne" />
        <TextField label="Départ" value={form.departure} onChange={set("departure")} placeholder="Au départ de Conakry" />
        <TextField label="Dates" value={form.dates} onChange={set("dates")} placeholder="Tous les jours, ou du 14 au 20 décembre" />
      </div>
      <TextAreaField
        label="Accroche (carte de l'accueil)"
        value={form.tagline}
        onChange={set("tagline")}
        placeholder="En une phrase, ce qui rend ce circuit unique."
      />
      <ImageField label="Photo principale" value={form.image} onChange={set("image")} />

      <FormSection title="Page du circuit" hint="Contenu de la page détaillée /circuits/…">
        <TextField
          label="Adresse de la page"
          value={form.slug}
          onChange={set("slug")}
          placeholder="laisser vide pour la créer depuis le titre"
        />
        <TextAreaField
          label="Description (une ligne vide entre deux paragraphes)"
          value={form.description}
          onChange={set("description")}
          rows={6}
        />
      </FormSection>

      <FormSection
        title="Programme jour par jour"
        hint="Une étape par jour, dans l'ordre du voyage. Avec un lieu et ses coordonnées GPS, l'étape apparaît sur la carte de l'itinéraire : choisir une destination du site les remplit, sinon copiez-les depuis Google Maps (clic droit sur le lieu)."
      >
        <ProgrammeEditor value={form.programme} onChange={set("programme")} destinations={destinations} />
      </FormSection>

      <FormSection title="Ce qui est compris">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextAreaField
            label="Inclus (un par ligne)"
            value={form.included}
            onChange={set("included")}
            rows={5}
            placeholder={"Transport climatisé\nGuide francophone"}
          />
          <TextAreaField
            label="Non inclus (un par ligne)"
            value={form.excluded}
            onChange={set("excluded")}
            rows={5}
            placeholder={"Vols internationaux\nDépenses personnelles"}
          />
        </div>
      </FormSection>

      <label className="flex items-start gap-3 border-t border-petrol/10 pt-6">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(event) => set("published")(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[hsl(var(--petrol))]"
        />
        <span>
          <span className="label-caps text-petrol">Publié sur le site</span>
          <span className="mt-1 block text-[0.85rem] text-petrol/55">
            Décoché, le circuit reste un brouillon : seuls les administrateurs peuvent voir sa page.
          </span>
        </span>
      </label>

      {error ? <p className="text-[0.85rem] text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={saving}
          className="label-caps gap-2 rounded-full bg-petrol px-5 text-ivory hover:bg-petrol-deep"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="label-caps rounded-full text-petrol/65 hover:text-petrol">
          Annuler
        </Button>
      </div>
    </form>
  );
}
