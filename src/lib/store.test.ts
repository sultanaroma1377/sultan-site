/// <reference types="bun" />
import { expect, test } from "bun:test";

test("site edits and manually added Eco sizes are written to browser storage", async () => {
  const data = new Map<string, string>();
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  } });
  try {
    const { store } = await import("./store");
    store.set(s => ({ ...s, site: { ...s.site, tagline: "Saved site edit" }, sheetSync: { ...s.sheetSync, mode: "eco", variants: [{ label: "6ml", oilMl: 6, packagingCost: 10 }] } }));
    const saved = JSON.parse(data.get("perfume_app_v1") ?? "{}");
    expect(saved.site.tagline).toBe("Saved site edit");
    expect(saved.sheetSync.variants).toEqual([{ label: "6ml", oilMl: 6, packagingCost: 10 }]);
    expect(saved.sheetSync.mode).toBe("eco");
    store.set(s => ({ ...s, products: [{ id: "04v3ml", name: "cr7 3ml", price: 120 }, { id: "04v6ml", name: "cr7 6ml", price: 240 }], sheetSync: { ...s.sheetSync, variants: [] } }));
    const grouped = JSON.parse(data.get("perfume_app_v1") ?? "{}");
    expect(grouped.products.map((p: { parentId: string }) => p.parentId)).toEqual(["eco-04", "eco-04"]);
    expect(store.get().products.map(p => p.variantLabel)).toEqual(["3ml", "6ml"]);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});