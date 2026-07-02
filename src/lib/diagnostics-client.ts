/**
 * Shared diagnostics utilities: session correlation, chunk-load tracking,
 * persistent issue log (for post-reload banner), dependency parsing,
 * and a lightweight in-session timeline.
 */

const SESSION_KEY = "recallly.diag.sessionId";
const LAST_ISSUE_KEY = "recallly.diag.lastIssue";
const LAST_CHUNK_KEY = "recallly.diag.lastChunk";
const TIMELINE_KEY = "recallly.diag.timeline";
const TIMELINE_MAX = 40;

export type TimelineEntry = { t: number; kind: string; detail?: string };

export type PersistedIssue = {
  eventId: string;
  sessionId: string;
  kind: string;
  message: string;
  dependency?: string;
  url?: string;
  route?: string;
  lastChunkUrl?: string;
  lastChunkAt?: number;
  timeline?: TimelineEntry[];
  at: number;
};

export type ChunkAttempt = { url: string; at: number };

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${uid()}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

export function newEventId() {
  return `e_${uid()}`;
}

/* ---------------- Timeline ---------------- */

export function pushTimeline(kind: string, detail?: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(TIMELINE_KEY);
    const arr: TimelineEntry[] = raw ? JSON.parse(raw) : [];
    arr.push({ t: Date.now(), kind, detail });
    if (arr.length > TIMELINE_MAX) arr.splice(0, arr.length - TIMELINE_MAX);
    sessionStorage.setItem(TIMELINE_KEY, JSON.stringify(arr));
  } catch {}
}

export function getTimeline(): TimelineEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(TIMELINE_KEY);
    return raw ? (JSON.parse(raw) as TimelineEntry[]) : [];
  } catch {
    return [];
  }
}

/* ---------------- Chunk tracking ---------------- */

export function recordChunkAttempt(url: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LAST_CHUNK_KEY, JSON.stringify({ url, at: Date.now() }));
    pushTimeline("chunk-attempt", url);
  } catch {}
}

export function getLastChunkAttempt(): ChunkAttempt | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_CHUNK_KEY);
    return raw ? (JSON.parse(raw) as ChunkAttempt) : null;
  } catch {
    return null;
  }
}

/* ---------------- Persisted issue ---------------- */

export function persistIssue(issue: PersistedIssue) {
  if (typeof window === "undefined") return;
  try {
    pushTimeline("first-error", `${issue.kind}:${issue.dependency ?? "?"}`);
    const withTimeline: PersistedIssue = {
      ...issue,
      timeline: issue.timeline ?? getTimeline(),
    };
    sessionStorage.setItem(LAST_ISSUE_KEY, JSON.stringify(withTimeline));
  } catch {}
}

export function takePersistedIssue(): PersistedIssue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_ISSUE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(LAST_ISSUE_KEY);
    return JSON.parse(raw) as PersistedIssue;
  } catch {
    return null;
  }
}

export function peekPersistedIssue(): PersistedIssue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_ISSUE_KEY);
    return raw ? (JSON.parse(raw) as PersistedIssue) : null;
  } catch {
    return null;
  }
}

/* ---------------- Dependency detection ---------------- */

const DEP_RULES: Array<{ re: RegExp; name: string | ((m: RegExpMatchArray) => string) }> = [
  { re: /@radix-ui[_/]react-slot/i, name: "@radix-ui/react-slot" },
  { re: /@radix-ui[_/]react-dialog/i, name: "@radix-ui/react-dialog" },
  { re: /@radix-ui[_/]react-([\w-]+)/i, name: (m) => `@radix-ui/react-${m[1]}` },
  { re: /@lovable[_./-]+(?:dev[_./-]+)?cloud-auth-js/i, name: "@lovable.dev/cloud-auth-js" },
  { re: /@supabase[_/]supabase-js/i, name: "@supabase/supabase-js" },
  { re: /\bclsx\b/i, name: "clsx" },
  { re: /\btailwind-merge\b/i, name: "tailwind-merge" },
  { re: /\bpdfjs-dist\b/i, name: "pdfjs-dist" },
  { re: /\bframer-motion\b/i, name: "framer-motion" },
  { re: /\breact-dropzone\b/i, name: "react-dropzone" },
  { re: /\bcanvas-confetti\b/i, name: "canvas-confetti" },
  { re: /\bsonner\b/i, name: "sonner" },
  { re: /\blucide-react\b/i, name: "lucide-react" },
  { re: /@tanstack[_/]react-query/i, name: "@tanstack/react-query" },
  { re: /@tanstack[_/]react-router/i, name: "@tanstack/react-router" },
  { re: /@ai-sdk[_/]([\w-]+)/i, name: (m) => `@ai-sdk/${m[1]}` },
  {
    re: /node_modules\/\.vite\/deps\/([^.?\s]+)\.js/i,
    name: (m) => m[1].replace(/^_+/, "").replace(/_/g, "/"),
  },
];

