import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  clients: [] as Array<ReturnType<typeof createClient>>,
  sent: [] as Array<Record<string, unknown>>,
  sendFailure: false,
}));

function createClient(
  responder: (query: string, params: unknown[] | undefined) => unknown,
) {
  return {
    query: vi.fn(async (query: string, params?: unknown[]) =>
      responder(String(query), params),
    ),
    release: vi.fn(),
  };
}

vi.mock("@workspace/db", () => ({
  pool: {
    connect: vi.fn(async () => {
      const client = state.clients.shift();
      if (!client) throw new Error("Unexpected pool connection");
      return client;
    }),
  },
  db: {
    transaction: vi.fn(),
  },
  memberAgreementsTable: {},
  usersTable: {},
}));

vi.mock("../../lib/auth", () => ({ createSession: vi.fn() }));
vi.mock("../../lib/email", () => ({
  sendEmail: vi.fn(async (payload: Record<string, unknown>) => {
    state.sent.push(payload);
    if (state.sendFailure) throw new Error("provider unavailable");
    return { id: "provider-receipt" };
  }),
}));
vi.mock("../../lib/protectedAdminAccess", () => ({
  isFounderOwnerEmail: (email: string) => email === "founder@example.test",
}));

import {
  issueStagingFounderAdminRecovery,
  type StagingFounderAdminRecoveryEnvironment,
} from "../stagingFounderAdminRecovery";

const environment: StagingFounderAdminRecoveryEnvironment = {
  ADMIN_EMAILS: "founder@example.test",
  KINFOLK_MEMORY_STAGING_ISOLATION: "true",
  KINFOLK_STAGING_ADMIN_BOOTSTRAP_ENABLED: "false",
  KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_ENABLED: "true",
  KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_TARGET_EMAIL: "founder@example.test",
  MWM_EXPLICIT_FEATURE_RELEASE_MODE: "true",
  RAILWAY_ENVIRONMENT_NAME: "staging",
  RAILWAY_PROJECT_ID: "37ed0a9d-a280-43d5-b6ca-885f237b84ea",
  RAILWAY_SERVICE_ID: "7c02d801-6273-4e77-aea3-1db8bd86be18",
  RESEND_API_KEY: "test-configured-provider",
};

function standardPreflight(
  query: string,
  overrides: {
    targetExists?: boolean;
    historicalAdminCount?: number;
    pendingTesterExists?: boolean;
    failPreflight?: "target" | "historical_admins" | "pending_tester";
  } = {},
): unknown | undefined {
  if (query.includes("SELECT EXISTS(SELECT 1 FROM users")) {
    if (overrides.failPreflight === "target") {
      throw new Error("preflight query unavailable");
    }
    return { rows: [{ exists: overrides.targetExists ?? false }] };
  }
  if (query.includes("SELECT COUNT(*)::int AS count")) {
    if (overrides.failPreflight === "historical_admins") {
      throw new Error("preflight query unavailable");
    }
    return { rows: [{ count: overrides.historicalAdminCount ?? 1 }] };
  }
  if (query.includes("SELECT EXISTS(SELECT 1 FROM pending_tester_emails")) {
    if (overrides.failPreflight === "pending_tester") {
      throw new Error("preflight query unavailable");
    }
    return { rows: [{ exists: overrides.pendingTesterExists ?? false }] };
  }
  return undefined;
}

function issuanceClient(
  existing: unknown[] = [],
  preflightOverrides: Parameters<typeof standardPreflight>[1] = {},
) {
  return createClient((query, params) => {
    const preflight = standardPreflight(query, preflightOverrides);
    if (preflight) return preflight;
    if (query.includes("SELECT id, state, expires_at"))
      return { rows: existing };
    if (
      query.includes(
        "INSERT INTO staging_founder_admin_recovery\n         (is_current",
      )
    ) {
      return { rows: [{ id: "recovery-new" }], rowCount: 1 };
    }
    if (query.includes("SET is_current = FALSE"))
      return { rows: [], rowCount: 1 };
    return { rows: [], rowCount: 1, params };
  });
}

function deliveryClient(kind: "accepted" | "failed") {
  return createClient((query) => {
    if (kind === "accepted" && query.includes("SET state = 'sent'")) {
      return { rows: [], rowCount: 1 };
    }
    if (kind === "failed" && query.includes("SET state = 'failed_delivery'")) {
      return { rows: [], rowCount: 1 };
    }
    return { rows: [], rowCount: 1 };
  });
}

