import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { store, useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

export function requireLogin() {
  if (!store.get().currentCustomerId) {
    toast.error("Please login to continue", { description: "Open the menu (top right) to login or sign up." });
    return false;
  }
  return true;
}

export function toggleFav(pid: string) {
  if (!requireLogin()) return;
  store.set((s) => ({
    ...s,
    customers: s.customers.map((c) =>
      c.id !== s.currentCustomerId
        ? c
        : { ...c, favorites: c.favorites.includes(pid) ? c.favorites.filter((x) => x !== pid) : [...c.favorites, pid] },
    ),
  }));
}

export function addCart(pid: string) {
  if (!requireLogin()) return;
  store.set((s) => ({
    ...s,
    customers: s.customers.map((c) => {
      if (c.id !== s.currentCustomerId) return c;
      const ex = c.cart.find((i) => i.productId === pid && !i.savedForLater);
      return {
        ...c,
        cart: ex ? c.cart.map((i) => (i === ex ? { ...i, qty: i.qty + 1 } : i)) : [...c.cart, { productId: pid, qty: 1 }],
      };
    }),
  }));
  toast.success("Added to cart");
}

export function ProductCard({ product }: { product: Product }) {
  const fav = useStore((s) => s.customers.find((c) => c.id === s.currentCustomerId)?.favorites.includes(product.id) ?? false);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-theme-gradient-reverse shadow-sm transition hover:shadow-lg">
      <Link to="/product/$id" params={{ id: product.id }} className="relative block aspect-[3/4] overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center font-serif text-5xl text-on-gradient-muted">
            {product.name[0]}
          </div>
        )}
      </Link>
      <button
        onClick={() => toggleFav(product.id)}
        className="absolute-none relative -mt-[calc(100%*4/3)] ml-auto mr-2 mt-2 grid h-9 w-9 place-items-center self-end rounded-full bg-white/30 backdrop-blur-md hover:bg-white/45"
        aria-label="Favorite"
        style={{ marginTop: "-3rem" }}
      >
        <Heart className={`h-4 w-4 text-on-gradient ${fav ? "fill-current" : ""}`} />
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to="/product/$id" params={{ id: product.id }} className="font-serif text-lg leading-tight text-on-gradient hover:underline">
          {product.name}
        </Link>
        {product.description && <p className="line-clamp-2 text-xs text-on-gradient-muted">{product.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-medium text-on-gradient">₹{product.price.toLocaleString("en-IN")}</span>
          <button
            onClick={() => addCart(product.id)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-primary hover:bg-white"
            aria-label="Add to cart"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
