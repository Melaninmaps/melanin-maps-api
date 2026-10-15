import { afterEach, describe, expect, it, vi } from "vitest";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { setAccountContextForTransport } from "@/lib/account-context-transport";

afterEach(() => {
  setAccountContextForTransport({ kind: "personal" });
  vi.unstubAllGlobals();
});

describe("authenticatedFetch account workspace propagation", () => {
  it("sends the selected business context with authenticated requests", async () => {
    const request = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", request);
    setAccountContextForTransport({ kind: "business", businessId: "business_123" });

    await authenticatedFetch("/api/businesses/mine/managed/business_123");

    const [, init] = request.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get("x-mwm-account-context")).toBe("business:business_123");
  });

  it("respects an explicit context header when a caller supplies one", async () => {
    const request = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", request);
    setAccountContextForTransport({ kind: "business", businessId: "business_123" });

    await authenticatedFetch("/api/kinfolk/chat", {
      headers: { "x-mwm-account-context": "personal" },
    });

    const [, init] = request.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get("x-mwm-account-context")).toBe("personal");
  });
});
