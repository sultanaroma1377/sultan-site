import type { ConfirmedOrder } from './types';

export function previousReceivers(orders: ConfirmedOrder[], customerId: string) {
  const unique = new Map<string, { name: string; phone: string }>();
  for (const order of [...orders].sort((a, b) => b.createdAt - a.createdAt)) {
    if (order.customerId !== customerId) continue;
    const key = `${order.receiverName.trim()}|${order.receiverPhone.trim()}`;
    if (!unique.has(key)) unique.set(key, { name: order.receiverName, phone: order.receiverPhone });
  }
  return [...unique.values()];
}

export function ownOrders(orders: ConfirmedOrder[], customerId: string) {
  return orders.filter(o => o.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt);
}