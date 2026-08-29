import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart, Sparkles, Truck, PackageCheck, Palette, ArrowRight } from "lucide-react";
import { SiteShell, Section, Eyebrow } from "@/components/SiteShell";
import { Stars } from "@/components/Stars";
import { storefrontQuery } from "@/lib/queries";
import { rand } from "@/lib/shop";
import { productImage } from "@/components/productImages";
import heroImage from "@/assets/hero-scrunchies.jpg";
import storyImage from "@/assets/story-hands.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Selloane's Crochet — Handmade Chunky Crochet Scrunchies" },
      {
        name: "description",
        content:
          "Beautiful chunky crochet scrunchies, handmade with soft wool and lots of love. Order online for local delivery.",
      },
      { property: "og:title", content: "Selloane's Crochet — Handmade. Unique. Beautifully You." },
      {
        property: "og:description",
        content: "Beautiful chunky crochet scrunchies, handmade with soft wool and lots of love.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const fullyBooked = data.week.used >= data.week.limit;
  const slotsLeft = Math.max(0, data.week.limit - data.week.used);

  return (
    <SiteShell>
      {/* HERO */}
      <div className="warm-gradient relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14">
          <div className="animate-rise-in">
            <Eyebrow>Handmade with love ♡</Eyebrow>
            <h1 className="text-balance-tight mt-5 text-4xl leading-[1.05] font-semibold text-primary sm:text-5xl lg:text-6xl">
              Handmade. Unique. Beautifully You.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-foreground/75 sm:text-lg">
              Beautiful chunky crochet scrunchies, handmade with soft wool and lots of love.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex h-13 items-center justify-center rounded-full bg-primary px-8 text-sm font-bold tracking-wide text-primary-foreground uppercase shadow-lift transition-transform hover:-translate-y-0.5"
              >
                Shop scrunchies
              </Link>
              <Link
                to="/our-story"
                className="inline-flex h-13 items-center justify-center rounded-full border-2 border-primary/25 bg-card px-8 text-sm font-bold tracking-wide text-primary uppercase transition-colors hover:bg-secondary"
              >
                Our story
              </Link>
            </div>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm font-semibold text-clay">
              <Truck className="size-4" /> Local delivery only
            </p>
          </div>

          <div className="relative">
            <div className="animate-float-soft overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
              <img
                src={heroImage}
                alt="Chunky handmade crochet wool scrunchies in burgundy, cream and mustard"
                width={1408}
                height={1056}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft sm:left-8">
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">From</p>
              <p className="font-display text-2xl font-semibold text-primary">
                {rand(Math.min(...data.products.map((p) => p.price)))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* INTRO */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
            <img
              src={storyImage}
              alt="Hands crocheting with chunky wool yarn"
              loading="lazy"
              width={1200}
              height={912}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">
              Welcome to Selloane's Crochet ♡
            </h2>
            <p className="mt-4 leading-relaxed text-foreground/75">
              Selloane's Crochet is a small handmade business creating beautiful chunky crochet
              scrunchies from soft, colorful wool. Every piece is made with care, giving you
              something simple, cute and unique to wear.
            </p>
            <Link
              to="/our-story"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary uppercase"
            >
              Read more <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* WHAT WE OFFER / HOW IT WORKS */}
      <div className="bg-secondary/50 py-4">
        <Section>
          <div className="text-center">
            <Eyebrow>How ordering works</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">
              Simple, from basket to doorstep
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Palette, title: "1. Choose", text: "Pick your size, colours and how many you'd like." },
              { icon: Sparkles, title: "2. Order", text: "Add your name, phone and delivery spot. No address needed." },
              { icon: PackageCheck, title: "3. Handmade", text: "Selloane crochets your scrunchies by hand, one by one." },
              { icon: Truck, title: "4. Delivered", text: "We deliver locally and you can track every step." },
            ].map((s) => (
              <div key={s.title} className="surface-card p-6 transition-transform hover:-translate-y-1">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-accent/70 text-accent-foreground">
                  <s.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-primary">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/how-it-works" className="text-sm font-bold text-primary uppercase">
              See full details →
            </Link>
          </div>
        </Section>
      </div>

      {/* PRODUCTS */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>The shop</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">Our scrunchies</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Mixed colours add {rand(data.settings.mixed_colour_fee)} per order — charged once.
          </p>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.products.map((p) => (
            <article key={p.slug} className="surface-card overflow-hidden transition-transform hover:-translate-y-1">
              <img
                src={productImage(p.slug)}
                alt={`${p.name} — real chunky crochet wool scrunchie`}
                loading="lazy"
                width={912}
                height={912}
                className="aspect-square w-full object-cover"
              />
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold text-primary">{p.name}</h3>
                  <span className="font-display text-xl font-semibold text-clay">{rand(p.price)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                {!p.available && (
                  <p className="mt-3 text-sm font-bold text-destructive">Currently unavailable</p>
                )}
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/shop" className="text-sm font-bold text-primary uppercase">
            Browse the full shop →
          </Link>
        </div>
      </Section>

      {/* REVIEWS */}
      {data.reviews.length > 0 && (
        <div className="bg-secondary/50 py-4">
          <Section>
            <div className="text-center">
              <Eyebrow>Reviews</Eyebrow>
              <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">
                What our customers say ♡
              </h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.reviews.slice(0, 6).map((r, i) => (
                <blockquote key={i} className="surface-card p-6">
                  <Stars rating={r.rating} />
                  <p className="mt-3 leading-relaxed text-foreground/80">{r.comment}</p>
                  <footer className="mt-4 text-sm font-bold text-clay">— {r.display_name}</footer>
                </blockquote>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* CTA */}
      <Section>
        <div className="surface-card warm-gradient px-6 py-12 text-center sm:px-12">
          <Heart className="mx-auto size-8 text-primary" fill="currentColor" />
          <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">Ready to order?</h2>
          {fullyBooked ? (
            <>
              <p className="mt-4 font-display text-xl font-semibold text-primary">❤️ FULLY BOOKED</p>
              <p className="mt-1 text-foreground/75">We've reached our {data.week.limit} orders for this week.</p>
              <p className="text-foreground/75">Please check back next week.</p>
            </>
          ) : (
            <>
              <p className="mt-3 text-foreground/75">
                {slotsLeft} order {slotsLeft === 1 ? "slot" : "slots"} left this week — Selloane only takes{" "}
                {data.week.limit} per week so every piece gets proper care.
              </p>
              <Link
                to="/order"
                className="mt-7 inline-flex h-13 items-center justify-center rounded-full bg-primary px-9 text-sm font-bold tracking-wide text-primary-foreground uppercase shadow-lift transition-transform hover:-translate-y-0.5"
              >
                Start my order
              </Link>
            </>
          )}
        </div>
      </Section>
    </SiteShell>
  );
}
