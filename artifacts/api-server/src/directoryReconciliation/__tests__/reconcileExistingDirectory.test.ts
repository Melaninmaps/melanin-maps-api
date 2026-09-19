import { describe, expect, it, vi } from "vitest";
import {
  planExistingDirectoryReconciliation,
  reconcileExistingDirectory,
} from "../reconcileExistingDirectory";

const row = (id: string, overrides = {}) => ({
  id,
  name: "Same business",
  city: "Austin",
  state: "TX",
  country: "US",
  address: "100 Main Street",
  ...overrides,
});

describe("existing-directory reconciliation", () => {
  it("groups only exact identities and selects a deterministic canonical", () => {
    const decisions = planExistingDirectoryReconciliation([
      row("z", { verified: true }),
      row("a"),
      row("b", { address: "200 Main Street", verified: true }),
    ]);
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({
      canonicalId: "z",
      supersededIds: ["a"],
    });
  });

  it("does not merge same-name rows when locality is all they share", () => {
    expect(planExistingDirectoryReconciliation([
      row("one", { address: "100 Main Street" }),
      row("two", { address: "200 Main Street" }),
    ])).toEqual([]);
  });

  it("supports dry-run and applies reversible pointers without deleting", async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 1 });
    const rows = [row("a"), row("b")];
    const dryRun = await reconcileExistingDirectory({ query }, rows);
    expect(dryRun.changed).toBe(0);
    expect(query).not.toHaveBeenCalled();

    const applied = await reconcileExistingDirectory({ query }, rows, "apply");
    expect(applied.changed).toBe(1);
    expect(applied.deleted).toBe(0);
    expect(query.mock.calls[0]?.[0]).toMatch(/^INSERT INTO business_duplicate_resolutions/);
    expect(query.mock.calls[0]?.[0]).not.toMatch(/DELETE/i);
    expect(query.mock.calls[0]?.[0]).not.toMatch(/UPDATE businesses/i);
  });
});