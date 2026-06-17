/**
 * Shared diagnostics utilities: session correlation, chunk-load tracking,
 * persistent issue log (for post-reload banner), and dependency parsing.
 */

const SESSION_KEY = "recallly.diag.sessionId";
const LAST_ISSUE_KEY = "recallly.diag.lastIssue";
const LAST_CHUNK_KEY = "recallly.diag.lastChunk";

export type PersistedIssue = {
  eventId: string;
  sessionId: string;
  kind: string;
  message: string;
  dependency?: string;
  url?: string;
  route?: string;
  at: number;
};

export type ChunkAttempt = { url: string; at: number };

function uid() {
  return (
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  );
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

export function recordChunkAttempt(url: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LAST_CHUNK_KEY, JSON.stringify({ url, at: Date.now() }));
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

export function persistIssue(issue: PersistedIssue) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LAST_ISSUE_KEY, JSON.stringify(issue));
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

/**
 * Detect failing dependency from messages, stack traces and chunk URLs.
 * Handles Vite's mangled deps filenames (`@radix-ui_react-slot.js`) and
 * normal package paths inside stack traces.
 */
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
  // Vite deps fallback: node_modules/.vite/deps/<name>.js
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

/** Tailored remediation tips per detected dependency. */
export function fixesFor(dep?: string): Array<{ title: string; body: string }> {
  const generic = [
    { title: "Hard reload the page", body: "Press Cmd/Ctrl+Shift+R to bypass cache and re-fetch every bundle." },
    { title: "Clear site data", body: "Open DevTools → Application → Clear storage if hard reload didn't help." },
    { title: "Wait 10s and retry", body: "The dev server may be re-bundling. A fresh load usually resolves it." },
  ];
  if (!dep) return generic;
  if (dep.startsWith("@radix-ui/"))
    return [
      { title: "Re-prebundle Radix", body: "Radix sub-packages often need Vite to re-optimize. Reload to retry." },
      ...generic,
    ];
  if (dep === "clsx" || dep === "tailwind-merge")
    return [
      { title: "Tiny util failed to load", body: "Usually a transient 504 — a reload almost always fixes it." },
      ...generic,
    ];
  if (dep.includes("cloud-auth-js") || dep.includes("supabase"))
    return [
      { title: "Auth bundle stalled", body: "Sign-in libraries failed to load. Reload, then try signing in again." },
      ...generic,
    ];
  return generic;
}
