import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, X, Package, MapPin, Link2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { logClientDiagnostic, logClientDiagnosticAction } from "@/lib/diagnostics.functions";
import {
  detectDependency,
  getLastChunkAttempt,
  getSessionId,
  hardReload,
  isChunkLoadError,
  newEventId,
  persistIssue,
  pushTimeline,
  recordChunkAttempt,
} from "@/lib/diagnostics-client";

type RuntimeIssue = {
  kind: "chunk-load" | "vite-error" | "unhandled" | "promise";
  message: string;
  url?: string;
  dependency?: string;
  stack?: string;
  at: number;
  eventId: string;
};

export function RuntimeDiagnostics() {
  const [issue, setIssue] = useState<RuntimeIssue | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const report = useServerFn(logClientDiagnostic);

  useEffect(() => {
    const sessionId = getSessionId();

    // Track chunk load attempts via PerformanceObserver so we know the last
    // resource the browser tried to fetch before any error.
    let perfObs: PerformanceObserver | null = null;
    try {
      perfObs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          const url = (e as PerformanceResourceTiming).name;
          if (url && /\.(js|mjs|css)(\?|$)/.test(url)) recordChunkAttempt(url);
        }
      });
      perfObs.observe({ type: "resource", buffered: true });
    } catch {}

    function record(next: Omit<RuntimeIssue, "eventId"> & { eventId?: string }) {
      const eventId = next.eventId ?? newEventId();
      const full: RuntimeIssue = { ...next, eventId };
      setIssue(full);
      setDismissed(false);
      const lastChunk = getLastChunkAttempt();
      persistIssue({
        eventId,
        sessionId,
        kind: full.kind,
        message: full.message,
        dependency: full.dependency,
        url: full.url,
        route: window.location.pathname,
        at: full.at,
      });
      report({
        data: {
          kind: full.kind,
          message: full.message,
          url: full.url,
          stack: full.stack,
          dependency: full.dependency,
          userAgent: navigator.userAgent,
          route: window.location.pathname,
          sessionId,
          eventId,
          lastChunkUrl: lastChunk?.url,
          lastChunkAt: lastChunk?.at,
        },
      }).catch(() => {});
    }

    function onError(e: ErrorEvent) {
      const msg = e.message || String(e.error);
      const url = (e.filename || "") + "";
      const stack = e.error?.stack as string | undefined;
      const dep = detectDependency(msg, url, stack, getLastChunkAttempt()?.url);
      record({
        kind: isChunkLoadError(msg) ? "chunk-load" : "unhandled",
        message: msg,
        url,
        dependency: dep,
        stack,
        at: Date.now(),
      });
    }

    function onRejection(e: PromiseRejectionEvent) {
      const reason = e.reason as { message?: string; stack?: string } | string;
      const msg = typeof reason === "string" ? reason : reason?.message || String(reason);
      const stack = typeof reason === "string" ? undefined : reason?.stack;
      const dep = detectDependency(msg, stack, getLastChunkAttempt()?.url);
      record({
        kind: isChunkLoadError(msg) ? "chunk-load" : "promise",
        message: msg,
        dependency: dep,
        stack,
        at: Date.now(),
      });
    }

    function onViteError(e: Event) {
      const detail = (e as CustomEvent).detail as
        | { err?: { message?: string; stack?: string; loc?: { file?: string } } }
        | undefined;
      const msg = detail?.err?.message || "Vite reported an error";
      const file = detail?.err?.loc?.file || "";
      const stack = detail?.err?.stack;
      const dep = detectDependency(msg, file, stack);
      record({ kind: "vite-error", message: msg, url: file, dependency: dep, stack, at: Date.now() });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("vite:error", onViteError as EventListener);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("vite:error", onViteError as EventListener);
      perfObs?.disconnect();
    };
  }, [report]);

  if (!issue || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="fixed bottom-4 right-4 z-[9999] max-w-md w-[calc(100vw-2rem)] rounded-2xl border border-amber-300/40 bg-background/95 backdrop-blur-xl shadow-2xl p-4"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm">A module failed to load</h3>
              <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            {issue.dependency && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs rounded-md bg-muted px-2 py-1 font-mono">
                <Package className="size-3" /> {issue.dependency}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">id: {issue.eventId}</p>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-3 break-words">{issue.message}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => location.reload()}
                className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg bg-foreground text-background px-3 py-1.5 hover:opacity-90"
              >
                <RefreshCw className="size-3" /> Reload
              </button>
              <a
                href="/diagnostics"
                className="inline-flex items-center text-xs font-medium rounded-lg border border-border px-3 py-1.5 hover:bg-muted"
              >
                Run health check
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
