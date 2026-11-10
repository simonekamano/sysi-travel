import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { saveLivre } from "@/lib/server-fns";
import { browserSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ImageField, TextAreaField, TextField } from "@/components/admin/fields";
import { BOOK_KINDS, formatSize, parsePrice, priceInput } from "@/lib/boutique";

const MAX_PDF_BYTES = 50 * 1024 * 1024;

const EMPTY = {
  title: "",
  subtitle: "",
  author: "",
  kind: "guide",
  description: "",
  cover: "",
  price: "",
  pages: "",
  language: "Français",
  file_path: "",
  file_size: 0,
  published: false,
};

const toForm = (record) =>
  record ? { ...EMPTY, ...record, price: priceInput(record.price_cents), pages: record.pages ? String(record.pages) : "" } : EMPTY;

const selectClass = "h-10 w-full border border-petrol/25 bg-white px-3 text-[0.95rem] text-petrol outline-none focus:border-gold";

// The PDF goes to the private bucket « livres » (admins only; buyers get it through their
// download link). Returns its path in the bucket.
async function uploadPdf(file) {
  const path = `${crypto.randomUUID()}.pdf`;
  const { error } = await browserSupabase()
    .storage.from("livres")
    .upload(path, file, { contentType: "application/pdf", cacheControl: "3600" });
  if (error) throw error;
  return path;
}

const removePdf = (path) => (path ? browserSupabase().storage.from("livres").remove([path]).catch(() => null) : null);

export default function LivreForm({ initial, sortOrder, onCancel, onSaved }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  // The PDF sent during this edit, removed again if the edit is cancelled or replaced.
  const sentPath = useRef("");
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Choisissez un fichier PDF.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError("Ce PDF dépasse 50 Mo : réduisez-le (par exemple en compressant les images) avant de l'envoyer.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const path = await uploadPdf(file);
      if (sentPath.current) removePdf(sentPath.current);
      sentPath.current = path;
      setFileName(file.name);
      setForm((prev) => ({ ...prev, file_path: path, file_size: file.size }));
    } catch {
      setError(
        "L'envoi du PDF a échoué. Vérifiez votre connexion, puis réessayez. Si le fichier est lourd (plus de 12 Mo), le serveur doit d'abord accepter les gros fichiers.",
      );
    } finally {
      setUploading(false);
    }
  };

  const cancel = () => {
    if (sentPath.current) removePdf(sentPath.current);
    onCancel();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    const priceCents = parsePrice(form.price);
    if (priceCents === null || priceCents < 50) {
      setError("Prix attendu en euros, par exemple 12,90.");
      return;
    }
    const pages = form.pages.trim() ? Number(form.pages) : null;
    if (pages !== null && (!Number.isInteger(pages) || pages < 1)) {
      setError("Le nombre de pages doit être un nombre entier.");
      return;
    }
    if (form.published && !form.file_path) {
      setError("Ajoutez le PDF avant de mettre le livre en vente.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      title: form.title.trim(),
      slug: initial?.slug ?? "",
      subtitle: form.subtitle.trim(),
      author: form.author.trim(),
      kind: form.kind,
      description: form.description.trim(),
      cover: form.cover.trim(),
      price_cents: priceCents,
      pages,
      language: form.language.trim() || "Français",
      file_path: form.file_path,
      file_size: form.file_size,
      published: form.published,
      sort_order: initial?.sort_order ?? sortOrder,
    };
    try {
      await saveLivre({ data: { ...payload, id: initial?.id } });
      // The replaced PDF is no longer needed.
      if (initial?.file_path && initial.file_path !== form.file_path) removePdf(initial.file_path);
      sentPath.current = "";
      onSaved();
    } catch {
      setError("Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 border border-petrol/15 bg-white p-6">
      <p className="label-caps text-gold-deep">{initial?.id ? "Modifier le livre" : "Nouveau livre ou guide"}</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Titre" value={form.title} onChange={set("title")} placeholder="Guide de Conakry" />
        <TextField label="Sous-titre (facultatif)" value={form.subtitle} onChange={set("subtitle")} placeholder="Les adresses de la capitale" />
        <TextField label="Auteur" value={form.author} onChange={set("author")} placeholder="Simone Kamano" />
        <div className="space-y-2">
          <label htmlFor="livre-kind" className="label-caps text-petrol/65">
            Type
          </label>
          <select id="livre-kind" value={form.kind} onChange={(event) => set("kind")(event.target.value)} className={selectClass}>
            {BOOK_KINDS.map((kind) => (
              <option key={kind.key} value={kind.key}>
                {kind.label}
              </option>
            ))}
          </select>
        </div>
        <TextField label="Prix (€)" value={form.price} onChange={set("price")} placeholder="12,90" />
        <div className="grid grid-cols-2 gap-5">
          <TextField label="Pages" value={form.pages} onChange={set("pages")} placeholder="120" />
          <TextField label="Langue" value={form.language} onChange={set("language")} placeholder="Français" />
        </div>
      </div>

      <TextAreaField
        label="Description"
        value={form.description}
        onChange={set("description")}
        rows={6}
        placeholder="Ce que le lecteur va trouver dans ce livre. Une ligne vide sépare deux paragraphes."
      />

      <ImageField label="Couverture" value={form.cover} onChange={set("cover")} />

      <div className="space-y-2">
        <p className="label-caps text-petrol/65">Fichier PDF vendu</p>
        <div className="flex flex-col gap-3 border border-petrol/15 bg-ivory-soft p-4 sm:flex-row sm:items-center">
          <FileText className="h-8 w-8 shrink-0 text-gold-deep" strokeWidth={1.5} />
          <div className="flex-1 text-[0.9rem]">
            {form.file_path ? (
              <>
                <p className="font-semibold text-petrol">{fileName || "PDF enregistré"}</p>
                <p className="text-petrol/55">{formatSize(form.file_size)} · privé, remis seulement aux acheteurs</p>
              </>
            ) : (
              <p className="text-petrol/60">Aucun PDF pour l'instant : le livre ne peut pas être mis en vente.</p>
            )}
          </div>
          <label className="label-caps inline-flex cursor-pointer items-center gap-2 border border-petrol/25 bg-white px-4 py-2.5 text-petrol transition-colors hover:border-gold">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Envoi…" : form.file_path ? "Remplacer" : "Choisir le PDF"}
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        </div>
      </div>

      <label className="flex items-start gap-3 border-t border-petrol/10 pt-6">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(event) => set("published")(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[hsl(var(--petrol))]"
        />
        <span>
          <span className="label-caps text-petrol">En vente</span>
          <span className="mt-1 block text-[0.85rem] text-petrol/55">
            Visible dans la boutique. Décoché, le livre est masqué, mais ceux qui l'ont déjà acheté peuvent toujours le télécharger.
          </span>
        </span>
      </label>

      {error ? <p className="text-[0.85rem] text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={saving || uploading}
          className="label-caps gap-2 rounded-full bg-petrol px-6 text-ivory hover:bg-petrol-deep"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer
        </Button>
        <Button type="button" variant="ghost" onClick={cancel} className="label-caps rounded-full text-petrol/65 hover:text-petrol">
          Annuler
        </Button>
      </div>
    </form>
  );
}
