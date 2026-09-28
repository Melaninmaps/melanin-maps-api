import { describe, expect, it } from "vitest";
import { collectMinnesotaSourcePinTargets } from "../mnBlackDirectoryPinResolution";

describe("Minnesota source exact-pin targets", () => {
  it("keeps only one complete street-address target per reconciled record", () => {
    const targets = collectMinnesotaSourcePinTargets([
      {
        id: "source-1",
        name: "North Star Salon",
        address: "123 Lake Street",
        city: "Minneapolis",
        state: "MN",
        country: "US",
      },
      {
        id: "source-1",
        name: "North Star Salon",
        address: "123 Lake Street",
        city: "Minneapolis",
        state: "MN",
        country: "US",
      },
      {
        id: "source-2",
        name: "Online Marketplace",
        address: null,
        city: "Minneapolis",
        state: "MN",
        country: "US",
      },
      {
        id: "source-3",
        name: "Incomplete Place",
        address: "900 Hennepin Avenue",
        city: "Minneapolis",
        state: null,
        country: "US",
      },
    ]);

    expect(targets).toEqual([
      {
        id: "source-1",
        name: "North Star Salon",
        address: "123 Lake Street",
        city: "Minneapolis",
        state: "MN",
        country: "US",
      },
    ]);
  });
});
