import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell, Section, Eyebrow } from "@/components/SiteShell";
import { Stars } from "@/components/Stars";
import { storefrontQuery } from "@/lib/queries";
import { formatDate } from "@/lib/shop";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — Selloane's Crochet" },
      {
        name: "description",
        content: "Read what customers say about their handmade chunky crochet scrunchies from Selloane's Crochet.",
      },
      { property: "og:title", content: "What our customers say ♡" },
      { property: "og:description", content: "Reviews from Selloane's Crochet customers." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  component: ReviewsPage,
});

function ReviewsPage() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const avg =
    data.reviews.length > 0
      ? data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length
      : 0;

  return (
    <SiteShell>
      <div className="warm-gradient">
        <Section className="text-center">
          <Eyebrow>Reviews</Eyebrow>
          <h1 className="mt-5 text-4xl font-semibold text-primary sm:text-5xl">
            What our customers say ♡
          </h1>
          {data.reviews.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <Stars rating={Math.round(avg)} size={22} />
              <span className="font-display text-lg font-semibold text-primary">
                {avg.toFixed(1)} / 5 · {data.reviews.length} review{data.reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </Section>
      </div>

      <Section>
        {data.reviews.length === 0 ? (
          <div className="surface-card mx-auto max-w-lg p-10 text-center">
            <p className="font-display text-xl font-semibold text-primary">No reviews yet</p>
            <p className="mt-2 text-muted-foreground">
              Reviews appear here once customers have received their orders and Selloane has approved them.
            </p>
            <Link to="/order" className="mt-6 inline-block text-sm font-bold text-primary uppercase">
              Be the first to order →
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.reviews.map((r, i) => (
              <blockquote key={i} className="surface-card p-6">
                <Stars rating={r.rating} />
                <p className="mt-3 leading-relaxed text-foreground/80">{r.comment}</p>
                <footer className="mt-4 text-sm font-bold text-clay">
                  — {r.display_name}
                  <span className="ml-2 font-normal text-muted-foreground">{formatDate(r.created_at)}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already received an order? Leave your review from your{" "}
          <Link to="/track" className="font-semibold text-primary underline-offset-4 hover:underline">
            tracking page
          </Link>
          .
        </p>
      </Section>
    </SiteShell>
  );
}
