import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  RefreshCw,
  Activity,
  Sparkles,
  BookOpen,
  ChevronDown,
  Package,
  Trash2,
  MapPin,
  Link2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  clearCacheSteps,
  detectEnv,
  fixesFor,
  getLastChunkAttempt,
  getSessionId,
  hardReload,
  peekPersistedIssue,
  type PersistedIssue,
} from "@/lib/diagnostics-client";
import { logClientDiagnosticAction } from "@/lib/diagnostics.functions";

export function BlankScreenFallback({ delayMs = 4000 }: { delayMs?: number }) {
  const [visible, setVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [issue, setIssue] = useState<PersistedIssue | null>(null);
  const [kbOpen, setKbOpen] = useState(false);
  const [cacheOpen, setCacheOpen] = useState(false);
  const logAction = useServerFn(logClientDiagnosticAction);

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
  const lastChunk = issue?.lastChunkUrl
    ? { url: issue.lastChunkUrl, at: issue.lastChunkAt }
    : getLastChunkAttempt();
  const route = issue?.route ?? (typeof window !== "undefined" ? window.location.pathname : undefined);
  const env = detectEnv();
  const cache = clearCacheSteps(env);

  const track = (action: Parameters<typeof logAction>[0]["data"]["action"], detail?: string) => {
    logAction({
      data: {
        action,
        detail,
        sessionId: getSessionId(),
        eventId: issue?.eventId,
        route,
        dependency: issue?.dependency,
      },
    }).catch(() => {});
  };

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
          {route && <Row icon={<MapPin className="size-3" />} label="Route" value={route} />}
          {lastChunk?.url && (
            <Row icon={<Link2 className="size-3" />} label="Last chunk" value={shorten(lastChunk.url)} />
          )}
          {issue?.eventId && <Row icon={<span className="text-muted-foreground">#</span>} label="cid" value={`${issue.sessionId}/${issue.eventId}`} />}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => {
              track("reload");
              location.reload();
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-xl bg-foreground text-background px-4 py-2 hover:opacity-90"
          >
            <RefreshCw className="size-4" /> Try again
          </button>
          <button
            onClick={() => {
              track("hard-reload");
              hardReload();
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-xl border border-border px-4 py-2 hover:bg-muted"
          >
            Hard reload
          </button>
          <a
            href="/diagnostics"
            onClick={() => track("run-diagnostics")}
            className="inline-flex items-center text-sm font-semibold rounded-xl border border-border px-4 py-2 hover:bg-muted"
          >
            Diagnostics
          </a>
        </div>

        {/* Clear Vite cache */}
        <div className="mt-4 text-left">
          <button
            onClick={() => {
              const next = !cacheOpen;
              setCacheOpen(next);
              if (next) track("kb-open", "clear-vite-cache");
            }}
            className="w-full flex items-center justify-between text-xs font-semibold rounded-lg border border-border/60 px-3 py-2 hover:bg-muted"
            aria-expanded={cacheOpen}
          >
            <span className="inline-flex items-center gap-1.5">
              <Trash2 className="size-3.5" /> {cache.title}
              <span className="font-mono text-[10px] text-muted-foreground">({env})</span>
            </span>
            <ChevronDown className={`size-4 transition-transform ${cacheOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {cacheOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 rounded-lg bg-muted/40 p-3 space-y-2"
              >
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground">
                  {cache.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <button
                  onClick={() => {
                    track("clear-vite-cache", env);
                    hardReload();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-foreground text-background px-3 py-1.5 hover:opacity-90"
                >
                  <RefreshCw className="size-3" /> Do it now (hard reload)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Common fixes */}
        <div className="mt-3 text-left">
          <button
            onClick={() => {
              const next = !kbOpen;
              setKbOpen(next);
              if (next) track("kb-open", issue?.dependency);
            }}
            className="w-full flex items-center justify-between text-xs font-semibold rounded-lg border border-border/60 px-3 py-2 hover:bg-muted"
            aria-expanded={kbOpen}
          >
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5" /> Common fixes
              {issue?.dependency && (
                <span className="font-mono text-[10px] text-muted-foreground">for {issue.dependency}</span>
              )}
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
                  <li key={f.id}>
                    <button
                      onClick={() => track("kb-fix", f.id)}
                      className="w-full text-left rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted"
                    >
                      <p className="text-xs font-semibold">{f.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{f.body}</p>
                    </button>
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

function shorten(url: string, max = 44) {
  if (url.length <= max) return url;
  return "…" + url.slice(-max);
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
        {icon} {label}
      </span>
      <span className="font-semibold text-foreground truncate max-w-[62%]">{value}</span>
    </div>
  );
}
