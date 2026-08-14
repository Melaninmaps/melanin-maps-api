/*
 * Add to the existing KinfolkAI route. Do not log prompts, replies, tokens,
 * cookies, emails, user IDs, or raw provider errors.
 */

type KinfolkTelemetry = {
  requestId: string;
  questionClass: string;
  status: number;
  degraded: boolean;
  degradedReason: string | null;
  providerStatus: number | null;
  latencyMs: number;
};

const degradedWindow: Array<{ at: number; degraded: boolean }> = [];
const DEGRADED_WINDOW_MS = 15 * 60 * 1000;
const DEGRADED_MIN_REQUESTS = 20;
const DEGRADED_ALERT_PERCENT = 5;

function recordKinfolkTelemetry(event: KinfolkTelemetry): void {
  const now = Date.now();
  degradedWindow.push({ at: now, degraded: event.degraded });
  while (degradedWindow.length && degradedWindow[0].at < now - DEGRADED_WINDOW_MS) {
    degradedWindow.shift();
  }

  const total = degradedWindow.length;
  const degradedCount = degradedWindow.filter((e) => e.degraded).length;
  const degradedPercent = total ? (degradedCount / total) * 100 : 0;

  // Replace logger with the project’s structured logger.
  logger.info("kinfolk_generation_result", {
    requestId: event.requestId,
    questionClass: event.questionClass,
    status: event.status,
    degraded: event.degraded,
    degradedReason: event.degradedReason,
    providerStatus: event.providerStatus,
    latencyMs: event.latencyMs,
    degradedWindowRequests: total,
    degradedWindowPercent: Number(degradedPercent.toFixed(2)),
  });

  if (total >= DEGRADED_MIN_REQUESTS && degradedPercent > DEGRADED_ALERT_PERCENT) {
    logger.warn("kinfolk_degraded_rate_threshold_exceeded", {
      requestId: event.requestId,
      windowMinutes: 15,
      requestCount: total,
      degradedCount,
      degradedPercent: Number(degradedPercent.toFixed(2)),
      thresholdPercent: DEGRADED_ALERT_PERCENT,
    });
    // Optional: call the existing alert/webhook service here. The webhook URL
    // must come from a secret; never include a token or response body.
  }
}

/* Inside the existing POST /kinfolk/chat handler: */
const requestId = crypto.randomUUID();
const generationStartedAt = Date.now();
let telemetryQuestionClass = "unknown";
let telemetryProviderStatus: number | null = null;

try {
  telemetryQuestionClass = intentClass ?? "unknown";
  // Existing KinfolkAI generation code remains here.
  // On the normal response path, immediately before res.status(200).json(...):
  recordKinfolkTelemetry({
    requestId,
    questionClass: telemetryQuestionClass,
    status: 200,
    degraded: false,
    degradedReason: null,
    providerStatus: null,
    latencyMs: Date.now() - generationStartedAt,
  });

  // Existing response follows; add requestId only if it is already part of the
  // public response contract. It is safe to keep it server-log-only.
} catch (providerError) {
  telemetryProviderStatus = Number((providerError as any)?.status ?? (providerError as any)?.statusCode) || null;
  const isRetryable = [429, 500, 502, 503, 504].includes(telemetryProviderStatus ?? -1);

  if (libraryTopic && isRetryable) {
    recordKinfolkTelemetry({
      requestId,
      questionClass: telemetryQuestionClass || "library",
      status: 200,
      degraded: true,
      degradedReason: "provider_transient_error_library_fallback",
      providerStatus: telemetryProviderStatus,
      latencyMs: Date.now() - generationStartedAt,
    });
    // Existing deterministic HTTP 200 fallback response follows here.
    return;
  }

  recordKinfolkTelemetry({
    requestId,
    questionClass: telemetryQuestionClass,
    status: telemetryProviderStatus ?? 500,
    degraded: false,
    degradedReason: null,
    providerStatus: telemetryProviderStatus,
    latencyMs: Date.now() - generationStartedAt,
  });
  throw providerError;
}

/* Production recommendation:
 * Replace the in-memory degradedWindow with Redis/DB/metrics storage if the
 * app runs more than one Railway instance. In-memory percentages are per
 * process and are not a complete production metric across replicas.
 */
