import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { store, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import jsPDF from "jspdf";
import type { Product, ConfirmedOrder } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const admins = useStore((s) => s.admins);

  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/40 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const ok = admins.find((a) => a.username === u && a.password === p);
            if (ok) setAuthed(true);
            else setErr("Invalid credentials");
          }}
          className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-8 shadow-sm"
        >
          <h1 className="font-serif text-3xl">Admin</h1>
          <p className="text-sm text-muted-foreground">Default: aaa / aaa</p>
          <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} />
          <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" type="password" placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" className="w-full">Login</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20">
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="font-serif text-2xl">Admin Panel</h1>
          <Button variant="outline" size="sm" onClick={() => setAuthed(false)}>Logout</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Tabs defaultValue="site">
          <TabsList className="flex w-full flex-wrap gap-1 h-auto">
            <TabsTrigger value="site">Site</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="cart">Cart</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
            <TabsTrigger value="orders">Confirmed orders</TabsTrigger>
          </TabsList>
          <TabsContent value="site"><SiteTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="customers"><CustomersTab /></TabsContent>
          <TabsContent value="cart"><CartTab /></TabsContent>
          <TabsContent value="coupons"><CouponsTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      {title && <h2 className="mb-4 font-serif text-xl">{title}</h2>}
      {children}
    </div>
  );
}

function SiteTab() {
  const site = useStore((s) => s.site);
  const admins = useStore((s) => s.admins);
  const [draft, setDraft] = useState(site);
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "" });
  const [pwChange, setPwChange] = useState({ which: admins[0]?.username ?? "", newUsername: "", newPassword: "" });

  const handleLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setDraft({ ...draft, logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-6 space-y-6">
      <Card title="Site details">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">Name<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="text-sm">Tagline<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} /></label>
          <label className="text-sm md:col-span-2">Logo (upload from device)
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])} />
            {draft.logo && <img src={draft.logo} alt="logo" className="mt-2 h-16 w-16 rounded-full object-cover" />}
          </label>
          <label className="text-sm">Instagram<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.social.instagram ?? ""} onChange={(e) => setDraft({ ...draft, social: { ...draft.social, instagram: e.target.value } })} /></label>
          <label className="text-sm">Facebook<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.social.facebook ?? ""} onChange={(e) => setDraft({ ...draft, social: { ...draft.social, facebook: e.target.value } })} /></label>
          <label className="text-sm">Twitter<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.social.twitter ?? ""} onChange={(e) => setDraft({ ...draft, social: { ...draft.social, twitter: e.target.value } })} /></label>
          <label className="text-sm">Website<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.website ?? ""} onChange={(e) => setDraft({ ...draft, website: e.target.value })} /></label>
          <label className="text-sm">Location link<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.locationLink ?? ""} onChange={(e) => setDraft({ ...draft, locationLink: e.target.value })} /></label>
          <label className="text-sm md:col-span-2">Address<textarea className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></label>
          <label className="text-sm">Phone<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
        </div>
        <Button className="mt-4" onClick={() => { store.set((s) => ({ ...s, site: draft })); toast.success("Site updated"); }}>Save site settings</Button>
      </Card>

      <Card title="Admin credentials">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">Existing admin
            <select className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={pwChange.which} onChange={(e) => setPwChange({ ...pwChange, which: e.target.value })}>
              {admins.map((a) => <option key={a.username} value={a.username}>{a.username}</option>)}
            </select>
          </label>
          <label className="text-sm">New username<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={pwChange.newUsername} onChange={(e) => setPwChange({ ...pwChange, newUsername: e.target.value })} /></label>
          <label className="text-sm">New password<input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={pwChange.newPassword} onChange={(e) => setPwChange({ ...pwChange, newPassword: e.target.value })} /></label>
        </div>
        <Button className="mt-3" variant="outline" onClick={() => {
          store.set((s) => ({
            ...s,
            admins: s.admins.map((a) => a.username === pwChange.which ? { username: pwChange.newUsername || a.username, password: pwChange.newPassword || a.password } : a),
          }));
          toast.success("Admin updated");
        }}>Update credentials</Button>

        <div className="mt-6 border-t pt-4">
          <h3 className="font-serif text-lg">Add new admin</h3>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Username" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} />
            <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} />
            <Button onClick={() => {
              if (!newAdmin.username || !newAdmin.password) return;
              store.set((s) => ({ ...s, admins: [...s.admins, newAdmin] }));
              setNewAdmin({ username: "", password: "" });
              toast.success("Admin added");
            }}>Add admin</Button>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Current: {admins.map((a) => a.username).join(", ")}</div>
        </div>
      </Card>
    </div>
  );
}

