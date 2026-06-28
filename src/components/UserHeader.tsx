import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { store, useStore } from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function UserHeader() {
  const site = useStore((s) => s.site);
  const cartCount = useStore((s) => {
    const cust = s.customers.find((c) => c.id === s.currentCustomerId);
    return cust?.cart.filter((i) => !i.savedForLater).reduce((a, b) => a + b.qty, 0) ?? 0;
  });

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/10 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          {site.logo ? (
            <img src={site.logo} alt={site.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-serif text-lg">
              {site.name?.[0] ?? "M"}
            </span>
          )}
          <span className="font-serif text-2xl tracking-wide">{site.name}</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-secondary">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>
          <AccountSheet />
        </div>
      </div>
    </header>
  );
}

function AccountSheet() {
  const [open, setOpen] = useState(false);
  const current = useStore((s) => s.customers.find((c) => c.id === s.currentCustomerId) ?? null);
  const [mode, setMode] = useState<"menu" | "login" | "signup" | "account">("menu");
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const close = () => {
    setOpen(false);
    setMode("menu");
    setU("");
    setP("");
    setErr("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">
            {current ? `Hello, ${current.username}` : "Welcome"}
          </SheetTitle>
        </SheetHeader>

        {mode === "menu" && (
          <div className="mt-6 space-y-2 px-4">
            <Link to="/" onClick={close} className="block rounded-md px-3 py-2 hover:bg-secondary">Shop</Link>
            <Link to="/favorites" onClick={close} className="block rounded-md px-3 py-2 hover:bg-secondary">Favorites</Link>
            <Link to="/cart" onClick={close} className="block rounded-md px-3 py-2 hover:bg-secondary">Cart</Link>
            <Link to="/admin" onClick={close} className="block rounded-md px-3 py-2 hover:bg-secondary">Admin</Link>
            <div className="my-3 h-px bg-border" />
            {current ? (
              <>
                <button onClick={() => setMode("account")} className="block w-full rounded-md px-3 py-2 text-left hover:bg-secondary">Account details</button>
                <button
                  onClick={() => {
                    store.set((s) => ({ ...s, currentCustomerId: null }));
                    close();
                  }}
                  className="block w-full rounded-md px-3 py-2 text-left hover:bg-secondary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setMode("login")} className="block w-full rounded-md px-3 py-2 text-left hover:bg-secondary">Login</button>
                <button onClick={() => setMode("signup")} className="block w-full rounded-md px-3 py-2 text-left hover:bg-secondary">Create account</button>
              </>
            )}
          </div>
        )}

        {(mode === "login" || mode === "signup") && (
          <form
            className="mt-6 space-y-3 px-4"
            onSubmit={(e) => {
              e.preventDefault();
              setErr("");
              const s = store.get();
              if (mode === "signup") {
                if (s.customers.find((c) => c.username === u)) { setErr("Username taken"); return; }
                const id = Math.random().toString(36).slice(2, 10);
                store.set((s2) => ({
                  ...s2,
                  customers: [...s2.customers, { id, username: u, password: p, favorites: [], cart: [], addresses: [] }],
                  currentCustomerId: id,
                }));
                close();
              } else {
                const c = s.customers.find((c) => c.username === u && c.password === p);
                if (!c) { setErr("Invalid credentials"); return; }
                store.set((s2) => ({ ...s2, currentCustomerId: c.id }));
                close();
              }
            }}
          >
            <h3 className="font-serif text-xl">{mode === "login" ? "Login" : "Create account"}</h3>
            <input className="w-full rounded-md border bg-background px-3 py-2" placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} required />
            <input className="w-full rounded-md border bg-background px-3 py-2" type="password" placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} required />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full">{mode === "login" ? "Login" : "Sign up"}</Button>
            <button type="button" onClick={() => setMode("menu")} className="block w-full text-sm text-muted-foreground hover:underline">Back</button>
          </form>
        )}

        {mode === "account" && current && <AccountDetails customerId={current.id} onBack={() => setMode("menu")} />}
        <button onClick={close} className="absolute right-4 top-4 rounded-full p-2 hover:bg-secondary" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </SheetContent>
    </Sheet>
  );
}

function AccountDetails({ customerId, onBack }: { customerId: string; onBack: () => void }) {
  const customer = useStore((s) => s.customers.find((c) => c.id === customerId)!);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ line1: "", pincode: "", state: "", city: "" });

  const startNew = () => {
    setEditing("new");
    setDraft({ line1: "", pincode: "", state: "", city: "" });
  };

  const startEdit = (id: string) => {
    const a = customer.addresses.find((x) => x.id === id)!;
    setEditing(id);
    setDraft({ line1: a.line1, pincode: a.pincode, state: a.state, city: a.city });
  };

  async function lookupPin(pin: string) {
    setDraft((d) => ({ ...d, pincode: pin }));
    if (pin.length === 6) {
      try {
        const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const j = await r.json();
        const po = j?.[0]?.PostOffice?.[0];
        if (po) setDraft((d) => ({ ...d, pincode: pin, state: po.State, city: po.District }));
      } catch {}
    }
  }

  const save = () => {
    store.set((s) => ({
      ...s,
      customers: s.customers.map((c) =>
        c.id !== customerId
          ? c
          : {
              ...c,
              addresses:
                editing === "new"
                  ? [...c.addresses, { id: Math.random().toString(36).slice(2, 10), ...draft }]
                  : c.addresses.map((a) => (a.id === editing ? { ...a, ...draft } : a)),
            },
      ),
    }));
    setEditing(null);
  };

  return (
    <div className="mt-6 space-y-4 px-4">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:underline">← Back</button>
      <h3 className="font-serif text-xl">Addresses</h3>
      <div className="space-y-2">
        {customer.addresses.map((a) => (
          <div key={a.id} className="flex items-start justify-between rounded-md border p-3 text-sm">
            <div>
              <div>{a.line1}</div>
              <div className="text-muted-foreground">{a.city}, {a.state} - {a.pincode}</div>
            </div>
            <button className="text-sm text-primary hover:underline" onClick={() => startEdit(a.id)}>Edit</button>
          </div>
        ))}
        {customer.addresses.length === 0 && <p className="text-sm text-muted-foreground">No addresses yet.</p>}
      </div>

      {editing ? (
        <div className="space-y-2 rounded-md border p-3">
          <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Flat no., building, area" value={draft.line1} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} />
          <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Pincode" value={draft.pincode} onChange={(e) => lookupPin(e.target.value)} />
          <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="State" value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} />
          <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={startNew} className="w-full">+ Add address</Button>
      )}
    </div>
  );
}
