import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserHeader } from "@/components/UserHeader";
import { UserFooter } from "@/components/UserFooter";
import { addCart, toggleFav } from "@/components/ProductCard";
import { useProductImage, useStore } from "@/lib/store";
import { ProductReviews, RatingLine } from "@/lib/ratings";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  head: () => ({
    meta: [
      { title: "Perfume details — SULTAN AL MISK" },
      { name: "description", content: "Notes, price and availability for this hand-blended SULTAN AL MISK perfume." },
      { property: "og:title", content: "Perfume details — SULTAN AL MISK" },
      { property: "og:description", content: "Notes, price and availability for this hand-blended SULTAN AL MISK perfume." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProductPage() {
  const { id } = Route.useParams();
  const products = useStore(s => s.products);
  const initial = products.find(p => p.id === id);
  const [selection, setSelection] = useState<{ routeId: string; sku: string } | null>(null);
  const variants = initial ? products.filter(p => initial.parentId ? p.parentId === initial.parentId : p.id === initial.id) : [];
  const product = variants.find(p => p.id === (selection?.routeId === id ? selection.sku : id)) ?? initial;
  const fav = useStore((s) => s.customers.find((c) => c.id === s.currentCustomerId)?.favorites.includes(product?.id ?? id) ?? false);
  const img = useProductImage(product);
  const share = async () => {
    if (!product) return;
    const url = new URL(`/product/${encodeURIComponent(product.id)}`, window.location.origin).href;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }); return; }
      catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(url); toast.success("Product link copied"); return; } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (ok) { toast.success("Product link copied"); return; }
    } catch {}
    window.prompt("Copy this product link:", url);
  };

  return (
    <div className="relative min-h-screen">
      <UserHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        {!product ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">This perfume is no longer available.</p>
            <Link to="/products" search={{ q: "" }} className="mt-4 inline-block text-primary hover:underline">
              Back to shop
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-theme-gradient-reverse">
              <div className="aspect-[3/4] w-full">
                {img ? (
                  <img src={img} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center font-serif text-7xl text-on-gradient-muted">
                    {product.name[0]}
                  </div>
                )}
              </div>
            </div>
            <div>
              {product.category && (
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{product.category}</p>
              )}
              <h1 className="mt-2 font-serif text-4xl">{product.baseName ?? product.name}</h1>
              {product.parentId && <fieldset className="mt-6"><legend className="mb-2 text-sm font-medium">Size</legend><div className="flex flex-wrap gap-2">{variants.map(v => <Button key={v.id} variant={v.id === product.id ? "default" : "outline"} aria-pressed={v.id === product.id} onClick={() => setSelection({ routeId: id, sku: v.id })}>{v.variantLabel}</Button>)}</div></fieldset>}
              <RatingLine ids={[product.id]} className="mt-2 text-sm" />
              <p className="mt-3 text-2xl font-medium">₹{product.price.toLocaleString("en-IN")}</p>
              {product.description && <p className="mt-4 text-muted-foreground">{product.description}</p>}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  onClick={() => addCart(product.id)}
                  className="rounded-full"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to cart
                </Button>
                <Button variant="outline"
                  onClick={() => toggleFav(product.id)}
                  className="rounded-full"
                >
                  <Heart className={`h-4 w-4 ${fav ? "fill-destructive text-destructive" : ""}`} />
                  {fav ? "In favorites" : "Add to favorites"}
                </Button>
                <Button variant="outline" className="rounded-full" onClick={share}><Share2 />Share</Button>
              </div>
              <Link to="/products" search={{ q: "" }} className="mt-6 inline-block text-sm text-primary hover:underline">
                ← Back to all perfumes
              </Link>
              <ProductReviews productId={product.id} />
            </div>
          </div>
        )}
      </main>
      <UserFooter />
    </div>
  );
}
