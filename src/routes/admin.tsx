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
            const ok = (u.trim() === "aaa" && p === "aaa") || admins.find((a) => a.username === u.trim() && a.password === p);
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
            <TabsTrigger value="carousel">Carousel</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="cart">Cart</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
            <TabsTrigger value="orders">Confirmed orders</TabsTrigger>
          </TabsList>
          <TabsContent value="site"><SiteTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="carousel"><CarouselTab /></TabsContent>
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
  const commonImg = useStore((s) => s.commonProductImage);
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
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sync.sheetId}/values/${encodeURIComponent(sync.range || "A1:AA1000")}?key=${sync.apiKey}`;
      const r = await fetch(url);
      const j = await r.json();
      if (!j.values) throw new Error(j.error?.message ?? "No values");
      // Mapping (same as Push My Code): row 1 = size labels over 4-col blocks starting E,I,M,Q,U;
      // data from row 3; A = id, B = base name; block: total cost, ml cost, price, profit;
      // Y/Z/AA = individual product name / cost / price.
      const all: string[][] = j.values;
      if (all.length < 3) throw new Error("No data rows (data starts at row 3)");
      const header = all[0] || [];
      const skuPrefix = (l: string) => { const n = (l || "").toLowerCase().replace(/\s+/g, ""); const m = n.match(/(\d+)ml/); return m ? `${m[1]}m` : n.replace(/[^a-z0-9]/g, "") || "x"; };
      const blocks = [4, 8, 12, 16, 20].map((c) => ({ c, label: (header[c] || "").toString().trim() })).filter((b) => b.label);
      const rows: Product[] = [];
      for (const row of all.slice(2)) {
        const rid = row[0]?.toString().trim();
        const base = row[1]?.toString().trim();
        if (!base) continue;
        for (const b of blocks) {
          rows.push({ id: `${skuPrefix(b.label)}${rid}`, name: `${base} ${b.label}`, price: parseFloat(row[b.c + 2]) || 0, category: "Perfume" });
        }
        const idv = row[24]?.toString().trim();
        if (idv) rows.push({ id: `idv${rid}`, name: idv, price: parseFloat(row[26]) || 0, category: "Accessory" });
      }
      if (!rows.length) throw new Error("No products could be parsed");
      let created = 0, updated = 0;
      store.set((s) => {
        const map = new Map(s.products.map((p) => [p.id, p]));
        for (const r of rows) { const ex = map.get(r.id); if (ex) { updated++; map.set(r.id, { ...ex, name: r.name, price: r.price, category: r.category }); } else { created++; map.set(r.id, r); } }
        return { ...s, products: [...map.values()] };
      });
      toast.success(`Synced: ${created} new, ${updated} updated`);
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
          <div className="rounded-md border p-3 md:col-span-2">
            <p className="mb-2 text-sm font-medium">Product image</p>
            <div className="mb-3 flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={!draft.image} onChange={() => setDraft({ ...draft, image: undefined })} />
                Keep default image
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={!!draft.image} onChange={() => {}} />
                Upload from device
              </label>
            </div>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => setDraft((d) => ({ ...d, image: reader.result as string }));
                reader.readAsDataURL(f);
              }}
            />
            {draft.image && (
              <div className="mt-3 flex items-center gap-3">
                <img src={draft.image} alt="preview" className="h-24 w-18 rounded-md object-cover" style={{ aspectRatio: "3 / 4", height: "6rem" }} />
                <Button size="sm" variant="ghost" onClick={() => setDraft({ ...draft, image: undefined })}>Remove / use default</Button>
              </div>
            )}
          </div>
          <textarea className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" placeholder="Description" value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={save}>{editing ? "Update" : "Add"}</Button>
          {editing && <Button variant="ghost" onClick={() => { setEditing(null); setDraft({ name: "", price: 0, description: "", category: "" }); }}>Cancel</Button>}
        </div>
      </Card>

      <Card title="Common product image">
        <p className="mb-3 text-sm text-muted-foreground">Shown on every product that has no image of its own (including synced products).</p>
        <div className="flex flex-wrap items-center gap-4">
          {commonImg ? <img src={commonImg} alt="Common" className="rounded-md object-cover" style={{ aspectRatio: "3 / 4", height: "8rem" }} /> : <div className="grid place-items-center rounded-md border text-xs text-muted-foreground" style={{ aspectRatio: "3 / 4", height: "8rem" }}>No image</div>}
          <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-secondary">
            {commonImg ? "Change image" : "Upload image"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { store.set((s) => ({ ...s, commonProductImage: r.result as string })); toast.success("Common image saved"); }; r.readAsDataURL(f); e.target.value = ""; }} />
          </label>
          {commonImg && <Button size="sm" variant="destructive" onClick={() => store.set((s) => ({ ...s, commonProductImage: undefined }))}>Delete</Button>}
        </div>
      </Card>

      <Card title="Sync from Google Sheets">
        <p className="mb-3 text-sm text-muted-foreground">Row 1: size labels (e.g. 3ml, 6ml) above columns E, I, M, Q, U. Data from row 3: A = id, B = name, each size block = total cost, ml cost, price, profit. Y/Z/AA = individual item name, cost, price. Existing products are updated, new ones added.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Google API Key" value={sync.apiKey} onChange={(e) => setSync({ ...sync, apiKey: e.target.value })} />
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Sheet ID" value={sync.sheetId} onChange={(e) => setSync({ ...sync, sheetId: e.target.value })} />
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Range e.g. A1:AA1000" value={sync.range} onChange={(e) => setSync({ ...sync, range: e.target.value })} />
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

function CarouselTab() {
  const slides = useStore((s) => s.carousel);
  const products = useStore((s) => s.products);
  const [image, setImage] = useState<string | undefined>();
  const [productId, setProductId] = useState("");
  const [caption, setCaption] = useState("");

  const add = () => {
    if (!image && !productId) { toast.error("Upload an image or select a product"); return; }
    store.set((s) => ({
      ...s,
      carousel: [...s.carousel, { id: Math.random().toString(36).slice(2, 10), image, productId: productId || undefined, caption: caption || undefined }],
    }));
    setImage(undefined);
    setProductId("");
    setCaption("");
    toast.success("Slide added");
  };

  return (
    <div className="mt-6 space-y-6">
      <Card title="Add carousel slide">
        <p className="mb-3 text-sm text-muted-foreground">
          Upload an image from your device and/or link a product. Linked slides open that product's details page when clicked.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">Image (upload from device)
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => setImage(reader.result as string);
                reader.readAsDataURL(f);
              }}
            />
          </label>
          <label className="text-sm">Link a product (optional)
            <select className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">— none —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="text-sm md:col-span-2">Caption (optional)
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </label>
        </div>
        {image && <img src={image} alt="preview" className="mt-3 h-28 w-full max-w-sm rounded-md object-cover" />}
        <Button className="mt-3" onClick={add}>Add slide</Button>
      </Card>

      <Card title={`Slides (${slides.length})`}>
        {slides.length === 0 && <p className="text-sm text-muted-foreground">No slides yet.</p>}
        <div className="space-y-2">
          {slides.map((sl, idx) => {
            const p = products.find((x) => x.id === sl.productId);
            const img = sl.image ?? p?.image;
            return (
              <div key={sl.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="flex items-center gap-3">
                  {img ? <img src={img} alt="" className="h-12 w-20 rounded object-cover" /> : <div className="grid h-12 w-20 place-items-center rounded bg-secondary text-xs">No image</div>}
                  <div className="text-sm">
                    <div className="font-medium">{sl.caption ?? p?.name ?? "Slide"}</div>
                    <div className="text-muted-foreground">{p ? `Links to ${p.name}` : "Image only"}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={idx === 0} onClick={() => store.set((s) => {
                    const c = [...s.carousel];
                    [c[idx - 1], c[idx]] = [c[idx]!, c[idx - 1]!];
                    return { ...s, carousel: c };
                  })}>↑</Button>
                  <Button size="sm" variant="outline" disabled={idx === slides.length - 1} onClick={() => store.set((s) => {
                    const c = [...s.carousel];
                    [c[idx + 1], c[idx]] = [c[idx]!, c[idx + 1]!];
                    return { ...s, carousel: c };
                  })}>↓</Button>
                  <Button size="sm" variant="destructive" onClick={() => store.set((s) => ({ ...s, carousel: s.carousel.filter((x) => x.id !== sl.id) }))}>Delete</Button>
                </div>
              </div>
            );
          })}
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
