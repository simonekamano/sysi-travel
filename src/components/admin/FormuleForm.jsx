import { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImageField, TextAreaField, TextField } from "@/components/admin/fields";

const EMPTY = {
  name: "",
  price: "",
  duration: "",
  tagline: "",
  features: "",
  image: "",
  highlight: false,
};

const toForm = (record) =>
  record ? { ...EMPTY, ...record, features: (record.features || []).join("\n") } : EMPTY;

export default function FormuleForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Le nom de la formule est obligatoire.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      price: form.price.trim(),
      duration: form.duration.trim(),
      tagline: form.tagline.trim(),
      image: form.image.trim(),
      highlight: Boolean(form.highlight),
      features: form.features
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      order: initial?.order ?? Date.now(),
    };
    try {
      if (initial?.id) await base44.entities.Formule.update(initial.id, payload);
      else await base44.entities.Formule.create(payload);
      onSaved();
    } catch {
      setError("Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 border border-petrol/15 bg-white p-6">
      <p className="label-caps text-gold-deep">
        {initial?.id ? "Modifier la formule" : "Nouvelle formule"}
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Nom"
          value={form.name}
          onChange={set("name")}
          placeholder="Signature Fouta"
        />
        <TextField
          label="Prix affiché"
          value={form.price}
          onChange={set("price")}
          placeholder="1 190 €"
        />
        <TextField
          label="Durée"
          value={form.duration}
          onChange={set("duration")}
          placeholder="8 jours / 7 nuits"
        />
        <TextField
          label="Accroche"
          value={form.tagline}
          onChange={set("tagline")}
          placeholder="Le voyage que l'on raconte pendant des années."
        />
      </div>
      <TextAreaField
        label="Prestations incluses (une par ligne)"
        value={form.features}
        onChange={set("features")}
        rows={5}
        placeholder={"Guide privé et chauffeur\nHébergements sélectionnés"}
      />
      <ImageField label="Photo de la formule" value={form.image} onChange={set("image")} />

      <label className="flex items-center gap-3 text-[0.9rem] text-petrol/75">
        <Switch
          checked={Boolean(form.highlight)}
          onCheckedChange={set("highlight")}
          className="data-[state=checked]:bg-gold"
        />
        Mettre cette formule en avant sur le site
      </label>

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