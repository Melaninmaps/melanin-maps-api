import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyExpoSubmissionResponse,
  createExpoNotificationProvider,
  type ProviderHttpTransport,
} from "../notification-provider";
import {
  classifyExpoReceiptResponse,
  receiptStateAfterSubmission,
} from "../receipt-state";

const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const message = {
  recipientToken: "ExponentPushToken[test-token]",
  title: "Safety alert",
  body: "A severe alert was issued for your selected area.",
  data: { type: "safety_alert" },
};

function transportReturning(body: unknown, status = 200): ProviderHttpTransport {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Safety Hub notification-provider boundary", () => {
  it("requires explicit provider configuration and makes no transport call when it is absent", async () => {
    const transport = transportReturning({ data: { status: "ok", id: "ticket-not-used" } });
    const provider = createExpoNotificationProvider({ transport });

    expect(provider.configuration).toEqual({ configured: false, reason: "missing_provider_endpoint" });
    await expect(provider.submit(message)).resolves.toMatchObject({
      kind: "provider_submission",
      state: "provider_not_configured",
      delivery: "unconfirmed",
      retryTarget: "requires_configuration",
      terminal: true,
      reason: "missing_provider_endpoint",
    });
    expect(transport).not.toHaveBeenCalled();
  });

  it("never uses global fetch in tests; only an injected fake transport may observe a submission", async () => {
    const globalFetch = vi.fn(() => {
      throw new Error("a test attempted a real notification send");
    });
    vi.stubGlobal("fetch", globalFetch);
    const transport = transportReturning({ data: { status: "ok", id: "expo-ticket-123" } });
    const provider = createExpoNotificationProvider({ endpoint: EXPO_ENDPOINT, transport });

    const result = await provider.submit(message);

    expect(transport).toHaveBeenCalledOnce();
    expect(globalFetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      kind: "provider_submission",
      provider: "expo",
      state: "provider_accepted",
      submissionReference: "expo-ticket-123",
      delivery: "unconfirmed",
      retryTarget: "none",
      terminal: true,
      reason: "accepted_by_provider",
    });
    expect(JSON.stringify(result)).not.toMatch(/delivered|delivery_receipt/i);
  });

  it("does not turn a provider ticket or accepted provider receipt into a device-delivery claim", async () => {
    const submission = await classifyExpoSubmissionResponse({
      ok: true,
      status: 200,
      json: async () => ({ data: { status: "ok", id: "expo-ticket-123" } }),
    });

    expect(receiptStateAfterSubmission(submission)).toEqual({
      kind: "provider_receipt",
      state: "awaiting_provider_receipt",
      delivery: "unconfirmed",
      retryTarget: "lookup_receipt",
      terminal: false,
      reason: "awaiting_provider_receipt",
    });

    await expect(classifyExpoReceiptResponse({
      ok: true,
      status: 200,
      json: async () => ({ data: { "expo-ticket-123": { status: "ok" } } }),
    }, "expo-ticket-123")).resolves.toEqual({
      kind: "provider_receipt",
      state: "provider_receipt_accepted",
      delivery: "unconfirmed",
      retryTarget: "none",
      terminal: true,
      reason: "provider_receipt_accepted",
    });
  });

  it("keeps a retryable provider rejection separate from terminal rejection", async () => {
    await expect(classifyExpoSubmissionResponse({
      ok: false,
      status: 503,
      json: async () => ({}),
    })).resolves.toMatchObject({
      state: "provider_retryable_failure",
      retryTarget: "resubmit",
      terminal: false,
      delivery: "unconfirmed",
    });

    await expect(classifyExpoSubmissionResponse({
      ok: false,
      status: 400,
      json: async () => ({}),
    })).resolves.toMatchObject({
      state: "provider_terminal_failure",
      retryTarget: "none",
      terminal: true,
      delivery: "unconfirmed",
    });
  });

  it("does not blindly retry ambiguous submission outcomes and polls pending receipts instead of resubmitting", async () => {
    const provider = createExpoNotificationProvider({
      endpoint: EXPO_ENDPOINT,
      transport: vi.fn(async () => {
        throw new Error("connection reset after request write");
      }),
    });
    await expect(provider.submit(message)).resolves.toMatchObject({
      state: "provider_submission_unknown",
      retryTarget: "manual_review",
      terminal: false,
      reason: "provider_transport_outcome_unknown",
    });

    await expect(classifyExpoReceiptResponse({
      ok: true,
      status: 200,
      json: async () => ({ data: {} }),
    }, "expo-ticket-123")).resolves.toMatchObject({
      state: "provider_receipt_pending",
      retryTarget: "lookup_receipt",
      terminal: false,
      delivery: "unconfirmed",
    });
  });

  it("makes permanent receipt errors terminal and keeps transient receipt errors lookup-retryable", async () => {
    await expect(classifyExpoReceiptResponse({
      ok: true,
      status: 200,
      json: async () => ({
        data: { "expo-ticket-123": { status: "error", details: { error: "DeviceNotRegistered" } } },
      }),
    }, "expo-ticket-123")).resolves.toMatchObject({
      state: "provider_receipt_terminal_failure",
      retryTarget: "none",
      terminal: true,
      delivery: "unconfirmed",
    });

    await expect(classifyExpoReceiptResponse({
      ok: true,
      status: 200,
      json: async () => ({
        data: { "expo-ticket-123": { status: "error", details: { error: "MessageRateExceeded" } } },
      }),
    }, "expo-ticket-123")).resolves.toMatchObject({
      state: "provider_receipt_retryable_failure",
      retryTarget: "lookup_receipt",
      terminal: false,
      delivery: "unconfirmed",
    });
  });
});
