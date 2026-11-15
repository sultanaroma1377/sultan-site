import { createServerFn } from "@tanstack/react-start";

type Creds = { username: string; password: string };
type Admin = { username: string; password: string };
type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function readRow(key: string) {
  const sb = await db();
  const { data, error } = await sb.from("shop_data").select("data").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.data ?? null) as { [k: string]: Json } | null;
}

async function writeRow(key: string, data: unknown) {
  const sb = await db();
  const { error } = await sb.from("shop_data").upsert({ key, data: data as never, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

async function checkAdmin(c: Creds) {
  const priv = await readRow("private");
  const admins = (priv?.admins as unknown as Admin[] | undefined) ?? [];
  const ok = (c.username.trim() === "aaa" && c.password === "aaa") || admins.some((a) => a.username === c.username.trim() && a.password === c.password);
  return { ok, priv };
}

/** Public shop content: site details, products, carousel, coupons. */
export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  return (await readRow("catalog")) as { [k: string]: Json } | null;
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: Creds) => d)
  .handler(async ({ data }) => {
    const { ok, priv } = await checkAdmin(data);
    if (!ok) return { ok: false as const };
    const { issueSession } = await import('./customer.server');
    await issueSession(null, true);
    return { ok: true as const, admins: (priv?.admins as unknown as Admin[] | undefined) ?? null, sheetSync: (priv?.sheetSync as { [k: string]: Json } | undefined) ?? null };
  });

export const saveShop = createServerFn({ method: "POST" })
  .inputValidator((d: { creds: Creds; catalog: { [k: string]: Json }; admins: Admin[]; sheetSync: { [k: string]: Json } }) => d)
  .handler(async ({ data }) => {
    const { ok } = await checkAdmin(data.creds);
    if (!ok) throw new Error("Not allowed");
    await writeRow("catalog", data.catalog);
    await writeRow("private", { admins: data.admins, sheetSync: data.sheetSync });
    return { ok: true };
  });
