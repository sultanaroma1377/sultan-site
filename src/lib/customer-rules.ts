import type { ConfirmedOrder } from './types';
import { z } from 'zod';

export const optionalWhatsapp = z.string().trim().refine(value => !value || /^[+\d\s()-]{7,20}$/.test(value), 'Enter a valid WhatsApp number').optional();

export function previousReceivers(orders: ConfirmedOrder[], customerId: string) {
  const unique = new Map<string, { name: string; phone: string; whatsapp?: string }>();
  for (const order of [...orders].sort((a, b) => b.createdAt - a.createdAt)) {
    if (order.customerId !== customerId) continue;
    const key = `${order.receiverName.trim()}|${order.receiverPhone.trim()}|${order.receiverWhatsapp?.trim() ?? ''}`;
    if (!unique.has(key)) unique.set(key, { name: order.receiverName, phone: order.receiverPhone, ...(order.receiverWhatsapp ? { whatsapp: order.receiverWhatsapp } : {}) });
  }
  return [...unique.values()];
}

export function ownOrders(orders: ConfirmedOrder[], customerId: string) {
  return orders.filter(o => o.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt);
}