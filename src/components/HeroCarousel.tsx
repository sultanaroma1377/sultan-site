import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function HeroCarousel() {
  const slides = useStore((s) => s.carousel);
  const products = useStore((s) => s.products);
  const [i, setI] = useState(0);

  const items = slides
    .map((sl) => {
      const p = sl.productId ? products.find((x) => x.id === sl.productId) : undefined;
      return {
        id: sl.id,
        image: sl.image ?? p?.image ?? (p ? commonImg : undefined),
        caption: sl.caption ?? p?.name,
        productId: p?.id,
      };
    })
    .filter((x) => x.image || x.caption);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const idx = i % items.length;
  const active = items[idx]!;

  const Slide = (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl border border-border bg-theme-gradient-reverse">
      {active.image ? (
        <img src={active.image} alt={active.caption ?? "Featured"} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center font-serif text-4xl text-on-gradient">{active.caption}</div>
      )}
      {active.caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5">
          <p className="font-serif text-2xl text-on-gradient">{active.caption}</p>
          {active.productId && <p className="text-sm text-on-gradient-muted">Tap to view details</p>}
        </div>
      )}
    </div>
  );

  return (
    <section className="mx-auto max-w-6xl px-4 pb-6 md:px-6">
      <div className="relative">
        {active.productId ? (
          <Link to="/product/$id" params={{ id: active.productId }} className="block">
            {Slide}
          </Link>
        ) : (
          Slide
        )}
        {items.length > 1 && (
          <>
            <button
              aria-label="Previous"
              onClick={() => setI((v) => (v - 1 + items.length) % items.length)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-card backdrop-blur-md"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              aria-label="Next"
              onClick={() => setI((v) => (v + 1) % items.length)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-card backdrop-blur-md"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="mt-3 flex justify-center gap-2">
              {items.map((s, n) => (
                <button
                  key={s.id}
                  aria-label={`Go to slide ${n + 1}`}
                  onClick={() => setI(n)}
                  className={`h-2 rounded-full transition-all ${n === idx ? "w-6 bg-primary" : "w-2 bg-border"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
