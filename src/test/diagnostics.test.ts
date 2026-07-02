/**
 * Diagnostics unit tests — simulate missing Radix/clsx/auth chunks and
 * verify: correlation IDs, dependency detection, persisted issue payload
 * (drives the post-reload banner), startup card failure list, and
 * KB drawer contents (fixesFor).
 *
 * Run with: `bun test src/test/diagnostics.test.ts`
 */
import { describe, it, expect, beforeEach } from "bun:test";

// jsdom-lite: give the module a sessionStorage before importing.
class MemStore {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}
(globalThis as any).window = globalThis;
(globalThis as any).sessionStorage = new MemStore();
(globalThis as any).crypto = (globalThis as any).crypto ?? {
  randomUUID: () => "abcd1234-ef56-7890-abcd-ef1234567890",
};

const D = await import("../lib/diagnostics-client");

const RADIX_SLOT_504 = {
  message: "Failed to fetch dynamically imported module: http://localhost:5173/node_modules/.vite/deps/@radix-ui_react-slot.js?v=abc",
  url: "http://localhost:5173/node_modules/.vite/deps/@radix-ui_react-slot.js?v=abc",
  stack: "at http://localhost:5173/node_modules/.vite/deps/@radix-ui_react-slot.js:1:1",
};
const CLSX_504 = {
  message: "Loading chunk clsx failed (504)",
  url: "http://localhost:5173/node_modules/.vite/deps/clsx.js?v=xyz",
};
const AUTH_504 = {
  message: "Importing a module script failed.",
  url: "http://localhost:5173/node_modules/.vite/deps/@lovable_dev_cloud-auth-js.js?v=zzz",
};

beforeEach(() => {
  (globalThis as any).sessionStorage.clear();
});

describe("detectDependency", () => {
  it("identifies @radix-ui/react-slot from a Vite mangled URL", () => {
    expect(D.detectDependency(RADIX_SLOT_504.message, RADIX_SLOT_504.url, RADIX_SLOT_504.stack))
      .toBe("@radix-ui/react-slot");
  });
  it("identifies clsx from a chunk URL", () => {
    expect(D.detectDependency(CLSX_504.message, CLSX_504.url)).toBe("clsx");
  });
  it("identifies the auth package from a mangled dep name", () => {
    expect(D.detectDependency(AUTH_504.message, AUTH_504.url)).toBe(
      "@lovable.dev/cloud-auth-js",
    );
  });
  it("returns undefined when nothing matches", () => {
    expect(D.detectDependency("random unrelated error")).toBeUndefined();
  });
});

describe("isChunkLoadError", () => {
  it("flags Vite-style dynamic import failures", () => {
    expect(D.isChunkLoadError(RADIX_SLOT_504.message)).toBe(true);
    expect(D.isChunkLoadError(CLSX_504.message)).toBe(true);
    expect(D.isChunkLoadError(AUTH_504.message)).toBe(true);
  });
  it("does not flag ordinary runtime errors", () => {
    expect(D.isChunkLoadError("TypeError: undefined is not a function")).toBe(false);
  });
});

describe("correlation IDs + persisted issue (drives banner)", () => {
  it("gives stable sessionId and unique eventIds", () => {
    const s1 = D.getSessionId();
    const s2 = D.getSessionId();
    expect(s1).toBe(s2);
    expect(s1.startsWith("s_")).toBe(true);
    const e1 = D.newEventId();
    const e2 = D.newEventId();
    expect(e1.startsWith("e_")).toBe(true);
    expect(e2.startsWith("e_")).toBe(true);
  });

  it("records chunk attempts and persists the full issue with timeline", () => {
    D.pushTimeline("health-check-start");
    D.pushTimeline("health-check-end", "ok");
    D.recordChunkAttempt(RADIX_SLOT_504.url);

    const lastChunk = D.getLastChunkAttempt();
    expect(lastChunk?.url).toBe(RADIX_SLOT_504.url);

    const eventId = D.newEventId();
    const sessionId = D.getSessionId();
    D.persistIssue({
      eventId,
      sessionId,
      kind: "chunk-load",
      message: RADIX_SLOT_504.message,
      dependency: D.detectDependency(RADIX_SLOT_504.message, RADIX_SLOT_504.url),
      url: RADIX_SLOT_504.url,
      route: "/dashboard",
      lastChunkUrl: lastChunk?.url,
      lastChunkAt: lastChunk?.at,
      at: Date.now(),
    });

    // Peek then take (mirrors post-reload-banner behavior).
    const peeked = D.peekPersistedIssue();
    expect(peeked?.dependency).toBe("@radix-ui/react-slot");
    expect(peeked?.route).toBe("/dashboard");
    expect(peeked?.lastChunkUrl).toBe(RADIX_SLOT_504.url);
    expect(peeked?.eventId).toBe(eventId);

    const taken = D.takePersistedIssue();
    expect(taken?.timeline?.length).toBeGreaterThanOrEqual(3);
    const kinds = taken!.timeline!.map((t) => t.kind);
    expect(kinds).toContain("health-check-start");
    expect(kinds).toContain("health-check-end");
    expect(kinds).toContain("chunk-attempt");
    expect(kinds).toContain("first-error");

    // Taken clears it — second read should be null.
    expect(D.takePersistedIssue()).toBeNull();
  });
});

describe("fixesFor (KB drawer)", () => {
  it("prepends a Radix-specific tip for @radix-ui/*", () => {
    const fixes = D.fixesFor("@radix-ui/react-slot");
    expect(fixes[0].id).toBe("radix-reprebundle");
    expect(fixes.some((f) => f.id === "hard-reload")).toBe(true);
  });
  it("prepends a util tip for clsx/tailwind-merge", () => {
    expect(D.fixesFor("clsx")[0].id).toBe("util-transient");
    expect(D.fixesFor("tailwind-merge")[0].id).toBe("util-transient");
  });
  it("prepends an auth tip for the auth package", () => {
    expect(D.fixesFor("@lovable.dev/cloud-auth-js")[0].id).toBe("auth-stalled");
  });
  it("returns generic fixes when no dependency is known", () => {
    const generic = D.fixesFor(undefined);
    expect(generic[0].id).toBe("hard-reload");
  });
});

describe("clearCacheSteps (one-click Clear Vite cache)", () => {
  it("gives localhost-specific rm -rf node_modules/.vite steps", () => {
    const c = D.clearCacheSteps("localhost");
    expect(c.steps.join("\n")).toMatch(/node_modules\/\.vite/);
    expect(c.autoAction).toBe("hard-reload");
  });
  it("gives preview-specific steps", () => {
    const c = D.clearCacheSteps("lovable-preview");
    expect(c.title).toMatch(/preview/i);
  });
  it("gives deployed-friendly steps without shell commands", () => {
    const c = D.clearCacheSteps("deployed");
    expect(c.steps.join("\n")).not.toMatch(/rm -rf/);
  });
});
