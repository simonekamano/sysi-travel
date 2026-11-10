import { useState } from "react";
import { Loader2 } from "lucide-react";
import { saveSite } from "@/lib/server-fns";
import { Button } from "@/components/ui/button";
import { ImageField, TextAreaField, TextField } from "@/components/admin/fields";
import { EXPLORER_REGIONS, SITE_CATEGORIES } from "@/data/explorer";
import { formatCoordinates, parseCoordinates } from "@/lib/coordinates";

const EMPTY = {
  name: "",
  slug: "",
  region: "basse",
  category: "nature",
  town: "",
  description: "",
  image: "",
  coordinates: "",
  approximate: false,
  destination_slug: "",
  published: true,
};

const toForm = (record) => (record ? { ...EMPTY, ...record, coordinates: formatCoordinates(record) } : EMPTY);

const selectClass = "h-10 w-full border border-petrol/25 bg-white px-3 text-[0.95rem] text-petrol outline-none focus:border-gold";

function Select({ id, label, value, onChange, children }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="label-caps text-petrol/65">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        {children}
      </select>
    </div>
  );
}

function Check({ label, hint, checked, onChange }) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[hsl(var(--petrol))]"
      />
      <span>
        <span className="label-caps text-petrol">{label}</span>
        <span className="mt-1 block text-[0.85rem] text-petrol/55">{hint}</span>
      </span>
    </label>
  );
}

export default function SiteForm({ initial, destinations = [], onCancel, onSaved }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Le nom du site est obligatoire.");
      return;
    }
    const position = parseCoordinates(form.coordinates);
    if (!position || position.latitude === null) {
      setError("Coordonnées GPS obligatoires. Format attendu : 10.6969, -12.2509");
      return;
    }
    const slug = form.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]*$/.test(slug)) {
      setError("L'adresse ne peut contenir que des lettres minuscules, des chiffres et des tirets.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      slug,
      region: form.region,
      category: form.category,
      town: form.town.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      ...position,
      approximate: form.approximate,
      destination_slug: form.destination_slug,
      published: form.published,
      sort_order: initial?.sort_order ?? Date.now(),
    };
    try {
      await saveSite({ data: { ...payload, id: initial?.id } });
      onSaved();
    } catch {
      setError("Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 border border-petrol/15 bg-white p-6">
      <p className="label-caps text-gold-deep">{initial?.id ? "Modifier le site" : "Nouveau site"}</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Nom" value={form.name} onChange={set("name")} placeholder="Chutes de Kambadaga" />
        <TextField label="Ville ou secteur" value={form.town} onChange={set("town")} placeholder="Pita" />
        <Select id="site-region" label="Région" value={form.region} onChange={set("region")}>
          {EXPLORER_REGIONS.map((region) => (
            <option key={region.key} value={region.key}>
              {region.label}
            </option>
          ))}
        </Select>
        <Select id="site-category" label="Type" value={form.category} onChange={set("category")}>
          {SITE_CATEGORIES.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
        </Select>
        <TextField
          label="Coordonnées GPS (latitude, longitude)"
          value={form.coordinates}
          onChange={set("coordinates")}
          placeholder="10.8340, -12.5000"
        />
        <Select id="site-destination" label="Fiche destination liée" value={form.destination_slug} onChange={set("destination_slug")}>
          <option value="">Aucune</option>
          {destinations.map((destination) => (
            <option key={destination.slug} value={destination.slug}>
              {destination.name}
            </option>
          ))}
        </Select>
      </div>
      <p className="-mt-2 text-[0.85rem] text-petrol/55">
        Dans Google Maps, clic droit sur le lieu puis clic sur les coordonnées pour les copier.
      </p>
      <TextAreaField
        label="Description (courte)"
        value={form.description}
        onChange={set("description")}
        rows={3}
        placeholder="Ce qui rend ce site unique, en une ou deux phrases."
      />
      <ImageField label="Photo" value={form.image} onChange={set("image")} />
      <div className="space-y-4 border-t border-petrol/10 pt-6">
        <Check
          label="Position approximative"
          hint="Affiche « position approximative » sur la fiche, tant que le lieu exact n'est pas vérifié."
          checked={form.approximate}
          onChange={set("approximate")}
        />
        <Check
          label="Visible sur la carte"
          hint="Décoché, le site est masqué de la carte « Explorer la Guinée »."
          checked={form.published}
          onChange={set("published")}
        />
      </div>

      {error ? <p className="text-[0.85rem] text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving} className="label-caps gap-2 rounded-full bg-petrol px-6 text-ivory hover:bg-petrol-deep">
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
