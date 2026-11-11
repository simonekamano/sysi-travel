import { Link } from "@tanstack/react-router";
import { ARTICLE_CATEGORY_LABEL, articleImages, formatPrice, thumbOf, variantsOf } from "@/lib/boutique";
import { cn } from "@/lib/utils";

// An article in a list: its photo (a second view on hover), section, name, colours and price.
export default function ArticleCard({ article, className }) {
  const images = articleImages(article);
  const variants = variantsOf(article).filter((variant) => variant.available !== false);
  const [first, second] = images;

  return (
    <Link
      to="/boutique/article/$slug"
      params={{ slug: article.slug }}
      className={cn("group flex h-full flex-col focus-visible:outline-none", className)}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-soft ring-1 ring-petrol/10 transition-shadow duration-500 group-hover:shadow-[0_24px_50px_-28px_rgba(18,61,67,0.55)] group-focus-visible:ring-2 group-focus-visible:ring-gold">
        {first ? (
          <img
            src={thumbOf(first)}
            alt={article.name}
            loading="lazy"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]",
              second ? "group-hover:opacity-0" : "",
            )}
          />
        ) : null}
        {second ? (
          <img
            src={thumbOf(second)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
        ) : null}
        {variants.length > 1 ? (
          <span className="label-caps absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[0.62rem] text-petrol backdrop-blur-sm">
            {variants.length} coloris
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <p className="label-caps text-[0.66rem] text-gold-deep">{ARTICLE_CATEGORY_LABEL[article.category]}</p>
        <h3 className="mt-1 font-display text-[1.05rem] font-bold leading-snug text-petrol transition-colors duration-300 group-hover:text-gold-deep">
          {article.name}
        </h3>
        <p className="mt-auto pt-2 font-display text-[1.05rem] font-bold text-petrol">{formatPrice(article.price_cents)}</p>
      </div>
    </Link>
  );
}
