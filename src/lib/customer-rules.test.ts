/// <reference types="bun" />
import { expect, test } from 'bun:test';
import { previousReceivers, ownOrders } from './customer-rules';
import type { ConfirmedOrder } from './types';
const order = (id: string, customerId: string, name: string, phone: string, createdAt = 1): ConfirmedOrder => ({ id, customerId, receiverName: name, receiverPhone: phone, createdAt, items: [], total: 0, status: 'pending', address: { id: 'a', line1: 'Building', pincode: '400001', state: 'Maharashtra', city: 'Mumbai' } });
test('previous receiver choices reuse checked-out receivers without duplicates or another customer’s details', () => {
  expect(previousReceivers([order('1', 'one', 'Ali', '9999999999'), order('2', 'one', 'Ali', '9999999999', 2), order('3', 'two', 'Other', '8888888888')], 'one')).toEqual([{ name: 'Ali', phone: '9999999999' }]);
});
test('customer orders show only that customer’s checked-out orders, including accepted orders', () => {
  const accepted = { ...order('2', 'one', 'Ali', '9999999999', 2), status: 'accepted' as const };
  expect(ownOrders([order('1', 'one', 'Ali', '9999999999'), accepted, order('3', 'two', 'Other', '8888888888')], 'one').map(o => o.id)).toEqual(['2', '1']);
});