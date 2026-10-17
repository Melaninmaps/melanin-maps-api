import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => {
  type Condition = {
    operator: string;
    values: unknown[];
  };

  const state: {
    selectResults: unknown[][];
    selectCalls: { fields: unknown; where?: Condition }[];
    insertedValues: unknown[];
    updates: unknown[];
  } = {
    selectResults: [],
    selectCalls: [],
    insertedValues: [],
    updates: [],
  };

  const condition = (operator: string, ...values: unknown[]): Condition => ({
    operator,
    values,
  });

  const dbSelect = vi.fn((fields?: unknown) => {
    const result = state.selectResults.shift();
    if (!result) {
      throw new Error(
        "Unexpected waitlist select; queue an explicit result for this route call.",
      );
    }
    const call: { fields: unknown; where?: Condition } = { fields };
    state.selectCalls.push(call);
    const query: Record<string, unknown> = {
      from: () => query,
      where: (where: Condition) => {
        call.where = where;
        return query;
      },
      orderBy: () => query,
      limit: () => query,
      offset: () => query,
      groupBy: () => query,
      then: (
        resolve: (value: unknown[]) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(result).then(resolve, reject),
    };
    return query;
  });

  const dbInsert = vi.fn(() => {
    const query: Record<string, unknown> = {
      values: (values: unknown) => {
        state.insertedValues.push(values);
        return query;
      },
      onConflictDoNothing: () => query,
      returning: async () => [{ id: "waitlist-one" }],
    };
    return query;
  });

  const dbUpdate = vi.fn(() => {
    const query: Record<string, unknown> = {
      set: (values: unknown) => {
        state.updates.push(values);
        return query;
      },
      where: async () => [],
    };
    return query;
  });

  const poolQuery = vi.fn(async (statement: string) => {
    if (statement.includes("SELECT EXISTS")) {
      return { rows: [{ active: false }] };
    }
    return { rows: [] };
  });

  const waitlistTable = {
    id: "id",
    email: "email",
    firstName: "first_name",
    lastName: "last_name",
    city: "city",
    state: "state",
    status: "status",
    signupSources: "signup_sources",
    createdAt: "created_at",
    isSyntheticTest: "is_synthetic_test",
    referralCode: "referral_code",
    referredBy: "referred_by",
    websiteUrl: "website_url",
    notes: "notes",
    cityNomination: "city_nomination",
  };

  return {
    state,
    dbSelect,
    dbInsert,
    dbUpdate,
    poolQuery,
    waitlistTable,
    orm: {
      and: (...conditions: unknown[]) => condition("and", ...conditions),
      asc: (field: unknown) => condition("asc", field),
      count: () => condition("count"),
      desc: (field: unknown) => condition("desc", field),
      eq: (field: unknown, value: unknown) => condition("eq", field, value),
      gte: (field: unknown, value: unknown) => condition("gte", field, value),
      ilike: (field: unknown, value: unknown) =>
        condition("ilike", field, value),
      isNotNull: (field: unknown) => condition("isNotNull", field),
      lt: (field: unknown, value: unknown) => condition("lt", field, value),
      ne: (field: unknown, value: unknown) => condition("ne", field, value),
      or: (...conditions: unknown[]) => condition("or", ...conditions),
      sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
        condition("sql", strings.join("?"), ...values),
    },
  };
});

vi.mock("@workspace/db", () => ({
  db: {
    select: harness.dbSelect,
    insert: harness.dbInsert,
    update: harness.dbUpdate,
  },
  pool: { query: harness.poolQuery },
  waitlistTable: harness.waitlistTable,
  usersTable: {},
  businessRecommendationsTable: {},
  pointsLedgerTable: {},
  businessesTable: {},
  businessSuggestionsTable: {},
  waitlistSafetyReportsTable: {},
}));

vi.mock("drizzle-orm", () => harness.orm);
vi.mock("../../middleware/rateLimiter", () => ({
  waitlistLimiter: (
    _request: Request,
    _response: Response,
    next: NextFunction,
  ) => next(),
}));
vi.mock("../../lib/adminAuth", () => ({
  isAdmin: (request: Request) =>
    (request.user as { role?: string } | undefined)?.role === "admin",
}));
vi.mock("../../lib/approvalGate", () => ({
  isApprovalRequired: () => true,
}));
vi.mock("../../lib/nudgeScheduler", () => ({
  runWeeklyNudge: vi.fn(),
}));
vi.mock("../../lib/email", () => {
  const pending = () => new Promise<void>(() => undefined);
  return {
    sendWaitlistConfirmation: pending,
    sendWelcomeEmail: pending,
    sendApprovalNotification: pending,
    sendBusinessRecommendationInvite: pending,
    sendFriendInvitation: pending,
    sendBusinessWaitlistInvitation: pending,
    sendReferralMilestoneUpdate: pending,
    sendReferralNudge: pending,
    sendAppLaunchBlast: pending,
    sendBetaAnnouncementBlast: pending,
    sendWaitlistInvitation: pending,
    sendWaitlistFounderRegistrationAlert: pending,
  };
});

import waitlistRouter from "../waitlist";

type WaitlistEntry = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  state: string | null;
  status: "pending" | "approved" | "rejected" | "archived";
  signupSources: string;
  referralCode: string;
  isSyntheticTest: boolean;
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((request: Request, _response: Response, next: NextFunction) => {
    (request as any).log = {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    };
    if (request.path.includes("/admin/")) {
      request.user = { id: "staging-admin", role: "admin" } as any;
    }
    next();
  });
  app.use("/api", waitlistRouter);
  return app;
}

