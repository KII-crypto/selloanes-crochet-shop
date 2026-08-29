import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { storefrontQuery } from "@/lib/queries";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/our-story", label: "Our Story" },
  { to: "/shop", label: "Shop" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/reviews", label: "Reviews" },
  { to: "/order", label: "Order" },
  { to: "/track", label: "Track Order" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery(storefrontQuery);
  const name = data?.settings.business_name ?? "Selloane's Crochet";
  const phone = data?.settings.business_phone;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Heart className="size-4" fill="currentColor" />
            </span>
            <span className="font-display text-lg leading-tight font-semibold text-primary sm:text-xl">
              {name}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full px-3 py-2 text-sm font-semibold text-foreground/75 transition-colors hover:bg-secondary hover:text-primary"
                activeProps={{ className: "bg-secondary text-primary" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-primary lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-border bg-card px-4 pb-4 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-base font-semibold text-foreground/80 hover:bg-secondary"
                activeProps={{ className: "bg-secondary text-primary" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-border bg-secondary/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 text-center sm:px-6">
          <p className="font-display text-2xl font-semibold text-primary">{name} ♡</p>
          <p className="mt-2 text-sm text-muted-foreground">Handmade. Unique. Beautifully You.</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-clay shadow-soft">
            🚚 Local delivery only
          </p>
          {phone && (
            <p className="mt-4 text-sm text-muted-foreground">
              Questions? Call or message{" "}
              <a className="font-semibold text-primary underline-offset-4 hover:underline" href={`tel:${phone}`}>
                {phone}
              </a>
            </p>
          )}
          <p className="mt-6 text-xs text-muted-foreground">© 2026 Selloane's Crochet</p>
        </div>
      </footer>
    </div>
  );
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 ${className}`}>
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-accent/70 px-4 py-1.5 text-xs font-bold tracking-[0.18em] text-accent-foreground uppercase">
      {children}
    </span>
  );
}
