import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ChevronLeft, TrendingUp, TrendingDown, IndianRupee, Percent, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useStore } from '@/lib/store';
import { dateKey, emptyAdjustment, profitRows, profitTotals, type ProfitAdjustment, type ProfitAdjustments } from '@/lib/profit-rules';
import { getProfitAdjustments, saveProfitAdjustments } from '@/lib/profit.functions';

const money = (value: number) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const periodName = (key: string) => key === 'all-time' ? 'All time' : new Date(`${key}-01T12:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
type Rows = ReturnType<typeof profitRows>;

export function ProfitDashboard() {
  const orders = useStore(s => s.orders);
  const [adjustments, setAdjustments] = useState<ProfitAdjustments>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<string | null>(null);
  const [day, setDay] = useState('');
  const load = useServerFn(getProfitAdjustments);
  const save = useServerFn(saveProfitAdjustments);
  useEffect(() => { void load().then(value => { setAdjustments(value); setLoaded(true); }).catch(() => setError('Could not load profit adjustments.')); }, [load]);
  const allRows = profitRows(orders);
  const months = [...new Set([...allRows.map(row => dateKey(row.date).slice(0, 7)), ...Object.keys(adjustments).filter(key => key !== 'all-time')])].sort().reverse();
  const adjustment = adjustments[period ?? 'all-time'] ?? emptyAdjustment();
  const rows = profitRows(orders, 'dispatched', period && period !== 'all-time' ? period : undefined, day || undefined);
  const totals = profitTotals(rows, day ? emptyAdjustment() : adjustment);
  const update = async (nextAdjustment: ProfitAdjustment) => {
    if (!period || !loaded || saving) return;
    const next = { ...adjustments, [period]: nextAdjustment };
    setSaving(true);
    try { const saved = await save({ data: next }); setAdjustments(saved); toast.success('Profit adjustments saved'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Adjustments not saved'); }
    finally { setSaving(false); }
  };
  const periodButton = (key: string) => {
    const value = profitTotals(profitRows(orders, 'dispatched', key === 'all-time' ? undefined : key), adjustments[key] ?? emptyAdjustment());
    return <Button key={key} variant="outline" onClick={() => { setPeriod(key); setDay(''); }} className="h-auto min-w-0 items-start justify-between gap-3 whitespace-normal bg-card p-5 text-left">
      <span className="min-w-0"><span className="block font-semibold">{periodName(key)}</span><span className={`mt-3 block break-words text-2xl font-semibold ${value.profit < 0 ? 'text-destructive' : 'text-primary'}`}>{money(value.profit)}</span><span className="mt-1 block text-xs text-muted-foreground">{value.profit < 0 ? 'Loss' : 'Profit'} · {value.orders} dispatched orders</span></span>
      {value.profit < 0 ? <TrendingDown className="h-5 w-5 shrink-0 text-destructive" /> : <TrendingUp className="h-5 w-5 shrink-0 text-primary" />}
    </Button>;
  };
  return <section className="mt-6 space-y-6">
    <div className="flex items-center gap-3">{period && <Button size="icon" variant="ghost" aria-label="Back to profit summary" onClick={() => { setPeriod(null); setDay(''); }}><ChevronLeft className="h-5 w-5" /></Button>}<div><h2 className="flex items-center gap-2 font-serif text-3xl"><TrendingUp className="h-5 w-5" />{period ? periodName(period) : 'Profit analysis'}</h2><p className="mt-1 text-sm text-muted-foreground">Dispatched orders · INR</p></div></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}<Button className="ml-3" size="sm" variant="outline" onClick={() => { setError(''); void load().then(value => { setAdjustments(value); setLoaded(true); }).catch(() => setError('Could not load profit adjustments.')); }}>Retry</Button></p>}
    {!period ? <><div className="grid gap-4 sm:grid-cols-2">{periodButton('all-time')}</div><h3 className="text-lg font-semibold">Monthly breakdown</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{months.map(periodButton)}</div>{!months.length && <p className="py-6 text-sm text-muted-foreground">No dispatched orders yet.</p>}<div className="flex flex-wrap items-center gap-3"><Label htmlFor="profit-month">Month</Label><Input id="profit-month" type="month" className="w-48" onChange={event => { if (event.target.value) { setPeriod(event.target.value); setDay(''); } }} /></div></> : <>
      <div className="flex flex-wrap items-center gap-3"><Label htmlFor="profit-day">Date</Label><Input id="profit-day" type="date" value={day} onChange={event => setDay(event.target.value)} className="w-48" min={period !== 'all-time' ? `${period}-01` : undefined} max={period !== 'all-time' ? dateKey(new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0).getTime()) : undefined} />{day && <Button variant="outline" size="sm" onClick={() => setDay('')}>All days</Button>}</div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        { label: 'Total revenue', value: money(totals.revenue), icon: IndianRupee },
        { label: 'Total cost', value: money(totals.cost), icon: IndianRupee },
        { label: totals.profit < 0 ? 'Net loss' : 'Net profit', value: money(totals.profit), icon: totals.profit < 0 ? TrendingDown : TrendingUp },
        { label: 'Profit margin', value: `${totals.margin.toFixed(2)}%`, icon: Percent },
      ].map(metric => <div key={metric.label} className="min-w-0 rounded-lg border bg-card p-4"><div className="flex justify-between gap-2 text-muted-foreground"><p className="text-sm">{metric.label}</p><metric.icon className="h-4 w-4 shrink-0" /></div><p className="mt-3 break-words text-2xl font-semibold">{metric.value}</p></div>)}</div>
      {rows.some(row => row.missingCost) && <p role="status" className="border-l-2 border-destructive pl-3 text-sm text-destructive">Purchase cost is missing for {rows.filter(row => row.missingCost).length} item entries. Profit is provisional; missing costs are counted as ₹0.</p>}
      <Tabs defaultValue="daily"><TabsList><TabsTrigger value="daily">Daily</TabsTrigger><TabsTrigger value="detailed">Detailed</TabsTrigger><TabsTrigger value="products">Products</TabsTrigger></TabsList>
        <TabsContent value="daily"><ProfitTable rows={rows} mode="daily" /></TabsContent>
        <TabsContent value="detailed"><ProfitTable rows={rows} mode="detailed" />{!day && <div className="mt-4 space-y-2 text-sm">{adjustment.additionalCosts > 0 && <p>Additional costs: {money(adjustment.additionalCosts)}</p>}{adjustment.costTags.map(tag => <p key={tag.id}>{tag.tag} · Cost: {money(tag.amount)}</p>)}{adjustment.extraProfit > 0 && <p>Extra income: {money(adjustment.extraProfit)}</p>}{adjustment.profitTags.map(tag => <p key={tag.id}>{tag.tag} · Income: {money(tag.amount)}</p>)}</div>}</TabsContent>
        <TabsContent value="products"><ProfitTable rows={rows} mode="products" /></TabsContent>
      </Tabs>
      {!day && <section className="space-y-4 border-t pt-6"><h3 className="text-lg font-semibold">Profit adjustments</h3>{!loaded && <p className="text-sm text-muted-foreground">Adjustments unavailable until loading completes.</p>}<div className="grid gap-4 md:grid-cols-2"><AmountAdjustment key={`${period}-cost-${adjustment.additionalCosts}`} label="Additional costs" value={adjustment.additionalCosts} disabled={!loaded || saving} onSave={value => update({ ...adjustment, additionalCosts: value })} /><AmountAdjustment key={`${period}-income-${adjustment.extraProfit}`} label="Extra income" value={adjustment.extraProfit} disabled={!loaded || saving} onSave={value => update({ ...adjustment, extraProfit: value })} /></div><div className="grid gap-6 md:grid-cols-2"><TaggedAdjustments key={`${period}-cost-tags`} label="Cost entries" items={adjustment.costTags} disabled={!loaded || saving} onChange={costTags => update({ ...adjustment, costTags })} /><TaggedAdjustments key={`${period}-income-tags`} label="Income entries" items={adjustment.profitTags} disabled={!loaded || saving} onChange={profitTags => update({ ...adjustment, profitTags })} /></div>{saving && <p className="text-sm text-muted-foreground" role="status">Saving…</p>}</section>}
    </>}
  </section>;
}

function AmountAdjustment({ label, value, disabled, onSave }: { label: string; value: number; disabled: boolean; onSave: (value: number) => Promise<void> }) {
  const [draft, setDraft] = useState(String(value));
  return <form className="space-y-2" onSubmit={event => { event.preventDefault(); void onSave(Number(draft)); }}><Label>{label} (₹)</Label><div className="flex gap-2"><Input type="number" min="0" step="0.01" required value={draft} onChange={event => setDraft(event.target.value)} disabled={disabled} aria-label={label} /><Button type="submit" disabled={disabled || Number(draft) === value}>Save</Button></div></form>;
}

function TaggedAdjustments({ label, items, disabled, onChange }: { label: string; items: ProfitAdjustment['costTags']; disabled: boolean; onChange: (items: ProfitAdjustment['costTags']) => Promise<void> }) {
  const [tag, setTag] = useState('');
  const [amount, setAmount] = useState('');
  return <div className="space-y-3"><h4 className="font-medium">{label}</h4><form className="flex flex-wrap gap-2" onSubmit={async event => { event.preventDefault(); if (!tag.trim() || Number(amount) <= 0) return; await onChange([...items, { id: crypto.randomUUID(), tag: tag.trim(), amount: Number(amount) }]); setTag(''); setAmount(''); }}><Input className="min-w-0 flex-1 basis-32" placeholder="Title" aria-label={`${label} title`} maxLength={200} required value={tag} onChange={event => setTag(event.target.value)} disabled={disabled} /><Input className="w-28" placeholder="Amount" aria-label={`${label} amount`} type="number" min="0.01" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} disabled={disabled} /><Button type="submit" size="icon" aria-label={`Add ${label.toLowerCase()}`} disabled={disabled}><Plus className="h-4 w-4" /></Button></form>{items.map(item => <TagEditor key={`${item.id}-${item.tag}-${item.amount}`} item={item} disabled={disabled} onSave={next => onChange(items.map(current => current.id === item.id ? next : current))} onDelete={() => onChange(items.filter(current => current.id !== item.id))} />)}</div>;
}
function TagEditor({ item, disabled, onSave, onDelete }: { item: ProfitAdjustment['costTags'][number]; disabled: boolean; onSave: (item: ProfitAdjustment['costTags'][number]) => Promise<void>; onDelete: () => Promise<void> }) {
  const [tag, setTag] = useState(item.tag);
  const [amount, setAmount] = useState(String(item.amount));
  return <form className="flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); void onSave({ ...item, tag: tag.trim(), amount: Number(amount) }); }}><Input className="min-w-0 flex-1 basis-32" value={tag} required maxLength={200} aria-label="Entry title" onChange={event => setTag(event.target.value)} disabled={disabled} /><Input className="w-28" type="number" min="0" step="0.01" required value={amount} aria-label="Entry amount" onChange={event => setAmount(event.target.value)} disabled={disabled} /><Button type="submit" size="sm" variant="outline" disabled={disabled || (tag === item.tag && Number(amount) === item.amount)}>Save</Button><Button type="button" size="icon" variant="ghost" aria-label={`Delete ${item.tag}`} disabled={disabled} onClick={() => { void onDelete(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></form>;
}

function ProfitTable({ rows, mode }: { rows: Rows; mode: 'daily' | 'detailed' | 'products' }) {
  const grouped = new Map<string, { name: string; orders: Set<string>; qty: number; revenue: number; cost: number }>();
  for (const row of rows) {
    const key = mode === 'daily' ? dateKey(row.date) : row.productId;
    const current = grouped.get(key) ?? { name: mode === 'daily' ? key : row.name, orders: new Set<string>(), qty: 0, revenue: 0, cost: 0 };
    current.orders.add(row.orderId); current.qty += row.qty; current.revenue += row.revenue; current.cost += row.cost; grouped.set(key, current);
  }
  const data = mode === 'detailed' ? [...rows].sort((a, b) => b.date - a.date).map(row => ({ id: row.id, label: `${new Date(row.date).toLocaleString()} · #${row.orderNo}`, name: row.name, count: row.qty, revenue: row.revenue, cost: row.cost, missing: row.missingCost })) : [...grouped.entries()].sort((a, b) => mode === 'daily' ? b[0].localeCompare(a[0]) : b[1].qty - a[1].qty).map(([id, row]) => ({ id, label: row.name, name: '', count: mode === 'daily' ? row.orders.size : row.qty, revenue: row.revenue, cost: row.cost, times: row.orders.size }));
  if (!data.length) return <p className="py-8 text-sm text-muted-foreground">No dispatched sales in this period.</p>;
  return <div className="mt-4 overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>{mode === 'daily' ? 'Date' : mode === 'detailed' ? 'Date / Order' : 'Product'}</TableHead>{mode === 'detailed' && <TableHead>Product</TableHead>}{mode === 'products' && <TableHead className="text-right">Times sold</TableHead>}<TableHead className="text-right">{mode === 'daily' ? 'Orders' : 'Quantity'}</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Profit / Loss</TableHead></TableRow></TableHeader><TableBody>{data.map(row => <TableRow key={row.id}><TableCell className="min-w-36 font-medium">{row.label}</TableCell>{mode === 'detailed' && <TableCell className="min-w-32">{row.name}</TableCell>}{mode === 'products' && <TableCell className="text-right">{'times' in row ? row.times : ''}</TableCell>}<TableCell className="text-right">{row.count}</TableCell><TableCell className="whitespace-nowrap text-right">{money(row.revenue)}</TableCell><TableCell className="whitespace-nowrap text-right">{money(row.cost)}{'missing' in row && row.missing ? ' *' : ''}</TableCell><TableCell className={`whitespace-nowrap text-right font-semibold ${row.revenue < row.cost ? 'text-destructive' : 'text-primary'}`}>{money(row.revenue - row.cost)}</TableCell></TableRow>)}</TableBody></Table></div>;
}