import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { store, useProductImage, useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RatingLine } from "@/lib/ratings";

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

export function ProductCard({ product, variants = [product] }: { product: Product; variants?: Product[] }) {
  const img = useProductImage(product);
  const fav = useStore(
    (s) => s.customers.find((c) => c.id === s.currentCustomerId)?.favorites.includes(product.id) ?? false,
  );

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition hover:shadow-lg">
      {/* 4 (height) : 3 (width) */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <Link to="/product/$id" params={{ id: product.id }} className="block h-full w-full">
          {img ? (
            <img src={img} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
          ) : (
            <div className="grid h-full w-full place-items-center font-serif text-5xl text-muted-foreground">
              {product.name[0]}
            </div>
          )}
        </Link>
        <Button size="icon" variant="ghost"
          onClick={() => toggleFav(product.id)}
          className="absolute right-2 top-2 rounded-full bg-background/30 backdrop-blur-md hover:bg-background/45"
          aria-label="Favorite"
        >
          <Heart className={`h-4 w-4 text-foreground ${fav ? "fill-current" : ""}`} />
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="font-serif text-lg leading-tight text-foreground hover:underline"
        >
          {product.baseName ?? product.name}
        </Link>
        {product.parentId && <p className="text-xs text-muted-foreground">{variants.map(v => v.variantLabel).join(" · ")}</p>}
        <RatingLine ids={variants.map(v => v.id)} className="text-foreground" />
        {product.description && <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-medium text-foreground">{product.parentId ? "From " : ""}₹{Math.min(...variants.map(v => v.price)).toLocaleString("en-IN")}</span>
          {product.parentId ? <Button asChild size="sm"><Link to="/product/$id" params={{ id: product.id }}>Sizes</Link></Button> : <Button size="icon" onClick={() => addCart(product.id)} className="rounded-full" aria-label="Add to cart"><ShoppingBag className="h-4 w-4" /></Button>}
        </div>
      </div>
    </article>
  );
}
