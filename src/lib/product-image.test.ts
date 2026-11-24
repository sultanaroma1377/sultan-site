import { expect, test } from 'bun:test';
import { productImage } from './product-image';
import { mergeSheetProducts } from './sheet-mapping';

const sizes = [{ label: '3ml', oilMl: 3, packagingCost: 10, image: 'shared-size-photo' }];
test('specific product photo overrides the common size photo without changing another perfume', () => {
  expect(productImage({ image: 'specific-perfume-photo', variantLabel: '3ml' }, sizes)).toBe('specific-perfume-photo');
  expect(productImage({ variantLabel: '3ml' }, sizes)).toBe('shared-size-photo');
});
test('specific product photo survives a Google Sheets refresh', () => {
  const result = mergeSheetProducts([{ id: '01v3ml', name: 'Perfume', price: 100, variantLabel: '3ml', image: 'specific-perfume-photo' }], [{ id: '01v3ml', name: 'Perfume', price: 200, variantLabel: '3ml' }]);
  expect(productImage(result.products[0], sizes)).toBe('specific-perfume-photo');
});