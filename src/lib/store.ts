import { useEffect, useState, useSyncExternalStore } from "react";
import type { Admin, CarouselSlide, ConfirmedOrder, Coupon, Customer, Product, SiteSettings } from "./types";
import type { EcoVariant, SheetMode } from "./sheet-mapping";

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
  commonProductImage?: string;
};

const KEY = "perfume_app_v1";

const defaultProducts: Product[] = [
  { id: "p1", name: "Rose Velvet", price: 2499, description: "Bulgarian rose, soft musk, vanilla.", category: "Floral" },
  { id: "p2", name: "Jasmine Noir", price: 2899, description: "Night-blooming jasmine and oud.", category: "Floral" },
  { id: "p3", name: "Cedar Bloom", price: 2299, description: "Cedarwood, bergamot, white tea.", category: "Woody" },
  { id: "p4", name: "Peony Mist", price: 1999, description: "Peony, peach, soft amber.", category: "Floral" },
  { id: "p5", name: "Amber Reverie", price: 3199, description: "Warm amber, sandalwood, saffron.", category: "Oriental" },
  { id: "p6", name: "Citrus Garden", price: 1799, description: "Yuzu, neroli, green leaves.", category: "Citrus" },
];

const defaultState: State = {
  site: {
    name: "SULTAN AL MISK",
    tagline: "Hand-blended perfumes inspired by gardens in bloom.",
    social: { instagram: "#", facebook: "#", twitter: "#" },
    website: "#",
    locationLink: "#",
    address: "12 Rosewood Lane, Mumbai 400001",
    phone: "+91 90000 00000",
  },
  admins: [{ username: "aaa", password: "aaa" }],
  products: defaultProducts,
  customers: [],
  currentCustomerId: null,
  coupons: [],
  orders: [],
  carousel: [],
  sheetSync: { apiKey: "", sheetId: "", range: "A1:AA1000" },
  commonProductImage: undefined,
};

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = { ...defaultState, ...JSON.parse(raw) };
    if (parsed.site?.name === "Maison Fleur") parsed.site = { ...parsed.site, name: "SULTAN AL MISK" };
    return parsed;
  } catch {
    return defaultState;
  }
}

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export const store = {
  get: () => state,
  set: (updater: (s: State) => State) => {
    state = updater(state);
    persist();
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

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
