import { Facebook, Instagram, MapPin, Twitter, Globe } from "lucide-react";
import { useStore } from "@/lib/store";

export function UserFooter() {
  const site = useStore((s) => s.site);
  return (
    <footer className="mt-24 border-t border-border bg-background/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <h3 className="font-brand text-2xl">{site.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{site.tagline}</p>
        </div>
        <div>
          <h4 className="font-serif text-lg">Visit</h4>
          <p className="mt-2 text-sm text-muted-foreground">{site.address}</p>
          {site.phone && <p className="mt-1 text-sm text-muted-foreground">{site.phone}</p>}
          {site.locationLink && (
            <a href={site.locationLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm hover:underline">
              <MapPin className="h-4 w-4" /> Find us
            </a>
          )}
        </div>
        <div>
          <h4 className="font-serif text-lg">Follow</h4>
          <div className="mt-2 flex gap-3">
            {site.social.instagram && <a href={site.social.instagram} aria-label="Instagram"><Instagram className="h-5 w-5" /></a>}
            {site.social.facebook && <a href={site.social.facebook} aria-label="Facebook"><Facebook className="h-5 w-5" /></a>}
            {site.social.twitter && <a href={site.social.twitter} aria-label="Twitter"><Twitter className="h-5 w-5" /></a>}
            {site.website && <a href={site.website} aria-label="Website"><Globe className="h-5 w-5" /></a>}
          </div>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {site.name}
      </div>
    </footer>
  );
}
