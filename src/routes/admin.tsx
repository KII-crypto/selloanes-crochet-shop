import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminWhoAmI, claimOwnerAccess, ownerExists } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Owner Portal — Selloane's Crochet" },
      { name: "description", content: "Private owner portal for managing Selloane's Crochet orders." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Owner Portal — Selloane's Crochet" },
      { property: "og:description", content: "Private owner portal." },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/orders", label: "Orders", exact: false },
  { to: "/admin/reviews", label: "Reviews", exact: false },
  { to: "/admin/settings", label: "Settings", exact: false },
] as const;

function AdminLayout() {
  const [session, setSession] = useState<{ email: string } | null | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { email: data.session.user.email ?? "" } : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      setSession(s ? { email: s.user.email ?? "" } : null);
      queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const who = useQuery({
    queryKey: ["admin", "whoami", session?.email],
    queryFn: () => adminWhoAmI(),
    enabled: Boolean(session),
  });

  if (session === undefined || (session && who.isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <AdminSignIn />;
  if (!who.data?.isAdmin) return <NotAuthorised email={session.email} />;

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Heart className="size-4" fill="currentColor" />
            </span>
            <span className="font-display text-lg font-semibold text-primary">Owner Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-primary">
              View shop
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-primary"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap text-foreground/70 hover:bg-secondary"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

function AdminSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const owner = useQuery({ queryKey: ["owner-exists"], queryFn: () => ownerExists() });

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast.error(error.message);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) toast.error(error.message);
        else toast.success("Account created. You can sign in now.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <form onSubmit={handle} className="surface-card w-full max-w-sm p-7">
        <h1 className="font-display text-2xl font-semibold text-primary">Owner sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">This area is private to Selloane.</p>
        <label className="mt-6 block">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 outline-none focus:border-primary"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 outline-none focus:border-primary"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold tracking-wide text-primary-foreground uppercase disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create owner account"}
        </button>
        {owner.data && !owner.data.exists && (
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-sm font-semibold text-primary underline"
          >
            {mode === "signin" ? "First time? Create the owner account" : "Back to sign in"}
          </button>
        )}
        <Link to="/" className="mt-5 block text-center text-xs text-muted-foreground">
          ← Back to the shop
        </Link>
      </form>
    </div>
  );
}

function NotAuthorised({ email }: { email: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const claim = useServerFn(claimOwnerAccess);
  const owner = useQuery({ queryKey: ["owner-exists"], queryFn: () => ownerExists() });
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <div className="surface-card w-full max-w-sm p-7 text-center">
        <h1 className="font-display text-2xl font-semibold text-primary">Not authorised</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {email} doesn't have owner access to this portal.
        </p>
        {owner.data && !owner.data.exists && (
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await claim();
              setBusy(false);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success("Owner access granted.");
              await queryClient.invalidateQueries();
              navigate({ to: "/admin" });
            }}
            className="mt-5 h-12 w-full rounded-full bg-primary text-sm font-bold tracking-wide text-primary-foreground uppercase disabled:opacity-60"
          >
            Claim owner access
          </button>
        )}
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-4 w-full text-sm font-semibold text-primary underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
