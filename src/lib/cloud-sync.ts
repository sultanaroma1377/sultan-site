import { toast } from "sonner";
import { store } from "./store";
import { adminLogin, getCatalog, saveShop } from "./cloud.functions";

const CREDS_KEY = "sultan_admin_session";
let applyingRemote = false;
let started = false;
let catalogMissing = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function creds(): { username: string; password: string } | null {
  try { return JSON.parse(sessionStorage.getItem(CREDS_KEY) ?? "null"); } catch { return null; }
}

function snapshot() {
  const s = store.get();
  return { catalog: { site: s.site, products: s.products, carousel: s.carousel, coupons: s.coupons }, admins: s.admins, sheetSync: s.sheetSync };
}

async function pushNow() {
  const c = creds();
  if (!c) return;
  try {
    await saveShop({ data: { creds: c, ...snapshot() } as never });
    catalogMissing = false;
  } catch {
    toast.error("Changes not saved online", { description: "Check your connection and try again." });
  }
}

function schedulePush() {
  clearTimeout(timer);
  timer = setTimeout(pushNow, 700);
}

/** Load shop content from Lovable Cloud and keep admin edits saved online. */
export async function startCloudSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  let last = snapshot();
  store.subscribe(() => {
    const next = snapshot();
    const changed = next.catalog.site !== last.catalog.site || next.catalog.products !== last.catalog.products || next.catalog.carousel !== last.catalog.carousel || next.catalog.coupons !== last.catalog.coupons || next.admins !== last.admins || next.sheetSync !== last.sheetSync;
    last = next;
    if (changed && !applyingRemote && creds()) schedulePush();
  });
  try {
    const remote = await getCatalog();
    if (!remote) { catalogMissing = true; return; }
    applyingRemote = true;
    store.set((s) => ({ ...s, ...(remote as object) }));
  } catch {
    toast.error("Could not load the latest shop content");
  } finally {
    applyingRemote = false;
  }
}

export async function adminSignIn(username: string, password: string) {
  const res = await adminLogin({ data: { username, password } });
  if (!res.ok) return false;
  sessionStorage.setItem(CREDS_KEY, JSON.stringify({ username: username.trim(), password }));
  applyingRemote = true;
  try {
    store.set((s) => ({ ...s, ...(res.admins ? { admins: res.admins } : {}), ...(res.sheetSync ? { sheetSync: res.sheetSync as typeof s.sheetSync } : {}) }));
  } finally { applyingRemote = false; }
  if (catalogMissing || !res.admins) await pushNow();
  return true;
}
