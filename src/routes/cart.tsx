import { createFileRoute, Link } from "@tanstack/react-router";
import { UserHeader } from "@/components/UserHeader";
import { UserFooter } from "@/components/UserFooter";
import { store, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Bookmark, Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const current = useStore((s) => s.customers.find((c) => c.id === s.currentCustomerId) ?? null);
  const products = useStore((s) => s.products);

  if (!current) {
    return (
      <div className="min-h-screen">
        <UserHeader />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-serif text-3xl">Your cart</h1>
          <p className="mt-2 text-muted-foreground">Please login to view your cart.</p>
          <Link to="/" className="mt-6 inline-block"><Button>Back to shop</Button></Link>
        </div>
        <UserFooter />
      </div>
    );
  }

  const active = current.cart.filter((i) => !i.savedForLater);
  const saved = current.cart.filter((i) => i.savedForLater);

  type CartItem = { productId: string; qty: number; savedForLater?: boolean };
  const update = (fn: (cart: CartItem[]) => CartItem[]) =>

    store.set((s) => ({
      ...s,
      customers: s.customers.map((c) => (c.id === current.id ? { ...c, cart: fn(c.cart) } : c)),
    }));

  const setQty = (pid: string, delta: number) =>
    update((cart) =>
      cart
        .map((i) => (i.productId === pid && !i.savedForLater ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );

  const remove = (pid: string) => update((cart) => cart.filter((i) => !(i.productId === pid && !i.savedForLater)));

  const saveForLater = (pid: string) =>
    update((cart) => cart.map((i) => (i.productId === pid && !i.savedForLater ? { ...i, savedForLater: true } : i)));

  const moveToCart = (pid: string) =>
    update((cart) => cart.map((i) => (i.productId === pid && i.savedForLater ? { ...i, savedForLater: false } : i)));

  const total = active.reduce((sum, i) => {
    const p = products.find((p) => p.id === i.productId);
    return sum + (p?.price ?? 0) * i.qty;
  }, 0);

  return (
    <div className="min-h-screen">
      <UserHeader />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-[1fr_320px] md:px-6">
        <div>
          <h1 className="font-serif text-4xl">Your cart</h1>
          <div className="mt-6 space-y-3">
            {active.length === 0 && <p className="text-muted-foreground">Cart is empty.</p>}
            {active.map((i) => {
              const p = products.find((p) => p.id === i.productId);
              if (!p) return null;
              return (
                <div key={i.productId} className="flex items-center gap-4 rounded-lg border bg-card p-3">
                  <div className="grid h-16 w-16 flex-none place-items-center rounded-md bg-secondary font-serif text-xl">{p.name[0]}</div>
                  <div className="flex-1">
                    <div className="font-serif text-lg">{p.name}</div>
                    <div className="text-sm text-muted-foreground">₹{p.price.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(p.id, -1)} className="grid h-7 w-7 place-items-center rounded-full border"><Minus className="h-3 w-3" /></button>
                    <span className="w-6 text-center text-sm">{i.qty}</span>
                    <button onClick={() => setQty(p.id, 1)} className="grid h-7 w-7 place-items-center rounded-full border"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => saveForLater(p.id)} title="Save for later" className="rounded-md p-2 hover:bg-secondary"><Bookmark className="h-4 w-4" /></button>
                  <button onClick={() => remove(p.id)} className="rounded-md p-2 hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
                </div>
              );
            })}
          </div>

          {saved.length > 0 && (
            <>
              <h2 className="mt-12 font-serif text-2xl">Saved for later</h2>
              <div className="mt-4 space-y-3">
                {saved.map((i) => {
                  const p = products.find((p) => p.id === i.productId);
                  if (!p) return null;
                  return (
                    <div key={i.productId} className="flex items-center gap-4 rounded-lg border bg-card p-3">
                      <div className="grid h-12 w-12 flex-none place-items-center rounded-md bg-secondary font-serif">{p.name[0]}</div>
                      <div className="flex-1">
                        <div>{p.name}</div>
                        <div className="text-sm text-muted-foreground">₹{p.price.toLocaleString("en-IN")}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => moveToCart(p.id)}>Move to cart</Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <aside className="h-fit rounded-lg border bg-card p-5">
          <h3 className="font-serif text-xl">Summary</h3>
          <div className="mt-4 flex justify-between text-sm">
            <span>Items</span>
            <span>{active.reduce((a, b) => a + b.qty, 0)}</span>
          </div>
          <div className="mt-2 flex justify-between font-medium">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
          {active.length === 0 ? (
            <Button className="mt-4 w-full" disabled>Checkout</Button>
          ) : (
            <Link to="/checkout"><Button className="mt-4 w-full">Checkout</Button></Link>
          )}

        </aside>
      </div>
      <UserFooter />
    </div>
  );
}
