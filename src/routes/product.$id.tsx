import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { UserHeader } from "@/components/UserHeader";
import { UserFooter } from "@/components/UserFooter";
import { addCart, toggleFav } from "@/components/ProductCard";
import { useStore } from "@/lib/store";

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
  const product = useStore((s) => s.products.find((p) => p.id === id) ?? null);
  const fav = useStore((s) => s.customers.find((c) => c.id === s.currentCustomerId)?.favorites.includes(id) ?? false);
  const commonImg = useStore((s) => s.commonProductImage);

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
                {(product.image ?? commonImg) ? (
                  <img src={product.image ?? commonImg} alt={product.name} className="h-full w-full object-cover" />
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
              <h1 className="mt-2 font-serif text-4xl">{product.name}</h1>
              <p className="mt-3 text-2xl font-medium">₹{product.price.toLocaleString("en-IN")}</p>
              {product.description && <p className="mt-4 text-muted-foreground">{product.description}</p>}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => addCart(product.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to cart
                </button>
                <button
                  onClick={() => toggleFav(product.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium backdrop-blur-md"
                >
                  <Heart className={`h-4 w-4 ${fav ? "fill-destructive text-destructive" : ""}`} />
                  {fav ? "In favorites" : "Add to favorites"}
                </button>
              </div>
              <Link to="/products" search={{ q: "" }} className="mt-6 inline-block text-sm text-primary hover:underline">
                ← Back to all perfumes
              </Link>
            </div>
          </div>
        )}
      </main>
      <UserFooter />
    </div>
  );
}
