import { Link } from "@tanstack/react-router";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

// « Ajouter au panier », then « Dans le panier » (a link to the cart) once the book is in it.
// `size`: "sm" on the cards, "lg" on a book's page. `tone`: "light" or "dark" background.
export default function AddToCartButton({ book, size = "sm", tone = "light", className }) {
  const cart = useCart();
  const inCart = cart.has(book.id);
  const large = size === "lg";

  if (inCart) {
    return (
      <Link
        to="/panier"
        aria-label={large ? undefined : `${book.title} est dans le panier : voir le panier`}
        className={cn(
          "label-caps inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border transition-colors duration-300",
          large ? "px-5 py-3" : "px-3.5 py-2 text-[0.66rem]",
          tone === "dark"
            ? "border-gold/60 text-gold hover:bg-gold hover:text-petrol-deep"
            : "border-[#1a7f4b]/40 text-[#1a7f4b] hover:border-petrol hover:bg-petrol hover:text-ivory",
          className,
        )}
      >
        <Check className="h-4 w-4" /> {large ? "Dans le panier" : "Ajouté"}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => cart.add(book.id)}
      aria-label={large ? undefined : `Ajouter « ${book.title} » au panier`}
      className={cn(
        "label-caps inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full transition-all duration-300 hover:-translate-y-0.5",
        large ? "px-5 py-3" : "px-3.5 py-2 text-[0.66rem]",
        tone === "dark" ? "bg-gold text-petrol-deep hover:bg-ivory" : "bg-petrol text-ivory hover:bg-petrol-deep",
        className,
      )}
    >
      <ShoppingBag className="h-4 w-4" /> {large ? "Ajouter au panier" : "Ajouter"}
    </button>
  );
}
