import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

// The cart in the navbar, shown once something is in it. The badge bounces at each addition.
export default function CartButton() {
  const { count } = useCart();
  if (count === 0) return null;

  return (
    <Link
      to="/panier"
      aria-label={`Panier : ${count} article${count > 1 ? "s" : ""}`}
      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:text-gold"
    >
      <ShoppingBag className="h-5 w-5" />
      <span
        key={count}
        className="cart-pop absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold px-1 text-[0.7rem] font-bold text-petrol-deep"
      >
        {count}
      </span>
    </Link>
  );
}
