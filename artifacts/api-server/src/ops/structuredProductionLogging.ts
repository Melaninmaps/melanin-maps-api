import crypto from "node:crypto";
import type { ErrorRequestHandler, RequestHandler } from "express";

type Logger = {
  info(payload: Record<string, unknown>, message?: string): void;
  error(payload: Record<string, unknown>, message?: string): void;
};

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack:
        process.env.NODE_ENV === "production"
          ? error.stack?.split("\n").slice(0, 8).join("\n")
          : error.stack,
      code: (error as Error & { code?: string }).code ?? null,
    };
  }
  return { name: "NonErrorThrow", message: String(error), stack: null, code: null };
}

export function requestCorrelationLogging(logger: Logger): RequestHandler {
  return (request, response, next) => {
    const requestId =
      request.header("x-request-id") || crypto.randomUUID();
    const start = performance.now();
    response.setHeader("x-request-id", requestId);
    response.on("finish", () => {
      logger.info(
        {
          requestId,
          method: request.method,
          route: request.route?.path ?? request.path,
          statusCode: response.statusCode,
          responseTimeMs: Math.round(performance.now() - start),
        },
        "request completed",
      );
    });
    next();
  };
}

export function structuredErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error, request, response, _next) => {
    const requestId =
      response.getHeader("x-request-id") ||
      request.header("x-request-id") ||
      "unknown";
    logger.error(
      {
        requestId,
        method: request.method,
        route: request.route?.path ?? request.path,
        statusCode: response.statusCode >= 400 ? response.statusCode : 500,
        error: serializeError(error),
      },
      "request errored",
    );

    if (response.headersSent) return;
    response
      .status(500)
      .json({ error: "The service could not complete that request.", requestId });
  };
}
