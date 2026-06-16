import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Package } from "lucide-react";

export const Route = createFileRoute("/diagnostics")({
  ssr: false,
  head: () => ({ meta: [{ title: "Diagnostics — Recallly" }] }),
  component: DiagnosticsPage,
});

type Check = {
  name: string;
  loader: () => Promise<unknown>;
  status: "pending" | "ok" | "fail";
  ms?: number;
  error?: string;
};

const initialChecks: Check[] = [
  { name: "@radix-ui/react-slot", loader: () => import("@radix-ui/react-slot"), status: "pending" },
  { name: "@radix-ui/react-dialog", loader: () => import("@radix-ui/react-dialog"), status: "pending" },
  { name: "clsx", loader: () => import("clsx"), status: "pending" },
  { name: "tailwind-merge", loader: () => import("tailwind-merge"), status: "pending" },
  { name: "@lovable.dev/cloud-auth-js", loader: () => import("@lovable.dev/cloud-auth-js"), status: "pending" },
  { name: "@supabase/supabase-js", loader: () => import("@supabase/supabase-js"), status: "pending" },
  { name: "framer-motion", loader: () => import("framer-motion"), status: "pending" },
  { name: "sonner", loader: () => import("sonner"), status: "pending" },
  { name: "lucide-react", loader: () => import("lucide-react"), status: "pending" },
  { name: "@tanstack/react-query", loader: () => import("@tanstack/react-query"), status: "pending" },
];

function DiagnosticsPage() {
  const [checks, setChecks] = useState<Check[]>(initialChecks);
  const [running, setRunning] = useState(false);

  async function runAll() {
    setRunning(true);
    setChecks((c) => c.map((x) => ({ ...x, status: "pending", ms: undefined, error: undefined })));
    const results = await Promise.all(
      initialChecks.map(async (c): Promise<Check> => {
        const t0 = performance.now();
        try {
          await c.loader();
          return { ...c, status: "ok", ms: Math.round(performance.now() - t0) };
        } catch (e) {
          return { ...c, status: "fail", ms: Math.round(performance.now() - t0), error: e instanceof Error ? e.message : String(e) };
        }
      }),
    );
    setChecks(results);
    setRunning(false);
  }

  useEffect(() => {
    runAll();
  }, []);

  const ok = checks.filter((c) => c.status === "ok").length;
  const fail = checks.filter((c) => c.status === "fail").length;
  const pending = checks.filter((c) => c.status === "pending").length;

  return (
    <div className="min-h-screen mesh-bg px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold">Dependency health check</h1>
          <p className="text-muted-foreground mt-1">Verifies critical bundles load without 504s from the dev server.</p>
        </motion.div>

        <div className="mt-6 glass-strong rounded-2xl border border-border/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3 text-sm">
              <Pill color="emerald" label={`${ok} ok`} />
              <Pill color="rose" label={`${fail} failed`} />
              <Pill color="amber" label={`${pending} pending`} />
            </div>
            <button
              disabled={running}
              onClick={runAll}
              className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-xl bg-foreground text-background px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${running ? "animate-spin" : ""}`} /> Re-run
            </button>
          </div>

          <ul className="divide-y divide-border/40">
            {checks.map((c) => (
              <li key={c.name} className="py-3 flex items-center gap-3">
                <StatusIcon status={c.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <Package className="size-3.5 text-muted-foreground" />
                    {c.name}
                  </div>
                  {c.error && <p className="text-xs text-rose-500 mt-0.5 truncate">{c.error}</p>}
                </div>
                {c.ms !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{c.ms}ms</span>}
              </li>
            ))}
          </ul>
        </div>

        {fail > 0 && (
          <div className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/5 p-4 text-sm">
            <p className="font-semibold text-rose-600">Some dependencies failed to load.</p>
            <p className="text-muted-foreground mt-1">
              This typically means Vite's pre-bundle cache is stale or a package isn't installed. Try a hard reload, or contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: Check["status"] }) {
  if (status === "ok") return <CheckCircle2 className="size-5 text-emerald-500" />;
  if (status === "fail") return <XCircle className="size-5 text-rose-500" />;
  return <Loader2 className="size-5 text-muted-foreground animate-spin" />;
}

function Pill({ color, label }: { color: "emerald" | "rose" | "amber"; label: string }) {
  const map = {
    emerald: "bg-emerald-500/15 text-emerald-600",
    rose: "bg-rose-500/15 text-rose-600",
    amber: "bg-amber-500/15 text-amber-600",
  } as const;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[color]}`}>{label}</span>;
}
