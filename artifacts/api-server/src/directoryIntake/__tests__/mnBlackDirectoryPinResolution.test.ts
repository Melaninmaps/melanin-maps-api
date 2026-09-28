import { describe, expect, it, vi } from "vitest";
import {
  collectMinnesotaSourcePinTargets,
  resolveMinnesotaSourcePins,
} from "../mnBlackDirectoryPinResolution";

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

  it("casts source-evidence parameters before writing a precise pin", async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 1 });
    const summary = await resolveMinnesotaSourcePins(
      { query } as never,
      [{
        id: "source-1",
        name: "North Star Salon",
        address: "123 Lake Street",
        city: "Minneapolis",
        state: "MN",
        country: "US",
      }],
      async () => ({
        lat: "44.9778",
        lng: "-93.2650",
        source: "google_geocoder",
        formattedAddress: "123 Lake Street, Minneapolis, MN 55401, USA",
      }),
    );

    expect(summary).toMatchObject({ attempted: 1, pinned: 1, unresolved: 0, errors: 0 });
    expect(query).toHaveBeenCalledTimes(1);
    const statement = query.mock.calls[0]?.[0] as string;
    expect(statement).toContain("'sourceType',$4::text");
    expect(statement).toContain("'excerpt',$5::text");
    expect(statement).toContain("'policyVersion',$6::text");
  });
});
