import { useState } from "react";
import { Loader2 } from "lucide-react";
import { saveDestination } from "@/lib/server-fns";
import { Button } from "@/components/ui/button";
import { GalleryField, ImageField, TextAreaField, TextField } from "@/components/admin/fields";
import { formatCoordinates, parseCoordinates } from "@/lib/coordinates";

const EMPTY = {
  name: "",
  region: "",
  text: "",
  price: "",
  tags: "",
  image: "",
  slug: "",
  description: "",
  highlights: "",
  gallery: [],
  best_period: "",
  access: "",
  coordinates: "",
};

const toForm = (record) =>
  record
    ? {
        ...EMPTY,
        ...record,
        tags: (record.tags || []).join(", "),
        highlights: (record.highlights || []).join("\n"),
        gallery: record.gallery || [],
        coordinates: formatCoordinates(record),
      }
    : EMPTY;

const lines = (value) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

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

export default function DestinationForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Le nom de la destination est obligatoire.");
      return;
    }
    const position = parseCoordinates(form.coordinates);
    if (!position) {
      setError("Coordonnées GPS invalides. Format attendu : 9.5092, -13.7122");
      return;
    }
    const slug = form.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]*$/.test(slug)) {
      setError("L'adresse de la page ne peut contenir que des lettres minuscules, des chiffres et des tirets.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      region: form.region.trim(),
      text: form.text.trim(),
      price: form.price.trim(),
      image: form.image.trim(),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      sort_order: initial?.sort_order ?? Date.now(),
      slug,
      description: form.description.trim(),
      highlights: lines(form.highlights),
      gallery: form.gallery,
      best_period: form.best_period.trim(),
      access: form.access.trim(),
      ...position,
    };
    try {
      await saveDestination({ data: { ...payload, id: initial?.id } });
      onSaved();
    } catch {
      setError("Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 border border-petrol/15 bg-white p-6">
      <p className="label-caps text-gold-deep">
        {initial?.id ? "Modifier la destination" : "Nouvelle destination"}
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Nom" value={form.name} onChange={set("name")} placeholder="Îles de Loos" />
        <TextField label="Région" value={form.region} onChange={set("region")} placeholder="Conakry" />
        <TextField
          label="Prix affiché"
          value={form.price}
          onChange={set("price")}
          placeholder="dès 190 € / personne"
        />
        <TextField
          label="Étiquettes (virgules)"
          value={form.tags}
          onChange={set("tags")}
          placeholder="Plage, Snorkeling"
        />
      </div>
      <TextAreaField
        label="Accroche (carte de l'accueil)"
        value={form.text}
        onChange={set("text")}
        placeholder="Sable blanc, eau turquoise et mangrove…"
      />
      <ImageField label="Photo principale" value={form.image} onChange={set("image")} />

      <FormSection title="Page de la destination" hint="Contenu de la page détaillée /destinations/…">
        <TextField
          label="Adresse de la page"
          value={form.slug}
          onChange={set("slug")}
          placeholder="laisser vide pour la créer depuis le nom"
        />
        <TextAreaField
          label="Description (une ligne vide entre deux paragraphes)"
          value={form.description}
          onChange={set("description")}
          rows={7}
          placeholder="À quelques encablures du port de Conakry…"
        />
        <TextAreaField
          label="Temps forts (un par ligne)"
          value={form.highlights}
          onChange={set("highlights")}
          rows={4}
          placeholder={"Traversée en bateau depuis Conakry\nSnorkeling dans les criques"}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Meilleure période"
            value={form.best_period}
            onChange={set("best_period")}
            placeholder="Novembre à mai"
          />
          <TextField
            label="Accès"
            value={form.access}
            onChange={set("access")}
            placeholder="Bateau depuis Conakry, 20 minutes"
          />
        </div>
        <GalleryField label="Galerie photos" value={form.gallery} onChange={set("gallery")} />
      </FormSection>

      <FormSection
        title="Position sur la carte"
        hint="Dans Google Maps, clic droit sur le lieu puis cliquez sur les coordonnées pour les copier, et collez-les ici."
      >
        <TextField
          label="Coordonnées GPS (latitude, longitude)"
          value={form.coordinates}
          onChange={set("coordinates")}
          placeholder="9.5092, -13.7122"
        />
      </FormSection>

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
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="label-caps rounded-full text-petrol/65 hover:text-petrol"
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
