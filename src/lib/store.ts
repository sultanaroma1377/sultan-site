import { useEffect, useState, useSyncExternalStore } from "react";
import type { Admin, CarouselSlide, ConfirmedOrder, Coupon, Customer, Product, SiteSettings } from "./types";
import type { EcoVariant, SheetMode } from "./sheet-mapping";
import { migrateEcoProducts } from "./product-groups";
import { toast } from "sonner";
import { cleanShopContent } from "./shop-content";

type State = {
  site: SiteSettings;
  admins: Admin[];
  products: Product[];
  customers: Customer[];
  currentCustomerId: string | null;
  coupons: Coupon[];
  orders: ConfirmedOrder[];
  carousel: CarouselSlide[];
  sheetSync: { apiKey: string; sheetId: string; range: string; mode?: SheetMode; variants?: EcoVariant[] };
};

const KEY = "perfume_app_v1";

const defaultState: State = {
  site: {
    name: "SULTAN AL MISK",
    tagline: "",
    social: {},
    website: "",
    locationLink: "",
    address: "",
    phone: "",
  },
  admins: [{ username: "aaa", password: "aaa" }],
  products: [],
  customers: [],
  currentCustomerId: null,
  coupons: [],
  orders: [],
  carousel: [],
  sheetSync: { apiKey: "", sheetId: "", range: "A1:AA1000" },
};

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = { ...defaultState, ...JSON.parse(raw), customers: [], orders: [], currentCustomerId: null };
    delete parsed.commonProductImage;
    parsed.products = migrateEcoProducts(parsed.products, (parsed.sheetSync.variants ?? []).map((v: EcoVariant) => v.label));
    if (parsed.site?.name === "Maison Fleur") parsed.site = { ...parsed.site, name: "SULTAN AL MISK" };
    return { ...parsed, ...cleanShopContent(parsed.site, parsed.products) };
  } catch {
    return defaultState;
  }
}

export const store = {
  get: () => state,
  set: (updater: (s: State) => State) => {
    const updated = updater(state);
    const next = {
      ...updated,
      ...cleanShopContent(updated.site, migrateEcoProducts(updated.products, (updated.sheetSync.variants ?? []).map(v => v.label))),
    };
    try {
      if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify({ ...next, customers: [], orders: [], currentCustomerId: null }));
    } catch {
      toast.error("Changes could not be saved", { description: "Your browser storage may be full. Try a smaller image or free some space." });
      throw new Error("Browser storage could not save changes");
    }
    state = next;
    listeners.forEach((l) => l());
  },
  subscribe: (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

export function useStore<T>(selector: (s: State) => T): T {
  // Avoid SSR mismatch: only sync after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const value = useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(defaultState),
  );
  return mounted ? value : selector(defaultState);
}

/** Product's own image, else the image set for its size (variant label). */
export function useProductImage(p?: { image?: string; variantLabel?: string }) {
  const variants = useStore((s) => s.sheetSync.variants);
  if (!p) return undefined;
  return p.image ?? (p.variantLabel ? variants?.find((v) => v.label === p.variantLabel)?.image : undefined);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
