import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminSettingsData,
  adminSaveSettings,
  adminSaveProduct,
  adminSaveLocation,
  adminDeleteLocation,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "settings"], queryFn: () => adminSettingsData() });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fee, setFee] = useState(10);
  const [limit, setLimit] = useState(5);
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [newLocation, setNewLocation] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!query.data) return;
    const s = query.data.settings as any;
    if (s) {
      setName(s.business_name);
      setPhone(s.business_phone);
      setFee(Number(s.mixed_colour_fee));
      setLimit(Number(s.weekly_order_limit));
    }
    setProducts(query.data.products ?? []);
    setLocations(query.data.locations ?? []);
  }, [query.data]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    await queryClient.invalidateQueries({ queryKey: ["storefront"] });
  }

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <h1 className="font-display text-2xl font-semibold text-primary">Business settings</h1>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Business name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Contact phone (private)">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Mixed colour fee (R)">
            <input
              type="number"
              min={0}
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Weekly order limit">
            <input
              type="number"
              min={1}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await adminSaveSettings({
                data: {
                  business_name: name,
                  business_phone: phone,
                  mixed_colour_fee: fee,
                  weekly_order_limit: limit,
                },
              });
              toast.success("Settings saved");
              await refresh();
            } catch {
              toast.error("Couldn't save settings — check the phone number format.");
            } finally {
              setBusy(false);
            }
          }}
          className="mt-5 h-12 rounded-full bg-primary px-8 text-sm font-bold tracking-wide text-primary-foreground uppercase disabled:opacity-60"
        >
          Save settings
        </button>
      </section>

      <section className="surface-card p-6">
        <h2 className="font-display text-xl font-semibold text-primary">Products &amp; prices</h2>
        <div className="mt-4 space-y-4">
          {products.map((p, i) => (
            <div key={p.id} className="flex flex-wrap items-end gap-3 rounded-2xl bg-secondary/50 p-4">
              <Field label="Name">
                <input
                  value={p.name}
                  onChange={(e) =>
                    setProducts((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Price (R)">
                <input
                  type="number"
                  min={0}
                  value={p.price}
                  onChange={(e) =>
                    setProducts((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)),
                    )
                  }
                  className={`${inputClass} w-32`}
                />
              </Field>
              <label className="flex h-12 items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={p.available}
                  onChange={(e) =>
                    setProducts((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, available: e.target.checked } : x)),
                    )
                  }
                  className="size-5"
                />
                Available
              </label>
              <button
                onClick={async () => {
                  await adminSaveProduct({
                    data: { id: p.id, name: p.name, price: Number(p.price), available: p.available },
                  });
                  toast.success(`${p.name} updated`);
                  await refresh();
                }}
                className="h-12 rounded-full bg-primary px-6 text-xs font-bold tracking-wide text-primary-foreground uppercase"
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card p-6">
        <h2 className="font-display text-xl font-semibold text-primary">Delivery locations</h2>
        <div className="mt-4 space-y-3">
          {locations.map((l, i) => (
            <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/50 p-4">
              <input
                value={l.name}
                onChange={(e) =>
                  setLocations((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                }
                className={`${inputClass} flex-1`}
              />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={l.active}
                  onChange={(e) =>
                    setLocations((prev) => prev.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))
                  }
                  className="size-5"
                />
                Active
              </label>
              <button
                onClick={async () => {
                  await adminSaveLocation({ data: { id: l.id, name: l.name, active: l.active } });
                  toast.success("Location updated");
                  await refresh();
                }}
                className="h-11 rounded-full bg-primary px-6 text-xs font-bold tracking-wide text-primary-foreground uppercase"
              >
                Save
              </button>
              <button
                aria-label={`Delete ${l.name}`}
                onClick={async () => {
                  if (!confirm(`Remove ${l.name}?`)) return;
                  await adminDeleteLocation({ data: { id: l.id } });
                  toast.success("Location removed");
                  await refresh();
                }}
                className="flex size-11 items-center justify-center rounded-full border border-destructive/40 text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Add a delivery location"
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={async () => {
              if (newLocation.trim().length < 2) return;
              await adminSaveLocation({ data: { id: null, name: newLocation.trim(), active: true } });
              setNewLocation("");
              toast.success("Location added");
              await refresh();
            }}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-xs font-bold tracking-wide text-primary-foreground uppercase"
          >
            <Plus className="size-4" /> Add
          </button>
        </div>
      </section>
    </div>
  );
}

const inputClass =
  "mt-2 h-12 rounded-2xl border border-input bg-card px-4 outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{label}</span>
      {children}
    </label>
  );
}
