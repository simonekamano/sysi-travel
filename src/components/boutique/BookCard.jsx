import { Link } from "@tanstack/react-router";
import BookCover from "@/components/boutique/BookCover";
import AddToCartButton from "@/components/boutique/AddToCartButton";
import { BOOK_KIND_LABEL, formatPrice } from "@/lib/boutique";
import { cn } from "@/lib/utils";

// A book in a list: the cover (it turns towards the reader on hover), title, price and the
// cart button. `tone`: "light" or "dark" background.
export default function BookCard({ book, tone = "light" }) {
  const dark = tone === "dark";

  return (
    <article className="book-hover flex h-full flex-col">
      <Link to="/boutique/$slug" params={{ slug: book.slug }} className="group block focus-visible:outline-none">
        <BookCover book={book} className="mx-auto w-[78%] pt-2" />
        <div className="mt-7">
          <p className={cn("label-caps", dark ? "text-gold" : "text-gold-deep")}>{BOOK_KIND_LABEL[book.kind]}</p>
          <h3
            className={cn(
              "mt-1.5 font-display text-[1.15rem] font-bold leading-snug transition-colors duration-300",
              dark ? "text-ivory group-hover:text-gold" : "text-petrol group-hover:text-gold-deep",
            )}
          >
            {book.title}
          </h3>
          {book.author ? <p className={cn("mt-1 text-[0.9rem]", dark ? "text-ivory/60" : "text-petrol/60")}>{book.author}</p> : null}
        </div>
      </Link>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-5">
        <span className={cn("font-display text-[1.25rem] font-bold", dark ? "text-ivory" : "text-petrol")}>{formatPrice(book.price_cents)}</span>
        <AddToCartButton book={book} tone={tone} />
      </div>
    </article>
  );
}
