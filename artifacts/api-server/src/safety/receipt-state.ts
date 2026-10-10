/**
 * Safety Hub provider-receipt state boundary.
 *
 * Provider receipts are provider-side evidence only. Even an `accepted` receipt
 * leaves device delivery unconfirmed because neither Expo nor this service can
 * observe that a person/device received or displayed a notification.
 */

import type { NotificationSubmissionResult, ProviderHttpResponse } from "./notification-provider";

export type ReceiptRetryTarget = "none" | "lookup_receipt" | "manual_review";

export type ProviderReceiptState =
  | "not_applicable"
  | "awaiting_provider_receipt"
  | "provider_receipt_pending"
  | "provider_receipt_accepted"
  | "provider_receipt_retryable_failure"
  | "provider_receipt_terminal_failure"
  | "provider_receipt_unknown";

export type ProviderReceiptResult = {
  kind: "provider_receipt";
  state: ProviderReceiptState;
  /** Provider-side receipt evidence never establishes delivery to a device. */
  delivery: "unconfirmed";
  retryTarget: ReceiptRetryTarget;
  terminal: boolean;
  reason:
    | "submission_not_accepted"
    | "awaiting_provider_receipt"
    | "provider_receipt_not_ready"
    | "provider_receipt_accepted"
    | "provider_receipt_unavailable"
    | "provider_receipt_rejected"
    | "provider_receipt_unparseable";
};

const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_EXPO_ERRORS = new Set(["MessageRateExceeded", "InternalServerError"]);

function receiptResult(
  state: ProviderReceiptState,
  reason: ProviderReceiptResult["reason"],
  retryTarget: ReceiptRetryTarget,
): ProviderReceiptResult {
  return {
    kind: "provider_receipt",
    state,
    delivery: "unconfirmed",
    retryTarget,
    terminal: retryTarget === "none",
    reason,
  };
}

/**
 * Converts a provider submission outcome into the only honest receipt state.
 * Failed, unknown, and unconfigured submissions are not candidates for a
 * receipt lookup. A submission acknowledgement starts a lookup, never delivery.
 */
export function receiptStateAfterSubmission(
  submission: NotificationSubmissionResult,
): ProviderReceiptResult {
  if (submission.state !== "provider_accepted" || !submission.submissionReference) {
    return receiptResult("not_applicable", "submission_not_accepted", "none");
  }
  return receiptResult("awaiting_provider_receipt", "awaiting_provider_receipt", "lookup_receipt");
}

type ExpoReceipt = {
  status?: unknown;
  details?: { error?: unknown };
};

function receiptForReference(body: unknown, reference: string): ExpoReceipt | null {
  if (!body || typeof body !== "object" || !("data" in body)) return null;
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const receipt = (data as Record<string, unknown>)[reference];
  return receipt && typeof receipt === "object" ? receipt as ExpoReceipt : null;
}

/**
 * Classifies a response from Expo's receipt endpoint. This function is pure with
 * respect to I/O: a caller supplies a response from its own injected transport.
 */
export async function classifyExpoReceiptResponse(
  response: ProviderHttpResponse,
  submissionReference: string,
): Promise<ProviderReceiptResult> {
  if (!submissionReference.trim()) {
    return receiptResult("not_applicable", "submission_not_accepted", "none");
  }
  if (!response.ok) {
    return RETRYABLE_HTTP_STATUSES.has(response.status)
      ? receiptResult("provider_receipt_retryable_failure", "provider_receipt_unavailable", "lookup_receipt")
      : receiptResult("provider_receipt_terminal_failure", "provider_receipt_rejected", "none");
  }

  try {
    const receipt = receiptForReference(await response.json(), submissionReference);
    if (!receipt) {
      // Expo can take time to expose a receipt. Poll the receipt endpoint; do
      // not resubmit the original notification.
      return receiptResult("provider_receipt_pending", "provider_receipt_not_ready", "lookup_receipt");
    }
    if (receipt.status === "ok") {
      return receiptResult("provider_receipt_accepted", "provider_receipt_accepted", "none");
    }
    const error = typeof receipt.details?.error === "string" ? receipt.details.error : null;
    if (error && RETRYABLE_EXPO_ERRORS.has(error)) {
      return receiptResult("provider_receipt_retryable_failure", "provider_receipt_unavailable", "lookup_receipt");
    }
    if (receipt.status === "error") {
      return receiptResult("provider_receipt_terminal_failure", "provider_receipt_rejected", "none");
    }
    return receiptResult("provider_receipt_unknown", "provider_receipt_unparseable", "manual_review");
  } catch {
    return receiptResult("provider_receipt_unknown", "provider_receipt_unparseable", "manual_review");
  }
}
