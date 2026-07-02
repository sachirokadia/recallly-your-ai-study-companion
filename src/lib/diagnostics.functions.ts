import { createServerFn } from "@tanstack/react-start";

export type DiagnosticPayload = {
  kind: string;
  message: string;
  url?: string;
  stack?: string;
  userAgent?: string;
  route?: string;
  dependency?: string;
  sessionId?: string;
  eventId?: string;
  lastChunkUrl?: string;
  lastChunkAt?: number;
  timeline?: Array<{ t: number; kind: string; detail?: string }>;
};

export const logClientDiagnostic = createServerFn({ method: "POST" })
  .inputValidator((data: DiagnosticPayload) => data)
  .handler(async ({ data }) => {
    const cid = `${data.sessionId ?? "anon"}/${data.eventId ?? "-"}`;
    console.error(
      `[client-diagnostic cid=${cid}] ${data.kind} :: ${data.message}` +
        (data.dependency ? ` :: dep=${data.dependency}` : "") +
        (data.url ? ` :: url=${data.url}` : "") +
        (data.lastChunkUrl ? ` :: lastChunk=${data.lastChunkUrl}@${data.lastChunkAt}` : "") +
        (data.route ? ` :: route=${data.route}` : "") +
        (data.userAgent ? ` :: ua=${data.userAgent}` : "") +
        (data.timeline?.length ? ` :: timeline=${JSON.stringify(data.timeline)}` : "") +
        (data.stack ? `\n${data.stack}` : ""),
    );
    return { ok: true, at: Date.now(), correlationId: cid };
  });

export type DiagnosticActionPayload = {
  action:
    | "reload"
    | "hard-reload"
    | "kb-open"
    | "kb-fix"
    | "clear-vite-cache"
    | "run-diagnostics"
    | "dismiss";
  detail?: string;
  sessionId?: string;
  eventId?: string;
  route?: string;
  dependency?: string;
};

export const logClientDiagnosticAction = createServerFn({ method: "POST" })
  .inputValidator((data: DiagnosticActionPayload) => data)
  .handler(async ({ data }) => {
    const cid = `${data.sessionId ?? "anon"}/${data.eventId ?? "-"}`;
    console.log(
      `[client-diagnostic-action cid=${cid}] action=${data.action}` +
        (data.detail ? ` :: detail=${data.detail}` : "") +
        (data.dependency ? ` :: dep=${data.dependency}` : "") +
        (data.route ? ` :: route=${data.route}` : ""),
    );
    return { ok: true, at: Date.now(), correlationId: cid };
  });
