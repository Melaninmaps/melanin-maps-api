import express from "express";
import { readFileSync } from "node:fs";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  createBusinessCulturalTeachingsRouter,
  type BusinessCulturalTeachingDatabase,
} from "../business-cultural-teachings";

const businessId = "business-1";
const submitted = {
  title: "A small welcome",
  teaching: "We invite visitors to take their time and enjoy this space with care.",
  ownerConfirmed: true,
};
type Availability = "active" | "unconfirmed" | "withdrawn" | "revoked";

function fixture(options: {
  approvedOwners?: string[];
  activeCreator?: string | null;
  availability?: Availability;
} = {}) {
  const calls: Array<{ text: string; values: readonly unknown[] | undefined }> = [];
  const approvedOwners = new Set(options.approvedOwners ?? ["owner-a", "owner-b"]);
  let activeCreator: string | null = options.activeCreator ?? "owner-a";
  let availability = options.availability ?? "active";
  const ownerRecords = new Map<string, { title: string; text: string; active: boolean }>([
    ["owner-a", { title: "A small welcome", text: "Take your time in this space.", active: availability === "active" }],
  ]);

  const database: BusinessCulturalTeachingDatabase = {
    async query<T extends Record<string, unknown>>(
      text: string,
      values?: readonly unknown[],
    ): Promise<{ rows: T[] }> {
      calls.push({ text, values });
      if (text.includes("FROM businesses b")) {
        return { rows: (approvedOwners.has(String(values?.[1])) ? [{ id: businessId }] : []) as unknown as T[] };
      }
      if (text.includes("SELECT creator_owner_user_id")) {
        return { rows: (activeCreator ? [{ creatorOwnerUserId: activeCreator }] : []) as unknown as T[] };
      }
      if (text.includes("INSERT INTO business_cultural_teachings")) {
        const creator = String(values?.[1]);
        const row = { title: String(values?.[2]), text: String(values?.[3]), active: true };
        ownerRecords.set(creator, row);
        activeCreator = creator;
        availability = "active";
        return { rows: [row] as unknown as T[] };
      }
      if (text.includes("UPDATE business_cultural_teachings")) {
        const creator = String(values?.[1]);
        const own = ownerRecords.get(creator);
        if (own) ownerRecords.set(creator, { ...own, active: false });
        if (activeCreator === creator) activeCreator = null;
        availability = "withdrawn";
        return { rows: [] as T[] };
      }
      if (text.includes("FROM business_cultural_teachings teaching")) {
        const own = activeCreator ? ownerRecords.get(activeCreator) : null;
        return {
          rows: availability === "active" && own?.active
            ? [{ title: own.title, text: own.text }]
            : [] as T[],
        } as { rows: T[] };
      }
      if (text.includes("FROM business_cultural_teachings")) {
        const own = ownerRecords.get(String(values?.[1]));
        return { rows: (own ? [own] : []) as unknown as T[] };
      }
      throw new Error(`Unexpected query: ${text}`);
    },
  };

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const userId = req.header("x-user");
    if (userId) req.user = { id: userId } as Express.User;
    next();
  });
  app.use(createBusinessCulturalTeachingsRouter({ database }));
  const call = (
    method: "get" | "put" | "delete",
    path: "/owner" | "" = "/owner",
    userId: string | null = "owner-a",
    body?: object,
  ) => {
    const requestPath = `/businesses/${businessId}/cultural-teaching${path}`;
    const result = request(app)[method](requestPath);
    if (userId) result.set("x-user", userId);
    return body === undefined ? result : result.send(body);
  };

  return { calls, call, ownerRecords };
}

