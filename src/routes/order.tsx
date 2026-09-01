import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { Copy, Check, Minus, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteShell, Section, Eyebrow } from "@/components/SiteShell";
import { storefrontQuery } from "@/lib/queries";
import { COLOURS, COLOUR_SWATCH, rand } from "@/lib/shop";
import { productImage } from "@/components/productImages";
import { placeOrder } from "@/lib/storefront.functions";

type Search = { add?: string; colour?: string };

export const Route = createFileRoute("/order")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof search["add"] === "string") out.add = search["add"].slice(0, 40);
    if (typeof search["colour"] === "string") out.colour = search["colour"].slice(0, 40);
    return out;
  },
  head: () => ({
    meta: [
      { title: "Place an Order — Selloane's Crochet" },
      {
        name: "description",
        content: "Build your order of handmade chunky crochet scrunchies and get a private tracking link.",
      },
      { property: "og:title", content: "Place an Order — Selloane's Crochet" },
      { property: "og:description", content: "Choose sizes, colours and quantities, then order for local delivery." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  component: OrderPage,
});

type Line = { quantity: number; colours: string[] };

function OrderPage() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submit = useServerFn(placeOrder);

  const [lines, setLines] = useState<Record<string, Line>>(() => {
    const init: Record<string, Line> = {};
    for (const p of data.products) {
      const isAdded = search.add === p.slug && p.available;
      init[p.slug] = {
        quantity: isAdded ? 1 : 0,
        colours: isAdded && search.colour ? [search.colour] : [],
      };
    }
    return init;
  });
  const [mixColours, setMixColours] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState(data.locations[0] ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [confirmation, setConfirmation] = useState<{ order_number: string; tracking_token: string; total: number } | null>(null);
  const requestId = useRef<string>(
    `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`,
  );

  const fullyBooked = data.week.used >= data.week.limit;

  const summary = useMemo(() => {
    const rows = data.products
      .filter((p) => (lines[p.slug]?.quantity ?? 0) > 0)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        quantity: lines[p.slug]!.quantity,
        colours: lines[p.slug]!.colours,
        lineTotal: p.price * lines[p.slug]!.quantity,
        price: p.price,
      }));
    const subtotal = rows.reduce((s, r) => s + r.lineTotal, 0);
    const fee = mixColours ? data.settings.mixed_colour_fee : 0;
    return { rows, subtotal, fee, total: subtotal + fee };
  }, [lines, mixColours, data]);

  function setQty(slug: string, delta: number) {
    setLines((prev) => {
      const line = prev[slug] ?? { quantity: 0, colours: [] };
      const quantity = Math.max(0, Math.min(50, line.quantity + delta));
      return { ...prev, [slug]: { ...line, quantity } };
    });
  }

  function toggleColour(slug: string, colour: string) {
    setLines((prev) => {
      const line = prev[slug] ?? { quantity: 0, colours: [] };
      const has = line.colours.includes(colour);
      return {
        ...prev,
        [slug]: {
          ...line,
          colours: has ? line.colours.filter((c) => c !== colour) : [...line.colours, colour],
        },
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const problems: string[] = [];
    if (summary.rows.length === 0) problems.push("Add at least one scrunchie to your order.");
    for (const row of summary.rows) {
      if (row.colours.length === 0) problems.push(`Choose at least one colour for ${row.name}.`);
    }
    if (name.trim().length < 2) problems.push("Enter your full name.");
    if (!/^[0-9+ ()-]{8,20}$/.test(phone.trim())) problems.push("Enter a valid phone number.");
    if (!location) problems.push("Choose a delivery location.");
    setErrors(problems);
    if (problems.length > 0) return;

    setSubmitting(true);
    try {
      const result = await submit({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          location,
          mixColours,
          requestId: requestId.current,
          items: summary.rows.map((r) => ({ slug: r.slug, quantity: r.quantity, colours: r.colours })),
        },
      });
      if (!result.ok) {
        setErrors([result.error]);
        toast.error(result.error);
        await queryClient.invalidateQueries({ queryKey: ["storefront"] });
        return;
      }
      setConfirmation(result);
      await queryClient.invalidateQueries({ queryKey: ["storefront"] });
    } catch {
      setErrors(["We couldn't place your order right now. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <SiteShell>
        <Section>
          <div className="surface-card warm-gradient mx-auto max-w-xl animate-rise-in p-8 text-center sm:p-12">
            <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">🎉 ORDER RECEIVED!</h1>
            <p className="mt-4 text-foreground/80">
              Thank you for ordering from Selloane's Crochet. ♡
            </p>
            <div className="mt-6 rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Your order number</p>
              <p className="mt-1 font-display text-3xl font-semibold text-primary">
                Order #{confirmation.order_number}
              </p>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(confirmation.order_number);
                  setCopied(true);
                  toast.success("Order number copied");
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy order number"}
              </button>
              <p className="mt-4 text-sm font-semibold text-clay">Status: Received</p>
              <p className="mt-1 text-sm text-muted-foreground">Total paid on delivery: {rand(confirmation.total)}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/track", search: { t: confirmation.tracking_token } })}
              className="mt-7 inline-flex h-13 items-center justify-center rounded-full bg-primary px-9 text-sm font-bold tracking-wide text-primary-foreground uppercase shadow-lift"
            >
              Track my order →
            </button>
            <p className="mt-4 text-xs text-muted-foreground">
              Bookmark your tracking page — the link is private to you.
            </p>
          </div>
        </Section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="warm-gradient">
        <Section className="text-center">
          <Eyebrow>Order</Eyebrow>
          <h1 className="mt-5 text-4xl font-semibold text-primary sm:text-5xl">Build your order</h1>
          <p className="mx-auto mt-4 max-w-xl text-foreground/75">
            Choose your sizes, quantities and colours. Your total updates as you go.
          </p>
        </Section>
      </div>

      {fullyBooked ? (
        <Section>
          <div className="surface-card mx-auto max-w-lg p-10 text-center">
            <p className="font-display text-3xl font-semibold text-primary">❤️ FULLY BOOKED</p>
            <p className="mt-3 text-foreground/80">We've reached our {data.week.limit} orders for this week.</p>
            <p className="text-foreground/80">Please check back next week.</p>
            <Link to="/shop" className="mt-6 inline-block text-sm font-bold text-primary uppercase">
              Browse the shop →
            </Link>
          </div>
        </Section>
      ) : (
        <Section className="pt-4">
          <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <div className="space-y-5">
              {data.products.map((p) => {
                const line = lines[p.slug] ?? { quantity: 0, colours: [] };
                return (
                  <div key={p.slug} className="surface-card overflow-hidden p-5">
                    <div className="flex gap-4">
                      <img
                        src={productImage(p.slug)}
                        alt={p.name}
                        loading="lazy"
                        width={912}
                        height={912}
                        className="size-20 shrink-0 rounded-2xl object-cover sm:size-24"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h2 className="font-display text-lg font-semibold text-primary">{p.name}</h2>
                          <span className="font-display text-lg font-semibold text-clay">{rand(p.price)}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                        {!p.available && (
                          <p className="mt-2 text-sm font-bold text-destructive">Currently unavailable</p>
                        )}
                      </div>
                    </div>

                    {p.available && (
                      <>
                        <div className="mt-4 flex items-center gap-4">
                          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                            Quantity
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Decrease ${p.name} quantity`}
                              onClick={() => setQty(p.slug, -1)}
                              disabled={line.quantity === 0}
                              className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-primary disabled:opacity-40"
                            >
                              <Minus className="size-4" />
                            </button>
                            <span className="w-10 text-center font-display text-xl font-semibold">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${p.name} quantity`}
                              onClick={() => setQty(p.slug, 1)}
                              className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                        </div>

                        {line.quantity > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                              Colours for this size
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {COLOURS.map((c) => {
                                const active = line.colours.includes(c);
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => toggleColour(p.slug, c)}
                                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                                      active
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-card text-foreground/70 hover:border-primary/40"
                                    }`}
                                  >
                                    <span
                                      className="size-3.5 rounded-full border border-black/10"
                                      style={{ backgroundColor: COLOUR_SWATCH[c] }}
                                    />
                                    {c}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              <label className="surface-card flex cursor-pointer items-start gap-4 p-5">
                <input
                  type="checkbox"
                  checked={mixColours}
                  onChange={(e) => setMixColours(e.target.checked)}
                  className="mt-1 size-5 accent-[oklch(0.4_0.13_20)]"
                />
                <span>
                  <span className="font-display text-lg font-semibold text-primary">Mix my colours</span>
                  <span className="block text-sm text-muted-foreground">
                    Let Selloane blend your chosen colours together. Adds{" "}
                    {rand(data.settings.mixed_colour_fee)} once per order, no matter how many scrunchies.
                  </span>
                </span>
              </label>

              {/* CUSTOMER DETAILS */}
              <div className="surface-card p-5">
                <h2 className="font-display text-xl font-semibold text-primary">Your details</h2>
                <p className="mt-1 text-sm font-semibold text-clay">🚚 Local delivery only</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                      Full name
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      maxLength={80}
                      className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 text-base outline-none focus:border-primary"
                      placeholder="e.g. Nomsa Dlamini"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                      Phone number
                    </span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={20}
                      className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 text-base outline-none focus:border-primary"
                      placeholder="e.g. 0821234567"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                      Delivery location
                    </span>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 text-base outline-none focus:border-primary"
                    >
                      {data.locations.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Your phone number is private and is only used by Selloane to arrange your delivery.
                </p>
              </div>
            </div>

            {/* SUMMARY */}
            <aside className="surface-card sticky top-24 p-6">
              <h2 className="font-display text-xl font-semibold text-primary">Order summary</h2>
              <div className="mt-4 space-y-3">
                {summary.rows.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nothing added yet — pick a size to begin.</p>
                )}
                {summary.rows.map((r) => (
                  <div key={r.slug} className="flex justify-between gap-3 text-sm">
                    <span>
                      <span className="font-semibold">
                        {r.name.replace(" Scrunchie", "")} x{r.quantity}
                      </span>
                      {r.colours.length > 0 && (
                        <span className="block text-xs text-muted-foreground">{r.colours.join(", ")}</span>
                      )}
                    </span>
                    <span className="font-semibold">{rand(r.lineTotal)}</span>
                  </div>
                ))}
                {mixColours && (
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Mixed colours</span>
                    <span className="font-semibold">{rand(summary.fee)}</span>
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
                <span className="font-display text-lg font-semibold text-primary">TOTAL</span>
                <span className="font-display text-2xl font-semibold text-primary">{rand(summary.total)}</span>
              </div>

              {errors.length > 0 && (
                <ul className="mt-4 list-inside list-disc rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold tracking-wide text-primary-foreground uppercase shadow-lift disabled:opacity-60"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {submitting ? "Placing order…" : "Place order"}
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {data.week.limit - data.week.used} of {data.week.limit} order slots left this week.
              </p>
            </aside>
          </form>
        </Section>
      )}
    </SiteShell>
  );
}
