import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
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

export function ImageField({ label = "Photo", value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange(file_url);
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