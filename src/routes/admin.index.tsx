import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminOverview } from "@/lib/admin.functions";
import { rand, formatDate, ORDER_STATUSES } from "@/lib/shop";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "overview"], queryFn: () => adminOverview() });
  const first = useRef(true);

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        toast.success("🔔 New order received!");
        void queryClient.invalidateQueries({ queryKey: ["admin"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["admin"] });
      })
      .subscribe();
    first.current = false;
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  const data = query.data;
  if (!data) return <p className="text-muted-foreground">Couldn't load the dashboard.</p>;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Orders this week" value={`${data.week.used} / ${data.week.limit}`} />
        <Stat label="Slots left" value={String(Math.max(0, data.week.limit - data.week.used))} />
        <Stat label="Active orders" value={String(
          ORDER_STATUSES.filter((s) => s !== "Delivered" && s !== "Cancelled").reduce(
            (sum, s) => sum + (data.counts[s] ?? 0),
            0,
          ),
        )} />
        <Stat label="Revenue (last 200)" value={rand(data.revenue)} />
      </div>

      <section className="surface-card p-6">
        <h2 className="font-display text-xl font-semibold text-primary">Orders by status</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => (
            <span key={s} className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary">
              {s}: {data.counts[s] ?? 0}
            </span>
          ))}
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-primary">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm font-bold text-primary uppercase">
            View all →
          </Link>
        </div>
        <div className="mt-4 divide-y divide-border">
          {data.recent.length === 0 && <p className="py-4 text-sm text-muted-foreground">No orders yet.</p>}
          {data.recent.map((o: any) => (
            <Link
              key={o.id}
              to="/admin/orders/$id"
              params={{ id: o.id }}
              className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-secondary/50"
            >
              <span>
                <span className="font-display font-semibold text-primary">#{o.order_number}</span>{" "}
                <span className="text-sm text-foreground/80">{o.customer_name}</span>
                <span className="block text-xs text-muted-foreground">
                  {o.delivery_location} · {formatDate(o.created_at)}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">{o.status}</span>
                <span className="font-semibold">{rand(o.total)}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-primary">{value}</p>
    </div>
  );
}
