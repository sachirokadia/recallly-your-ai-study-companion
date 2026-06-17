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
        (data.stack ? `\n${data.stack}` : ""),
    );
    return { ok: true, at: Date.now(), correlationId: cid };
  });
