import { Play } from "lucide-react";
import { VIDEO_CATEGORY_LABEL, videoPoster } from "@/lib/video";
import { cn } from "@/lib/utils";

// A video in a list: its image, theme and title. A click opens it in the player (VideoDialog).
// `tone`: "light" on a light background, "dark" on the pétrole sections.
export default function VideoCard({ video, onPlay, tone = "light", compact = false }) {
  const poster = videoPoster(video);
  const dark = tone === "dark";

  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      aria-label={`Lire la vidéo « ${video.title} »`}
      className={cn(
        "group flex h-full w-full flex-col text-left transition-colors duration-300 focus-visible:outline-none",
        compact ? "gap-3" : "gap-4",
      )}
    >
      <span
        className={cn(
          "relative block aspect-video w-full shrink-0 overflow-hidden bg-petrol-deep ring-gold ring-offset-2 group-focus-visible:ring-2",
          dark ? "ring-offset-petrol-deep" : "ring-offset-background",
        )}
      >
        {poster ? (
          <img
            src={poster}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] motion-reduce:transition-none"
          />
        ) : (
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--petrol-light)),hsl(var(--petrol-deep))_70%)]" />
        )}
        <span aria-hidden="true" className="absolute inset-0 bg-petrol-deep/20 transition-colors duration-300 group-hover:bg-petrol-deep/5" />
        <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold/95 text-petrol-deep shadow-lg transition-transform duration-300 group-hover:scale-110">
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </span>
        {video.duration ? (
          <span className="label-caps absolute bottom-2.5 right-2.5 rounded-full bg-petrol-deep/80 px-2.5 py-1 text-[0.68rem] text-ivory">
            {video.duration}
          </span>
        ) : null}
      </span>
      <span className="block">
        <span className={cn("label-caps block", dark ? "text-gold" : "text-gold-deep")}>
          {VIDEO_CATEGORY_LABEL[video.category]}
        </span>
        <span
          className={cn(
            "mt-1.5 block font-display font-bold leading-snug transition-colors duration-300",
            compact ? "text-[1.02rem]" : "text-[1.15rem]",
            dark ? "text-ivory group-hover:text-gold" : "text-petrol group-hover:text-gold-deep",
          )}
        >
          {video.title}
        </span>
        {video.description && !compact ? (
          <span className={cn("mt-2 line-clamp-2 block text-[0.92rem] leading-relaxed", dark ? "text-ivory/65" : "text-petrol/65")}>
            {video.description}
          </span>
        ) : null}
      </span>
    </button>
  );
}
