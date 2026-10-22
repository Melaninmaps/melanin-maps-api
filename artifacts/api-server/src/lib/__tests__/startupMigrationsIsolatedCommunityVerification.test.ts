import { afterEach, describe, expect, it, vi } from "vitest";

const databaseMock = vi.hoisted(() => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
  },
  THE_REAL_TAGS: [],
}));

vi.mock("@workspace/db", () => databaseMock);

import { runStartupMigrations } from "../startup-migrations";

describe("runStartupMigrations isolated community verification mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    databaseMock.pool.query.mockReset();
    databaseMock.pool.connect.mockReset();
  });

  it("does not run legacy migrations or fixed-roster recovery against the isolated database", async () => {
    vi.stubEnv("COMMUNITY_VERIFICATION_ISOLATED_TEST", "true");
    const info = vi.fn();
    const warn = vi.fn();

    await runStartupMigrations({ info, warn } as never);

    expect(databaseMock.pool.query).not.toHaveBeenCalled();
    expect(databaseMock.pool.connect).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      "Isolated community verification test: legacy startup migrations, account recoveries, and seed guards are disabled.",
    );
    expect(warn).not.toHaveBeenCalled();
  });
});
