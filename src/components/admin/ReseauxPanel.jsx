import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { saveReseauxSociaux } from "@/lib/server-fns";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/admin/fields";
import { SocialIcon, socialLabel } from "@/components/SocialLinks";

const PLACEHOLDERS = {
  facebook: "https://www.facebook.com/sysitravel",
  instagram: "https://www.instagram.com/sysitravel",
  tiktok: "https://www.tiktok.com/@sysitravel",
  youtube: "https://www.youtube.com/@sysitravel",
  x: "https://x.com/sysitravel",
};

// "facebook.com/page" or "http://…" typed by hand becomes "https://…".
const normalize = (value) => {
  const url = value.trim();
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url.replace(/^http:\/\//i, "https://") : `https://${url}`;
};

export default function ReseauxPanel({ reseaux = [] }) {
  const router = useRouter();
  const [urls, setUrls] = useState(() => Object.fromEntries(reseaux.map((item) => [item.reseau, item.url])));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    const data = reseaux.map((item) => ({ reseau: item.reseau, url: normalize(urls[item.reseau] ?? "") }));
    const invalid = data.find((item) => item.url && !/^https:\/\/[^\s/]+\.[^\s]+$/.test(item.url));
    if (invalid) {
      setMessage({ error: true, text: `L'adresse ${socialLabel(invalid.reseau)} n'est pas valide.` });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveReseauxSociaux({ data });
      setUrls(Object.fromEntries(data.map((item) => [item.reseau, item.url])));
      setMessage({ error: false, text: "Réseaux sociaux enregistrés. Ils sont visibles sur le site." });
      router.invalidate();
    } catch {
      setMessage({ error: true, text: "Enregistrement impossible. Vérifiez que vous êtes connecté en administrateur." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 border border-petrol/15 bg-white p-6">
      {reseaux.map((item) => (
        <div key={item.reseau} className="flex items-end gap-4">
          <span className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-petrol text-ivory">
            <SocialIcon reseau={item.reseau} />
          </span>
          <TextField
            label={socialLabel(item.reseau)}
            value={urls[item.reseau]}
            onChange={(value) => setUrls((prev) => ({ ...prev, [item.reseau]: value }))}
            placeholder={PLACEHOLDERS[item.reseau]}
            className="flex-1"
          />
        </div>
      ))}

      {message ? (
        <p className={message.error ? "text-[0.85rem] text-destructive" : "text-[0.85rem] text-petrol/70"}>
          {message.text}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={saving}
        className="label-caps gap-2 rounded-full bg-petrol px-5 text-ivory hover:bg-petrol-deep"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Enregistrer
      </Button>
    </form>
  );
}
