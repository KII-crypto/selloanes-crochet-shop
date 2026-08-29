import { Star } from "lucide-react";

export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= rating ? "fill-honey text-honey" : "text-border"}
        />
      ))}
    </span>
  );
}

export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i)}
          className="rounded-full p-1.5 transition-transform hover:scale-110"
        >
          <Star className={`size-8 ${i <= value ? "fill-honey text-honey" : "text-border"}`} />
        </button>
      ))}
    </div>
  );
}
