import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, EyeOff, Pencil, Play, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteVideo, reorderVideos } from "@/lib/server-fns";
import VideoForm from "@/components/admin/VideoForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { VIDEO_CATEGORY_LABEL, videoPoster } from "@/lib/video";

export default function VideosPanel({ videos = [] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  // The first visible video leads the home page.
  const featuredId = videos.find((video) => video.published)?.id;
  const nextSortOrder = videos.reduce((max, video) => Math.max(max, video.sort_order ?? 0), 0) + 1;

  const saved = () => {
    setEditing(null);
    router.invalidate();
  };

  const move = async (index, step) => {
    const order = [...videos];
    const [item] = order.splice(index, 1);
    order.splice(index + step, 0, item);
    setBusy(true);
    try {
      await reorderVideos({ data: order.map((video, position) => ({ id: video.id, sort_order: position + 1 })) });
      router.invalidate();
    } catch {
      toast.error("Impossible de changer l'ordre. Vérifiez que vous êtes connecté en administrateur.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteVideo({ data: { id: pending.id } });
      setPending(null);
      router.invalidate();
    } catch {
      toast.error("Suppression impossible. Vérifiez que vous êtes connecté en administrateur.");
    } finally {
      setBusy(false);
    }
  };

  const iconButton =
    "inline-flex h-9 w-9 items-center justify-center border border-petrol/20 text-petrol/65 transition-colors hover:border-gold hover:text-petrol disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="space-y-8">
      {editing === null ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-2.5 text-ivory transition-colors hover:bg-petrol-deep"
        >
          <Plus className="h-4 w-4" /> Ajouter une vidéo
        </button>
      ) : (
        <VideoForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          sortOrder={nextSortOrder}
          onCancel={() => setEditing(null)}
          onSaved={saved}
        />
      )}

      <ul className="divide-y divide-petrol/10 border border-petrol/15 bg-white">
        {videos.map((video, index) => {
          const poster = videoPoster(video);
          return (
            <li key={video.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden bg-petrol-deep">
                {poster ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" /> : null}
                <Play className="relative h-5 w-5 fill-gold text-gold" />
              </div>
              <div className="flex-1">
                <p className="label-caps flex flex-wrap items-center gap-2 text-gold-deep">
                  {VIDEO_CATEGORY_LABEL[video.category]}
                  {video.duration ? <span className="text-petrol/45">· {video.duration}</span> : null}
                  {video.id === featuredId ? (
                    <span className="inline-flex items-center gap-1 text-petrol">
                      <Star className="h-3 w-3 fill-gold text-gold" /> à la une sur l'accueil
                    </span>
                  ) : null}
                  {video.published ? null : (
                    <span className="inline-flex items-center gap-1 text-petrol/45">
                      <EyeOff className="h-3 w-3" /> masquée
                    </span>
                  )}
                </p>
                <h3 className="text-[1rem] font-semibold text-petrol">{video.title}</h3>
                <p className="truncate text-[0.85rem] text-petrol/55">{video.url}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => move(index, -1)} disabled={busy || index === 0} className={iconButton} aria-label={`Monter « ${video.title} »`}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={busy || index === videos.length - 1}
                  className={iconButton}
                  aria-label={`Descendre « ${video.title} »`}
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(video)}
                  className="label-caps inline-flex items-center gap-2 border border-petrol/20 px-3 py-2 text-petrol/75 transition-colors hover:border-gold hover:text-petrol"
                >
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
                <button
                  type="button"
                  onClick={() => setPending(video)}
                  className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-petrol/50 transition-colors hover:text-destructive"
                  aria-label={`Supprimer ${video.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
        {videos.length === 0 ? (
          <li className="p-6 text-[0.9rem] text-petrol/55">
            Aucune vidéo pour l'instant : la section vidéo de l'accueil reste masquée.
          </li>
        ) : null}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Supprimer cette vidéo ?"
        description={pending ? `« ${pending.title} » disparaîtra du site. La vidéo reste sur YouTube ou Vimeo.` : ""}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}
