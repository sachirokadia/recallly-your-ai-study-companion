import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X, Package } from "lucide-react";
import { takePersistedIssue, type PersistedIssue } from "@/lib/diagnostics-client";

const RECOVERED_FLAG = "recallly.diag.recoveredFrom";

/**
 * Shows a summary right after the user reloaded following an error.
 * Reads the persisted issue from the previous session, then watches for
 * 8s — if no new error fires, the retry is reported as successful.
 */
export function PostReloadBanner() {
  const [prev, setPrev] = useState<PersistedIssue | null>(null);
  const [recovered, setRecovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const issue = takePersistedIssue();
    if (issue) {
      setPrev(issue);
      try {
        sessionStorage.setItem(RECOVERED_FLAG, "pending");
      } catch {}
      const t = setTimeout(() => {
        setRecovered(true);
        try {
          sessionStorage.setItem(RECOVERED_FLAG, "ok");
        } catch {}
      }, 8000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!prev || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[min(92vw,520px)] rounded-2xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl p-4"
        role="status"
      >
        <div className="flex items-start gap-3">
          <div
            className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
              recovered ? "bg-emerald-500/15" : "bg-amber-500/15"
            }`}
          >
            {recovered ? (
              <CheckCircle2 className="size-5 text-emerald-500" />
            ) : (
              <AlertCircle className="size-5 text-amber-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm">
                {recovered ? "Recovered after retry" : "Previous load had an error"}
              </h3>
              <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {recovered
                ? "Everything looks healthy now."
                : "Watching for repeat errors for a few seconds…"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              {prev.dependency && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono">
                  <Package className="size-3" /> {prev.dependency}
                </span>
              )}
              <span className="font-mono text-muted-foreground">{prev.kind}</span>
              <span className="font-mono text-muted-foreground">id: {prev.eventId}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
