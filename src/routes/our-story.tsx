import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, Section, Eyebrow } from "@/components/SiteShell";
import storyImage from "@/assets/story-hands.jpg";
import heroImage from "@/assets/hero-scrunchies.jpg";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: "Our Story — Selloane's Crochet" },
      {
        name: "description",
        content:
          "Selloane's Crochet is a small handmade business creating beautiful chunky crochet scrunchies from soft, colorful wool.",
      },
      { property: "og:title", content: "Our Story — Selloane's Crochet" },
      {
        property: "og:description",
        content: "A small handmade business creating chunky crochet scrunchies from soft, colorful wool.",
      },
    ],
  }),
  component: StoryPage,
});

function StoryPage() {
  return (
    <SiteShell>
      <div className="warm-gradient">
        <Section className="text-center">
          <Eyebrow>Our story</Eyebrow>
          <h1 className="mt-5 text-4xl font-semibold text-primary sm:text-5xl">
            Welcome to Selloane's Crochet ♡
          </h1>
        </Section>
      </div>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
            <img
              src={storyImage}
              alt="Hands crocheting a chunky wool piece"
              loading="lazy"
              width={1200}
              height={912}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-foreground/80">
            <p>
              Selloane's Crochet is a small handmade business creating beautiful chunky crochet
              scrunchies from soft, colorful wool.
            </p>
            <p>
              Every piece is made with care, giving you something simple, cute and unique to wear.
            </p>
            <p className="font-display text-2xl font-semibold text-primary">Handmade with love ♡</p>
            <Link
              to="/shop"
              className="inline-flex h-13 items-center justify-center rounded-full bg-primary px-8 text-sm font-bold tracking-wide text-primary-foreground uppercase shadow-lift"
            >
              See the scrunchies
            </Link>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
          <img
            src={heroImage}
            alt="A collection of handmade chunky crochet scrunchies"
            loading="lazy"
            width={1408}
            height={1056}
            className="h-full w-full object-cover"
          />
        </div>
      </Section>
    </SiteShell>
  );
}
