import { BOOK_KIND_LABEL } from "@/lib/boutique";
import { cn } from "@/lib/utils";

// A book's cover, drawn as a book standing slightly turned (src/index.css, .book-3d). Without a
// cover image, a cover in the house colours with the title. `flat`: facing the reader.
export default function BookCover({ book, flat = false, eager = false, className }) {
  return (
    <div className={cn("book-3d", flat && "book-3d--flat", className)}>
      <div className="book-3d__body aspect-[2/3] w-full overflow-hidden bg-petrol-deep">
        {book.cover ? (
          <img
            src={book.cover}
            alt={`Couverture : ${book.title}`}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={`Couverture : ${book.title}`}
            className="flex h-full w-full flex-col justify-between bg-[radial-gradient(circle_at_70%_15%,hsl(var(--petrol-light)),hsl(var(--petrol-deep))_75%)] p-[9%] pl-[14%] text-ivory"
          >
            <span className="label-caps text-[0.62rem] text-gold">{BOOK_KIND_LABEL[book.kind]}</span>
            <span>
              <span aria-hidden="true" className="mb-3 block h-px w-10 bg-gold" />
              <span className="block font-display text-[clamp(1rem,2.2vw,1.45rem)] font-bold leading-tight">{book.title}</span>
              {book.subtitle ? <span className="mt-2 block text-[0.72rem] leading-snug text-ivory/65">{book.subtitle}</span> : null}
            </span>
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-ivory/55">{book.author || "SYSI TRAVEL"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
