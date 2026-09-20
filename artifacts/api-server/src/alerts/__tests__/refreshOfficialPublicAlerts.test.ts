import { describe, expect, it } from "vitest";
import { __testables, refreshOfficialPublicAlerts } from "../refreshOfficialPublicAlerts";

describe("official public alert refresh", () => {
  it("accepts only canonical CPSC and CDC notice hosts", () => {
    expect(__testables.officialCpscUrl("https://www.cpsc.gov/Recalls/2026/example")).toContain("cpsc.gov");
    expect(__testables.officialCpscUrl("https://example.test/recall")).toBeNull();
    expect(__testables.officialCdcUrl("https://www.cdc.gov/han/php/notices/han00533.html")).toContain("cdc.gov");
    expect(__testables.officialCdcUrl("https://example.test/han00533.html")).toBeNull();
  });

  it("keeps only unique, official CDC HAN notice links", () => {
    const links = __testables.cdcNoticeLinks(`
      <a href="/han/php/notices/han00533.html">HAN 533</a>
      <a href="/han/php/notices/han00532.html">HAN 532</a>
      <a href="/han/php/notices/han00533.html">duplicate</a>
      <a href="https://example.test/han00999.html">untrusted</a>
    `);
    expect(links).toEqual([
      { hanId: "00533", url: "https://www.cdc.gov/han/php/notices/han00533.html" },
      { hanId: "00532", url: "https://www.cdc.gov/han/php/notices/han00532.html" },
    ]);
  });

  it("accepts known CPSC response shapes without treating unknown objects as records", () => {
    expect(__testables.cpscRows({ Recall: [{ RecallID: "1" }] })).toEqual([{ RecallID: "1" }]);
    expect(__testables.cpscRows({ unexpected: [{ RecallID: "1" }] })).toEqual([]);
  });

  it("does not fetch or deliver while the feature flag is off", async () => {
    const previous = process.env.OFFICIAL_PUBLIC_ALERTS_ENABLED;
    process.env.OFFICIAL_PUBLIC_ALERTS_ENABLED = "0";
    try {
      await expect(refreshOfficialPublicAlerts()).resolves.toMatchObject({
        enabled: false,
        sources: expect.arrayContaining([
          expect.objectContaining({ source: "cpsc", status: "disabled" }),
          expect.objectContaining({ source: "cdc", status: "disabled" }),
          expect.objectContaining({ source: "fda", status: "disabled" }),
        ]),
      });
    } finally {
      if (previous === undefined) delete process.env.OFFICIAL_PUBLIC_ALERTS_ENABLED;
      else process.env.OFFICIAL_PUBLIC_ALERTS_ENABLED = previous;
    }
  });
});
