import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

const { poolQuery } = vi.hoisted(() => ({ poolQuery: vi.fn() }));

vi.mock("@workspace/db", () => ({
  pool: { query: poolQuery },
}));

import connectedAppsRouter from "../kinfolk-connected-apps";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(connectedAppsRouter);
  return app;
}

describe("Connected Apps default-off feature gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    poolQuery.mockReset();
  });

  it("rejects every route before authentication or database access until explicitly enabled", async () => {
    vi.stubEnv("KINFOLK_CONNECTED_APPS_ENABLED", "");

    await request(createApp())
      .get("/kinfolk-connected-apps")
      .expect(404, { error: "CONNECTED_APPS_DISABLED" });

    expect(poolQuery).not.toHaveBeenCalled();
  });
});
