import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { adminListOrders } from "@/lib/admin.functions";
import { rand, formatDate, statusLabel, ORDER_STATUSES } from "@/lib/shop";

export const Route = createFileRoute("/admin/orders/")({
  component: OrdersList,
});

function OrdersList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const query = useQuery({
    queryKey: ["admin", "orders", search, status],
    queryFn: () => adminListOrders({ data: { search, status } }),
  });

  return (
    <div className="space-y-6">
      <div className="surface-card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number, name or phone"
            className="h-12 w-full rounded-2xl border border-input bg-card pr-4 pl-11 outline-none focus:border-primary"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-12 rounded-2xl border border-input bg-card px-4 outline-none focus:border-primary"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="surface-card divide-y divide-border p-2">
          {(query.data?.orders ?? []).length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No orders match this search.</p>
          )}
          {(query.data?.orders ?? []).map((o: any) => (
            <Link
              key={o.id}
              to="/admin/orders/$id"
              params={{ id: o.id }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 hover:bg-secondary/60"
            >
              <span>
                <span className="font-display font-semibold text-primary">#{o.order_number}</span>{" "}
                <span className="text-sm text-foreground/80">{o.customer_name}</span>
                <span className="block text-xs text-muted-foreground">
                  {o.customer_phone} · {o.delivery_location} · {formatDate(o.created_at)}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">{statusLabel(o.status)}</span>
                <span className="font-semibold">{rand(o.total)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
