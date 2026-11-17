import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageField, TextAreaField, TextField } from "@/components/admin/fields";
import { ACCOMPAGNEMENT } from "@/lib/histoire";
import { saveHistoire } from "@/lib/server-fns";

const FIELDS = ["titre", "role", "accroche", "signature", "photo_portrait", "photo_recit_1", "photo_recit_2", "recit", "avant", "pendant", "apres"];

function Group({ title, text, children }) {
  return (
    <section className="space-y-5 border border-petrol/15 bg-white p-6">
      <div>
        <p className="label-caps text-gold-deep">{title}</p>
        {text ? <p className="mt-2 max-w-3xl text-[0.88rem] leading-relaxed text-petrol/65">{text}</p> : null}
      </div>
      {children}
    </section>
  );
}

// The texts and photos of the « Notre histoire » page, saved together.
export default function HistoireForm({ histoire }) {
  const router = useRouter();
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((key) => [key, histoire?.[key] ?? ""])));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const set = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  // Closing or reloading the tab with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.titre.trim()) {
      toast.error("Le titre de la page est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      await saveHistoire({ data: form });
      setDirty(false);
      toast.success("Page « Notre histoire » enregistrée : elle est à jour sur le site.");
      await router.invalidate();
    } catch {
      toast.error("Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Group title="En-tête de la page" text="Le haut de la page : votre présentation et votre portrait.">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Titre" value={form.titre} onChange={set("titre")} placeholder="Bonjour, moi c'est Simone." />
          <TextField label="Rôle" value={form.role} onChange={set("role")} placeholder="Fondatrice de SYSI TRAVEL Guinée" />
        </div>
        <TextAreaField label="Phrase d'accroche" value={form.accroche} onChange={set("accroche")} rows={2} />
        <ImageField label="Portrait" value={form.photo_portrait} onChange={set("photo_portrait")} />
      </Group>

      <Group
        title="Le récit"
        text="Une ligne vide entre deux paragraphes. Commencez chaque partie par « ## » suivi de son titre (par exemple « ## Pourquoi j'ai créé SYSI TRAVEL Guinée »). Une phrase entre astérisques, seule sur sa ligne (*comme ceci*), est mise en avant en grand : dans une partie sans photo, la première s'affiche dans un encadré à côté du texte."
      >
        <TextAreaField label="Texte du récit" value={form.recit} onChange={set("recit")} rows={22} />
        <div className="grid gap-5 lg:grid-cols-2">
          <ImageField label="Photo à côté de la première partie" value={form.photo_recit_1} onChange={set("photo_recit_1")} />
          <ImageField label="Photo à côté de la dernière partie" value={form.photo_recit_2} onChange={set("photo_recit_2")} />
        </div>
        <TextField label="Signature (sous le récit)" value={form.signature} onChange={set("signature")} placeholder="Simone Nèma KAMANO" />
      </Group>

      <Group title="Notre accompagnement" text="Les trois étapes affichées sous le récit. Une étape laissée vide est masquée.">
        <div className="grid gap-5 lg:grid-cols-3">
          {ACCOMPAGNEMENT.map((step) => (
            <TextAreaField key={step.key} label={step.title} value={form[step.key]} onChange={set(step.key)} rows={6} />
          ))}
        </div>
      </Group>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-petrol/15 bg-background/95 px-1 py-4 backdrop-blur">
        <Button type="submit" disabled={saving} className="label-caps gap-2 rounded-full bg-petrol px-5 text-ivory hover:bg-petrol-deep">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </Button>
        <a
          href="/notre-histoire"
          target="_blank"
          rel="noopener noreferrer"
          className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-5 py-2 text-petrol transition-colors hover:border-gold"
        >
          <ExternalLink className="h-4 w-4" /> Voir la page
        </a>
        {dirty ? <span className="text-[0.85rem] text-gold-deep">Modifications non enregistrées</span> : null}
      </div>
    </form>
  );
}