export function detectDependency(...texts: Array<string | undefined>): string | undefined {
  const blob = texts.filter(Boolean).join("\n");
  if (!blob) return undefined;
  for (const rule of DEP_RULES) {
    const m = blob.match(rule.re);
    if (m) return typeof rule.name === "function" ? rule.name(m) : rule.name;
  }
  return undefined;
}

export function isChunkLoadError(message: string): boolean {
  return /Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError|Importing a module script failed|\b504\b/i.test(
    message,
  );
}

/* ---------------- Environment detection ---------------- */

export type EnvKind = "localhost" | "lovable-preview" | "deployed";

export function detectEnv(): EnvKind {
  if (typeof window === "undefined") return "deployed";
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".local")) return "localhost";
  if (h.includes("lovable.app") || h.includes("lovableproject.com")) return "lovable-preview";
  return "deployed";
}

/** Steps for the one-click "Clear Vite cache" action, tailored per env. */
export function clearCacheSteps(env: EnvKind = detectEnv()): {
  title: string;
  steps: string[];
  autoAction?: "hard-reload";
} {
  if (env === "localhost") {
    return {
      title: "Clear Vite cache (local dev)",
      steps: [
        "Stop the dev server (Ctrl+C in the terminal running `vite dev`).",
        "Delete Vite's pre-bundle cache: `rm -rf node_modules/.vite`.",
        "Restart with `bun dev` (or `npm run dev`).",
        "Back here, hard-reload the tab (Cmd/Ctrl+Shift+R).",
      ],
      autoAction: "hard-reload",
    };
  }
  if (env === "lovable-preview") {
    return {
      title: "Clear preview cache",
      steps: [
        "The preview auto-rebuilds — a hard reload is usually enough.",
        "If the error repeats, open DevTools → Application → Clear storage.",
        "Then hard-reload (Cmd/Ctrl+Shift+R).",
      ],
      autoAction: "hard-reload",
    };
  }
  return {
    title: "Refresh the app",
    steps: [
      "Hard-reload the page (Cmd/Ctrl+Shift+R) to bypass the browser cache.",
      "If it persists, clear site data in DevTools → Application → Clear storage.",
    ],
    autoAction: "hard-reload",
  };
}

export function hardReload() {
  if (typeof window === "undefined") return;
  try {
    // Best-effort: append a cache-buster query and reload.
    const url = new URL(window.location.href);
    url.searchParams.set("__hr", Date.now().toString(36));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

/* ---------------- KB fixes ---------------- */

export function fixesFor(dep?: string): Array<{ id: string; title: string; body: string }> {
  const generic = [
    { id: "hard-reload", title: "Hard reload the page", body: "Press Cmd/Ctrl+Shift+R to bypass cache and re-fetch every bundle." },
    { id: "clear-storage", title: "Clear site data", body: "Open DevTools → Application → Clear storage if hard reload didn't help." },
    { id: "wait-retry", title: "Wait 10s and retry", body: "The dev server may be re-bundling. A fresh load usually resolves it." },
  ];
  if (!dep) return generic;
  if (dep.startsWith("@radix-ui/"))
    return [
      { id: "radix-reprebundle", title: "Re-prebundle Radix", body: "Radix sub-packages often need Vite to re-optimize. Reload to retry." },
      ...generic,
    ];
  if (dep === "clsx" || dep === "tailwind-merge")
    return [
      { id: "util-transient", title: "Tiny util failed to load", body: "Usually a transient 504 — a reload almost always fixes it." },
      ...generic,
    ];
  if (dep.includes("cloud-auth-js") || dep.includes("supabase"))
    return [
      { id: "auth-stalled", title: "Auth bundle stalled", body: "Sign-in libraries failed to load. Reload, then try signing in again." },
      ...generic,
    ];
  return generic;
}
