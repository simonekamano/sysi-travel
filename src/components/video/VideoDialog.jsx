import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import VideoPlayer from "@/components/video/VideoPlayer";
import { VIDEO_CATEGORY_LABEL } from "@/lib/video";
import { cn } from "@/lib/utils";

// The video chosen in a list, played full width over the page. Closing it stops the video.
export default function VideoDialog({ video, onClose }) {
  return (
    <DialogPrimitive.Root open={Boolean(video)} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-petrol-deep/90 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        {video ? (
          <DialogPrimitive.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 duration-300 focus:outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
              // An upright video is as tall as the screen allows; a wide one as wide.
              video.vertical ? "max-w-[min(24rem,calc((100svh-12rem)*9/16))]" : "max-w-[min(61.71rem,calc((100svh-12rem)*16/9))]",
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="label-caps text-gold">{VIDEO_CATEGORY_LABEL[video.category]}</p>
                <DialogPrimitive.Title className="mt-1 truncate font-display text-[1.15rem] font-bold text-ivory sm:text-[1.35rem]">
                  {video.title}
                </DialogPrimitive.Title>
              </div>
              <DialogPrimitive.Close
                aria-label="Fermer la vidéo"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
            <VideoPlayer key={video.id} video={video} autoPlay className="w-full shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]" />
            {video.description ? (
              <DialogPrimitive.Description className="mt-4 line-clamp-3 text-[0.95rem] leading-relaxed text-ivory/75">
                {video.description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">Lecture de la vidéo {video.title}</DialogPrimitive.Description>
            )}
          </DialogPrimitive.Content>
        ) : null}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
