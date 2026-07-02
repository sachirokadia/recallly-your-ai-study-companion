import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X, Package, ChevronDown, Clock } from "lucide-react";
import { takePersistedIssue, type PersistedIssue } from "@/lib/diagnostics-client";

const RECOVERED_FLAG = "recallly.diag.recoveredFrom";

/**
 * Shows a summary right after the user reloaded following an error.
 * Reads the persisted issue from the previous session (including the
 * client timeline), then watches for 8s — if no new error fires, the
 * retry is reported as successful.
 */
export function PostReloadBanner() {
  const [prev, setPrev] = useState<PersistedIssue | null>(null);
  const [recovered, setRecovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

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

  const timeline = prev.timeline ?? [];
  const t0 = timeline[0]?.t ?? prev.at;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[min(92vw,560px)] rounded-2xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl p-4"
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
              <button
                onClick={() => setDismissed(true)}
                aria-label="Dismiss"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {recovered ? "Everything looks healthy now." : "Watching for repeat errors for a few seconds…"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              {prev.dependency && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono">
                  <Package className="size-3" /> {prev.dependency}
                </span>
              )}
              <span className="font-mono text-muted-foreground">{prev.kind}</span>
              {prev.route && <span className="font-mono text-muted-foreground">route: {prev.route}</span>}
              <span className="font-mono text-muted-foreground">
                cid: {prev.sessionId}/{prev.eventId}
              </span>
            </div>

            {timeline.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setTimelineOpen((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  aria-expanded={timelineOpen}
                >
                  <Clock className="size-3" /> Timeline ({timeline.length})
                  <ChevronDown className={`size-3 transition-transform ${timelineOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {timelineOpen && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-2 space-y-1 max-h-56 overflow-y-auto pr-1"
                    >
                      {timeline.map((e, i) => (
                        <li key={i} className="flex gap-2 text-[10.5px] font-mono">
                          <span className="text-muted-foreground tabular-nums shrink-0 w-14">
                            +{((e.t - t0) / 1000).toFixed(2)}s
                          </span>
                          <span className="font-semibold shrink-0">{e.kind}</span>
                          {e.detail && (
                            <span className="text-muted-foreground truncate" title={e.detail}>
                              {e.detail}
                            </span>
                          )}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