describe("staging founder recovery issuance behavior", () => {
  it("persists only a hash, then records accepted delivery before the capability can be redeemed", async () => {
    const original = issuanceClient();
    state.clients = [original, deliveryClient("accepted")];
    state.sent = [];
    state.sendFailure = false;

    await expect(
      issueStagingFounderAdminRecovery(environment),
    ).resolves.toEqual({ status: "issued" });

    expect(state.sent).toHaveLength(1);
    const html = String(state.sent[0]?.html ?? "");
    const token = new URL(
      String(html.match(/href="([^"]+)"/)?.[1] ?? "").replace(/&amp;/g, "&"),
    ).searchParams.get("invite");
    expect(token).toHaveLength(43);
    const insertCall = original.query.mock.calls.find(([query]) =>
      String(query).includes("INSERT INTO staging_founder_admin_recovery"),
    );
    const persistedTokenHash = insertCall?.[1]?.[1];
    expect(persistedTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(persistedTokenHash).not.toBe(token);
    const preflightQueries = original.query.mock.calls
      .map(([query]) => String(query))
      .filter(
        (query) =>
          query.includes("SELECT EXISTS(SELECT 1 FROM users") ||
          query.includes("SELECT COUNT(*)::int AS count") ||
          query.includes("SELECT EXISTS(SELECT 1 FROM pending_tester_emails"),
      );
    expect(preflightQueries).toHaveLength(3);
    expect(preflightQueries[0]).toContain("SELECT EXISTS(SELECT 1 FROM users");
    expect(preflightQueries[1]).toContain("SELECT COUNT(*)::int AS count");
    expect(preflightQueries[2]).toContain(
      "SELECT EXISTS(SELECT 1 FROM pending_tester_emails",
    );
  });

  it("revokes the pending attempt when provider delivery fails and never reports issuance", async () => {
    state.clients = [issuanceClient(), deliveryClient("failed")];
    state.sent = [];
    state.sendFailure = true;

    await expect(
      issueStagingFounderAdminRecovery(environment),
    ).resolves.toEqual({ status: "blocked", reason: "delivery_failed" });
    expect(state.sent).toHaveLength(1);
  });

  it("reports a provider-unavailable block without opening a database connection", async () => {
    state.clients = [];
    state.sent = [];
    await expect(
      issueStagingFounderAdminRecovery({ ...environment, RESEND_API_KEY: "" }),
    ).resolves.toEqual({
      status: "blocked",
      reason: "email_provider_unavailable",
    });
    expect(state.sent).toHaveLength(0);
  });

  it("reports a target-account preflight block without sending a recovery link", async () => {
    state.clients = [issuanceClient([], { targetExists: true })];
    state.sent = [];
    state.sendFailure = false;

    await expect(
      issueStagingFounderAdminRecovery(environment),
    ).resolves.toEqual({
      status: "blocked",
      reason: "target_account_exists",
    });
    expect(state.sent).toHaveLength(0);
  });

  it("reports a non-single historical-admin baseline as a policy block without delivery", async () => {
    state.clients = [issuanceClient([], { historicalAdminCount: 2 })];
    state.sent = [];
    state.sendFailure = false;

    await expect(
      issueStagingFounderAdminRecovery(environment),
    ).resolves.toEqual({
      status: "blocked",
      reason: "historical_admin_count_not_one",
    });
    expect(state.sent).toHaveLength(0);
  });

  it("reports a pending-tester conflict as a policy block without delivery", async () => {
    state.clients = [issuanceClient([], { pendingTesterExists: true })];
    state.sent = [];
    state.sendFailure = false;

    await expect(
      issueStagingFounderAdminRecovery(environment),
    ).resolves.toEqual({
      status: "blocked",
      reason: "pending_tester_conflict",
    });
    expect(state.sent).toHaveLength(0);
  });

  it("propagates a preflight query failure instead of treating it as an eligibility block", async () => {
    state.clients = [
      issuanceClient([], { failPreflight: "historical_admins" }),
    ];
    state.sent = [];
    state.sendFailure = false;

    await expect(issueStagingFounderAdminRecovery(environment)).rejects.toThrow(
      "preflight query unavailable",
    );
    expect(state.sent).toHaveLength(0);
  });

  it("requires a second explicit flag before superseding a non-redeemable pending attempt", async () => {
    const original = issuanceClient([
      {
        id: "recovery-old",
        state: "pending_delivery",
        expires_at: new Date(Date.now() + 60_000),
      },
    ]);
    state.clients = [original, deliveryClient("accepted")];
    state.sent = [];
    state.sendFailure = false;

    await expect(
      issueStagingFounderAdminRecovery({
        ...environment,
        KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_REISSUE_ENABLED: "true",
      }),
    ).resolves.toEqual({ status: "issued" });

    expect(
      original.query.mock.calls.some(([query]) =>
        String(query).includes("SET is_current = FALSE"),
      ),
    ).toBe(true);
    expect(
      original.query.mock.calls.some(([query]) =>
        String(query).includes("'superseded'"),
      ),
    ).toBe(true);
  });
});
