import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, Activity, Sparkles } from "lucide-react";

/**
 * Premium fallback shown when the app shell hasn't mounted within a threshold.
 * Renders into a static div in index.html OR mounts inside React tree as a Suspense fallback.
 */
export function BlankScreenFallback({ delayMs = 4000 }: { delayMs?: number }) {
  const [visible, setVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delayMs);
    const i = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
  }, [delayMs]);

  if (!visible) return null;

  const stage = elapsed < 6 ? "Loading app bundles…" : elapsed < 12 ? "Still working — this is taking longer than usual." : "The page didn't load — a dependency may have failed.";

  return (
    <div className="fixed inset-0 z-[9998] mesh-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong max-w-md w-full rounded-3xl border border-border/40 p-8 shadow-2xl text-center"
      >
        <div className="mx-auto size-12 rounded-2xl bg-gradient-to-br from-grape via-lavender to-sky flex items-center justify-center shadow-xl">
          <Sparkles className="size-6 text-white" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold">Recallly is warming up</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{stage}</p>

        <div className="mt-5 rounded-xl bg-muted/50 p-3 text-left text-xs font-mono space-y-1.5">
          <Row icon={<Loader2 className="size-3 animate-spin" />} label="App shell" value={`${elapsed}s`} />
          <Row icon={<Activity className="size-3" />} label="Status" value={elapsed < 12 ? "loading" : "stalled"} />
        </div>

        <div className="mt-5 flex gap-2 justify-center">
          <button
            onClick={() => location.reload()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-xl bg-foreground text-background px-4 py-2 hover:opacity-90"
          >
            <RefreshCw className="size-4" /> Try again
          </button>
          <a
            href="/diagnostics"
            className="inline-flex items-center text-sm font-semibold rounded-xl border border-border px-4 py-2 hover:bg-muted"
          >
            Diagnostics
          </a>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon} {label}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
