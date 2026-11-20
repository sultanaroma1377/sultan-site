import type { ConfirmedOrder, Product } from './types';

export type ProfitAdjustment = { additionalCosts: number; extraProfit: number; costTags: { id: string; tag: string; amount: number }[]; profitTags: { id: string; tag: string; amount: number }[] };
export type ProfitAdjustments = Record<string, ProfitAdjustment>;
export const emptyAdjustment = (): ProfitAdjustment => ({ additionalCosts: 0, extraProfit: 0, costTags: [], profitTags: [] });
export const dateKey = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export function snapshotOrderItem(product: Product, qty: number) {
  return { productId: product.id, name: product.name, price: product.price, qty, ...(product.buyingPrice !== undefined ? { buyingPrice: product.buyingPrice } : {}) };
}
export function profitRows(orders: ConfirmedOrder[], basis: 'dispatched' | 'accepted' = 'dispatched', month?: string, day?: string) {
  return orders.filter(order => (order.status === 'dispatched' || (basis === 'accepted' && order.status === 'accepted')) && (!month || dateKey(order.createdAt).slice(0, 7) === month) && (!day || dateKey(order.createdAt) === day)).flatMap(order => {
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return order.items.map((item, index) => {
      const revenue = subtotal > 0 ? order.total * item.price * item.qty / subtotal : 0;
      const cost = (item.buyingPrice ?? 0) * item.qty;
      return { id: `${order.id}-${index}`, orderId: order.id, orderNo: order.orderNo ?? order.id.slice(0, 8), date: order.createdAt, productId: item.productId, name: item.name, qty: item.qty, revenue, cost, profit: revenue - cost, missingCost: item.buyingPrice === undefined };
    });
  });
}
export function profitTotals(rows: ReturnType<typeof profitRows>, adjustment = emptyAdjustment()) {
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const costAdjustment = adjustment.additionalCosts + adjustment.costTags.reduce((sum, tag) => sum + tag.amount, 0);
  const income = adjustment.extraProfit + adjustment.profitTags.reduce((sum, tag) => sum + tag.amount, 0);
  const cost = rows.reduce((sum, row) => sum + row.cost, 0) + costAdjustment;
  const profit = revenue - cost + income;
  return { revenue, cost, income, profit, margin: revenue ? profit / revenue * 100 : 0, orders: new Set(rows.map(row => row.orderId)).size };
}