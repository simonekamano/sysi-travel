import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import Reveal from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

// Photo grid; a click opens the photo full size, with arrows (and ← → keys) to browse.
export default function Gallery({ images = [], name }) {
  const [index, setIndex] = useState(null);
  const open = index !== null;
  const count = images.length;
  const step = (delta) => setIndex((current) => (current + delta + count) % count);

  useEffect(() => {
    if (!open || count < 2) return;
    const onKey = (event) => {
      if (event.key === "ArrowRight") setIndex((current) => (current + 1) % count);
      if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + count) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count]);

  if (!images.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {images.map((src, i) => (
          <Reveal key={src} delay={(i % 3) * 80} className={cn(i === 0 && images.length > 2 && "col-span-2 row-span-2")}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block aspect-square w-full overflow-hidden bg-petrol/10"
              aria-label={`Agrandir la photo ${i + 1} de ${name}`}
            >
              <img
                src={src}
                alt={`${name}, photo ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-petrol-deep/0 transition-colors duration-500 group-hover:bg-petrol-deep/20" />
            </button>
          </Reveal>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(next) => !next && setIndex(null)}>
        <DialogContent className="max-w-5xl rounded-none border-0 bg-petrol-deep p-0 text-ivory sm:rounded-none">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <DialogDescription className="sr-only">
            Photo {open ? index + 1 : 0} sur {images.length}
          </DialogDescription>
          {open ? (
            <div className="relative">
              <img src={images[index]} alt={`${name}, photo ${index + 1}`} className="max-h-[80vh] w-full object-contain" />
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Photo précédente"
                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-petrol-deep/70 text-ivory transition-colors hover:bg-gold hover:text-petrol-deep"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Photo suivante"
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-petrol-deep/70 text-ivory transition-colors hover:bg-gold hover:text-petrol-deep"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <p className="label-caps absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-petrol-deep/70 px-3 py-1.5 text-ivory/80">
                    {index + 1} / {images.length}
                  </p>
                </>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
