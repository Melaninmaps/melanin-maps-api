import express, { Router, type Express, type Request } from "express";
import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import {
  createKinfolkAccountContextGuard,
  type MemberAccountContextResolver,
} from "../../lib/account-context";

const servers: http.Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) => new Promise<void>((resolve) => server.close(() => resolve())),
    ),
  );
});

function createTestApp(resolveContext: MemberAccountContextResolver): Express {
  const app = express();
  app.use("/kinfolk", createKinfolkAccountContextGuard(resolveContext));
  app.post("/kinfolk/chat", (_req, res) => res.status(204).end());
  app.get("/kinfolk/sessions", (_req, res) => res.status(204).end());
  return app;
}

function createNestedKinfolkRouteApp(resolveContext: MemberAccountContextResolver): Express {
  const app = express();
  const api = Router();
  const kinfolk = Router();

  // This mirrors the production aggregate API router: the Kinfolk guard runs
  // before separately registered /kinfolk private-control routers and before
  // app-level capability routes can receive a non-Personal request.
  kinfolk.use("/kinfolk", createKinfolkAccountContextGuard(resolveContext));
  api.use(kinfolk);
  api.get("/kinfolk/private-places", (_req, res) => res.status(204).end());
  app.use("/api", api);
  app.post("/api/kinfolk/capability-turns", (_req, res) => res.status(204).end());
  return app;
}

async function request(
  app: Express,
  method: "GET" | "POST",
  path: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  const server = http.createServer(app);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind a TCP port");
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: address.port, method, path, headers },
      (res) => {
        let body = "";
        res.on("data", (chunk) => { body += String(chunk); });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

const businessResolver: MemberAccountContextResolver = async (req: Request) => ({
  kind: "business",
  businessId: String(req.header("x-mwm-account-context") ?? "").replace("business:", ""),
  businessName: "Aster & Gold",
  category: "Retail",
  city: "Philadelphia",
  state: "PA",
  managementRole: "owner",
});

describe("Kinfolk account workspace middleware", () => {
  it("allows only stateless chat and marks business responses no-store", async () => {
    const app = createTestApp(businessResolver);
    const response = await request(app, "POST", "/kinfolk/chat", {
      "x-mwm-account-context": "business:business_123",
    });

    expect(response.status).toBe(204);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("blocks personal Kinfolk controls when a business workspace is selected", async () => {
    const app = createTestApp(businessResolver);
    const response = await request(app, "GET", "/kinfolk/sessions", {
      "x-mwm-account-context": "business:business_123",
    });

    expect(response.status).toBe(403);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toContain("available only in Personal workspace");
  });

  it("fails closed when an explicit workspace cannot be resolved", async () => {
    const app = createTestApp(async () => ({ kind: "denied", reason: "not_authorized" }));
    const response = await request(app, "POST", "/kinfolk/chat", {
      "x-mwm-account-context": "business:unrelated_business",
    });

    expect(response.status).toBe(403);
    expect(response.body).toContain("workspace is not available");
  });

  it("keeps legacy Personal requests available without invoking a nonpersonal resolver", async () => {
    let resolveCalls = 0;
    const app = createTestApp(async () => {
      resolveCalls += 1;
      return { kind: "denied", reason: "not_authorized" };
    });
    const response = await request(app, "GET", "/kinfolk/sessions");

    expect(response.status).toBe(204);
    expect(resolveCalls).toBe(0);
  });

  it("blocks private-place and capability controls through the production router layering", async () => {
    const app = createNestedKinfolkRouteApp(businessResolver);
    const headers = { "x-mwm-account-context": "business:business_123" };

    const [privatePlace, capabilityTurn] = await Promise.all([
      request(app, "GET", "/api/kinfolk/private-places", headers),
      request(app, "POST", "/api/kinfolk/capability-turns", headers),
    ]);

    expect(privatePlace.status).toBe(403);
    expect(capabilityTurn.status).toBe(403);
    expect(privatePlace.body).toContain("available only in Personal workspace");
    expect(capabilityTurn.body).toContain("available only in Personal workspace");
  });
});
