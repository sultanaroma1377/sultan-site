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
  const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
  return products.map(product => {
    if (product.parentId) return product;
    const match = product.id.match(/^(\d+)v(.+)$/i);
    if (!match) return product;
    const suffix = normalize(match[2] ?? "");
    const savedLabel = labels.find(value => normalize(value) === suffix)?.trim();
    // Recover the original size from the SKU and name even when settings were
    // removed or renamed. Never merge unrelated perfumes just by display name.
    const words = product.name.trim().split(/\s+/);
    const nameLabel = words.map((_, i) => words.slice(i).join(" ")).find(value => normalize(value) === suffix);
    const label = product.variantLabel?.trim() || nameLabel || savedLabel;
    if (!label) return product;
    const baseName = product.baseName ?? (nameLabel ? product.name.trim().slice(0, -nameLabel.length).trim() : product.name.trim());
    if (!baseName) return product;
    return { ...product, parentId: `eco-${(match[1] ?? "").padStart(2, "0")}`, baseName, variantLabel: label };
  });
}