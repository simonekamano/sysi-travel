import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { embedSrc, parseVideo, videoPoster } from "@/lib/video";
import { cn } from "@/lib/utils";

const IFRAME_ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share";

// The image before play. For YouTube without a chosen image, the large version when the video has
// one (YouTube answers a 120 px grey image otherwise), else the standard one.
function Poster({ video, parsed, className }) {
  const fallback = videoPoster(video, parsed);
  const hd = !video.poster && parsed?.provider === "youtube" ? `https://i.ytimg.com/vi/${parsed.id}/maxresdefault.jpg` : "";
  const [src, setSrc] = useState(hd || fallback);

  if (!src) {
    return (
      <span
        aria-hidden="true"
        className={cn("block bg-[radial-gradient(circle_at_30%_20%,hsl(var(--petrol-light)),hsl(var(--petrol-deep))_70%)]", className)}
      />
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onLoad={(event) => {
        if (src === hd && event.currentTarget.naturalWidth <= 120) setSrc(fallback);
      }}
      onError={() => setSrc(src === hd ? fallback : "")}
      className={cn("object-cover", className)}
    />
  );
}

// The site's video player: the image with a play button, then the video itself (YouTube, Vimeo or
// a file) once the visitor presses play. Nothing is loaded from YouTube or Vimeo before that.
// `frame`: "auto" follows the video (upright or wide); "wide" keeps a 16:9 frame and centres an
// upright video in it.
export default function VideoPlayer({ video, autoPlay = false, frame = "auto", className }) {
  const parsed = useMemo(() => parseVideo(video.url), [video.url]);
  const [playing, setPlaying] = useState(autoPlay);
  if (!parsed) return null;

  const upright = Boolean(video.vertical);
  const boxed = upright && frame === "wide";

  const media =
    parsed.provider === "file" ? (
      <video
        src={parsed.src}
        poster={videoPoster(video, parsed) || undefined}
        controls
        autoPlay
        playsInline
        className="h-full w-full bg-black"
      />
    ) : (
      <iframe
        src={embedSrc(parsed)}
        title={video.title}
        allow={IFRAME_ALLOW}
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full border-0"
      />
    );

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-petrol-deep",
        upright && !boxed ? "aspect-[9/16]" : "aspect-video",
        className,
      )}
    >
      {playing ? (
        boxed ? (
          <>
            <Poster video={video} parsed={parsed} className="absolute inset-0 h-full w-full scale-110 opacity-40 blur-xl" />
            <div className="relative mx-auto aspect-[9/16] h-full">{media}</div>
          </>
        ) : (
          <div className="absolute inset-0">{media}</div>
        )
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Lire la vidéo « ${video.title} »`}
          className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none"
        >
          <Poster
            video={video}
            parsed={parsed}
            className="absolute inset-0 h-full w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-petrol-deep/70 via-petrol-deep/10 to-transparent" />
          <span className="video-play relative flex h-[4.11rem] w-[4.11rem] items-center justify-center rounded-full bg-gold text-petrol-deep shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-110 group-focus-visible:ring-4 group-focus-visible:ring-ivory/70">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </span>
          {video.duration ? (
            <span className="label-caps absolute bottom-4 right-4 rounded-full bg-petrol-deep/75 px-3 py-1.5 text-ivory backdrop-blur-sm">
              {video.duration}
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}
