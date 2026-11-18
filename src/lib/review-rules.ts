import type { ConfirmedOrder, Product } from './types';

export function reviewKey(products: Product[], productId: string) {
  return products.find(p => p.id === productId)?.parentId ?? productId;
}

export function scannedOrderNumber(text: string) {
  const value = /Order:\s*([^\s]+)/i.exec(text)?.[1] ?? text.trim();
  return /^(ws\d{6}|[0-9a-f]{8}-[0-9a-f-]{27})$/i.test(value) ? value.toUpperCase() : null;
}

export function saveReview(order: ConfirmedOrder, products: Product[], productId: string, stars: number, text: string) {
  if (order.status !== 'dispatched') throw new Error('You can review after dispatch');
  if (!order.items.some(i => i.productId === productId)) throw new Error('Item not in order');
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error('Choose 1–5 stars');
  if (!text.trim() || text.trim().length > 2000) throw new Error('Enter a review of up to 2000 characters');
  const key = reviewKey(products, productId);
  return { ...order, reviews: { ...order.reviews, [key]: { stars, text: text.trim(), createdAt: Date.now() } }, ratings: { ...order.ratings, [productId]: stars } };
}

export function summarizeReviews(orders: ConfirmedOrder[], products: Product[]) {
  const out: Record<string, { sum: number; count: number; reviews: { stars: number; text: string; createdAt: number }[] }> = {};
  for (const order of orders) {
    const seen = new Set<string>();
    for (const [id, review] of Object.entries(order.reviews ?? {})) {
      const key = reviewKey(products, id);
      const entry = out[key] ??= { sum: 0, count: 0, reviews: [] };
      entry.sum += review.stars; entry.count++; entry.reviews.push(review); seen.add(key);
    }
    for (const [id, stars] of Object.entries(order.ratings ?? {})) {
      const key = reviewKey(products, id);
      if (seen.has(key)) continue;
      const entry = out[key] ??= { sum: 0, count: 0, reviews: [] };
      entry.sum += stars; entry.count++;
    }
  }
  return out;
}