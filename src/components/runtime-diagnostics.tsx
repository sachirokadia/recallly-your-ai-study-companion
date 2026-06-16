import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, X, Package } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { logClientDiagnostic } from "@/lib/diagnostics.functions";

type RuntimeIssue = {
  kind: "chunk-load" | "vite-error" | "unhandled" | "promise";
  message: string;
  url?: string;
  dependency?: string;
  stack?: string;
  at: number;
};

const DEP_PATTERNS: Array<{ re: RegExp; name: string }> = [
  { re: /@radix-ui[_/]react-slot/i, name: "@radix-ui/react-slot" },
  { re: /@radix-ui[_/]([\w-]+)/i, name: "@radix-ui/*" },
  { re: /\bclsx\b/i, name: "clsx" },
  { re: /@lovable[_/.]+dev[_/]cloud-auth-js/i, name: "@lovable.dev/cloud-auth-js" },
  { re: /@supabase[_/]supabase-js/i, name: "@supabase/supabase-js" },
  { re: /\bpdfjs-dist\b/i, name: "pdfjs-dist" },
  { re: /\bframer-motion\b/i, name: "framer-motion" },
  { re: /\breact-dropzone\b/i, name: "react-dropzone" },
  { re: /\bcanvas-confetti\b/i, name: "canvas-confetti" },
  { re: /node_modules\/\.vite\/deps\/([^.?]+)/i, name: "" },
];

function detectDependency(text: string): string | undefined {
  for (const { re, name } of DEP_PATTERNS) {
    const m = text.match(re);
    if (m) return name || m[1];
  }
  return undefined;
}

export function RuntimeDiagnostics() {
  const [issue, setIssue] = useState<RuntimeIssue | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const report = useServerFn(logClientDiagnostic);

  useEffect(() => {
    function record(next: RuntimeIssue) {
      setIssue(next);
      setDismissed(false);
      report({
        data: {
          kind: next.kind,
          message: next.message,
          url: next.url,
          stack: next.stack,
          userAgent: navigator.userAgent,
          route: window.location.pathname,
        },
      }).catch(() => {});
    }

    function onError(e: ErrorEvent) {
      const msg = e.message || String(e.error);
      const url = (e.filename || "") + "";
      const dep = detectDependency(msg + " " + url);
      const isChunk = /Failed to fetch dynamically imported module|Loading chunk|504|ChunkLoadError|Importing a module script failed/i.test(msg);
      record({
        kind: isChunk ? "chunk-load" : "unhandled",
        message: msg,
        url,
        dependency: dep,
        stack: e.error?.stack,
        at: Date.now(),
      });
    }

    function onRejection(e: PromiseRejectionEvent) {
      const reason = e.reason;
      const msg = typeof reason === "string" ? reason : reason?.message || String(reason);
      const stack = reason?.stack;
      const dep = detectDependency(msg + " " + (stack || ""));
      const isChunk = /Failed to fetch dynamically imported module|Loading chunk|504|ChunkLoadError/i.test(msg);
      record({
        kind: isChunk ? "chunk-load" : "promise",
        message: msg,
        dependency: dep,
        stack,
        at: Date.now(),
      });
    }

    function onViteError(e: Event) {
      const detail = (e as CustomEvent).detail as { err?: { message?: string; stack?: string; loc?: { file?: string } } } | undefined;
      const msg = detail?.err?.message || "Vite reported an error";
      const file = detail?.err?.loc?.file || "";
      const dep = detectDependency(msg + " " + file);
      record({ kind: "vite-error", message: msg, url: file, dependency: dep, stack: detail?.err?.stack, at: Date.now() });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("vite:error", onViteError as EventListener);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("vite:error", onViteError as EventListener);
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
                <Package className="size-3" />
                {issue.dependency}
              </div>
            )}
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
