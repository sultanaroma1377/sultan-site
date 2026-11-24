import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { productImage } from '@/lib/product-image';

export function HeroCarousel() {
  const slides = useStore((s) => s.carousel);
  const products = useStore((s) => s.products);
  const sizes = useStore((s) => s.sheetSync.variants);
  const [i, setI] = useState(0);

  const items = slides
    .map((sl) => {
      const p = sl.productId ? products.find((x) => x.id === sl.productId) : undefined;
      return {
        id: sl.id,
        image: sl.image ?? productImage(p, sizes),
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
  const active = items[idx];
  if (!active) return null;

  const Slide = (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-lg border border-border bg-primary-gradient">
      <div className="flex h-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {items.map((it) => {
          const body = (
            <div className="relative h-full w-full">
              {it.image ? <img src={it.image} alt={it.caption ?? "Featured"} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center font-serif text-4xl text-on-gradient">{it.caption}</div>}
              {it.caption && <div className="absolute inset-x-0 bottom-0 bg-carousel-scrim p-5"><p className="font-serif text-2xl text-on-gradient">{it.caption}</p>{it.productId && <p className="text-sm text-on-gradient-muted">Tap to view details</p>}</div>}
            </div>
          );
          return <div key={it.id} className="h-full w-full shrink-0">{it.productId ? <Link to="/product/$id" params={{ id: it.productId }} className="block h-full">{body}</Link> : body}</div>;
        })}
      </div>
    </div>
  );

  return (
    <section className="mx-auto max-w-6xl px-4 pb-6 md:px-6">
      <div className="relative">
        {Slide}
        {items.length > 1 && (
          <>
            <Button
              variant="outline" size="icon" aria-label="Previous"
              onClick={() => setI((v) => (v - 1 + items.length) % items.length)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-card backdrop-blur-md"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline" size="icon" aria-label="Next"
              onClick={() => setI((v) => (v + 1) % items.length)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-card backdrop-blur-md"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="mt-3 flex justify-center gap-2">
              {items.map((s, n) => (
                <Button
                  variant="ghost"
                  key={s.id}
                  aria-label={`Go to slide ${n + 1}`}
                  onClick={() => setI(n)}
                  className={`h-2 min-h-0 p-0 rounded-full transition-all ${n === idx ? "w-6 bg-primary" : "w-2 bg-border"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
