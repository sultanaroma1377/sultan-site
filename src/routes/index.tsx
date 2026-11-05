import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { UserHeader } from "@/components/UserHeader";
import { UserFooter } from "@/components/UserFooter";
import { HeroCarousel } from "@/components/HeroCarousel";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Storefront,
  head: () => ({
    meta: [
      { title: "SULTAN AL MISK — Hand-blended luxury perfumes" },
      { name: "description", content: "Discover hand-blended perfumes inspired by gardens in bloom. Floral, woody and oriental fragrances." },
      { property: "og:title", content: "SULTAN AL MISK — Hand-blended luxury perfumes" },
      { property: "og:description", content: "Discover hand-blended perfumes inspired by gardens in bloom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Storefront() {
  const site = useStore((s) => s.site);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/products", search: { q } });
  };

  return (
    <div className="relative min-h-screen">
      <UserHeader />

      <div className="mx-auto max-w-6xl px-4 pt-5 md:px-6">
        <form onSubmit={submit} className="relative mx-auto w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search perfumes…"
            className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-ring"
          />
        </form>
      </div>

      <section>
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">New Season</p>
          <h1 className="font-serif text-5xl leading-tight md:text-7xl">{site.name}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">{site.tagline}</p>
        </div>
      </section>

      <HeroCarousel />

      <div className="mx-auto max-w-6xl px-4 py-10 text-center md:px-6">
        <button
          onClick={() => navigate({ to: "/products", search: { q: "" } })}
          className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Browse all perfumes
        </button>
      </div>

      <UserFooter />
    </div>
  );
}
