/**
 * Safety Hub notification-provider boundary.
 *
 * This adapter records only what a provider says about accepting a submission.
 * A successful submission is deliberately never represented as device delivery;
 * the caller must use receipt-state.ts for a later provider-receipt lookup.
 */

export type NotificationProviderId = "expo";

export type SubmissionRetryTarget =
  | "none"
  | "resubmit"
  | "manual_review"
  | "requires_configuration";

export type NotificationSubmissionState =
  | "provider_accepted"
  | "provider_retryable_failure"
  | "provider_terminal_failure"
  | "provider_submission_unknown"
  | "provider_not_configured";

/** Every submission result intentionally leaves device delivery unconfirmed. */
export type NotificationSubmissionResult = {
  kind: "provider_submission";
  provider: NotificationProviderId;
  state: NotificationSubmissionState;
  /** Expo ticket/reference, not a device-delivery receipt. */
  submissionReference: string | null;
  /** This boundary has no evidence that a device received a notification. */
  delivery: "unconfirmed";
  retryTarget: SubmissionRetryTarget;
  /** Terminal for a resubmission; receipt lookup is tracked separately. */
  terminal: boolean;
  reason:
    | "accepted_by_provider"
    | "missing_provider_endpoint"
    | "invalid_provider_endpoint"
    | "transport_unavailable"
    | "missing_recipient_token"
    | "invalid_notification_content"
    | "provider_rejected"
    | "provider_unavailable"
    | "provider_response_unparseable"
    | "provider_transport_outcome_unknown";
};

export type NotificationProviderMessage = {
  recipientToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export type ProviderHttpResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

export type ProviderHttpTransport = (
  url: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
  },
) => Promise<ProviderHttpResponse>;

export type ExpoNotificationProviderOptions = {
  /** Must be supplied by deployment configuration; no guessed production host. */
  endpoint?: string | null;
  /** Injectable transport keeps unit tests and dry runs from sending notifications. */
  transport?: ProviderHttpTransport | null;
};

export type NotificationProviderConfiguration =
  | { configured: true; endpoint: string }
  | {
      configured: false;
      reason: "missing_provider_endpoint" | "invalid_provider_endpoint" | "transport_unavailable";
    };

export type NotificationProviderAdapter = {
  readonly provider: NotificationProviderId;
  readonly configuration: NotificationProviderConfiguration;
  submit(message: NotificationProviderMessage): Promise<NotificationSubmissionResult>;
};

const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_EXPO_ERRORS = new Set(["MessageRateExceeded", "InternalServerError"]);

function submissionResult(
  state: NotificationSubmissionState,
  reason: NotificationSubmissionResult["reason"],
  retryTarget: SubmissionRetryTarget,
  submissionReference: string | null = null,
): NotificationSubmissionResult {
  return {
    kind: "provider_submission",
    provider: "expo",
    state,
    submissionReference,
    delivery: "unconfirmed",
    retryTarget,
    terminal: retryTarget === "none" || retryTarget === "requires_configuration",
    reason,
  };
}

function configuredEndpoint(endpoint: string | null | undefined): NotificationProviderConfiguration {
  const trimmed = endpoint?.trim();
  if (!trimmed) return { configured: false, reason: "missing_provider_endpoint" };
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return { configured: false, reason: "invalid_provider_endpoint" };
    }
    return { configured: true, endpoint: parsed.toString() };
  } catch {
    return { configured: false, reason: "invalid_provider_endpoint" };
  }
}

function validMessage(message: NotificationProviderMessage): NotificationSubmissionResult | null {
  if (!message.recipientToken?.trim()) {
    return submissionResult("provider_terminal_failure", "missing_recipient_token", "none");
  }
  if (!message.title?.trim() || !message.body?.trim()) {
    return submissionResult("provider_terminal_failure", "invalid_notification_content", "none");
  }
  return null;
}

function expoTicket(body: unknown): { status: string; id: string | null; error: string | null } | null {
  if (!body || typeof body !== "object" || !("data" in body)) return null;
  const data = (body as { data?: unknown }).data;
  const tickets = Array.isArray(data) ? data : data ? [data] : [];
  if (tickets.length !== 1 || !tickets[0] || typeof tickets[0] !== "object") return null;
  const ticket = tickets[0] as { status?: unknown; id?: unknown; details?: { error?: unknown } };
  if (typeof ticket.status !== "string") return null;
  return {
    status: ticket.status,
    id: typeof ticket.id === "string" && ticket.id.trim() ? ticket.id.trim() : null,
    error: typeof ticket.details?.error === "string" ? ticket.details.error : null,
  };
}

/**
 * Classifies a completed Expo HTTP response. It is exported so tests can prove
 * that the adapter never promotes a provider ticket into a delivery receipt.
 */
export async function classifyExpoSubmissionResponse(
  response: ProviderHttpResponse,
): Promise<NotificationSubmissionResult> {
  if (!response.ok) {
    return RETRYABLE_HTTP_STATUSES.has(response.status)
      ? submissionResult("provider_retryable_failure", "provider_unavailable", "resubmit")
      : submissionResult("provider_terminal_failure", "provider_rejected", "none");
  }

  try {
    const ticket = expoTicket(await response.json());
    if (!ticket) {
      // The provider answered, but acceptance cannot be established. Retrying a
      // request of unknown outcome could duplicate a notification.
      return submissionResult("provider_submission_unknown", "provider_response_unparseable", "manual_review");
    }
    if (ticket.status === "ok" && ticket.id) {
      return submissionResult("provider_accepted", "accepted_by_provider", "none", ticket.id);
    }
    if (ticket.status === "error" && ticket.error && RETRYABLE_EXPO_ERRORS.has(ticket.error)) {
      return submissionResult("provider_retryable_failure", "provider_unavailable", "resubmit");
    }
    return submissionResult("provider_terminal_failure", "provider_rejected", "none");
  } catch {
    return submissionResult("provider_submission_unknown", "provider_response_unparseable", "manual_review");
  }
}

/**
 * Creates an explicit configuration boundary. The adapter does not silently
 * assume an Expo endpoint, and it has no database or workflow side effects.
 */
export function createExpoNotificationProvider(
  options: ExpoNotificationProviderOptions = {},
): NotificationProviderAdapter {
  const endpointConfiguration = configuredEndpoint(options.endpoint);
  const configuration: NotificationProviderConfiguration = !endpointConfiguration.configured
    ? endpointConfiguration
    : !options.transport
      ? { configured: false, reason: "transport_unavailable" }
      : endpointConfiguration;

  return {
    provider: "expo",
    configuration,
    async submit(message) {
      const invalid = validMessage(message);
      if (invalid) return invalid;
      if (!configuration.configured) {
        return submissionResult(
          "provider_not_configured",
          configuration.reason,
          "requires_configuration",
        );
      }

      try {
        const response = await options.transport!(configuration.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
          },
          body: JSON.stringify({
            to: message.recipientToken,
            title: message.title,
            body: message.body,
            data: message.data ?? {},
            sound: "default",
            priority: "high",
          }),
        });
        return classifyExpoSubmissionResponse(response);
      } catch {
        // A transport exception can occur after bytes left this process. Do not
        // blindly resend and risk a duplicate notification.
        return submissionResult("provider_submission_unknown", "provider_transport_outcome_unknown", "manual_review");
      }
    },
  };
}
