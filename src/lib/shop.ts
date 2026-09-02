export const COLOURS = [
  "Red",
  "White/Cream",
  "Pink",
  "Black",
  "Purple",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
] as const;

export const COLOUR_SWATCH: Record<string, string> = {
  Red: "#b3202b",
  "White/Cream": "#f5efe2",
  Pink: "#e79aad",
  Black: "#22201f",
  Purple: "#6b4a9c",
  Blue: "#3763a8",
  Green: "#4b8c5a",
  Yellow: "#e6c14b",
  Orange: "#dd8330",
};

export const ORDER_STATUSES = [
  "Received",
  "Confirmed",
  "Being Prepared",
  "Ready",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const TIMELINE_STATUSES: OrderStatus[] = [
  "Received",
  "Confirmed",
  "Being Prepared",
  "Ready",
  "Out for Delivery",
  "Delivered",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  Received: "🟡 Awaiting confirmation",
  Confirmed: "🟢 Order confirmed",
  "Being Prepared": "🧶 Being prepared",
  Ready: "📦 Ready",
  "Out for Delivery": "🚚 Out for delivery",
  Delivered: "✅ Order received / delivered",
  Cancelled: "❌ Order rejected",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] ?? status;
}


export function rand(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `R${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export type PublicProduct = {
  slug: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
};

export type TrackedOrder = {
  order_number: string;
  created_at: string;
  status: OrderStatus;
  delivery_location: string;
  customer_name: string;
  subtotal: number;
  mixed_colour_fee: number;
  total: number;
  expected_delivery_date: string | null;
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    colours: string[];
    is_mixed?: boolean;
    mixed_fee?: number;
    line_total?: number;
  }[];

  review: { rating: number; comment: string; approved: boolean } | null;
};
