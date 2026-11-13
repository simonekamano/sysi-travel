import { useState } from "react";
import { breadcrumbLd, seo } from "@/lib/seo";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import BackButton from "@/components/BackButton";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import VideoCard from "@/components/video/VideoCard";
import VideoDialog from "@/components/video/VideoDialog";
import { getSiteContent } from "@/lib/server-fns";
import { VIDEO_CATEGORIES } from "@/lib/video";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/videos")({
  loader: () => getSiteContent(),
  head: () =>
    seo({
      title: "La Guinée en vidéo — SYSI TRAVEL",
      description:
        "Les vidéos de SYSI TRAVEL : qui nous sommes, nos voyages accompagnés et la Guinée, de la côte atlantique à la forêt.",
      path: "/videos",
      scripts: [breadcrumbLd([["Accueil", "/"], ["Vidéos", "/videos"]])],
    }),
  component: VideosPage,
});

function VideosPage() {
  const { videos, destinations, formules, reseaux } = Route.useLoaderData();
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState(null);
  const [formule, setFormule] = useState("");
  // Filters only for the themes that have at least one video, and only when there are several.
  const categories = VIDEO_CATEGORIES.filter((item) => videos.some((video) => video.category === item.key));
  const visible = category ? videos.filter((video) => video.category === category) : videos;

  return (
    <div className="min-h-screen bg-background">
      <Nav home={false} solid />

      <main>
        <section className="bg-background pb-14 pt-36 lg:pb-20 lg:pt-40">
          <div className="mx-auto max-w-site px-6">
            <BackButton label="Retour" className="mb-8" />
            <p className="eyebrow text-gold-deep">En vidéo</p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-petrol">
              SYSI TRAVEL et la Guinée en vidéo
            </h1>
            <p className="mt-6 max-w-2xl text-[1rem] leading-relaxed text-petrol/70">
              Qui nous sommes, comment se passe un voyage avec nous, et la Guinée qui vous attend, de
              la côte atlantique aux montagnes du Fouta et à la forêt.
            </p>

            {categories.length > 1 ? (
              <div role="group" aria-label="Filtrer par thème" className="mt-10 flex flex-wrap gap-2">
                {[{ key: "", label: "Toutes" }, ...categories].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    aria-pressed={category === item.key}
                    onClick={() => setCategory(item.key)}
                    className={cn(
                      "label-caps rounded-full border px-5 py-2.5 transition-colors duration-300",
                      category === item.key
                        ? "border-petrol bg-petrol text-ivory"
                        : "border-petrol/20 text-petrol/70 hover:border-gold hover:text-petrol",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            {visible.length ? (
              <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((video, index) => (
                  <Reveal key={video.id} delay={(index % 3) * 90} className="h-full">
                    <VideoCard video={video} onPlay={setOpen} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="mt-10 max-w-2xl border border-petrol/15 bg-white p-8">
                <p className="label-caps text-gold-deep">Bientôt en ligne</p>
                <p className="mt-3 text-[1rem] leading-relaxed text-petrol/75">
                  Nos vidéos sont en préparation. En attendant, partez à la découverte des sites de
                  Guinée sur notre carte interactive.
                </p>
                <Link
                  to="/explorer"
                  className="label-caps mt-6 inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-2.5 text-ivory transition-colors hover:bg-petrol-deep"
                >
                  <Compass className="h-4 w-4" /> Explorer la Guinée
                </Link>
              </div>
            )}
          </div>
        </section>

        <ContactForm formule={formule} setFormule={setFormule} destinations={destinations} formules={formules} />
      </main>

      <Footer destinations={destinations} reseaux={reseaux} />
      <WhatsAppButton />
      <VideoDialog video={open} onClose={() => setOpen(null)} />
    </div>
  );
}
