import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteShell, Section, Eyebrow } from "@/components/SiteShell";
import { StatusTimeline } from "@/components/StatusTimeline";
import { Stars, StarPicker } from "@/components/Stars";
import { getTrackedOrder, submitReview } from "@/lib/storefront.functions";
import { rand, formatDate, statusLabel, type TrackedOrder } from "@/lib/shop";

type Search = { t?: string };

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof search["t"] === "string") out.t = search["t"].slice(0, 120);
    return out;
  },
  head: () => ({
    meta: [
      { title: "Track Your Order — Selloane's Crochet" },
      {
        name: "description",
        content: "Follow your handmade crochet scrunchie order from Received to Delivered with your private tracking link.",
      },
      { property: "og:title", content: "Track Your Order — Selloane's Crochet" },
      { property: "og:description", content: "Follow your order from Received to Delivered." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { t } = Route.useSearch();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const fetchOrder = useServerFn(getTrackedOrder);

  const query = useQuery({
    queryKey: ["tracking", t],
    queryFn: () => fetchOrder({ data: { token: t! } }),
    enabled: Boolean(t),
    refetchInterval: 30_000,
  });

  return (
    <SiteShell>
      <div className="warm-gradient">
        <Section className="text-center">
          <Eyebrow>Track order</Eyebrow>
          <h1 className="mt-5 text-4xl font-semibold text-primary sm:text-5xl">Where's my order?</h1>
          <p className="mx-auto mt-4 max-w-xl text-foreground/75">
            Open the private tracking link from your confirmation, or paste your tracking code below.
          </p>
        </Section>
      </div>

      <Section className="pt-4">
        {!t && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = input.trim();
              if (!value) return;
              const token = value.includes("t=") ? value.split("t=").pop()!.split("&")[0]! : value;
              navigate({ to: "/track", search: { t: token } });
            }}
            className="surface-card mx-auto max-w-lg p-6"
          >
            <label className="block">
              <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Tracking link or code
              </span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 text-base outline-none focus:border-primary"
                placeholder="Paste your tracking link here"
              />
            </label>
            <button
              type="submit"
              className="mt-5 h-12 w-full rounded-full bg-primary text-sm font-bold tracking-wide text-primary-foreground uppercase"
            >
              Find my order
            </button>
            <p className="mt-4 text-xs text-muted-foreground">
              For your privacy, orders can only be opened with their private link — an order number on its own
              won't work.
            </p>
          </form>
        )}

        {t && query.isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        )}

        {t && query.data && !query.data.ok && (
          <div className="surface-card mx-auto max-w-lg p-8 text-center">
            <p className="font-display text-xl font-semibold text-primary">Order not found</p>
            <p className="mt-2 text-muted-foreground">{query.data.error}</p>
            <button
              onClick={() => navigate({ to: "/track", search: {} })}
              className="mt-6 rounded-full border border-border px-5 py-2 text-sm font-bold text-primary uppercase"
            >
              Try another link
            </button>
          </div>
        )}

        {t && query.data?.ok && <OrderView order={query.data.order as TrackedOrder} token={t} />}
      </Section>
    </SiteShell>
  );
}

function OrderView({ order, token }: { order: TrackedOrder; token: string }) {
  const queryClient = useQueryClient();
  const send = useServerFn(submitReview);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
      <div className="surface-card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-primary">Order #{order.order_number}</h2>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">{statusLabel(order.status)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Placed {formatDate(order.created_at)}</p>

        <div className="mt-6 space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between gap-3 text-sm">
              <span>
                <span className="font-semibold">
                  Scrunchie #{i + 1} — {item.name}
                </span>
                {item.colours.length > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    {item.colours.join(" + ")}
                    {item.colours.length > 1 ? " · mixed colours" : " · single colour"}
                  </span>
                )}
              </span>
              <span className="font-semibold">
                {rand(Number(item.line_total ?? Number(item.unit_price) * item.quantity))}
              </span>
            </div>
          ))}

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{rand(order.subtotal)}</span>
          </div>
          {Number(order.mixed_colour_fee) > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Mixed-colour fees</span>
              <span>{rand(order.mixed_colour_fee)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <span className="font-display text-lg font-semibold text-primary">TOTAL</span>
            <span className="font-display text-xl font-semibold text-primary">{rand(order.total)}</span>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Delivery location</dt>
            <dd className="mt-1 font-semibold">{order.delivery_location}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Expected delivery</dt>
            <dd className="mt-1 font-semibold">
              {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : "To be confirmed"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs font-semibold text-clay">🚚 Local delivery only</p>
      </div>

      <div className="space-y-6">
        <div className="surface-card p-6">
          <h3 className="font-display text-lg font-semibold text-primary">Progress</h3>
          <div className="mt-4">
            <StatusTimeline status={order.status} />
          </div>
        </div>

        {order.status === "Delivered" && (
          <div className="surface-card p-6">
            <h3 className="font-display text-lg font-semibold text-primary">Leave a review ♡</h3>
            {order.review ? (
              <div className="mt-4">
                <Stars rating={order.review.rating} />
                <p className="mt-2 text-sm text-foreground/80">{order.review.comment}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {order.review.approved
                    ? "Your review is live on the reviews page. Thank you! ♡"
                    : "Thank you! Your review is waiting for Selloane to approve it."}
                </p>
              </div>
            ) : (
              <form
                className="mt-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (rating < 1) {
                    toast.error("Please choose a star rating.");
                    return;
                  }
                  setBusy(true);
                  const result = await send({ data: { token, rating, comment } });
                  setBusy(false);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Thank you! Your review was sent for approval.");
                  await queryClient.invalidateQueries({ queryKey: ["tracking", token] });
                }}
              >
                <StarPicker value={rating} onChange={setRating} />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={600}
                  rows={4}
                  placeholder="Tell us how you like your scrunchies…"
                  className="mt-3 w-full rounded-2xl border border-input bg-card p-4 text-base outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold tracking-wide text-primary-foreground uppercase disabled:opacity-60"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Send review
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
