import { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/admin/fields";

const EMPTY = { question: "", answer: "" };

export default function FaqForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initial || {}) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      setError("La question et la réponse sont obligatoires.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      order: initial?.order ?? Date.now(),
    };
    try {
      if (initial?.id) await base44.entities.Faq.update(initial.id, payload);
      else await base44.entities.Faq.create(payload);
      onSaved();
    } catch {
      setError("Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 border border-petrol/15 bg-white p-6">
      <p className="label-caps text-gold-deep">
        {initial?.id ? "Modifier la question" : "Nouvelle question"}
      </p>
      <TextField
        label="Question"
        value={form.question}
        onChange={set("question")}
        placeholder="Faut-il un visa pour venir en Guinée ?"
      />
      <TextAreaField
        label="Réponse"
        value={form.answer}
        onChange={set("answer")}
        rows={4}
        placeholder="Oui pour la plupart des passeports…"
      />

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