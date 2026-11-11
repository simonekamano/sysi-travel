import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { saveArticle } from "@/lib/server-fns";
import { Button } from "@/components/ui/button";
import { GalleryField, TextAreaField, TextField } from "@/components/admin/fields";
import { CUSTOM_SIZE, SHOP_CATEGORIES, parsePrice, priceInput } from "@/lib/boutique";

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const EMPTY = {
  name: "",
  slug: "",
  category: "femme",
  tagline: "",
  description: "",
  price: "",
  sizes: "",
  custom_made: false,
  variants: [{ name: "", images: [], available: true }],
  published: false,
};

const toForm = (record) =>
  record
    ? {
        ...EMPTY,
        ...record,
        price: priceInput(record.price_cents),
        sizes: (record.sizes ?? []).join(", "),
        variants: (record.variants ?? []).length ? record.variants.map((variant) => ({ available: true, images: [], ...variant })) : EMPTY.variants,
      }
    : EMPTY;

const sizesOf = (text) =>
  [...new Set(text.split(",").map((size) => size.trim()).filter(Boolean))].filter((size) => size.toLowerCase() !== CUSTOM_SIZE.toLowerCase());

const selectClass = "h-10 w-full border border-petrol/25 bg-white px-3 text-[0.95rem] text-petrol outline-none focus:border-gold";
const chipClass = "label-caps border border-petrol/20 px-3 py-1.5 text-[0.68rem] text-petrol/70 transition-colors hover:border-gold hover:text-petrol";

