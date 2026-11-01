import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { browserSupabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const inputClass =
  "border-petrol/25 bg-white text-petrol placeholder:text-petrol/45 focus-visible:ring-gold";

export function TextField({ label, value, onChange, placeholder, type = "text", className }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="label-caps text-petrol/65">{label}</Label>
      <Input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </div>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 3, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="label-caps text-petrol/65">{label}</Label>
      <Textarea
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(inputClass, "resize-none")}
      />
    </div>
  );
}

// Uploads one photo to the public bucket "images" (supabase/migrations/0001_init.sql:
// only admins may upload) and returns its public URL.
async function uploadImage(file) {
  const bucket = browserSupabase().storage.from("images");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await bucket.upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;
  return bucket.getPublicUrl(path).data.publicUrl;
}

// A list of photos (destination gallery): add several at once, paste a URL, remove one.
export function GalleryField({ label = "Galerie", value = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const urls = await Promise.all(files.map(uploadImage));
      onChange([...value, ...urls]);
    } catch {
      setError("L'envoi d'une photo a échoué. Réessayez avec une autre image.");
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setUrl("");
  };

  return (
    <div className="space-y-3">
      <Label className="label-caps text-petrol/65">{label}</Label>
      {value.length ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {value.map((src, index) => (
            <li key={`${src}-${index}`} className="group relative aspect-square overflow-hidden border border-petrol/20 bg-petrol/5">
              <img src={src} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={`Retirer la photo ${index + 1}`}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-petrol-deep/80 text-ivory opacity-90 transition-colors hover:bg-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[0.85rem] text-petrol/55">Aucune photo : la section galerie est masquée sur la page.</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="label-caps inline-flex cursor-pointer items-center gap-2 border border-petrol/25 px-4 py-2.5 text-petrol transition-colors hover:border-gold hover:bg-petrol/5">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Envoi…" : "Ajouter des photos"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
        </label>
        <div className="flex flex-1 gap-2">
          <Input
            value={url}
            placeholder="ou collez une URL d'image"
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addUrl();
              }
            }}
            className={inputClass}
          />
          <button type="button" onClick={addUrl} className="label-caps border border-petrol/25 px-4 text-petrol transition-colors hover:border-gold">
            Ajouter
          </button>
        </div>
      </div>
      {error ? <p className="text-[0.8rem] text-destructive">{error}</p> : null}
    </div>
  );
}

export function ImageField({ label = "Photo", value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      onChange(await uploadImage(file));
    } catch {
      setError("L'envoi de la photo a échoué. Réessayez avec une autre image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="label-caps text-petrol/65">{label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="h-20 w-28 shrink-0 overflow-hidden border border-petrol/20 bg-petrol/5">
          {value ? (
            <img src={value} alt="Aperçu" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex-1 space-y-2">
          <label className="label-caps inline-flex cursor-pointer items-center gap-2 border border-petrol/25 px-4 py-2.5 text-petrol transition-colors hover:border-gold hover:bg-petrol/5">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Envoi…" : "Choisir une photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
          </label>
          <Input
            value={value ?? ""}
            placeholder="ou collez une URL d'image"
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      {error ? <p className="text-[0.8rem] text-destructive">{error}</p> : null}
    </div>
  );
}