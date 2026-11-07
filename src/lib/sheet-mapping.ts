import type { Product } from "./types";

export type SheetMode = "sheet" | "eco";
export type EcoVariant = { label: string; oilMl: number; packagingCost: number };

const text = (value: unknown) => String(value ?? "").trim();
const number = (value: unknown) => parseFloat(text(value)) || 0;

export function mapSheetProducts(rows: unknown[][], mode: SheetMode, variants: EcoVariant[] = []): Product[] {
  if (rows.length < 3) throw new Error("No data rows (data starts at row 3)");
  if (mode === "eco" && (!variants.length || variants.some(v => !v.label.trim() || !Number.isFinite(v.oilMl) || v.oilMl <= 0 || !Number.isFinite(v.packagingCost) || v.packagingCost < 0))) {
    throw new Error("Add Eco sizes with oil volume above zero and packaging cost of zero or more");
  }
  const header = rows[0] ?? [];
  const products: Product[] = [];
  for (const row of rows.slice(2)) {
    const rowId = text(row[0]);
    const name = text(row[1]);
    if (!rowId || (!name && !text(row[24]))) continue;
    if (name) {
      if (mode === "sheet") {
        for (const start of [4, 8, 12, 16, 20]) {
          const label = text(header[start]);
          if (!label) continue;
          const normalized = label.toLowerCase().replace(/\s+/g, "");
          const match = normalized.match(/(\d+)ml/);
          const prefix = match ? `${match[1]}m` : normalized.replace(/[^a-z0-9]/g, "") || "x";
          products.push({ id: `${prefix}${rowId}`, name: `${name} ${label}`, price: number(row[start + 2]), buyingPrice: number(row[start]), category: "Perfume" });
        }
      } else {
        for (const variant of variants) {
          const cost = number(row[3]) / 100 * variant.oilMl + variant.packagingCost;
          products.push({ id: `${rowId.padStart(2, "0")}v${variant.label.toLowerCase().replace(/\s+/g, "")}`, name: `${name} ${variant.label.trim()}`, price: Math.ceil(cost / 0.30 / 10) * 10, buyingPrice: cost, category: "Perfume" });
        }
      }
    }
    const accessory = text(row[24]);
    if (accessory) products.push({ id: mode === "eco" ? `${rowId.padStart(2, "0")}acc` : `idv${rowId}`, name: accessory, price: number(row[26]), buyingPrice: number(row[25]), category: "Accessory" });
  }
  return products;
}

export function mergeSheetProducts(existing: Product[], incoming: Product[]) {
  const map = new Map(existing.map(p => [p.id, p]));
  let created = 0, updated = 0;
  for (const product of incoming) {
    const previous = map.get(product.id);
    if (previous) updated++; else created++;
    map.set(product.id, { ...previous, ...product });
  }
  return { products: [...map.values()], created, updated };
}