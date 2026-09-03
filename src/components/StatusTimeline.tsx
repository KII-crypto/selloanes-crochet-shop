import { Check } from "lucide-react";
import { TIMELINE_STATUSES, statusLabel, type OrderStatus } from "@/lib/shop";

export function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "Cancelled") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center">
        <p className="font-display text-lg font-semibold text-destructive">❌ Order rejected</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Please get in touch if you think this was a mistake.
        </p>
      </div>
    );
  }

  const current = TIMELINE_STATUSES.indexOf(status);

  return (
    <ol className="space-y-0">
      {TIMELINE_STATUSES.map((step, i) => {
        const done = i <= current;
        const isCurrent = i === current;
        return (
          <li key={step} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              {i < TIMELINE_STATUSES.length - 1 && (
                <span className={`w-0.5 flex-1 ${i < current ? "bg-primary" : "bg-border"}`} style={{ minHeight: 28 }} />
              )}
            </div>
            <div className="pb-6">
              <p className={`font-semibold ${isCurrent ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                {statusLabel(step)}
              </p>
              {isCurrent && <p className="text-xs text-muted-foreground">Current status</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
