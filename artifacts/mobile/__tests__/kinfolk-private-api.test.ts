import { describe, expect, it, vi } from "vitest";
import { requireKinfolkPrivateApiContext } from "../lib/kinfolkPrivateApi";

describe("private Kinfolk API context", () => {
  it("uses the reviewed origin resolver and returns bearer-only request headers", async () => {
    const resolveApiBase = vi.fn(() => "https://api.melaninmaps.com");

    await expect(requireKinfolkPrivateApiContext(
      async () => "member-token",
      "Private Places",
      resolveApiBase,
    )).resolves.toEqual({
      base: "https://api.melaninmaps.com",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer member-token",
      },
    });
    expect(resolveApiBase).toHaveBeenCalledTimes(1);
  });

  it("does not resolve an origin or construct a request without a member token", async () => {
    const resolveApiBase = vi.fn(() => "https://api.melaninmaps.com");

    await expect(requireKinfolkPrivateApiContext(
      async () => null,
      "Temporary Stays",
      resolveApiBase,
    )).rejects.toThrow("Please sign in again");
    expect(resolveApiBase).not.toHaveBeenCalled();
  });

  it("fails closed before a request when the canonical origin policy rejects configuration", async () => {
    const resolveApiBase = vi.fn(() => {
      throw new Error("API configuration blocked: EXPO_PUBLIC_API_ORIGIN is required");
    });

    await expect(requireKinfolkPrivateApiContext(
      async () => "member-token",
      "Kinfolk Settings",
      resolveApiBase,
    )).rejects.toThrow("API configuration blocked");
  });
});