function ProductsTab() {
  const products = useStore((s) => s.products);
  const sheetSync = useStore((s) => s.sheetSync);
  const [draft, setDraft] = useState<Omit<Product, "id">>({ name: "", price: 0, description: "", category: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [sync, setSync] = useState(sheetSync);
  const [syncing, setSyncing] = useState(false);

  const save = () => {
    if (!draft.name) return;
    if (editing) {
      store.set((s) => ({ ...s, products: s.products.map((p) => p.id === editing ? { ...p, ...draft } : p) }));
    } else {
      store.set((s) => ({ ...s, products: [...s.products, { id: Math.random().toString(36).slice(2, 10), ...draft }] }));
    }
    setDraft({ name: "", price: 0, description: "", category: "" });
    setEditing(null);
  };

  const startEdit = (p: Product) => {
    setEditing(p.id);
    setDraft({ name: p.name, price: p.price, description: p.description, category: p.category, image: p.image });
  };

  const syncSheets = async () => {
    if (!sync.apiKey || !sync.sheetId) { toast.error("Add API key and Sheet ID"); return; }
    setSyncing(true);
    try {
      store.set((s) => ({ ...s, sheetSync: sync }));
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sync.sheetId}/values/${sync.range}?key=${sync.apiKey}`;
      const r = await fetch(url);
      const j = await r.json();
      if (!j.values) throw new Error(j.error?.message ?? "No values");
      // Expected columns: name, price, description, category, image
      const rows: Product[] = j.values.map((row: string[]) => ({
        id: Math.random().toString(36).slice(2, 10),
        name: row[0] ?? "",
        price: Number(row[1] ?? 0),
        description: row[2] ?? "",
        category: row[3] ?? "",
        image: row[4] ?? undefined,
      })).filter((p: Product) => p.name);
      store.set((s) => ({ ...s, products: rows }));
      toast.success(`Synced ${rows.length} products`);
    } catch (e: any) {
      toast.error("Sync failed: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <Card title={editing ? "Edit product" : "Add product manually"}>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input type="number" className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Price" value={draft.price || ""} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Category" value={draft.category ?? ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Image URL (optional)" value={draft.image ?? ""} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
          <textarea className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" placeholder="Description" value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={save}>{editing ? "Update" : "Add"}</Button>
          {editing && <Button variant="ghost" onClick={() => { setEditing(null); setDraft({ name: "", price: 0, description: "", category: "" }); }}>Cancel</Button>}
        </div>
      </Card>

      <Card title="Sync from Google Sheets">
        <p className="mb-3 text-sm text-muted-foreground">Columns: name, price, description, category, image. Replaces all products.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Google API Key" value={sync.apiKey} onChange={(e) => setSync({ ...sync, apiKey: e.target.value })} />
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Sheet ID" value={sync.sheetId} onChange={(e) => setSync({ ...sync, sheetId: e.target.value })} />
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Range e.g. Sheet1!A2:E" value={sync.range} onChange={(e) => setSync({ ...sync, range: e.target.value })} />
        </div>
        <Button className="mt-3" onClick={syncSheets} disabled={syncing}>{syncing ? "Syncing…" : "Sync now"}</Button>
      </Card>

      <Card title={`Products (${products.length})`}>
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">₹{p.price} · {p.category}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => store.set((s) => ({ ...s, products: s.products.filter((x) => x.id !== p.id) }))}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CustomersTab() {
  const customers = useStore((s) => s.customers);
  const products = useStore((s) => s.products);
  const [selected, setSelected] = useState<string | null>(null);
  const sel = customers.find((c) => c.id === selected);
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-[260px_1fr]">
      <Card title={`Customers (${customers.length})`}>
        {customers.length === 0 && <p className="text-sm text-muted-foreground">No customers yet.</p>}
        <div className="space-y-1">
          {customers.map((c) => (
            <button key={c.id} onClick={() => setSelected(c.id)} className={`block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-secondary ${selected === c.id ? "bg-secondary" : ""}`}>
              {c.username}
            </button>
          ))}
        </div>
      </Card>
      <Card title={sel ? `Activity — ${sel.username}` : "Select a customer"}>
        {sel && (
          <div className="space-y-4">
            <section>
              <h4 className="font-serif text-lg">Favorites</h4>
              <ul className="mt-2 text-sm">
                {sel.favorites.map((pid) => {
                  const p = products.find((p) => p.id === pid);
                  return <li key={pid}>• {p?.name ?? pid}</li>;
                })}
                {sel.favorites.length === 0 && <li className="text-muted-foreground">No favorites.</li>}
              </ul>
            </section>
            <section>
              <h4 className="font-serif text-lg">Cart</h4>
              <ul className="mt-2 text-sm">
                {sel.cart.map((i) => {
                  const p = products.find((p) => p.id === i.productId);
                  return <li key={i.productId}>• {p?.name ?? i.productId} × {i.qty} {i.savedForLater && <span className="text-xs text-muted-foreground">(saved for later)</span>}</li>;
                })}
                {sel.cart.length === 0 && <li className="text-muted-foreground">Empty cart.</li>}
              </ul>
            </section>
          </div>
        )}
      </Card>
    </div>
  );
}

function CartTab() {
  const customers = useStore((s) => s.customers);
  const products = useStore((s) => s.products);
  const all = customers.flatMap((c) => c.cart.filter((i) => !i.savedForLater).map((i) => ({ ...i, customer: c.username })));
  return (
    <div className="mt-6">
      <Card title="All active cart items across customers">
        {all.length === 0 && <p className="text-sm text-muted-foreground">No items in carts.</p>}
        <div className="space-y-2">
          {all.map((i, idx) => {
            const p = products.find((p) => p.id === i.productId);
            return (
              <div key={idx} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>{i.customer} — {p?.name} × {i.qty}</span>
                <span>₹{((p?.price ?? 0) * i.qty).toLocaleString("en-IN")}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function CouponsTab() {
  const coupons = useStore((s) => s.coupons);
  const [draft, setDraft] = useState({ code: "", minAmount: 0, discount: 0 });
  return (
    <div className="mt-6 space-y-4">
      <Card title="Create coupon">
        <div className="grid gap-3 md:grid-cols-3">
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Code e.g. BLOOM10" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
          <input type="number" className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Min purchase amount" value={draft.minAmount || ""} onChange={(e) => setDraft({ ...draft, minAmount: Number(e.target.value) })} />
          <input type="number" className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Discount amount (₹)" value={draft.discount || ""} onChange={(e) => setDraft({ ...draft, discount: Number(e.target.value) })} />
        </div>
        <Button className="mt-3" onClick={() => {
          if (!draft.code) return;
          store.set((s) => ({ ...s, coupons: [...s.coupons, { id: Math.random().toString(36).slice(2, 10), ...draft }] }));
          setDraft({ code: "", minAmount: 0, discount: 0 });
          toast.success("Coupon created");
        }}>Add coupon</Button>
      </Card>
      <Card title={`Active coupons (${coupons.length})`}>
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-mono font-medium">{c.code}</div>
                <div className="text-muted-foreground">Min ₹{c.minAmount} · −₹{c.discount}</div>
              </div>
              <Button size="sm" variant="destructive" onClick={() => store.set((s) => ({ ...s, coupons: s.coupons.filter((x) => x.id !== c.id) }))}>Delete</Button>
            </div>
          ))}
          {coupons.length === 0 && <p className="text-sm text-muted-foreground">No coupons yet.</p>}
        </div>
      </Card>
    </div>
  );
}

function OrdersTab() {
  const orders = useStore((s) => s.orders);
  const site = useStore((s) => s.site);
  const customers = useStore((s) => s.customers);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const printSingleA5 = (o: ConfirmedOrder) => {
    const pdf = new jsPDF({ unit: "mm", format: "a5" });
    drawAddress(pdf, o, site, 10, 10);
    pdf.save(`address-${o.id}.pdf`);
  };

  const printCombinedA4 = () => {
    const list = orders.filter((o) => selected.has(o.id));
    if (list.length === 0) { toast.error("Select orders first"); return; }
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210, pageH = 297, halfH = pageH / 2;
    list.forEach((o, idx) => {
      const slot = idx % 2;
      if (idx > 0 && slot === 0) pdf.addPage();
      const yOffset = slot === 0 ? 0 : halfH;
      // Draw cut line between the two A5 halves
      if (slot === 1) {
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(5, halfH, pageW - 5, halfH);
        pdf.setLineDashPattern([], 0);
      }
      drawAddress(pdf, o, site, 10, yOffset + 10);
    });
    pdf.save(`addresses-combined.pdf`);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button onClick={printCombinedA4} disabled={selected.size === 0}>Print selected ({selected.size}) as A4 combined</Button>
      </div>
      <Card title={`Confirmed orders (${orders.length})`}>
        {orders.length === 0 && <p className="text-sm text-muted-foreground">No confirmed orders yet.</p>}
        <div className="space-y-3">
          {orders.map((o) => {
            const cust = customers.find((c) => c.id === o.customerId);
            return (
              <div key={o.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" checked={selected.has(o.id)} onChange={() => toggle(o.id)} />
                    <div>
                      <div className="font-medium">Order #{o.id} · {cust?.username ?? "—"}</div>
                      <div className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()} · ₹{o.total.toLocaleString("en-IN")} · <span className={o.status === "accepted" ? "text-accent" : "text-muted-foreground"}>{o.status}</span></div>
                      <div className="mt-2 text-sm">To: {o.receiverName} ({o.receiverPhone})</div>
                      <div className="text-sm">{o.address.line1}, {o.address.city}, {o.address.state} - {o.address.pincode}</div>
                      <ul className="mt-2 text-sm text-muted-foreground">
                        {o.items.map((i) => <li key={i.productId}>• {i.name} × {i.qty}</li>)}
                      </ul>
                    </div>
                  </label>
                  <div className="flex flex-col gap-2">
                    {o.status !== "accepted" && (
                      <Button size="sm" onClick={() => store.set((s) => ({ ...s, orders: s.orders.map((x) => x.id === o.id ? { ...x, status: "accepted" } : x) }))}>Accept</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => printSingleA5(o)}>Print A5</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function drawAddress(pdf: jsPDF, o: ConfirmedOrder, site: { name: string; address: string; phone?: string }, x: number, y: number) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("FROM:", x, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(site.name, x, y + 5);
  const fromLines = pdf.splitTextToSize(site.address, 120);
  pdf.text(fromLines, x, y + 10);
  if (site.phone) pdf.text(site.phone, x, y + 10 + fromLines.length * 5);

  const ty = y + 40;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("TO:", x, ty);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.text(o.receiverName, x, ty + 6);
  pdf.setFontSize(10);
  pdf.text(o.receiverPhone, x, ty + 12);
  const toLines = pdf.splitTextToSize(`${o.address.line1}, ${o.address.city}, ${o.address.state} - ${o.address.pincode}`, 120);
  pdf.text(toLines, x, ty + 18);

  pdf.setFontSize(8);
  pdf.text(`Order #${o.id}`, x, ty + 18 + toLines.length * 5 + 6);
}
