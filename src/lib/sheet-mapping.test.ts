import { describe, expect, test } from "bun:test";
import { mapSheetProducts, mergeSheetProducts } from "./sheet-mapping";

function fixture() {
  const header = Array(27).fill("");
  ["3ml", "6 ml", "12ML", "50ml", "20ml"].forEach((v, i) => header[4 + i * 4] = v);
  const row = Array(27).fill("");
  row[0] = "4"; row[1] = "cr7"; row[3] = "1000";
  [100, 200, 300, 400, 500].forEach((v, i) => { row[4 + i * 4] = "40"; row[6 + i * 4] = String(v); });
  row[24] = "Bottle"; row[25] = "25"; row[26] = "80";
  return [header, ["ignored header"], row];
}

describe("uploaded Google Sheets mappings", () => {
  test("G Sheet reads row 3, B names, E/I/M/Q/U size headers and G/K/O/S/W prices", () => {
    const result = mapSheetProducts(fixture(), "sheet");
    expect(result.slice(0, 5).map(p => [p.id, p.name, p.price, p.buyingPrice])).toEqual([
      ["3m4", "cr7 3ml", 100, 40], ["6m4", "cr7 6 ml", 200, 40], ["12m4", "cr7 12ML", 300, 40], ["50m4", "cr7 50ml", 400, 40], ["20m4", "cr7 20ml", 500, 40],
    ]);
  });
  test("Eco reads D bulk cost and rounds cost divided by .30 up to nearest 10", () => {
    const p = mapSheetProducts(fixture(), "eco", [{ label: "3ml", oilMl: 3, packagingCost: 5 }])[0];
    expect(p).toMatchObject({ id: "04v3ml", name: "cr7 3ml", buyingPrice: 35, price: 120 });
  });
  test("accessory uses Y/Z/AA and mode-specific SKU", () => {
    expect(mapSheetProducts(fixture(), "sheet").at(-1)).toMatchObject({ id: "idv4", name: "Bottle", buyingPrice: 25, price: 80 });
    expect(mapSheetProducts(fixture(), "eco", [{ label: "3ml", oilMl: 3, packagingCost: 0 }]).at(-1)?.id).toBe("04acc");
  });
  test("Eco requires configured positive oil volumes", () => {
    expect(() => mapSheetProducts(fixture(), "eco")).toThrow();
    expect(() => mapSheetProducts(fixture(), "eco", [{ label: "3ml", oilMl: 0, packagingCost: 0 }])).toThrow();
  });
  test("resync updates by SKU without duplicates or losing uploaded images", () => {
    const old = [{ id: "3m4", name: "Old", price: 1, image: "local-image" }];
    const result = mergeSheetProducts(old, mapSheetProducts(fixture(), "sheet"));
    expect(result.created).toBe(5); expect(result.updated).toBe(1);
    expect(result.products[0]).toMatchObject({ price: 100, image: "local-image" });
    expect(mergeSheetProducts(result.products, mapSheetProducts(fixture(), "sheet")).created).toBe(0);
  });
});