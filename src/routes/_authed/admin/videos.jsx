import { createFileRoute } from "@tanstack/react-router";
import { listAllVideos } from "@/lib/server-fns";
import VideosPanel from "@/components/admin/VideosPanel";

export const Route = createFileRoute("/_authed/admin/videos")({
  loader: () => listAllVideos(),
  head: () => ({ meta: [{ title: "Vidéos — Administration SYSI TRAVEL" }] }),
  component: AdminVideosPage,
});

function AdminVideosPage() {
  const videos = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Présentation en vidéo</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          Vidéos
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Les vidéos de présentation de SYSI TRAVEL et de la Guinée, affichées sur l'accueil et sur la
          page Vidéos. La première vidéo visible de la liste est mise à la une de l'accueil : changez
          l'ordre avec les flèches.
        </p>
      </div>
      <VideosPanel videos={videos} />
    </div>
  );
}
