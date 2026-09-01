import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { ORDER_STATUSES } from "./shop";

const adminFn = () => createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]);

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const adminWhoAmI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: Boolean(data) };
  });

export const adminOverview = adminFn().handler(async ({ context }) => {
  await assertAdmin(context as any);
  const { data: week } = await context.supabase.rpc("get_week_status");
  const { data: orders } = await context.supabase
    .from("orders")
    .select("id, order_number, customer_name, delivery_location, total, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = orders ?? [];
  const counts: Record<string, number> = {};
  for (const s of ORDER_STATUSES) counts[s] = 0;
  let revenue = 0;
  for (const o of rows) {
    counts[o.status as string] = (counts[o.status as string] ?? 0) + 1;
    if (o.status !== "Cancelled") revenue += Number(o.total);
  }
  const w = (week ?? { used: 0, limit: 5 }) as { used: number; limit: number };
  return {
    week: { used: Number(w.used), limit: Number(w.limit) },
    counts,
    revenue,
    recent: rows.slice(0, 8),
  };
});

export const adminListOrders = adminFn()
  .inputValidator((d: unknown) =>
    z.object({ search: z.string().max(80).default(""), status: z.string().max(30).default("all") }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    let query = context.supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, delivery_location, total, status, created_at, expected_delivery_date")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status !== "all") query = query.eq("status", data.status as never);
    const term = data.search.trim();
    if (term) {
      const safe = term.replace(/[%,()]/g, "");
      query = query.or(
        `order_number.ilike.%${safe}%,customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`,
      );
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { orders: rows ?? [] };
  });

export const adminGetOrder = adminFn()
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { data: order, error } = await context.supabase.from("orders").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found");
    const { data: items } = await context.supabase
      .from("order_items")
      .select("product_name, quantity, unit_price, colours")
      .eq("order_id", data.id)
      .order("created_at");
    return { order, items: items ?? [] };
  });

export const adminUpdateOrder = adminFn()
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(ORDER_STATUSES).optional(),
        expected_delivery_date: z.string().max(20).nullable().optional(),
        admin_notes: z.string().max(4000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const patch: Record<string, unknown> = {};
    if (data.status) patch["status"] = data.status;
    if (data.expected_delivery_date !== undefined)
      patch["expected_delivery_date"] = data.expected_delivery_date || null;
    if (data.admin_notes !== undefined) patch["admin_notes"] = data.admin_notes;
    const { error } = await context.supabase.from("orders").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSettingsData = adminFn().handler(async ({ context }) => {
  await assertAdmin(context as any);
  const [settings, products, locations] = await Promise.all([
    context.supabase.from("business_settings").select("*").eq("id", 1).maybeSingle(),
    context.supabase.from("products").select("*").order("sort_order"),
    context.supabase.from("delivery_locations").select("*").order("sort_order"),
  ]);
  return {
    settings: settings.data,
    products: (products.data ?? []).map((p: any) => ({ ...p, price: Number(p.price) })),
    locations: locations.data ?? [],
  };
});

export const adminSaveSettings = adminFn()
  .inputValidator((d: unknown) =>
    z
      .object({
        business_name: z.string().min(1).max(80),
        business_phone: z.string().regex(/^[0-9+ ()-]{8,20}$/),
        mixed_colour_fee: z.number().min(0).max(10000),
        weekly_order_limit: z.number().int().min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { error } = await context.supabase.from("business_settings").update(data).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveProduct = adminFn()
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(80),
        price: z.number().min(0).max(100000),
        available: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("products").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveLocation = adminFn()
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable(),
        name: z.string().min(2).max(120),
        active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    if (data.id) {
      const { error } = await context.supabase
        .from("delivery_locations")
        .update({ name: data.name, active: data.active })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("delivery_locations")
        .insert({ name: data.name, active: data.active, sort_order: 99 });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteLocation = adminFn()
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { error } = await context.supabase.from("delivery_locations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListReviews = adminFn().handler(async ({ context }) => {
  await assertAdmin(context as any);
  const { data, error } = await context.supabase
    .from("reviews")
    .select("id, display_name, rating, comment, approved, created_at, order_id")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { reviews: data ?? [] };
});

export const adminSetReviewApproved = adminFn()
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), approved: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { error } = await context.supabase.from("reviews").update({ approved: data.approved }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteReview = adminFn()
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { error } = await context.supabase.from("reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const claimOwnerAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) return { ok: false as const, error: "An owner account already exists." };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const ownerExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { exists: (count ?? 0) > 0 };
});
