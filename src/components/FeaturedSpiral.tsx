import { useEffect, useRef, useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";
import rosePetals from "@/assets/rose-petals.png";
import saffron from "@/assets/saffron.png";
import oud from "@/assets/oud.png";
import { toast } from "sonner";

export function FeaturedSpiral() {
  const products = useStore((s) => s.products);
  const current = useStore((s) => s.customers.find((c) => c.id === s.currentCustomerId) ?? null);
  const currentId = useStore((s) => s.currentCustomerId);
  const featured = products.slice(0, 8);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const requireLogin = () => {
    if (!currentId) {
      toast.error("Please login to continue");
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

  const count = featured.length;
  const radius = 280;
  const verticalSpan = 360; // px from top to bottom of spiral
  const baseRotate = progress * 540; // total degrees of rotation across scroll
  const bob = Math.sin(progress * Math.PI * 2) * 20;

  const ingredients = ["Rose Petals", "Saffron", "Oud", "Jasmine", "Amber"];

  return (
    <section ref={wrapRef} className="relative" style={{ height: "260vh" }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-background via-[oklch(0.16_0.02_50)] to-background">
        {/* ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.7_0.15_30/0.18),transparent_70%)] blur-2xl" />
        </div>

        <div className="absolute left-6 top-8 z-10 max-w-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Featured</p>
          <h2 className="mt-2 font-serif text-4xl md:text-5xl">The Essence Collection</h2>
          <p className="mt-3 text-sm text-muted-foreground">Scroll to drift through our signature blends — built around rose petals, saffron, and oud.</p>
        </div>

        <div
          className="relative h-full w-full"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
        >
          {/* central ingredient column */}
          <div
            className="absolute left-1/2 top-1/2 flex flex-col items-center gap-4"
            style={{
              transform: `translate(-50%, -50%) translateY(${bob}px) rotateY(${-baseRotate * 0.3}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {ingredients.map((ing, i) => (
              <div
                key={ing}
                className="rounded-full border border-[oklch(0.7_0.12_30/0.4)] bg-[oklch(0.2_0.02_40/0.6)] px-5 py-2 font-serif text-lg tracking-wide text-[oklch(0.88_0.08_30)] shadow-[0_0_30px_oklch(0.7_0.15_30/0.35)] backdrop-blur"
                style={{ transform: `translateZ(0px) rotateX(${Math.sin((progress * 2 + i) * Math.PI) * 8}deg)` }}
              >
                {ing}
              </div>
            ))}
            {/* glowing vertical stem */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[oklch(0.8_0.15_30/0.6)] to-transparent" />
          </div>

          {/* spiral of product cards */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transformStyle: "preserve-3d",
              transform: `translate(-50%, -50%) translateY(${-bob}px)`,
            }}
          >
            {featured.map((p, i) => {
              const t = i / Math.max(1, count - 1); // 0..1
              const angle = baseRotate + t * 360 + i * (360 / count);
              const y = (t - 0.5) * verticalSpan;
              const fav = current?.favorites.includes(p.id);
              return (
                <div
                  key={p.id}
                  className="absolute left-0 top-0"
                  style={{
                    transform: `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px) translateY(${y}px) rotateY(${-angle}deg)`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <article className="group relative w-44 overflow-hidden rounded-xl border border-[oklch(0.7_0.12_30/0.45)] bg-card/80 backdrop-blur transition before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:shadow-[0_0_25px_oklch(0.75_0.18_30/0.55),inset_0_0_20px_oklch(0.7_0.15_30/0.25)] before:content-['']">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-secondary to-muted">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center font-serif text-4xl text-muted-foreground/40">
                          {p.name[0]}
                        </div>
                      )}
                      <button
                        onClick={() => toggleFav(p.id)}
                        className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-background/80 backdrop-blur"
                        aria-label="Favorite"
                      >
                        <Heart className={`h-3.5 w-3.5 ${fav ? "fill-destructive text-destructive" : ""}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-serif text-sm leading-tight">{p.name}</h3>
                        <p className="text-xs text-muted-foreground">₹{p.price.toLocaleString("en-IN")}</p>
                      </div>
                      <button
                        onClick={() => addCart(p.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                        aria-label="Add to cart"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Scroll ↓
        </div>
      </div>
    </section>
  );
}
