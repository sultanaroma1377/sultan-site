/// <reference types="bun" />
import { expect, test } from "bun:test";
import { migrateEcoProducts, productGroups } from "./product-groups";
import { mapSheetProducts, mergeSheetProducts } from "./sheet-mapping";

test("Eco sizes appear under one main perfume with individual prices and SKUs", () => {
  const rows = [[], [], ["4", "cr7", "", "1000"]];
  const sizes = [{ label: "3ml", oilMl: 3, packagingCost: 5 }, { label: "6ml", oilMl: 6, packagingCost: 10 }];
  const products = mapSheetProducts(rows, "eco", sizes);
  const groups = productGroups(products);
  expect(groups.length).toBe(1);
  expect(groups[0]?.map(p => [p.id, p.baseName, p.variantLabel, p.price])).toEqual([["04v3ml", "cr7", "3ml", 120], ["04v6ml", "cr7", "6ml", 240]]);
  expect(productGroups(mergeSheetProducts(products, mapSheetProducts(rows, "eco", sizes)).products).length).toBe(1);
});

test("previously saved Eco SKUs become grouped without changing cart and favorite identifiers", () => {
  const products = migrateEcoProducts([{ id: "04v3ml", name: "cr7 3ml", price: 120 }, { id: "04v6ml", name: "cr7 6ml", price: 240 }, { id: "04acc", name: "Bottle", price: 80 }], ["3ml", "6ml"]);
  expect(products.map(p => p.id)).toEqual(["04v3ml", "04v6ml", "04acc"]);
  expect(productGroups(products).map(g => g.length)).toEqual([2, 1]);
  expect(products[0]?.baseName).toBe("cr7");
});