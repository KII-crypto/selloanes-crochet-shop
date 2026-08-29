import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteShell, Section, Eyebrow } from "@/components/SiteShell";
import { storefrontQuery } from "@/lib/queries";
import { COLOURS, COLOUR_SWATCH, rand } from "@/lib/shop";
import { productImage } from "@/components/productImages";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Scrunchies — Selloane's Crochet" },
      {
        name: "description",
        content:
          "Shop handmade chunky crochet scrunchies: Small R20, Medium R30, Large R40. Nine wool colours, local delivery.",
      },
      { property: "og:title", content: "Shop Scrunchies — Selloane's Crochet" },
      { property: "og:description", content: "Small, Medium and Large handmade chunky crochet scrunchies." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  component: ShopPage,
});

function ShopPage() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const navigate = useNavigate();
  const [picked, setPicked] = useState<Record<string, string>>({});

  return (
    <SiteShell>
      <div className="warm-gradient">
        <Section className="text-center">
          <Eyebrow>The shop</Eyebrow>
          <h1 className="mt-5 text-4xl font-semibold text-primary sm:text-5xl">Chunky crochet scrunchies</h1>
          <p className="mx-auto mt-4 max-w-xl text-foreground/75">
            Each one is crocheted by hand from soft wool. Mixed colours add{" "}
            {rand(data.settings.mixed_colour_fee)} per order — charged only once, no matter how many
            scrunchies you buy.
          </p>
        </Section>
      </div>

      <Section className="pt-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.products.map((p) => {
            const colour = picked[p.slug] ?? "";
            return (
              <article key={p.slug} className="surface-card flex flex-col overflow-hidden">
                <img
                  src={productImage(p.slug)}
                  alt={`${p.name} — handmade chunky crochet wool scrunchie`}
                  loading="lazy"
                  width={912}
                  height={912}
                  className="aspect-square w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-display text-xl font-semibold text-primary">{p.name}</h2>
                    <span className="font-display text-xl font-semibold text-clay">{rand(p.price)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>

                  <p className="mt-5 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    Choose a colour
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {COLOURS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        disabled={!p.available}
                        onClick={() => setPicked((prev) => ({ ...prev, [p.slug]: c }))}
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          colour === c
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
                    ))}
                  </div>

                  <div className="mt-auto pt-6">
                    {p.available ? (
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            to: "/order",
                            search: { add: p.slug, colour: colour || undefined },
                          })
                        }
                        className="h-12 w-full rounded-full bg-primary text-sm font-bold tracking-wide text-primary-foreground uppercase transition-transform hover:-translate-y-0.5"
                      >
                        Add to order
                      </button>
                    ) : (
                      <p className="rounded-full bg-muted py-3 text-center text-sm font-bold text-muted-foreground">
                        Currently unavailable
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Section>
    </SiteShell>
  );
}
