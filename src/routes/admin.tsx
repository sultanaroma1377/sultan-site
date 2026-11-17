import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { store, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { Product, ConfirmedOrder } from "@/lib/types";
import { mapSheetProducts, mergeSheetProducts, type EcoVariant } from "@/lib/sheet-mapping";
import { productGroups } from "@/lib/product-groups";
import { refreshAdminActivity } from "@/lib/customer-sync";
import { updateCustomerOrder } from "@/lib/customer.functions";
import { adminSignIn } from "@/lib/cloud-sync";

function shrinkImage(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", 0.82)); };
    img.onerror = reject; img.src = url;
  });
}

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [
    { title: "Manage products — SULTAN AL MISK" },
    { name: "description", content: "Manage SULTAN AL MISK products, sheet imports and orders." },
    { property: "og:title", content: "Manage products — SULTAN AL MISK" },
    { property: "og:description", content: "Manage SULTAN AL MISK products, sheet imports and orders." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!authed) return;
    let failed = false;
    const refresh = () => { void refreshAdminActivity().then(() => { failed = false; }).catch(() => { if (!failed) toast.error("Could not load customer activity", { description: "Please sign in to Admin again." }); failed = true; }); };
    refresh(); const timer = window.setInterval(refresh, 4000);
    return () => window.clearInterval(timer);
  }, [authed]);
  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/40 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr("");
            adminSignIn(u, p).then((ok) => ok ? setAuthed(true) : setErr("Invalid credentials")).catch(() => setErr("Could not reach the server. Try again."));
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
  const draft = site;
  const setDraft = (next: typeof site) => store.set(s => ({ ...s, site: next }));
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
            {draft.logo && <img src={draft.logo} alt="logo" className="mt-2 h-16 w-auto max-w-[220px] object-contain" />}
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
  const sync = sheetSync;
  const setSync = (next: typeof sync | ((current: typeof sync) => typeof sync)) => store.set(s => ({ ...s, sheetSync: typeof next === "function" ? next(s.sheetSync) : next }));
  const [syncing, setSyncing] = useState(false);
  const mode = sync.mode;
  const variants = sync.variants ?? [];
  const updateVariant = (index: number, patch: Partial<EcoVariant>) => setSync(s => ({ ...s, variants: (s.variants ?? []).map((v, i) => i === index ? { ...v, ...patch } : v) }));

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
    const { id: _id, ...details } = p;
    setDraft(details);
  };

  const syncSheets = async () => {
    if (!sync.apiKey || !sync.sheetId) { toast.error("Add API key and Sheet ID"); return; }
    if (!mode) { toast.error("Choose G Sheet System or Eco System first"); return; }
    setSyncing(true);
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sync.sheetId}/values/${encodeURIComponent(sync.range || "A1:AA1000")}?key=${sync.apiKey}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Google Sheets [${r.status}]: ${await r.text()}`);
      const j = await r.json();
      if (!j.values) throw new Error(j.error?.message ?? "No values");
      const rows = mapSheetProducts(j.values, mode, variants);
      if (!rows.length) throw new Error("No products could be parsed");
      let created = 0, updated = 0;
      store.set((s) => {
        const result = mergeSheetProducts(s.products, rows);
        created = result.created; updated = result.updated;
        return { ...s, products: result.products };
      });
      toast.success(`Synced: ${created} new, ${updated} updated`);
    } catch (e: unknown) {
      toast.error("Sync failed: " + (e instanceof Error ? e.message : "Unknown error"));
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

      <Card title="Sync from Google Sheets">
        <div className="mb-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mode === "sheet"} onChange={(e) => setSync(s => ({ ...s, mode: e.target.checked ? "sheet" : undefined }))} />G Sheet System</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mode === "eco"} onChange={(e) => setSync(s => ({ ...s, mode: e.target.checked ? "eco" : undefined }))} />Eco System</label>
        </div>
        {mode === "eco" && <div className="mb-4 space-y-3">
          <div className="text-sm font-medium">Eco sizes</div>
          {variants.map((v, i) => <div key={i} className="grid gap-2 sm:grid-cols-[auto_1fr_1fr_1fr_auto]">
            <div className="flex flex-col items-center gap-1 text-xs">
              {v.image ? <img src={v.image} alt={`${v.label} image`} className="rounded-md object-cover" style={{ aspectRatio: "3 / 4", height: "4rem" }} /> : <div className="grid place-items-center rounded-md border text-[10px] text-muted-foreground" style={{ aspectRatio: "3 / 4", height: "4rem" }}>No image</div>}
              <label className="cursor-pointer text-primary hover:underline">{v.image ? "Change" : "Add image"}<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; void shrinkImage(f).then((image) => { updateVariant(i, { image }); toast.success("Size image saved"); }); e.target.value = ""; }} /></label>
              {v.image && <button className="text-destructive hover:underline" onClick={() => updateVariant(i, { image: undefined })}>Remove image</button>}
            </div>
            <label className="text-xs">Size label<input aria-label={`Size label ${i + 1}`} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={v.label} onChange={e => updateVariant(i, { label: e.target.value })} /></label>
            <label className="text-xs">Oil volume (ml)<input aria-label={`Oil volume ${i + 1}`} type="number" min="0.01" step="any" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={v.oilMl || ""} onChange={e => updateVariant(i, { oilMl: Number(e.target.value) })} /></label>
            <label className="text-xs">Packaging cost (₹)<input aria-label={`Packaging cost ${i + 1}`} type="number" min="0" step="any" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={v.packagingCost} onChange={e => updateVariant(i, { packagingCost: Number(e.target.value) })} /></label>
            <Button variant="ghost" className="self-end" onClick={() => setSync(s => ({ ...s, variants: (s.variants ?? []).filter((_, n) => n !== i) }))}>Remove</Button>
          </div>)}
          <Button variant="outline" onClick={() => setSync(s => ({ ...s, variants: [...(s.variants ?? []), { label: "", oilMl: 0, packagingCost: 0 }] }))}>Add size</Button>
        </div>}
        <div className="grid gap-3 md:grid-cols-3">
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Google API Key" value={sync.apiKey} onChange={(e) => setSync({ ...sync, apiKey: e.target.value })} />
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Sheet ID" value={sync.sheetId} onChange={(e) => setSync({ ...sync, sheetId: e.target.value })} />
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Range e.g. A1:AA1000" value={sync.range} onChange={(e) => setSync({ ...sync, range: e.target.value })} />
        </div>
        <Button className="mt-3" onClick={syncSheets} disabled={syncing}>{syncing ? "Syncing…" : "Sync now"}</Button>
        <Button className="mt-3 ml-2" variant="outline" onClick={() => { store.set(s => ({ ...s, sheetSync: sync })); toast.success("Sheet settings saved"); }}>Save settings</Button>
      </Card>

      <Card title={`Products (${productGroups(products).length})`}>
        <div className="space-y-2">
          {productGroups(products).map((group) => {
            const p = group[0];
            if (!p) return null;
            return <div key={p.parentId ?? p.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">{p.baseName ?? p.name}</div>
                <div className="text-sm text-muted-foreground">₹{p.price} · {p.category}</div>
              </div>
              <div className="flex gap-2">
                {!p.parentId && <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Edit</Button>}
                <Button size="sm" variant="destructive" onClick={() => store.set((s) => ({ ...s, products: s.products.filter((x) => !group.some(v => v.id === x.id)) }))}>Delete</Button>
              </div>
              </div>
              {p.parentId && <div className="mt-3 space-y-2 border-t pt-3">{group.map(v => <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 pl-3"><span className="text-sm">{v.variantLabel} · ₹{v.price}</span><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => startEdit(v)}>Edit size</Button><Button size="sm" variant="ghost" onClick={() => store.set(s => ({ ...s, products: s.products.filter(x => x.id !== v.id) }))}>Remove size</Button></div></div>)}</div>}
            </div>
          })}
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
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.baseName ? `${p.baseName}${p.variantLabel ? ` — ${p.variantLabel}` : ""}` : p.name}</option>
              ))}
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
              <h4 className="font-serif text-lg">Order history</h4>
              <ul className="mt-2 space-y-2 text-sm">
                {allOrders.filter((o) => o.customerId === sel.id).sort((a, b) => b.createdAt - a.createdAt).map((o) => (
                  <li key={o.id} className="rounded-md border p-2">
                    <div className="flex justify-between gap-2"><span className="font-medium">#{o.orderNo ?? o.id.slice(0, 8)}</span><span className="capitalize">{o.status}</span></div>
                    <div className="text-muted-foreground">{new Date(o.createdAt).toLocaleString()} · ₹{o.total.toLocaleString("en-IN")}</div>
                    <div>{o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</div>
                    {o.courierName && <div className="text-muted-foreground">Courier: {o.courierName} · {o.courierNo}</div>}
                  </li>
                ))}
                {!allOrders.some((o) => o.customerId === sel.id) && <li className="text-muted-foreground">No orders yet.</li>}
              </ul>
            </section>
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
          if (!draft.code.trim() || draft.discount <= 0) { toast.error("Enter a code and a discount amount"); return; }
          store.set((s) => ({ ...s, coupons: [...s.coupons, { id: Math.random().toString(36).slice(2, 10), ...draft, code: draft.code.trim().toUpperCase() }] }));
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
  const [filter, setFilter] = useState<"all" | "accepted" | "pending" | "dispatched">("all");
  const [courier, setCourier] = useState<Record<string, { name: string; no: string }>>({});
  const shown = orders.filter((o) => filter === "all" ? true : filter === "pending" ? o.status === "pending" || o.status === "rejected" : o.status === filter);
  const act = (id: string, action: "accept" | "reject" | "dispatch" | "courier", extra: { courierName?: string; courierNo?: string } = {}) => {
    void updateCustomerOrder({ data: { id, action, ...extra } }).then(refreshAdminActivity).then(() => toast.success("Order updated")).catch((e: Error) => toast.error(e.message || "Could not update order"));
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const output = (pdf: jsPDF, name: string, direct: boolean) => {
    if (!direct) { pdf.save(name); return; }
    pdf.autoPrint();
    const url = URL.createObjectURL(pdf.output("blob"));
    const frame = document.createElement("iframe");
    frame.style.position = "fixed"; frame.style.width = "0"; frame.style.height = "0"; frame.style.border = "0";
    frame.src = url;
    frame.onload = () => { try { frame.contentWindow?.focus(); frame.contentWindow?.print(); } catch { window.open(url, "_blank"); } setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 60000); };
    document.body.appendChild(frame);
  };

  const qrFor = (o: ConfirmedOrder) => QRCode.toDataURL([
    `Order: ${o.orderNo ?? o.id}`,
    `Customer: ${customers.find((c) => c.id === o.customerId)?.username ?? "-"}`,
    `Receiver: ${o.receiverName}`,
    `Number: ${o.receiverPhone}`,
    `Items: ${o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}`,
    `Confirmed: ${new Date(o.acceptedAt ?? o.createdAt).toLocaleString("en-IN")}`,
  ].join("\n"), { margin: 1, width: 300 });

  const printSingleA5 = async (o: ConfirmedOrder, direct = false) => {
    const pdf = new jsPDF({ unit: "mm", format: "a5" });
    drawAddress(pdf, o, site, 10, 10, await qrFor(o));
    output(pdf, `address-${o.id}.pdf`, direct);
  };

  const printCombinedA4 = async (direct = false) => {
    const qrs = new Map<string, string>();
    for (const o of orders.filter((x) => selected.has(x.id))) qrs.set(o.id, await qrFor(o));
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
      drawAddress(pdf, o, site, 10, yOffset + 10, qrs.get(o.id));
    });
    output(pdf, `addresses-combined.pdf`, direct);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button onClick={() => printCombinedA4(true)} disabled={selected.size === 0}>Print selected ({selected.size}) A4</Button>
        <Button variant="outline" onClick={() => printCombinedA4(false)} disabled={selected.size === 0}>Download selected ({selected.size}) A4</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {([["all", "All"], ["accepted", "Accepted"], ["pending", "Non accepted"], ["dispatched", "Dispatched"]] as const).map(([k, label]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>{label} ({orders.filter((o) => k === "all" ? true : k === "pending" ? o.status === "pending" || o.status === "rejected" : o.status === k).length})</Button>
        ))}
      </div>
      <Card title={`Confirmed orders (${shown.length})`}>
        {shown.length === 0 && <p className="text-sm text-muted-foreground">No orders here.</p>}
        <div className="space-y-3">
          {shown.map((o) => {
            const cust = customers.find((c) => c.id === o.customerId);
            return (
              <div key={o.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" checked={selected.has(o.id)} onChange={() => toggle(o.id)} />
                    <div>
                      <div className="font-medium">Order #{o.orderNo ?? o.id} · {cust?.username ?? "—"}</div>
                      <div className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()} · ₹{o.total.toLocaleString("en-IN")} · <span className="font-medium capitalize">{o.status}</span></div>
                      <div className="mt-2 text-sm">To: {o.receiverName} ({o.receiverPhone})</div>
                      <div className="text-sm">{o.address.line1}, {o.address.city}, {o.address.state} - {o.address.pincode}</div>
                      <ul className="mt-2 text-sm text-muted-foreground">
                        {o.items.map((i) => <li key={i.productId}>• {i.name} × {i.qty}</li>)}
                      </ul>
                    </div>
                  </label>
                  <div className="flex flex-col gap-2">
                    {(o.status === "pending" || o.status === "rejected") && <Button size="sm" onClick={() => act(o.id, "accept")}>Accept</Button>}
                    {(o.status === "pending" || o.status === "accepted") && <Button size="sm" variant="destructive" onClick={() => act(o.id, "reject")}>Reject</Button>}
                    {o.status === "accepted" && <Button size="sm" onClick={() => act(o.id, "dispatch")}>Mark dispatched</Button>}
                    {o.status === "dispatched" && (
                      <div className="flex flex-col gap-1">
                        {o.courierName && <span className="text-xs">Courier: {o.courierName} · {o.courierNo}</span>}
                        <input className="rounded-md border bg-background px-2 py-1 text-xs" placeholder="Courier name" value={courier[o.id]?.name ?? o.courierName ?? ""} onChange={(e) => setCourier({ ...courier, [o.id]: { name: e.target.value, no: courier[o.id]?.no ?? o.courierNo ?? "" } })} />
                        <input className="rounded-md border bg-background px-2 py-1 text-xs" placeholder="Tracking no." value={courier[o.id]?.no ?? o.courierNo ?? ""} onChange={(e) => setCourier({ ...courier, [o.id]: { name: courier[o.id]?.name ?? o.courierName ?? "", no: e.target.value } })} />
                        <Button size="sm" onClick={() => act(o.id, "courier", { courierName: courier[o.id]?.name ?? o.courierName, courierNo: courier[o.id]?.no ?? o.courierNo })}>Save courier</Button>
                      </div>
                    )}
                    <Button size="sm" variant="outline" onClick={() => printSingleA5(o, true)}>Print A5</Button>
                    <Button size="sm" variant="outline" onClick={() => printSingleA5(o)}>Download A5</Button>
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

function drawAddress(pdf: jsPDF, o: ConfirmedOrder, site: { name: string; address: string; phone?: string }, x: number, y: number, qr?: string) {
  if (qr) pdf.addImage(qr, "PNG", x + 92, y + 38, 34, 34);
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
  const toLines = pdf.splitTextToSize(`${o.address.line1}, ${o.address.city}, ${o.address.state} - ${o.address.pincode}`, qr ? 88 : 120);
  pdf.text(toLines, x, ty + 18);

  pdf.setFontSize(8);
  pdf.text(`Order #${o.orderNo ?? o.id}`, x, ty + 18 + toLines.length * 5 + 6);
}
