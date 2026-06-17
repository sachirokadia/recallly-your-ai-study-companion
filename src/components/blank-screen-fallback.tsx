import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw, Activity, Sparkles, BookOpen, ChevronDown, Package } from "lucide-react";
import { fixesFor } from "@/lib/diagnostics-client";

type PeekedIssue = { dependency?: string; message?: string; kind?: string; eventId?: string } | null;

function peekPersistedIssue(): PeekedIssue {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("recallly.diag.lastIssue");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function BlankScreenFallback({ delayMs = 4000 }: { delayMs?: number }) {
  const [visible, setVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [issue, setIssue] = useState<PeekedIssue>(null);
  const [kbOpen, setKbOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      setIssue(peekPersistedIssue());
    }, delayMs);
    const i = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
  }, [delayMs]);

  if (!visible) return null;

  const stage =
    elapsed < 6
      ? "Loading app bundles…"
      : elapsed < 12
        ? "Still working — this is taking longer than usual."
        : "The page didn't load — a dependency may have failed.";

  const fixes = fixesFor(issue?.dependency);

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
          {issue?.dependency && (
            <Row icon={<Package className="size-3" />} label="Failing" value={issue.dependency} />
          )}
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

        <div className="mt-5 text-left">
          <button
            onClick={() => setKbOpen((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-semibold rounded-lg border border-border/60 px-3 py-2 hover:bg-muted"
            aria-expanded={kbOpen}
          >
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5" /> Common fixes
              {issue?.dependency && <span className="font-mono text-[10px] text-muted-foreground">for {issue.dependency}</span>}
            </span>
            <ChevronDown className={`size-4 transition-transform ${kbOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {kbOpen && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 space-y-2"
              >
                {fixes.map((f) => (
                  <li key={f.title} className="rounded-lg bg-muted/40 px-3 py-2">
                    <p className="text-xs font-semibold">{f.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{f.body}</p>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
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
      <span className="font-semibold text-foreground truncate max-w-[60%]">{value}</span>
    </div>
  );
}
