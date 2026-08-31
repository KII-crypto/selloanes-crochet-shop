import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminListReviews, adminSetReviewApproved, adminDeleteReview } from "@/lib/admin.functions";
import { Stars } from "@/components/Stars";
import { formatDate } from "@/lib/shop";

export const Route = createFileRoute("/admin/reviews")({
  component: ReviewModeration,
});

function ReviewModeration() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "reviews"], queryFn: () => adminListReviews() });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    await queryClient.invalidateQueries({ queryKey: ["storefront"] });
  }

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const reviews = query.data?.reviews ?? [];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-primary">Review moderation</h1>
      <p className="text-sm text-muted-foreground">
        Reviews only appear on the public reviews page once you approve them.
      </p>
      {reviews.length === 0 && <p className="surface-card p-6 text-sm text-muted-foreground">No reviews yet.</p>}
      {reviews.map((r: any) => (
        <article key={r.id} className="surface-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Stars rating={r.rating} />
              <p className="mt-1 text-sm font-semibold">{r.display_name}</p>
              <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                r.approved ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
              }`}
            >
              {r.approved ? "Published" : "Pending"}
            </span>
          </div>
          {r.comment && <p className="mt-3 text-sm text-foreground/85">{r.comment}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={async () => {
                await adminSetReviewApproved({ data: { id: r.id, approved: !r.approved } });
                toast.success(r.approved ? "Review hidden" : "Review published");
                await refresh();
              }}
              className="rounded-full bg-primary px-5 py-2 text-xs font-bold tracking-wide text-primary-foreground uppercase"
            >
              {r.approved ? "Unpublish" : "Approve"}
            </button>
            <button
              onClick={async () => {
                if (!confirm("Delete this review permanently?")) return;
                await adminDeleteReview({ data: { id: r.id } });
                toast.success("Review deleted");
                await refresh();
              }}
              className="rounded-full border border-destructive/40 px-5 py-2 text-xs font-bold tracking-wide text-destructive uppercase"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
