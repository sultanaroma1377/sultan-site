import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { ProfitAdjustments } from './profit-rules';

const amount = z.number().finite().min(0);
const tag = z.object({ id: z.string().max(100), tag: z.string().max(200), amount });
const adjustments = z.record(z.object({ additionalCosts: amount, extraProfit: amount, costTags: z.array(tag).max(500), profitTags: z.array(tag).max(500) }));

export const getProfitAdjustments = createServerFn({ method: 'GET' }).handler(async () => {
  const h = await import('./customer.server');
  await h.requireSession(true);
  const sb = await h.database();
  const result = await sb.from('shop_data').select('data').eq('key', 'profit-adjustments').maybeSingle();
  if (result.error) throw new Error('Could not load profit adjustments');
  return adjustments.parse(result.data?.data ?? {}) as ProfitAdjustments;
});

export const saveProfitAdjustments = createServerFn({ method: 'POST' }).inputValidator(data => adjustments.parse(data)).handler(async ({ data }) => {
  const h = await import('./customer.server');
  await h.assertWriteOrigin();
  await h.requireSession(true);
  const sb = await h.database();
  const result = await sb.from('shop_data').upsert({ key: 'profit-adjustments', data, updated_at: new Date().toISOString() });
  if (result.error) throw new Error('Profit adjustments were not saved');
  return data as ProfitAdjustments;
});