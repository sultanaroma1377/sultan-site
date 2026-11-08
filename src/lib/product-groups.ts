import type { Product } from "./types";

export function productGroups(products: Product[]) {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.parentId ?? product.id;
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }
  return [...groups.values()];
}

export function migrateEcoProducts(products: Product[], labels: string[]): Product[] {
  return products.map(product => {
    if (product.parentId) return product;
    const match = product.id.match(/^(\d+)v(.+)$/);
    if (!match) return product;
    const label = labels.find(value => value.toLowerCase().replace(/\s+/g, "") === match[2]);
    if (!label || !product.name.endsWith(` ${label.trim()}`)) return product;
    return { ...product, parentId: `eco-${match[1]}`, baseName: product.name.slice(0, -label.trim().length - 1), variantLabel: label.trim() };
  });
}