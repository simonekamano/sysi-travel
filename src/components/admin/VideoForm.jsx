import { useState } from "react";
import { CheckCircle2, Loader2, Play } from "lucide-react";
import { saveVideo } from "@/lib/server-fns";
import { Button } from "@/components/ui/button";
import { ImageField, TextAreaField, TextField } from "@/components/admin/fields";
import { VIDEO_CATEGORIES, parseVideo, videoPoster } from "@/lib/video";

const EMPTY = {
  title: "",
  description: "",
  category: "entreprise",
  url: "",
  poster: "",
  duration: "",
  vertical: false,
  published: true,
};

const PROVIDER_LABEL = { youtube: "Vidéo YouTube", vimeo: "Vidéo Vimeo", file: "Fichier vidéo" };

const selectClass = "h-10 w-full border border-petrol/25 bg-white px-3 text-[0.95rem] text-petrol outline-none focus:border-gold";

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

export default function VideoForm({ initial, sortOrder, onCancel, onSaved }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...initial }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const parsed = parseVideo(form.url);
  const poster = videoPoster(form, parsed);

  // A YouTube Short is filmed upright: tick « vertical » for the visitor's player.
  const setUrl = (url) => {
    const next = parseVideo(url);
    setForm((prev) => ({ ...prev, url, vertical: next?.short ? true : prev.vertical }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!parsed) {
      setError("Collez le lien d'une vidéo YouTube ou Vimeo, ou d'un fichier .mp4.");
      return;
    }
    if (!form.title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      url: form.url.trim(),
      poster: form.poster.trim(),
      duration: form.duration.trim(),
      vertical: form.vertical,
      published: form.published,
      sort_order: initial?.sort_order ?? sortOrder,
    };
    try {
      await saveVideo({ data: { ...payload, id: initial?.id } });
      onSaved();
    } catch {
      setError("Enregistrement impossible. Vérifiez le lien et que vous êtes connecté en administrateur.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 border border-petrol/15 bg-white p-6">
      <p className="label-caps text-gold-deep">{initial?.id ? "Modifier la vidéo" : "Nouvelle vidéo"}</p>

      <div className="space-y-2">
        <TextField
          label="Lien de la vidéo"
          value={form.url}
          onChange={setUrl}
          placeholder="https://www.youtube.com/watch?v=…"
        />
        {form.url.trim() ? (
          parsed ? (
            <p className="flex items-center gap-2 text-[0.85rem] text-[#1a7f4b]">
              <CheckCircle2 className="h-4 w-4" /> {PROVIDER_LABEL[parsed.provider]} reconnue
            </p>
          ) : (
            <p className="text-[0.85rem] text-destructive">
              Lien non reconnu : copiez l'adresse de la vidéo sur YouTube ou Vimeo (bouton « Partager »).
            </p>
          )
        ) : (
          <p className="text-[0.85rem] text-petrol/55">
            Mettez d'abord la vidéo sur la chaîne YouTube (ou Vimeo) de SYSI TRAVEL, puis collez son lien ici.
            Une vidéo « non répertoriée » sur YouTube fonctionne aussi.
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Titre" value={form.title} onChange={set("title")} placeholder="SYSI TRAVEL, qui sommes-nous ?" />
        <div className="space-y-2">
          <label htmlFor="video-category" className="label-caps text-petrol/65">
            Thème
          </label>
          <select id="video-category" value={form.category} onChange={(event) => set("category")(event.target.value)} className={selectClass}>
            {VIDEO_CATEGORIES.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <TextField label="Durée (facultative)" value={form.duration} onChange={set("duration")} placeholder="2:30" />
      </div>

      <TextAreaField
        label="Description (courte)"
        value={form.description}
        onChange={set("description")}
        rows={3}
        placeholder="Ce que le voyageur va découvrir, en une ou deux phrases."
      />

      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <ImageField label="Image d'aperçu (facultative pour YouTube)" value={form.poster} onChange={set("poster")} />
        <div className="space-y-2">
          <p className="label-caps text-petrol/65">Aperçu</p>
          <div className="relative flex h-24 w-40 items-center justify-center overflow-hidden bg-petrol-deep">
            {poster ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" /> : null}
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gold text-petrol-deep">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-petrol/10 pt-6">
        <Check
          label="Vidéo verticale"
          hint="Filmée au téléphone, en hauteur (format 9:16) : le lecteur s'adapte."
          checked={form.vertical}
          onChange={set("vertical")}
        />
        <Check
          label="Visible sur le site"
          hint="Décoché, la vidéo est masquée de l'accueil et de la page Vidéos."
          checked={form.published}
          onChange={set("published")}
        />
      </div>

      {error ? <p className="text-[0.85rem] text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving} className="label-caps gap-2 rounded-full bg-petrol px-5 text-ivory hover:bg-petrol-deep">
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
