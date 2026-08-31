import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { adminGetOrder, adminUpdateOrder } from "@/lib/admin.functions";
import { rand, formatDate, ORDER_STATUSES, type OrderStatus } from "@/lib/shop";
import { StatusTimeline } from "@/components/StatusTimeline";

export const Route = createFileRoute("/admin/orders/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = useParams({ from: "/admin/orders/$id" });
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "order", id], queryFn: () => adminGetOrder({ data: { id } }) });

  const [status, setStatus] = useState<OrderStatus>("Received");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!query.data) return;
    const o = query.data.order as any;
    setStatus(o.status);
    setDate(o.expected_delivery_date ?? "");
    setNotes(o.admin_notes ?? "");
  }, [query.data]);

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!query.data) return <p className="text-muted-foreground">Order not found.</p>;
  const order = query.data.order as any;

  async function save() {
    setBusy(true);
    try {
      await adminUpdateOrder({
        data: { id, status, expected_delivery_date: date || null, admin_notes: notes },
      });
      toast.success("Order updated");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch {
      toast.error("Couldn't save those changes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm font-bold text-primary uppercase">
        <ArrowLeft className="size-4" /> All orders
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div className="space-y-6">
          <section className="surface-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h1 className="font-display text-2xl font-semibold text-primary">Order #{order.order_number}</h1>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">{order.status}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Placed {formatDate(order.created_at)}</p>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Customer</dt>
                <dd className="mt-1 font-semibold">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Phone</dt>
                <dd className="mt-1 font-semibold">
                  <a href={`tel:${order.customer_phone}`} className="text-primary underline">
                    {order.customer_phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Location</dt>
                <dd className="mt-1 font-semibold">{order.delivery_location}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Total</dt>
                <dd className="mt-1 font-semibold">{rand(order.total)}</dd>
              </div>
            </dl>

            <div className="mt-6 space-y-2">
              {query.data.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between gap-3 text-sm">
                  <span>
                    <span className="font-semibold">
                      {item.product_name} x{item.quantity}
                    </span>
                    {item.colours?.length > 0 && (
                      <span className="block text-xs text-muted-foreground">{item.colours.join(", ")}</span>
                    )}
                  </span>
                  <span className="font-semibold">{rand(Number(item.unit_price) * item.quantity)}</span>
                </div>
              ))}
              {Number(order.mixed_colour_fee) > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Mixed colours</span>
                  <span>{rand(order.mixed_colour_fee)}</span>
                </div>
              )}
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold text-primary">Update order</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 outline-none focus:border-primary"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  Expected delivery
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 outline-none focus:border-primary"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  Private notes (never shown to the customer)
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-input bg-card p-4 outline-none focus:border-primary"
                />
              </label>
            </div>
            <button
              onClick={save}
              disabled={busy}
              className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-bold tracking-wide text-primary-foreground uppercase disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />} Save changes
            </button>
          </section>
        </div>

        <section className="surface-card p-6">
          <h2 className="font-display text-lg font-semibold text-primary">Progress</h2>
          <div className="mt-4">
            <StatusTimeline status={order.status} />
          </div>
        </section>
      </div>
    </div>
  );
}