describe("Business Cultural Teaching routes", () => {
  it("authenticates before any database lookup and marks every response no-store", async () => {
    const f = fixture();
    const response = await f.call("get", "/owner", null);
    expect(response.statusCode).toBe(401);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(f.calls).toHaveLength(0);
  });

  it("requires a currently approved, unrevoked owner link and never returns content to non-owners", async () => {
    const f = fixture({ approvedOwners: ["owner-a"] });
    for (const userId of ["member", "revoked-owner"]) {
      const response = await f.call("get", "/owner", userId);
      expect(response.statusCode).toBe(403);
      expect(JSON.stringify(response.body)).not.toContain("Take your time");
    }
    expect(f.calls).toHaveLength(2);
    expect(f.calls[0]?.text).toContain("bol.role = 'owner'");
    expect(f.calls[0]?.text).toContain("bol.status = 'approved'");
    expect(f.calls[0]?.text).toContain("bol.revoked_at IS NULL");
  });

  it("keeps creator content isolated from an approved co-owner and requires direct confirmation before saving", async () => {
    const f = fixture();
    const otherOwner = await f.call("get", "/owner", "owner-b");
    expect(otherOwner.statusCode).toBe(200);
    expect(otherOwner.body).toEqual({ teaching: null });

    const unconfirmed = await f.call("put", "/owner", "owner-a", { ...submitted, ownerConfirmed: false });
    expect(unconfirmed.statusCode).toBe(400);
    expect(f.calls.filter((call) => call.text.includes("INSERT INTO"))).toHaveLength(0);

    const saved = await f.call("put", "/owner", "owner-a", submitted);
    expect(saved.statusCode).toBe(200);
    expect(saved.body.teaching).toEqual({ title: submitted.title, text: submitted.teaching, active: true });
    expect(JSON.stringify(saved.body)).not.toMatch(/owner|created|updated|confirmedAt/i);
  });

  it("does not let a different current owner overwrite an active teaching", async () => {
    const f = fixture({ activeCreator: "owner-a" });
    const response = await f.call("put", "/owner", "owner-b", submitted);
    expect(response.statusCode).toBe(409);
    expect(JSON.stringify(response.body)).not.toContain(submitted.teaching);
    expect(f.calls.filter((call) => call.text.includes("INSERT INTO"))).toHaveLength(0);
  });

  it("withdraws rather than deletes and removes member availability", async () => {
    const f = fixture();
    const withdrawn = await f.call("delete", "/owner", "owner-a");
    expect(withdrawn.statusCode).toBe(204);
    expect(withdrawn.headers["cache-control"]).toBe("no-store");
    expect(f.calls.at(-1)?.text).toContain("SET withdrawn_at = NOW()");
    expect(f.calls.at(-1)?.text).not.toMatch(/DELETE\s+FROM/i);

    const member = await f.call("get", "", "member");
    expect(member.statusCode).toBe(404);
    expect(JSON.stringify(member.body)).not.toContain("Take your time");
  });

  it("returns only a compact member projection and fails closed for unconfirmed, withdrawn, or revoked records", async () => {
    const active = fixture();
    const visible = await active.call("get", "", "member");
    expect(visible.statusCode).toBe(200);
    expect(visible.body.teaching).toEqual({
      title: "A small welcome",
      text: "Take your time in this space.",
      sourceLabel: "Shared by this business",
    });
    expect(JSON.stringify(visible.body)).not.toMatch(/owner|creator|created|updated|confirmedAt|withdrawn/i);
    const publicSql = active.calls.at(-1)?.text ?? "";
    expect(publicSql).toContain("b.status = 'active'");
    expect(publicSql).toContain("teaching.owner_confirmed_at IS NOT NULL");
    expect(publicSql).toContain("teaching.withdrawn_at IS NULL");
    expect(publicSql).toContain("bol.revoked_at IS NULL");

    for (const availability of ["unconfirmed", "withdrawn", "revoked"] as const) {
      const unavailable = await fixture({ availability }).call("get", "", "member");
      expect(unavailable.statusCode).toBe(404);
      expect(JSON.stringify(unavailable.body)).not.toContain("Take your time");
    }
  });

  it("keeps the schema approval-required and isolated from startup, providers, and cross-feature delivery", () => {
    const migration = readFileSync(
      new URL("../../../migrations/20261014_business_cultural_teachings.approval-required.sql", import.meta.url),
      "utf8",
    );
    const startup = readFileSync(new URL("../../lib/startup-migrations.ts", import.meta.url), "utf8");
    const route = readFileSync(new URL("../business-cultural-teachings.ts", import.meta.url), "utf8");
    const routeIndex = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
    expect(migration).toContain("APPROVAL REQUIRED — SOURCE ONLY");
    expect(migration).toContain("CREATE TABLE business_cultural_teachings");
    expect(migration).toContain("WHERE withdrawn_at IS NULL");
    expect(migration).not.toMatch(/^\s*(?:INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/im);
    expect(startup).not.toContain("business_cultural_teachings");
    expect(route).not.toMatch(/from\s+["'][^"']*(?:openai|provider|notification|analytics)[^"']*["']/i);
    expect(route).not.toContain("/api/kinfolk/");
    expect(routeIndex.indexOf("router.use(requireAuth)")).toBeLessThan(
      routeIndex.indexOf("router.use(businessCulturalTeachingsRouter)"),
    );
  });
});
