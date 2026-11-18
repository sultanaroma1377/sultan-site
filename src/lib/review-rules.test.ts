/// <reference types="bun" />
import { expect, test } from 'bun:test';
import { saveReview, scannedOrderNumber, summarizeReviews } from './review-rules';
import type { ConfirmedOrder, Product } from './types';
const products: Product[] = [{ id: '17v3ml', parentId: 'eco-17', name: 'Misk 3ml', price: 100 }, { id: '17v6ml', parentId: 'eco-17', name: 'Misk 6ml', price: 200 }];
const order: ConfirmedOrder = { id: 'o', customerId: 'c', status: 'dispatched', createdAt: 1, items: [{ productId: '17v3ml', name: 'Misk', price: 100, qty: 1 }], total: 100, receiverName: 'Buyer', receiverPhone: '9999999999', address: { id: 'a', line1: 'Home', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' } };
test('external scanner accepts the printed multiline QR and bare order number', () => {
  expect(scannedOrderNumber('Order: WS123456\nCustomer: Buyer\nItems: Misk')).toBe('WS123456');
  expect(scannedOrderNumber('ws123456')).toBe('WS123456');
  expect(scannedOrderNumber('random text')).toBeNull();
});
test('submitted stars and text are shared by every size without double counting', () => {
  const saved = saveReview(order, products, '17v3ml', 4, ' Lovely scent ');
  expect(saved.reviews?.['eco-17']?.text).toBe('Lovely scent');
  expect(summarizeReviews([saved], products)['eco-17']).toMatchObject({ sum: 4, count: 1 });
  const updated = saveReview({ ...saved, items: [...saved.items, { ...saved.items[0], productId: '17v6ml' }] }, products, '17v6ml', 5, 'Long lasting');
  expect(summarizeReviews([updated], products)['eco-17']).toMatchObject({ sum: 5, count: 1 });
});
test('only purchased items in dispatched orders can be reviewed', () => {
  expect(() => saveReview({ ...order, status: 'accepted' }, products, '17v3ml', 4, 'Good')).toThrow('after dispatch');
  expect(() => saveReview(order, products, '17v6ml', 4, 'Good')).toThrow('Item not in order');
  expect(() => saveReview(order, products, '17v3ml', 0, 'Good')).toThrow('1–5');
  expect(() => saveReview(order, products, '17v3ml', 4, ' ')).toThrow('Enter a review');
});