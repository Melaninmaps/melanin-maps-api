import { describe, expect, it } from "vitest";
import { buildReducedSupportLensUpdate, persistReducedSupportLensRemoval } from "@/lib/supportLensActions";

describe("web Support Lens removal actions", () => {
  it("removes one designation while preserving strict mode and canonical aliases", () => {
    expect(buildReducedSupportLensUpdate(["black-african-american", "woman"], "woman")).toEqual({
      preferredOwnershipTypes: ["black-african-american"],
      ownershipTypes: ["black-african-american"],
      supportLensMode: "strict_documented_designations",
    });
  });

  it("transitions the last removal to all businesses", () => {
    expect(buildReducedSupportLensUpdate(["woman"], "woman")).toEqual({
      preferredOwnershipTypes: [],
      ownershipTypes: [],
      supportLensMode: "all_businesses",
    });
  });

  it("preserves the old lens on failure and succeeds on retry", async () => {
    const requests: RequestInit[] = [];
    const responses = [new Response(null, { status: 503 }), new Response("{}", { status: 200 })];
    const fetchImpl = async (_url: string | URL, init?: RequestInit) => {
      requests.push(init ?? {});
      return responses.shift()!;
    };
    const failed = await persistReducedSupportLensRemoval({
      baseUrl: "/",
      savedDesignations: ["black-african-american", "woman"],
      removeDesignation: "woman",
      fetchImpl,
    });
    expect(failed.error).toBeTruthy();
    expect(failed.update.preferredOwnershipTypes).toEqual(["black-african-american"]);
    const retried = await persistReducedSupportLensRemoval({
      baseUrl: "/",
      savedDesignations: ["black-african-american", "woman"],
      removeDesignation: "woman",
      fetchImpl,
    });
    expect(retried.error).toBeUndefined();
    expect(requests).toHaveLength(2);
    expect(JSON.parse(String(requests[1].body))).toMatchObject({
      preferredOwnershipTypes: ["black-african-american"],
      supportLensMode: "strict_documented_designations",
    });
  });
});