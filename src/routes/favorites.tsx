import { createFileRoute, Link } from "@tanstack/react-router";
import { UserHeader } from "@/components/UserHeader";
import { UserFooter } from "@/components/UserFooter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
  head: () => ({ meta: [
    { title: "Your favorites — SULTAN AL MISK" },
    { name: "description", content: "Your saved SULTAN AL MISK perfumes and sizes." },
    { property: "og:title", content: "Your favorites — SULTAN AL MISK" },
    { property: "og:description", content: "Your saved SULTAN AL MISK perfumes and sizes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function FavoritesPage() {
  const current = useStore((s) => s.customers.find((c) => c.id === s.currentCustomerId) ?? null);
  const products = useStore((s) => s.products);

  if (!current) {
    return (
      <div className="min-h-screen">
        <UserHeader />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-serif text-3xl">Favorites</h1>
          <p className="mt-2 text-muted-foreground">Please login to view your favorites.</p>
          <Link to="/" className="mt-6 inline-block"><Button>Back to shop</Button></Link>
        </div>
        <UserFooter />
      </div>
    );
  }

  const favs = products.filter((p) => current.favorites.includes(p.id));

  return (
    <div className="min-h-screen">
      <UserHeader />
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <h1 className="font-serif text-4xl">Favorites</h1>
        {favs.length === 0 ? (
          <p className="mt-6 text-muted-foreground">No favorites yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {favs.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
      <UserFooter />
    </div>
  );
}
