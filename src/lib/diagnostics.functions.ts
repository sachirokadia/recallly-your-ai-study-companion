import { createServerFn } from "@tanstack/react-start";

export const logClientDiagnostic = createServerFn({ method: "POST" })
  .inputValidator((data: { kind: string; message: string; url?: string; stack?: string; userAgent?: string; route?: string }) => data)
  .handler(async ({ data }) => {
    // Server log — visible in worker/dev-server logs.
    console.error(
      `[client-diagnostic] ${data.kind} :: ${data.message}` +
        (data.url ? ` :: url=${data.url}` : "") +
        (data.route ? ` :: route=${data.route}` : "") +
        (data.userAgent ? ` :: ua=${data.userAgent}` : "") +
        (data.stack ? `\n${data.stack}` : ""),
    );
    return { ok: true, at: Date.now() };
  });