// An article of the shop: name, section, price, sizes, and its variants (colour, fabric…) with
// their photos. The first photo of the first variant is the one shown in the lists.
export default function ArticleForm({ initial, sortOrder, onCancel, onSaved }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setVariant = (index, key, value) =>
    setForm((prev) => ({ ...prev, variants: prev.variants.map((variant, i) => (i === index ? { ...variant, [key]: value } : variant)) }));
  const moveVariant = (index, step) =>
    setForm((prev) => {
      const variants = [...prev.variants];
      [variants[index], variants[index + step]] = [variants[index + step], variants[index]];
      return { ...prev, variants };
    });

  const submit = async (event) => {
    event.preventDefault();
    const price = parsePrice(form.price);
    if (!form.name.trim()) return setError("Le nom de l'article est obligatoire.");
    if (price === null || price < 100) return setError("Indiquez un prix d'au moins 1 €, par exemple 79 ou 79,90.");
    const slug = form.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]*$/.test(slug)) return setError("L'adresse de la page ne peut contenir que des lettres minuscules, des chiffres et des tirets.");
    const variants = form.variants
      .map((variant) => ({ name: variant.name.trim(), images: variant.images, available: variant.available }))
      .filter((variant) => variant.name || variant.images.length);
    if (!variants.length) return setError("Ajoutez au moins une variante (par exemple sa couleur) avec ses photos.");
    if (variants.some((variant) => !variant.name)) return setError("Chaque variante doit avoir un nom (couleur, tissu…).");
    if (new Set(variants.map((variant) => variant.name.toLowerCase())).size !== variants.length) {
      return setError("Deux variantes portent le même nom.");
    }
    if (form.published && !variants.some((variant) => variant.images.length)) {
      return setError("Ajoutez au moins une photo avant de mettre l'article en vente.");
    }

    setSaving(true);
    setError("");
    try {
      await saveArticle({
        data: {
          id: initial?.id,
          name: form.name.trim(),
          slug,
          category: form.category,
          tagline: form.tagline.trim(),
          description: form.description.trim(),
          price_cents: price,
          sizes: sizesOf(form.sizes),
          custom_made: form.custom_made,
          variants,
          published: form.published,
          sort_order: initial?.sort_order ?? sortOrder,
        },
      });
      onSaved();
    } catch (caught) {
      setError(caught?.message?.includes("même nom") ? caught.message : "Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 border border-petrol/15 bg-white p-6">
      <p className="label-caps text-gold-deep">{initial?.id ? "Modifier l'article" : "Nouvel article"}</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Nom" value={form.name} onChange={set("name")} placeholder="Robe Bazin d'or" />
        <div className="space-y-2">
          <label htmlFor="article-category" className="label-caps text-petrol/65">
            Rayon
          </label>
          <select id="article-category" value={form.category} onChange={(event) => set("category")(event.target.value)} className={selectClass}>
            {SHOP_CATEGORIES.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <TextField label="Prix (€)" value={form.price} onChange={set("price")} placeholder="149 ou 149,90" />
        <TextField label="Adresse de la page" value={form.slug} onChange={set("slug")} placeholder="laisser vide pour la créer depuis le nom" />
      </div>

      <TextField label="Accroche (une phrase, sous le prix)" value={form.tagline} onChange={set("tagline")} placeholder="La robe longue de cérémonie, brocart jaune et foulard assorti." />
      <TextAreaField
        label="Description (une ligne vide entre deux paragraphes)"
        value={form.description}
        onChange={set("description")}
        rows={5}
        placeholder="Coupe, tissu, occasions, conseils d'entretien…"
      />

      <fieldset className="space-y-3 border-t border-petrol/10 pt-6">
        <legend className="label-caps text-petrol">Tailles</legend>
        <TextField label="Tailles proposées, séparées par des virgules (vide : pas de taille)" value={form.sizes} onChange={set("sizes")} placeholder="S, M, L, XL" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => set("sizes")(CLOTHING_SIZES.join(", "))} className={chipClass}>
            XS à XXL
          </button>
          <button type="button" onClick={() => set("sizes")("Taille unique")} className={chipClass}>
            Taille unique
          </button>
          <button type="button" onClick={() => set("sizes")("")} className={chipClass}>
            Aucune (sac, bijou)
          </button>
        </div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.custom_made}
            onChange={(event) => set("custom_made")(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[hsl(var(--petrol))]"
          />
          <span className="text-[0.9rem] text-petrol/75">Proposer aussi « Sur mesure » (les mesures sont demandées après la commande)</span>
        </label>
      </fieldset>

      <fieldset className="space-y-4 border-t border-petrol/10 pt-6">
        <div>
          <legend className="label-caps text-petrol">Variantes et photos</legend>
          <p className="mt-1 text-[0.85rem] text-petrol/55">
            Une variante par couleur ou par tissu, avec ses photos. La première photo de la première variante s'affiche dans la boutique.
          </p>
        </div>
        <ol className="space-y-4">
          {form.variants.map((variant, index) => (
            <li key={index} className="space-y-4 border border-petrol/15 bg-ivory-soft p-4">
              <div className="flex flex-wrap items-end gap-3">
                <TextField
                  label={`Variante ${index + 1} : nom`}
                  value={variant.name}
                  onChange={(value) => setVariant(index, "name", value)}
                  placeholder="Bleu indigo"
                  className="min-w-[12rem] flex-1"
                />
                <label className="flex h-10 items-center gap-2 text-[0.9rem] text-petrol/75">
                  <input
                    type="checkbox"
                    checked={variant.available}
                    onChange={(event) => setVariant(index, "available", event.target.checked)}
                    className="h-4 w-4 accent-[hsl(var(--petrol))]"
                  />
                  Disponible
                </label>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveVariant(index, -1)} disabled={index === 0} aria-label="Monter" className="p-2 text-petrol/55 hover:text-petrol disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveVariant(index, 1)}
                    disabled={index === form.variants.length - 1}
                    aria-label="Descendre"
                    className="p-2 text-petrol/55 hover:text-petrol disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => set("variants")(form.variants.filter((_, i) => i !== index))}
                    disabled={form.variants.length === 1}
                    aria-label={`Supprimer la variante ${index + 1}`}
                    className="p-2 text-petrol/55 hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <GalleryField
                label="Photos de cette variante"
                value={variant.images}
                onChange={(images) => setVariant(index, "images", images)}
                emptyText="Aucune photo pour cette variante."
              />
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => set("variants")([...form.variants, { name: "", images: [], available: true }])}
          className="label-caps inline-flex items-center gap-2 border border-petrol/25 px-4 py-2.5 text-petrol transition-colors hover:border-gold hover:bg-petrol/5"
        >
          <Plus className="h-4 w-4" /> Ajouter une variante
        </button>
      </fieldset>

      <label className="flex items-start gap-3 border-t border-petrol/10 pt-6">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(event) => set("published")(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[hsl(var(--petrol))]"
        />
        <span>
          <span className="label-caps text-petrol">En vente</span>
          <span className="mt-1 block text-[0.85rem] text-petrol/55">Visible dans la boutique. Décoché, l'article est masqué.</span>
        </span>
      </label>

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
