import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo } from "react";
import { UserHeader } from "@/components/UserHeader";
import { UserFooter } from "@/components/UserFooter";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/lib/store";
import { productGroups } from "@/lib/product-groups";

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>) => ({ q: typeof search.q === "string" ? search.q : "" }),
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Shop all perfumes — SULTAN AL MISK" },
      { name: "description", content: "Browse the SULTAN AL MISK perfume collection." },
      { property: "og:title", content: "Shop all perfumes — SULTAN AL MISK" },
      { property: "og:description", content: "Browse the SULTAN AL MISK perfume collection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProductsPage() {
  const products = useStore((s) => s.products);
  const { q } = Route.useSearch();
  const navigate = useNavigate();

  const filtered = useMemo(
    () => productGroups(products).filter(group => group.some(p => p.name.toLowerCase().includes(q.toLowerCase()))),
    [products, q],
  );

  return (
    <div className="relative min-h-screen">
      <UserHeader />

      <div className="mx-auto max-w-6xl px-4 pt-5 md:px-6">
        <div className="relative mx-auto w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => navigate({ to: "/products", search: { q: e.target.value }, replace: true })}
            placeholder="Search perfumes…"
            className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="mb-8 font-serif text-3xl">Our Perfumes</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {filtered.map(group => {
            const p = group[0];
            return p ? <ProductCard key={p.parentId ?? p.id} product={p} variants={group} /> : null;
          })}
        </div>
        {filtered.length === 0 && <p className="py-20 text-center text-muted-foreground">No perfumes match your search.</p>}
      </section>

      <UserFooter />
    </div>
  );
}
