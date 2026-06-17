import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";

const CRITICAL: Array<{ name: string; load: () => Promise<unknown> }> = [
  { name: "@radix-ui/react-slot", load: () => import("@radix-ui/react-slot") },
  { name: "clsx", load: () => import("clsx") },
  { name: "@lovable.dev/cloud-auth-js", load: () => import("@lovable.dev/cloud-auth-js") },
  { name: "@supabase/supabase-js", load: () => import("@supabase/supabase-js") },
  { name: "@tanstack/react-query", load: () => import("@tanstack/react-query") },
];

type Status = "checking" | "ok" | "fail";

export function StartupHealthCheck() {
  const [status, setStatus] = useState<Status>("checking");
  const [failed, setFailed] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        CRITICAL.map(async (c) => {
          try {
            await c.load();
            return { name: c.name, ok: true };
          } catch {
            return { name: c.name, ok: false };
          }
        }),
      );
      if (cancelled) return;
      const bad = results.filter((r) => !r.ok).map((r) => r.name);
      setFailed(bad);
      setStatus(bad.length ? "fail" : "ok");
      // Auto-dismiss the green card after a moment.
      if (bad.length === 0) setTimeout(() => setDismissed(true), 2500);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="fixed bottom-4 left-4 z-[9997] w-[min(92vw,340px)] rounded-2xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-xl p-3"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div
            className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
              status === "ok"
                ? "bg-emerald-500/15"
                : status === "fail"
                  ? "bg-rose-500/15"
                  : "bg-muted"
            }`}
          >
            {status === "checking" && <Loader2 className="size-4 text-muted-foreground animate-spin" />}
            {status === "ok" && <CheckCircle2 className="size-4 text-emerald-500" />}
            {status === "fail" && <AlertTriangle className="size-4 text-rose-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">
                {status === "checking" && "Checking dependencies…"}
                {status === "ok" && "All systems healthy"}
                {status === "fail" && `${failed.length} dependency issue${failed.length === 1 ? "" : "s"}`}
              </h4>
              <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
            {status === "fail" && (
              <ul className="mt-1.5 space-y-0.5 text-[11px] font-mono text-rose-600">
                {failed.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            )}
            {status === "fail" && (
              <a href="/diagnostics" className="mt-2 inline-block text-xs font-medium underline">
                Open diagnostics
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
