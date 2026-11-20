import { expect, test } from 'bun:test';
import { emptyAdjustment, profitRows, profitTotals, snapshotOrderItem } from './profit-rules';
import type { ConfirmedOrder } from './types';
const order: ConfirmedOrder = { id: 'o', customerId: 'c', items: [{ productId: 'p', name: 'Misk', price: 200, buyingPrice: 60, qty: 2 }, { productId: 'q', name: 'Oud', price: 100, buyingPrice: 40, qty: 1 }], total: 400, status: 'dispatched', createdAt: new Date(2026, 10, 20).getTime(), receiverName: 'Buyer', receiverPhone: '1234567890', address: { id: 'a', line1: 'Home', city: 'Mumbai', state: 'MH', pincode: '400001' } };
test('profit allocates coupon-adjusted order revenue proportionally', () => {
  const rows = profitRows([order]);
  expect(rows.map(row => row.revenue)).toEqual([320, 80]);
  expect(profitTotals(rows)).toMatchObject({ revenue: 400, cost: 160, profit: 240, margin: 60, orders: 1 });
});
test('pending and rejected orders do not count as sales; accepted basis is selectable', () => {
  const orders = ['pending', 'rejected', 'accepted', 'dispatched'].map((status, index) => ({ ...order, id: String(index), status: status as ConfirmedOrder['status'] }));
  expect(profitTotals(profitRows(orders)).orders).toBe(1);
  expect(profitTotals(profitRows(orders, 'accepted')).orders).toBe(2);
});
test('stored purchase costs remain unchanged after catalog edits', () => {
  const product = { id: 'p', name: 'Misk', price: 200, buyingPrice: 60 };
  const item = snapshotOrderItem(product, 2);
  product.buyingPrice = 150;
  expect(profitRows([{ ...order, items: [item] }])[0]?.cost).toBe(120);
});
test('month and day filters exclude other dates', () => {
  expect(profitRows([order], 'dispatched', '2026-11', '2026-11-20')).toHaveLength(2);
  expect(profitRows([order], 'dispatched', '2026-10')).toHaveLength(0);
});
test('additional costs and extra income change profit', () => {
  expect(profitTotals(profitRows([order]), { ...emptyAdjustment(), additionalCosts: 20, extraProfit: 10, costTags: [{ id: 'c', tag: 'Packing', amount: 30 }], profitTags: [{ id: 'i', tag: 'Income', amount: 5 }] })).toMatchObject({ cost: 210, income: 15, profit: 205 });
});
test('legacy orders flag unknown purchase costs rather than use current prices', () => {
  expect(profitRows([{ ...order, items: [{ productId: 'p', name: 'Misk', price: 200, qty: 1 }] }])[0]).toMatchObject({ missingCost: true, cost: 0 });
});