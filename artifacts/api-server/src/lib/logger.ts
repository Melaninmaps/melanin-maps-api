import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

function serializeCause(cause: unknown): Record<string, unknown> | undefined {
  if (!cause || typeof cause !== "object") return undefined;
  const c = cause as Record<string, unknown>;
  return {
    type: (cause as { constructor?: { name?: string } })?.constructor?.name,
    message: c.message,
    stack: typeof c.stack === "string" ? c.stack.slice(0, 600) : undefined,
    code: c.code,
    severity: c.severity,
    detail: c.detail,
    hint: c.hint,
    where: c.where,
    constraint: c.constraint,
    table: c.table,
    column: c.column,
    sqlState: (c as Record<string, unknown>).sqlState ?? (c as Record<string, unknown>).SQLSTATE,
    errno: c.errno,
    syscall: c.syscall,
    address: c.address,
    port: c.port,
  };
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  serializers: {
    err: (err: unknown) => {
      if (!err || typeof err !== "object") return err;
      const e = err as Record<string, unknown>;
      return {
        type: (err as { constructor?: { name?: string } })?.constructor?.name ?? "Error",
        message: e.message,
        stack: typeof e.stack === "string" ? e.stack.slice(0, 800) : undefined,
        code: e.code,
        severity: e.severity,
        detail: e.detail,
        hint: e.hint,
        constraint: e.constraint,
        sqlState: (e as Record<string, unknown>).sqlState ?? (e as Record<string, unknown>).SQLSTATE,
        errno: e.errno,
        syscall: e.syscall,
        address: e.address,
        port: e.port,
        cause: serializeCause(e.cause),
      };
    },
  },
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