function ordinaryEntry(overrides: Partial<WaitlistEntry> = {}): WaitlistEntry {
  return {
    id: "waitlist-one",
    email: "ordinary-member@qa.mwm.dev",
    firstName: "Ordinary",
    lastName: "Member",
    city: "Philadelphia",
    state: "PA",
    status: "pending",
    signupSources: "web",
    referralCode: "MWM-ORDINARY-1000",
    isSyntheticTest: false,
    ...overrides,
  };
}

function queueRegistration(
  entry: WaitlistEntry,
  priorEntry: Partial<WaitlistEntry> | null = null,
) {
  harness.state.selectResults.push(
    priorEntry ? [priorEntry] : [],
    [
      {
        id: entry.id,
        signupSources: entry.signupSources,
        referralCode: entry.referralCode,
      },
    ],
    [{ id: entry.id }],
  );
}

function queueAdminSearch(entry: WaitlistEntry) {
  harness.state.selectResults.push(
    [entry],
    [{ total: 1 }],
    [{ pending: entry.status === "pending" ? 1 : 0 }],
    [{ total: entry.isSyntheticTest ? 1 : 0 }],
    entry.city ? [{ city: entry.city }] : [],
    [],
    [{ total: 1 }],
    [{ total: 0 }],
    [{ id: entry.id }],
  );
}

function hasCondition(
  value: unknown,
  operator: string,
  field: unknown,
  expectedValue: unknown,
): boolean {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { operator?: string; values?: unknown[] };
  if (
    candidate.operator === operator &&
    candidate.values?.[0] === field &&
    candidate.values?.[1] === expectedValue
  ) {
    return true;
  }
  return (
    candidate.values?.some((nested) =>
      hasCondition(nested, operator, field, expectedValue),
    ) ?? false
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  harness.state.selectResults.splice(0);
  harness.state.selectCalls.splice(0);
  harness.state.insertedValues.splice(0);
  harness.state.updates.splice(0);
});

describe("ordinary waitlist registration visibility", () => {
  it("returns a newly registered non-reserved member through the authenticated Admin search", async () => {
    const entry = ordinaryEntry();
    queueRegistration(entry);

    const publicResponse = await supertest(createApp())
      .post("/api/waitlist")
      .send({
        email: entry.email,
        firstName: entry.firstName,
        lastName: entry.lastName,
        city: entry.city,
        state: entry.state,
        signupSource: "web",
      });

    expect(publicResponse.status).toBe(201);
    expect(publicResponse.body).toMatchObject({
      success: true,
      created: true,
      id: entry.id,
      signupSources: "web",
      testerAccessActive: false,
    });

    queueAdminSearch(entry);
    const adminResponse = await supertest(createApp())
      .get("/api/admin/waitlist")
      .query({ search: entry.email, page: 1, pageSize: 50 });

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body).toMatchObject({
      total: 1,
      retainedTotal: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
      entries: [
        expect.objectContaining({
          id: entry.id,
          email: entry.email,
          position: 1,
          testerStatus: null,
          pendingTesterAccess: false,
        }),
      ],
    });
    expect(harness.state.insertedValues).toHaveLength(1);

    const searchPredicate = harness.state.selectCalls
      .map((call) => call.where)
      .find((where) =>
        hasCondition(where, "ilike", "email", `%${entry.email}%`),
      );
    expect(searchPredicate).toBeDefined();
    expect(
      hasCondition(searchPredicate, "eq", "is_synthetic_test", false),
    ).toBe(true);
  });

  it("preserves one email-keyed person and appends a later platform source", async () => {
    const firstEntry = ordinaryEntry();
    queueRegistration(firstEntry);
    const app = createApp();

    const firstResponse = await supertest(app)
      .post("/api/waitlist")
      .send({ email: firstEntry.email, signupSource: "web" });
    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.created).toBe(true);

    const repeatedEntry = ordinaryEntry({ signupSources: "web,ios" });
    queueRegistration(repeatedEntry, firstEntry);
    const secondResponse = await supertest(app)
      .post("/api/waitlist")
      .send({ email: firstEntry.email, signupSource: "ios" });

    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body).toMatchObject({
      created: false,
      signupSources: "web,ios",
    });
    expect(harness.state.insertedValues).toHaveLength(1);
    expect(harness.state.updates).toContainEqual(
      expect.objectContaining({ signupSources: "web,ios" }),
    );
  });

  it("keeps synthetic test records behind the explicit synthetic view", async () => {
    const fixture = ordinaryEntry({
      email: "fixture@example.com",
      isSyntheticTest: true,
    });

    queueAdminSearch(fixture);
    const peopleResponse = await supertest(createApp())
      .get("/api/admin/waitlist")
      .query({ search: fixture.email, synthetic: "people" });
    expect(peopleResponse.status).toBe(200);
    const peoplePredicate = harness.state.selectCalls[0]?.where;
    expect(
      hasCondition(peoplePredicate, "eq", "is_synthetic_test", false),
    ).toBe(true);

    harness.state.selectCalls.splice(0);
    queueAdminSearch(fixture);
    const syntheticResponse = await supertest(createApp())
      .get("/api/admin/waitlist")
      .query({ search: fixture.email, synthetic: "only" });
    expect(syntheticResponse.status).toBe(200);
    const syntheticPredicate = harness.state.selectCalls[0]?.where;
    expect(
      hasCondition(syntheticPredicate, "eq", "is_synthetic_test", true),
    ).toBe(true);
  });
});
