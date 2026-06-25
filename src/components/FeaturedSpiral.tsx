import { useEffect, useRef, useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";
import rosePetals from "@/assets/rose-petals.png";
import saffron from "@/assets/saffron.png";
import oud from "@/assets/oud.png";

function angleDiff(a: number, b: number) {
  return (((a - b + 180) % 360) + 360) % 360 - 180;
}

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
  const radius = 320;
  const verticalSpan = 900;
  const trackTravel = 720;
  const straightenWindow = 25;
  const baseRotate = progress * 720;
  const trackY = (0.5 - progress) * trackTravel;
  const bob = Math.sin(progress * Math.PI * 2) * 15;

  const ingredients: { name: string; src: string; size: number }[] = [
    { name: "Rose Petals", src: rosePetals, size: 140 },
    { name: "Saffron", src: saffron, size: 120 },
    { name: "Oud", src: oud, size: 130 },
  ];

  return (
    <section ref={wrapRef} className="relative" style={{ height: "320vh" }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-background via-[oklch(0.16_0.02_50)] to-background">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.7_0.15_30/0.2),transparent_70%)] blur-3xl" />
        </div>

        {/* Foreground Copy */}
        <div className="absolute left-6 top-8 z-20 max-w-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Featured</p>
          <h2 className="mt-2 font-serif text-4xl md:text-5xl">The Essence Collection</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Scroll to drift through our signature blends — orbiting around real notes of rose petals, saffron, and rich oud.
          </p>
        </div>

        {/* --- GLOBAL 3D WORLD STAGE --- */}
        <div
          className="relative h-full w-full"
          style={{ perspective: "1600px", perspectiveOrigin: "50% 50%" }}
        >
          {/* CENTRAL CORE: Ingredients Column */}
          <div
            className="absolute left-1/2 top-1/2 flex flex-col items-center gap-6"
            style={{
              transform: `translate(-50%, -50%) translateY(${bob}px)`,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="pointer-events-none absolute left-1/2 -z-10 -translate-x-1/2 bg-gradient-to-b from-transparent via-[oklch(0.8_0.15_30/0.7)] to-transparent shadow-[0_0_50px_oklch(0.8_0.15_30/0.7)]"
              style={{ width: "2px", height: `${verticalSpan + 200}px`, top: `-${(verticalSpan + 200) / 2}px` }}
            />
            {ingredients.map((ing, i) => (
              <div
                key={ing.name}
                className="relative"
                style={{
                  transform: `rotateY(${baseRotate * 0.3 + i * 40}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                <img
                  src={ing.src}
                  alt={ing.name}
                  width={ing.size}
                  height={ing.size}
                  loading="lazy"
                  className="drop-shadow-[0_0_30px_oklch(0.8_0.15_30/0.6)]"
                  style={{ width: ing.size, height: ing.size, objectFit: "contain" }}
                />
                <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-serif text-xs uppercase tracking-[0.3em] text-[oklch(0.85_0.08_30)]">
                  {ing.name}
                </span>
              </div>
            ))}
          </div>

          {/* HELIX STAGE */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transformStyle: "preserve-3d",
              transform: `translate(-50%, -50%) translateY(${trackY}px)`,
            }}
          >
            {featured.map((p, i) => {
              const angleStep = 360 / count;
              const currentAngle = i * angleStep;
              const y = (i - (count - 1) / 2) * (verticalSpan / Math.max(1, count - 1));
              const fav = current?.favorites.includes(p.id);

              const worldRotation = ((currentAngle + baseRotate) % 360 + 360) % 360;
              const diffFromFront = angleDiff(worldRotation, 0);
              const straighten = Math.max(0, 1 - Math.abs(diffFromFront) / straightenWindow) ** 2;
              const faceCorrection = -worldRotation * straighten;
              const isFront = straighten > 0.9;

              return (
                <div
                  key={p.id}
                  className="absolute left-0 top-0"
                  style={{
                    transform: `translate(-50%, -50%) rotateY(${currentAngle + baseRotate}deg) translateZ(${radius}px) translateY(${y}px) rotateY(${-(currentAngle + baseRotate) + faceCorrection}deg)`,
                    transformStyle: "preserve-3d",
                    zIndex: isFront ? 20 : 10,
                  }}
                >
                  <article
                    className={`group relative w-48 overflow-hidden rounded-xl border bg-card/85 backdrop-blur transition-all duration-300 ${
                      isFront
                        ? "border-[oklch(0.8_0.18_30/0.8)] shadow-[0_0_45px_oklch(0.8_0.2_30/0.7),inset_0_0_25px_oklch(0.75_0.18_30/0.3)] scale-110"
                        : "border-[oklch(0.7_0.12_30/0.45)] shadow-[0_0_25px_oklch(0.75_0.18_30/0.4),inset_0_0_20px_oklch(0.7_0.15_30/0.2)]"
                    }`}
                  >
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
                        className="absolute right-2 top-2 z-30 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition-transform active:scale-95"
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
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
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

        {/* Scroll Indicator */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Scroll Down ↓
        </div>
      </div>
    </section>
  );
}
