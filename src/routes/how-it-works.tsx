import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell, Section, Eyebrow } from "@/components/SiteShell";
import { storefrontQuery } from "@/lib/queries";
import { rand } from "@/lib/shop";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Selloane's Crochet" },
      {
        name: "description",
        content:
          "How to order handmade crochet scrunchies from Selloane's Crochet: choose, order, we make it, we deliver locally.",
      },
      { property: "og:title", content: "How It Works — Selloane's Crochet" },
      { property: "og:description", content: "Choose, order, we make it, we deliver locally." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  component: HowItWorks,
});

function HowItWorks() {
  const { data } = useSuspenseQuery(storefrontQuery);

  const steps = [
    {
      title: "Pick your scrunchies",
      body: "Choose Small, Medium or Large and tell us how many of each. Quantities start at zero and you can adjust freely before ordering.",
    },
    {
      title: "Choose your colours",
      body: "Select from Red, White/Cream, Pink, Black, Purple, Blue, Green, Yellow and Orange. Want a mix? Tick mixed colours and we'll add a single mixed-colour fee of " + rand(data.settings.mixed_colour_fee) + " to the whole order — never per scrunchie.",
    },
    {
      title: "Add your details",
      body: "We only need your full name, phone number and delivery location. No street address is needed — we deliver locally to set drop-off spots.",
    },
    {
      title: "We confirm and make it",
      body: `Selloane accepts a maximum of ${data.week.limit} orders per week so every scrunchie is made properly by hand. Your order status moves from Received to Confirmed to Being Prepared.`,
    },
    {
      title: "Track your order",
      body: "Your confirmation gives you a private tracking link and an order number like SC-0047. Only you have that link — keep it safe.",
    },
    {
      title: "Delivery and review",
      body: "Once your order is Out for Delivery and then Delivered, you can leave a star rating and review. Selloane approves reviews before they appear on the site.",
    },
  ];

  return (
    <SiteShell>
      <div className="warm-gradient">
        <Section className="text-center">
          <Eyebrow>How it works</Eyebrow>
          <h1 className="mt-5 text-4xl font-semibold text-primary sm:text-5xl">Ordering, step by step</h1>
          <p className="mx-auto mt-4 max-w-xl text-foreground/75">
            Everything happens right here on this website — no messaging apps required.
          </p>
        </Section>
      </div>

      <Section>
        <ol className="grid gap-5 md:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.title} className="surface-card p-6">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary font-display text-lg font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold text-primary">{s.title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="surface-card mt-8 p-6">
          <h2 className="font-display text-xl font-semibold text-primary">Prices & delivery</h2>
          <ul className="mt-4 grid gap-2 text-foreground/80 sm:grid-cols-2">
            {data.products.map((p) => (
              <li key={p.slug}>
                {p.name} — <strong>{rand(p.price)}</strong>
                {!p.available && <span className="text-destructive"> (unavailable)</span>}
              </li>
            ))}
            <li>
              Mixed colours — <strong>+{rand(data.settings.mixed_colour_fee)} per order</strong> (once only)
            </li>
          </ul>
          <p className="mt-4 text-sm font-semibold text-clay">🚚 Local delivery only</p>
          <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
            {data.locations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/order"
            className="inline-flex h-13 items-center justify-center rounded-full bg-primary px-9 text-sm font-bold tracking-wide text-primary-foreground uppercase shadow-lift"
          >
            Start my order
          </Link>
        </div>
      </Section>
    </SiteShell>
  );
}
