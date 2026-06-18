import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { UserHeader } from "@/components/UserHeader";
import { UserFooter } from "@/components/UserFooter";
import { store, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import type { Address } from "@/lib/types";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const current = useStore((s) => s.customers.find((c) => c.id === s.currentCustomerId) ?? null);
  const products = useStore((s) => s.products);
  const coupons = useStore((s) => s.coupons);
  const nav = useNavigate();
  const [step, setStep] = useState<"address" | "receiver" | "done">("address");
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(current?.addresses[0]?.id ?? null);
  const [newAddr, setNewAddr] = useState<Omit<Address, "id">>({ line1: "", pincode: "", state: "", city: "" });
  const [showNewAddr, setShowNewAddr] = useState((current?.addresses.length ?? 0) === 0);
  const [receiver, setReceiver] = useState({ name: "", phone: "" });
  const [couponCode, setCouponCode] = useState("");

  const items = useMemo(
    () =>
      current?.cart
        .filter((i) => !i.savedForLater)
        .map((i) => {
          const p = products.find((p) => p.id === i.productId)!;
          return { productId: i.productId, qty: i.qty, name: p?.name ?? "", price: p?.price ?? 0 };
        }) ?? [],
    [current, products],
  );

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const appliedCoupon = coupons.find((c) => c.code.toLowerCase() === couponCode.toLowerCase() && subtotal >= c.minAmount);
  const total = Math.max(0, subtotal - (appliedCoupon?.discount ?? 0));

  if (!current) return <div className="p-12 text-center">Please login.</div>;

  async function lookupPin(pin: string) {
    setNewAddr((d) => ({ ...d, pincode: pin }));
    if (pin.length === 6) {
      try {
        const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const j = await r.json();
        const po = j?.[0]?.PostOffice?.[0];
        if (po) setNewAddr((d) => ({ ...d, pincode: pin, state: po.State, city: po.District }));
      } catch {}
    }
  }

  const confirm = () => {
    let addrId = selectedAddrId;
    let address: Address | undefined = current.addresses.find((a) => a.id === selectedAddrId);
    if (showNewAddr) {
      address = { id: Math.random().toString(36).slice(2, 10), ...newAddr };
      addrId = address.id;
      store.set((s) => ({
        ...s,
        customers: s.customers.map((c) => (c.id === current.id ? { ...c, addresses: [...c.addresses, address!] } : c)),
      }));
    }
    if (!address) return;
    const orderId = Math.random().toString(36).slice(2, 10);
    store.set((s) => ({
      ...s,
      orders: [
        ...s.orders,
        {
          id: orderId,
          customerId: current.id,
          items,
          total,
          address: address!,
          receiverName: receiver.name,
          receiverPhone: receiver.phone,
          status: "pending",
          createdAt: Date.now(),
        },
      ],
      customers: s.customers.map((c) => (c.id === current.id ? { ...c, cart: c.cart.filter((i) => i.savedForLater) } : c)),
    }));
    setStep("done");
  };

  return (
    <div className="min-h-screen">
      <UserHeader />
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
        <h1 className="font-serif text-4xl">Checkout</h1>

        {step === "address" && (
          <div className="mt-8 space-y-6">
            <h2 className="font-serif text-2xl">Delivery address</h2>
            {current.addresses.length > 0 && (
              <div className="space-y-2">
                {current.addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${selectedAddrId === a.id && !showNewAddr ? "border-primary bg-secondary/40" : ""}`}>
                    <input type="radio" name="addr" checked={selectedAddrId === a.id && !showNewAddr} onChange={() => { setSelectedAddrId(a.id); setShowNewAddr(false); }} />
                    <div className="text-sm">
                      <div>{a.line1}</div>
                      <div className="text-muted-foreground">{a.city}, {a.state} - {a.pincode}</div>
                    </div>
                  </label>
                ))}
                <button onClick={() => setShowNewAddr(!showNewAddr)} className="text-sm text-primary hover:underline">
                  {showNewAddr ? "Use saved address" : "+ Add new address"}
                </button>
              </div>
            )}
            {showNewAddr && (
              <div className="space-y-2 rounded-md border p-3">
                <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Flat no., building, area" value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} />
                <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Pincode" value={newAddr.pincode} onChange={(e) => lookupPin(e.target.value)} />
                <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="State" value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} />
                <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="City" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
              </div>
            )}
            <Button onClick={() => setStep("receiver")} disabled={showNewAddr ? !newAddr.line1 || !newAddr.pincode : !selectedAddrId}>Next</Button>
          </div>
        )}

        {step === "receiver" && (
          <div className="mt-8 space-y-4">
            <h2 className="font-serif text-2xl">Receiver details</h2>
            <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Receiver name" value={receiver.name} onChange={(e) => setReceiver({ ...receiver, name: e.target.value })} />
            <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Phone number" value={receiver.phone} onChange={(e) => setReceiver({ ...receiver, phone: e.target.value })} />
            <div className="space-y-1">
              <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Coupon code (optional)" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
              {couponCode && (appliedCoupon ? <p className="text-xs text-accent">Coupon applied: −₹{appliedCoupon.discount}</p> : <p className="text-xs text-muted-foreground">Invalid or min amount not reached.</p>)}
            </div>

            <div className="rounded-md border bg-card p-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
              {appliedCoupon && <div className="flex justify-between text-accent"><span>Discount</span><span>−₹{appliedCoupon.discount}</span></div>}
              <div className="mt-2 flex justify-between font-medium"><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("address")}>Back</Button>
              <Button onClick={confirm} disabled={!receiver.name || !receiver.phone}>Confirm order</Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="mt-12 rounded-lg border bg-card p-8 text-center">
            <h2 className="font-serif text-3xl">Thank you!</h2>
            <p className="mt-3 text-muted-foreground">
              Your order has been placed. Once it is accepted, you will be informed to pay the amount.
            </p>
            <Link to="/" className="mt-6 inline-block"><Button>Continue shopping</Button></Link>
          </div>
        )}
      </div>
      <UserFooter />
    </div>
  );
}
