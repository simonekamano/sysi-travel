import { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ImageField, TextAreaField, TextField } from "@/components/admin/fields";

const EMPTY = { name: "", region: "", text: "", price: "", tags: "", image: "" };

const toForm = (record) =>
  record ? { ...EMPTY, ...record, tags: (record.tags || []).join(", ") } : EMPTY;

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
      order: initial?.order ?? Date.now(),
    };
    try {
      if (initial?.id) await base44.entities.Destination.update(initial.id, payload);
      else await base44.entities.Destination.create(payload);
      onSaved();
    } catch {
      setError("Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 border border-petrol/15 bg-white p-6">
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
        label="Description"
        value={form.text}
        onChange={set("text")}
        placeholder="Sable blanc, eau turquoise et mangrove…"
      />
      <ImageField label="Photo de la destination" value={form.image} onChange={set("image")} />

      {error ? <p className="text-[0.85rem] text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={saving}
          className="label-caps gap-2 rounded-full bg-petrol px-6 text-ivory hover:bg-petrol-deep"
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