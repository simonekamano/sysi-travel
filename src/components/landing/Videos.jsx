import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoCard from "@/components/video/VideoCard";
import VideoDialog from "@/components/video/VideoDialog";
import { VIDEO_CATEGORY_LABEL } from "@/lib/video";

// How many videos the home page shows (one at the top, two beside it); all of them are on /videos.
const HOME_LIMIT = 3;

// The presentation of SYSI TRAVEL and of Guinea in video (admin › Vidéos). The first video plays
// right here; the next ones open over the page. Hidden while there is none.
export default function Videos({ videos = [] }) {
  const [open, setOpen] = useState(null);
  if (videos.length === 0) return null;

  const [featured, ...others] = videos.slice(0, HOME_LIMIT);

  return (
    <section id="videos" className="relative isolate overflow-hidden bg-petrol-deep py-14 text-ivory lg:py-20">
      <div
        aria-hidden="true"
        className="absolute -right-40 -top-40 -z-10 h-[29.71rem] w-[29.71rem] rounded-full bg-[radial-gradient(circle,hsl(var(--gold)/0.16),transparent_65%)]"
      />
      <div className="mx-auto max-w-site px-6">
        <Reveal>
          <SectionHeading
            tone="light"
            eyebrow="En vidéo"
            title="Découvrez SYSI TRAVEL et la Guinée"
            text="Qui nous sommes, comment nous voyageons, et la Guinée qui vous attend : quelques minutes pour vous projeter avant le départ."
          />
        </Reveal>

        <div className={others.length ? "mt-10 grid gap-8 lg:grid-cols-3 lg:gap-10" : "mx-auto mt-10 max-w-4xl"}>
          <Reveal className={others.length ? "lg:col-span-2" : undefined}>
            <VideoPlayer key={featured.id} video={featured} frame="wide" className="w-full shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)]" />
            <div className="mt-5">
              <p className="label-caps text-gold">{VIDEO_CATEGORY_LABEL[featured.category]}</p>
              <h3 className="mt-1.5 font-display text-[1.35rem] font-bold leading-snug text-ivory">{featured.title}</h3>
              {featured.description ? (
                <p className="mt-2 max-w-2xl text-[0.98rem] leading-relaxed text-ivory/70">{featured.description}</p>
              ) : null}
            </div>
          </Reveal>

          {others.length ? (
            <div className="grid content-start gap-8 sm:grid-cols-2 lg:grid-cols-1">
              {others.map((video, index) => (
                <Reveal key={video.id} delay={120 + index * 90}>
                  <VideoCard video={video} tone="dark" compact onPlay={setOpen} />
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>

        <Reveal className="mt-12 flex justify-center">
          <Link
            to="/videos"
            className="label-caps inline-flex items-center gap-2 rounded-full border border-ivory/25 px-7 py-4 text-ivory transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-petrol-deep"
          >
            {videos.length > HOME_LIMIT ? `Voir les ${videos.length} vidéos` : "Toutes les vidéos"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>

      <VideoDialog video={open} onClose={() => setOpen(null)} />
    </section>
  );
}
