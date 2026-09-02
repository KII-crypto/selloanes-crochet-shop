import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderInput = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^[0-9+ ()-]{8,20}$/),
  location: z.string().min(1).max(120),
  requestId: z.string().min(8).max(64),
  /** One entry per individual scrunchie, with its own colours. */
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(40),
        colours: z.array(z.string().max(40)).min(1).max(9),
      }),
    )
    .min(1)
    .max(50),
});


const ERRORS: Record<string, string> = {
  WEEKLY_LIMIT: "We've reached our order limit for this week. Please check back next week.",
  INVALID_NAME: "Please enter your full name.",
  INVALID_PHONE: "Please enter a valid phone number.",
  INVALID_LOCATION: "Please choose an available delivery location.",
  PRODUCT_UNAVAILABLE: "One of the sizes you chose is no longer available.",
  EMPTY_ORDER: "Please add at least one scrunchie to your order.",
  QUANTITY_TOO_LARGE: "That quantity is too large — please contact us for bulk orders.",
  NOT_DELIVERED: "You can leave a review once your order has been delivered.",
  ALREADY_REVIEWED: "You've already left a review for this order. Thank you! ♡",
  NOT_FOUND: "We couldn't find that order.",
  INVALID_RATING: "Please choose a star rating.",
};

function friendly(message: string): string {
  const key = Object.keys(ERRORS).find((k) => message.includes(k));
  return key ? ERRORS[key]! : "Something went wrong. Please try again.";
}

export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./public.server");
  const supabase = publicClient();

  const [settings, products, locations, reviews] = await Promise.all([
    supabase.from("business_settings").select("business_name, business_phone, mixed_colour_fee, weekly_order_limit").eq("id", 1).maybeSingle(),
    supabase.from("products").select("slug, name, description, price, available").order("sort_order"),
    supabase.from("delivery_locations").select("name").eq("active", true).order("sort_order"),
    supabase.from("reviews").select("display_name, rating, comment, created_at").eq("approved", true).order("created_at", { ascending: false }).limit(24),
  ]);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: week } = await supabaseAdmin.rpc("get_week_status");
  const weekStatus = (week ?? { used: 0, limit: 5 }) as { used: number; limit: number };

  return {
    settings: {
      business_name: settings.data?.business_name ?? "Selloane's Crochet",
      business_phone: settings.data?.business_phone ?? "",
      mixed_colour_fee: Number(settings.data?.mixed_colour_fee ?? 10),
      weekly_order_limit: Number(settings.data?.weekly_order_limit ?? 5),
    },
    products: (products.data ?? []).map((p) => ({ ...p, price: Number(p.price) })),
    locations: (locations.data ?? []).map((l) => l.name),
    reviews: reviews.data ?? [],
    week: { used: Number(weekStatus.used), limit: Number(weekStatus.limit) },
  };
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const items = data.items.filter((i) => i.colours.length > 0);
    if (items.length === 0) return { ok: false as const, error: ERRORS["EMPTY_ORDER"]! };

    const { data: result, error } = await (supabaseAdmin.rpc as any)("place_order", {
      p_name: data.name,
      p_phone: data.phone,
      p_location: data.location,
      p_items: items,
      p_request_id: data.requestId,
    });


    if (error) {
      const isLimit = error.message.includes("WEEKLY_LIMIT");
      return { ok: false as const, error: friendly(error.message), fullyBooked: isLimit };
    }
    const payload = result as { order_number: string; tracking_token: string; total: number };
    return { ok: true as const, ...payload };
  });

export const getTrackedOrder = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(10).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin.rpc("get_tracked_order", { p_token: data.token });
    if (error || !order) return { ok: false as const, error: "We couldn't find an order for that link." };
    return { ok: true as const, order };
  });

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ token: z.string().min(10).max(120), rating: z.number().int().min(1).max(5), comment: z.string().max(600) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("submit_review", {
      p_token: data.token,
      p_rating: data.rating,
      p_comment: data.comment,
    });
    if (error) return { ok: false as const, error: friendly(error.message) };
    return { ok: true as const };
  });
