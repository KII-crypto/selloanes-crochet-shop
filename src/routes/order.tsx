import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { Copy, Check, Loader2, Plus, Trash2 } from "lucide-react";
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

/** One scrunchie the customer is building. Colours belong to this scrunchie only. */
type Scrunchie = { key: string; slug: string; colours: string[] };

let counter = 0;
const nextKey = () => `s${++counter}_${Math.random().toString(36).slice(2, 7)}`;

function OrderPage() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submit = useServerFn(placeOrder);

  const available = data.products.filter((p) => p.available);
  const defaultSlug = available.find((p) => p.slug === "medium")?.slug ?? available[0]?.slug ?? "";

  const [items, setItems] = useState<Scrunchie[]>(() => {
    const preset = available.find((p) => p.slug === search.add);
    return [
      {
        key: nextKey(),
        slug: preset?.slug ?? defaultSlug,
        colours: preset && search.colour ? [search.colour] : [],
      },
    ];
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState(data.locations[0] ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    order_number: string;
    tracking_token: string;
    total: number;
  } | null>(null);
  const requestId = useRef<string>(`req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`);

  const fullyBooked = data.week.used >= data.week.limit;
  const fee = data.settings.mixed_colour_fee;
  const priceOf = (slug: string) => data.products.find((p) => p.slug === slug)?.price ?? 0;
  const nameOf = (slug: string) => data.products.find((p) => p.slug === slug)?.name ?? slug;

  const summary = useMemo(() => {
    const rows = items.map((it) => {
      const base = priceOf(it.slug);
      const mixed = it.colours.length > 1;
      const extra = mixed ? fee : 0;
      return { ...it, base, mixed, extra, total: base + extra };
    });
    const subtotal = rows.reduce((s, r) => s + r.base, 0);
    const fees = rows.reduce((s, r) => s + r.extra, 0);
    return { rows, subtotal, fees, total: subtotal + fees };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, data]);

  function addScrunchie() {
    setItems((prev) => [...prev, { key: nextKey(), slug: defaultSlug, colours: [] }]);
  }
  function removeScrunchie(key: string) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((i) => i.key !== key)));
  }
  function setSlug(key: string, slug: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, slug } : i)));
  }
  function toggleColour(key: string, colour: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? {
              ...i,
              colours: i.colours.includes(colour)
                ? i.colours.filter((c) => c !== colour)
                : [...i.colours, colour],
            }
          : i,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const problems: string[] = [];
    if (items.length === 0) problems.push("Add at least one scrunchie to your order.");
    items.forEach((it, i) => {
      if (!it.slug) problems.push(`Choose a size for scrunchie #${i + 1}.`);
      if (it.colours.length === 0) problems.push(`Choose at least one colour for scrunchie #${i + 1}.`);
    });
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
          requestId: requestId.current,
          items: items.map((i) => ({ slug: i.slug, colours: i.colours })),
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
            <p className="mt-4 text-foreground/80">Thank you for ordering from Selloane's Crochet. ♡</p>
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
              <p className="mt-4 text-sm font-semibold text-clay">Status: 🟡 Awaiting confirmation</p>
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
            Add one card per scrunchie. Each scrunchie has its own size and colours — pick more than one colour and
            that scrunchie becomes mixed colour (+{rand(fee)}).
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
              {summary.rows.map((row, index) => (
                <div key={row.key} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={productImage(row.slug)}
                        alt={nameOf(row.slug)}
                        loading="lazy"
                        width={912}
                        height={912}
                        className="size-14 shrink-0 rounded-2xl object-cover"
                      />
                      <div>
                        <h2 className="font-display text-lg font-semibold text-primary">Scrunchie #{index + 1}</h2>
                        <p className="text-xs text-muted-foreground">
                          {row.mixed ? "Mixed colours" : row.colours.length === 1 ? "Single colour" : "Pick colours"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-semibold text-primary">{rand(row.total)}</p>
                      {row.mixed && (
                        <p className="text-xs text-muted-foreground">
                          {rand(row.base)} + {rand(row.extra)} mixed
                        </p>
                      )}
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScrunchie(row.key)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-destructive"
                        >
                          <Trash2 className="size-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Size</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {available.map((p) => (
                        <button
                          key={p.slug}
                          type="button"
                          onClick={() => setSlug(row.key, p.slug)}
                          aria-pressed={row.slug === p.slug}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                            row.slug === p.slug
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-foreground/80 hover:bg-secondary"
                          }`}
                        >
                          {p.name} — {rand(p.price)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                      Colours for this scrunchie
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {COLOURS.map((c) => {
                        const on = row.colours.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleColour(row.key, c)}
                            aria-pressed={on}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                              on ? "border-primary bg-secondary text-primary" : "border-border bg-card text-foreground/70"
                            }`}
                          >
                            <span
                              className="size-4 rounded-full border border-border"
                              style={{ background: COLOUR_SWATCH[c] }}
                            />
                            {c}
                            {on && <Check className="size-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addScrunchie}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-primary/50 py-3 text-sm font-bold tracking-wide text-primary uppercase hover:bg-secondary"
              >
                <Plus className="size-4" /> Add another scrunchie
              </button>
            </div>

            <div className="surface-card space-y-5 p-6 lg:sticky lg:top-24">
              <h2 className="font-display text-xl font-semibold text-primary">Your order</h2>
              <div className="space-y-2 text-sm">
                {summary.rows.map((r, i) => (
                  <div key={r.key} className="flex justify-between gap-3">
                    <span>
                      <span className="font-semibold">
                        #{i + 1} {nameOf(r.slug)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {r.colours.length ? r.colours.join(" + ") : "No colours yet"}
                        {r.mixed ? " · mixed" : ""}
                      </span>
                    </span>
                    <span className="font-semibold">{rand(r.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-muted-foreground">
                  <span>Scrunchies ({summary.rows.length})</span>
                  <span>{rand(summary.subtotal)}</span>
                </div>
                {summary.fees > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Mixed-colour fees</span>
                    <span>{rand(summary.fees)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-border pt-3">
                  <span className="font-display text-lg font-semibold text-primary">TOTAL</span>
                  <span
                    data-testid="order-total"
                    className="font-display text-2xl font-semibold text-primary"
                  >
                    {rand(summary.total)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Full name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 text-base outline-none focus:border-primary"
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
                    className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 text-base outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    Delivery location
                  </span>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 outline-none focus:border-primary"
                  >
                    {data.locations.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {errors.length > 0 && (
                <ul className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {errors.map((err) => (
                    <li key={err}>• {err}</li>
                  ))}
                </ul>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold tracking-wide text-primary-foreground uppercase shadow-lift disabled:opacity-60"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />} Place order
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Pay on delivery. You'll get a private tracking link straight away.
              </p>
            </div>
          </form>
        </Section>
      )}
    </SiteShell>
  );
}
