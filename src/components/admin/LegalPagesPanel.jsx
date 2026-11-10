import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, ExternalLink, EyeOff, Globe, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import LegalText from "@/components/legal/LegalText";
import { PLACEHOLDER, findPlaceholders, legalDayFormat } from "@/lib/legal";
import { saveLegalPage } from "@/lib/server-fns";
import { cn } from "@/lib/utils";

function StatusBadge({ published }) {
  return published ? (
    <span className="label-caps inline-flex items-center gap-1.5 rounded-full bg-petrol px-3 py-1 text-[0.7rem] text-ivory">
      <Globe className="h-3 w-3" /> En ligne
    </span>
  ) : (
    <span className="label-caps inline-flex items-center gap-1.5 rounded-full bg-gold/25 px-3 py-1 text-[0.7rem] text-petrol">
      Brouillon
    </span>
  );
}

const plural = (count, word) => `${count} ${word}${count > 1 ? "s" : ""}`;

// The four legal pages: pick one, edit its text next to a live preview, publish it once every
// [[passage]] is filled in (the server and the database refuse it before).
export default function LegalPagesPanel({ pages = [] }) {
  const [selected, setSelected] = useState(pages[0]?.slug ?? null);
  const [dirty, setDirty] = useState(false);
  const page = pages.find((item) => item.slug === selected);

  const choose = (slug) => {
    if (slug === selected) return;
    if (dirty && !window.confirm("Vos modifications ne sont pas enregistrées. Les abandonner ?")) return;
    setDirty(false);
    setSelected(slug);
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

  return (
    <div className="space-y-8">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {pages.map((item) => {
          const todo = findPlaceholders(item.body).length;
          return (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => choose(item.slug)}
                aria-pressed={item.slug === selected}
                className={cn(
                  "flex h-full w-full flex-col items-start gap-3 border bg-white p-4 text-left transition-colors",
                  item.slug === selected ? "border-gold ring-1 ring-gold" : "border-petrol/15 hover:border-petrol/40",
                )}
              >
                <span className="font-display text-[1rem] font-bold leading-snug text-petrol">{item.title}</span>
                <span className="mt-auto flex flex-wrap items-center gap-2">
                  <StatusBadge published={item.published} />
                  {todo ? <span className="text-[0.8rem] font-semibold text-gold-deep">{plural(todo, "passage")} à compléter</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {page ? <LegalEditor key={`${page.slug}-${page.updated_at}`} page={page} onDirtyChange={setDirty} /> : null}
    </div>
  );
}

function LegalEditor({ page, onDirtyChange }) {
  const router = useRouter();
  const textarea = useRef(null);
  const saved = page.body.trim();
  const [body, setBody] = useState(saved);
  const [busy, setBusy] = useState("");
  const todo = findPlaceholders(body);
  const dirty = body.trim() !== saved;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  // Selects the n-th [[passage]] in the text and scrolls to it, ready to be typed over.
  const goTo = (index) => {
    const match = [...body.matchAll(PLACEHOLDER)][index];
    const element = textarea.current;
    if (!match || !element) return;
    // Height of the text before the passage, line wrapping included (measured at zero height,
    // or scrollHeight would never be less than the box itself).
    const { height, minHeight } = element.style;
    element.style.minHeight = "0px";
    element.style.height = "0px";
    element.value = body.slice(0, match.index);
    const offset = element.scrollHeight;
    element.value = body;
    element.style.height = height;
    element.style.minHeight = minHeight;
    element.focus();
    element.setSelectionRange(match.index, match.index + match[0].length);
    element.scrollTop = Math.max(0, offset - element.clientHeight / 3);
  };

  const save = async (published) => {
    const action = published === page.published ? "save" : published ? "publish" : "unpublish";
    setBusy(action);
    try {
      await saveLegalPage({ data: { slug: page.slug, body, published } });
      onDirtyChange(false);
      toast.success(
        action === "publish"
          ? "Page publiée : elle est en ligne, avec son lien dans le pied de page du site."
          : action === "unpublish"
            ? "Page retirée du site : elle redevient un brouillon."
            : page.published
              ? "Modifications enregistrées : elles sont en ligne."
              : "Brouillon enregistré.",
      );
      await router.invalidate();
    } catch (error) {
      toast.error(
        error?.message?.includes("[[")
          ? error.message
          : "Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur.",
      );
    } finally {
      setBusy("");
    }
  };

  const spinner = (action, Icon) =>
    busy === action ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />;

  return (
    <section className="space-y-5" aria-label={page.title}>
      <div className="flex flex-wrap items-start justify-between gap-4 border border-petrol/15 bg-white p-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-[1.3rem] font-bold text-petrol">{page.title}</h2>
            <StatusBadge published={page.published} />
          </div>
          <p className="mt-2 text-[0.85rem] text-petrol/60">
            Adresse : sysitravel.com/{page.slug} · Dernière modification :{" "}
            {legalDayFormat.format(new Date(page.updated_at))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {page.published ? (
            <a
              href={`/${page.slug}`}
              target="_blank"
              rel="noopener"
              className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-4 py-2.5 text-petrol transition-colors hover:border-gold"
            >
              <ExternalLink className="h-4 w-4" /> Voir la page
            </a>
          ) : null}
          {dirty ? (
            <button
              type="button"
              onClick={() => setBody(saved)}
              disabled={Boolean(busy)}
              className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-4 py-2.5 text-petrol transition-colors hover:border-gold disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> Annuler les modifications
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => save(page.published)}
            disabled={!dirty || Boolean(busy)}
            className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 bg-white px-4 py-2.5 text-petrol transition-colors hover:border-gold disabled:opacity-50"
          >
            {spinner("save", Save)} Enregistrer
          </button>
          {page.published ? (
            <button
              type="button"
              onClick={() => save(false)}
              disabled={Boolean(busy)}
              className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-4 py-2.5 text-petrol transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
            >
              {spinner("unpublish", EyeOff)} Retirer du site
            </button>
          ) : (
            <button
              type="button"
              onClick={() => save(true)}
              disabled={todo.length > 0 || Boolean(busy)}
              title={todo.length ? "Complétez d'abord les passages surlignés" : undefined}
              className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-2.5 text-ivory transition-colors hover:bg-petrol-deep disabled:opacity-50"
            >
              {spinner("publish", Globe)} Publier
            </button>
          )}
        </div>
      </div>

      {todo.length ? (
        <div className="border border-gold/70 bg-gold/10 p-5">
          <p className="flex items-center gap-2 font-semibold text-petrol">
            <AlertTriangle className="h-4 w-4 text-gold-deep" />
            {plural(todo.length, "passage")} à compléter avant de publier
          </p>
          <p className="mt-1 text-[0.88rem] leading-relaxed text-petrol/70">
            Cliquez sur un passage : il est sélectionné dans le texte. Tapez votre information à sa place,
            crochets compris. Supprimez un passage qui ne vous concerne pas.
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[0.88rem] marker:text-gold-deep">
            {todo.map((text, index) => (
              <li key={`${index}-${text}`}>
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  className="text-left text-petrol underline decoration-gold/70 underline-offset-4 hover:text-gold-deep"
                >
                  {text}
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : !page.published ? (
        <p className="flex items-center gap-2 border border-petrol/15 bg-white p-4 text-[0.9rem] text-petrol/75">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-deep" />
          Texte complet : relisez l'aperçu, puis cliquez sur « Publier » pour le mettre en ligne.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="legal-body" className="label-caps text-petrol/65">
            Texte
          </label>
          <textarea
            id="legal-body"
            ref={textarea}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            lang="fr"
            spellCheck
            maxLength={60000}
            className="mt-2 h-[70vh] min-h-[420px] w-full resize-y border border-petrol/25 bg-white p-4 font-mono text-[0.84rem] leading-relaxed text-petrol outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
          <details className="mt-3 text-[0.85rem] text-petrol/70">
            <summary className="label-caps cursor-pointer text-petrol/65">Mise en forme</summary>
            <ul className="mt-3 space-y-1.5">
              <li><code className="bg-petrol/5 px-1">## Titre</code> : le titre d'une partie</li>
              <li><code className="bg-petrol/5 px-1">- élément</code> : une liste, un élément par ligne</li>
              <li><code className="bg-petrol/5 px-1">**texte**</code> : du texte en gras</li>
              <li><code className="bg-petrol/5 px-1">[texte du lien](/confidentialite)</code> : un lien vers une page du site, ou vers une adresse https://…</li>
              <li><code className="bg-petrol/5 px-1">[[à compléter]]</code> : un passage à remplir (la page ne peut pas être publiée tant qu'il en reste)</li>
              <li>Une ligne vide sépare deux paragraphes.</li>
            </ul>
          </details>
        </div>

        <div className="min-w-0">
          <p className="label-caps text-petrol/65">Aperçu</p>
          <div className="mt-2 h-[70vh] min-h-[420px] overflow-y-auto border border-petrol/15 bg-background p-6 sm:p-8">
            <p className="eyebrow text-gold-deep">Informations légales</p>
            <h1 className="mt-3 text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-petrol">{page.title}</h1>
            <LegalText body={body} draft className="mt-8" />
          </div>
        </div>
      </div>
    </section>
  );
}
