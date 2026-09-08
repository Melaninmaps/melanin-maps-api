import { beforeEach, describe, expect, it, vi } from "vitest";

const poolQuery = vi.hoisted(() => vi.fn());

vi.mock("@workspace/db", () => ({
  pool: { query: poolQuery },
}));

import { getMemberAgeBand } from "../audience-policy";

describe("getMemberAgeBand database contract", () => {
  beforeEach(() => {
    poolQuery.mockReset();
  });

  it.each(["13_15", "16_17", "18_plus"] as const)(
    "returns the persisted canonical %s assurance without inventing a different band",
    async (ageBand) => {
      poolQuery.mockResolvedValueOnce({
        rows: [{ age_band: ageBand, date_of_birth: "1990-01-01" }],
      });

      await expect(getMemberAgeBand("member-id")).resolves.toBe(ageBand);
      expect(poolQuery).toHaveBeenCalledWith(expect.stringContaining("user_age_assurance"), ["member-id"]);
    },
  );

  it("uses legacy DOB only to establish broad adulthood", async () => {
    poolQuery.mockResolvedValueOnce({
      rows: [{ age_band: null, date_of_birth: "1990-01-01" }],
    });

    await expect(getMemberAgeBand("legacy-adult")).resolves.toBe("18_plus");
  });

  it("fails closed to unknown without exposing a database failure", async () => {
    poolQuery.mockRejectedValueOnce(new Error("private database detail"));

    await expect(getMemberAgeBand("member-id")).resolves.toBe("unknown");
  });
});
