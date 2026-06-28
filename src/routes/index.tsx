import { createFileRoute } from "@tanstack/react-router";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { UserHeader } from "@/components/UserHeader";
import { UserFooter } from "@/components/UserFooter";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Storefront,
});

function Storefront() {
  const site = useStore((s) => s.site);
  const products = useStore((s) => s.products);
  const currentId = useStore((s) => s.currentCustomerId);
  const current = useStore((s) => s.customers.find((c) => c.id === s.currentCustomerId) ?? null);
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [products, q],
  );

  const requireLogin = () => {
    if (!currentId) {
      toast.error("Please login to continue", { description: "Open the menu (top right) to login or sign up." });
      return false;
    }
    return true;
  };

  const toggleFav = (pid: string) => {
    if (!requireLogin()) return;
    store.set((s) => ({
      ...s,
      customers: s.customers.map((c) =>
        c.id !== s.currentCustomerId
          ? c
          : { ...c, favorites: c.favorites.includes(pid) ? c.favorites.filter((x) => x !== pid) : [...c.favorites, pid] },
      ),
    }));
  };

  const addCart = (pid: string) => {
    if (!requireLogin()) return;
    store.set((s) => ({
      ...s,
      customers: s.customers.map((c) => {
        if (c.id !== s.currentCustomerId) return c;
        const ex = c.cart.find((i) => i.productId === pid && !i.savedForLater);
        return {
          ...c,
          cart: ex
            ? c.cart.map((i) => (i === ex ? { ...i, qty: i.qty + 1 } : i))
            : [...c.cart, { productId: pid, qty: 1 }],
        };
      }),
    }));
    toast.success("Added to cart");
  };

  return (
    <div className="min-h-screen">
      <UserHeader />

      <section>
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">New Season</p>
          <h1 className="font-serif text-5xl leading-tight md:text-7xl">{site.name}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">{site.tagline}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">

        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Our Perfumes</h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-full border border-white/20 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {filtered.map((p) => {
            const fav = current?.favorites.includes(p.id);
            return (
              <article key={p.id} className="group flex flex-col overflow-hidden rounded-lg border border-white/10 bg-white/10 backdrop-blur-md transition hover:shadow-lg">
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-secondary to-muted">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full w-full place-items-center font-serif text-5xl text-muted-foreground/40">
                      {p.name[0]}
                    </div>
                  )}
                  <button
                    onClick={() => toggleFav(p.id)}
                    className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30"
                    aria-label="Favorite"
                  >
                    <Heart className={`h-4 w-4 ${fav ? "fill-destructive text-destructive" : ""}`} />
                  </button>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-serif text-lg leading-tight">{p.name}</h3>
                  {p.description && <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-medium">₹{p.price.toLocaleString("en-IN")}</span>
                    <button
                      onClick={() => addCart(p.id)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
                      aria-label="Add to cart"
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {filtered.length === 0 && <p className="py-20 text-center text-muted-foreground">No perfumes match your search.</p>}
      </section>

      <UserFooter />
    </div>
  );
}
