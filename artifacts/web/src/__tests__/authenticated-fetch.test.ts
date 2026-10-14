import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedFetch } from "../lib/authenticatedFetch";
import { authenticatedAdminFetch, readAdminJson } from "../lib/adminDataFetch";

const TOKEN_KEY = "web_auth_token";
const storedValues = new Map<string, string>();

const communityRequestSources = [
  "../pages/community.tsx",
  "../components/community/CommentsDialog.tsx",
  "../components/community/HappeningPanel.tsx",
].map((relativePath) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
));

const adminSource = readFileSync(
  fileURLToPath(new URL("../pages/admin.tsx", import.meta.url)),
  "utf8",
);

const accessLedgerSource = readFileSync(
  fileURLToPath(new URL("../components/AdminAccessLedger.tsx", import.meta.url)),
  "utf8",
);

describe("authenticatedFetch", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    storedValues.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storedValues.get(key) ?? null,
      setItem: (key: string, value: string) => storedValues.set(key, value),
      removeItem: (key: string) => storedValues.delete(key),
      clear: () => storedValues.clear(),
      key: (index: number) => Array.from(storedValues.keys())[index] ?? null,
      get length() { return storedValues.size; },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the saved browser token when the Community cookie is missing", async () => {
    storedValues.set(TOKEN_KEY, "test-session-token");

    await authenticatedFetch("/api/community/posts");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0];
    const headers = new Headers(request?.headers);
    expect(request?.credentials).toBe("include");
    expect(headers.get("authorization")).toBe("Bearer test-session-token");
  });

  it("does not send a malformed Authorization header when no token exists", async () => {
    await authenticatedFetch("/api/community/posts");

    const [, request] = fetchMock.mock.calls[0];
    const headers = new Headers(request?.headers);
    expect(request?.credentials).toBe("include");
    expect(headers.has("authorization")).toBe(false);
  });

  it("does not overwrite an explicitly supplied Authorization header", async () => {
    storedValues.set(TOKEN_KEY, "saved-session-token");

    await authenticatedFetch("/api/community/posts", {
      headers: { Authorization: "Basic explicit-credential" },
    });

    const [, request] = fetchMock.mock.calls[0];
    expect(new Headers(request?.headers).get("authorization")).toBe("Basic explicit-credential");
  });

  it("routes all Community API requests through the shared helper", () => {
    for (const source of communityRequestSources) {
      expect(source).toContain("authenticatedFetch(");
      expect(source).not.toMatch(/\bfetch\s*\(/);
    }
  });

  it("routes every Admin request through the shared bearer-and-cookie helper", () => {
    expect(adminSource).toContain('import { authenticatedFetch } from "@/lib/authenticatedFetch"');
    expect(adminSource).toContain('import { authenticatedAdminFetch, readAdminJson } from "@/lib/adminDataFetch"');
    expect(adminSource).toContain("const fetch = authenticatedAdminFetch;");
    expect(adminSource).toContain("api/admin/businesses/listing-status");
    expect(adminSource).toContain("api/admin/access/reconcile-retained");
  });

  it("forces Admin requests to bypass stale browser responses while preserving bearer-and-cookie authentication", async () => {
    storedValues.set(TOKEN_KEY, "test-session-token");

    await authenticatedAdminFetch("/api/admin/users", {
      headers: { "X-Admin-View": "users" },
    });

    const [, request] = fetchMock.mock.calls[0];
    const headers = new Headers(request?.headers);
    expect(request?.credentials).toBe("include");
    expect(request?.cache).toBe("no-store");
    expect(headers.get("authorization")).toBe("Bearer test-session-token");
    expect(headers.get("cache-control")).toBe("no-cache");
    expect(headers.get("x-admin-view")).toBe("users");
  });

  it("preserves authorization and network failures for a visible Admin error state", async () => {
    await expect(readAdminJson(new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }))).rejects.toMatchObject({
      name: "AdminDataRequestError",
      status: 403,
      message: "Admin access required",
    });
  });

  it("does not let the Admin page convert a failed list response into an empty collection", () => {
    expect(adminSource).toContain("readAdminJson<any>(response)");
    expect(adminSource).toContain("recordAdminDataError(\"waitlist\", error)");
    expect(adminSource).toContain("recordAdminDataError(\"users\", error)");
    expect(adminSource).toContain("recordAdminDataError(\"businesses\", error)");
    expect(adminSource).toContain("recordAdminDataError(\"members\", error)");
    expect(adminSource).toContain("recordAdminDataError(\"reviews\", error)");
    expect(adminSource).toContain("recordAdminDataError(\"reports\", error)");
    expect(adminSource).toContain("A failed request is never presented as zero matching records.");
  });

  it("keeps founder tester roster provisioning authenticated and explicitly confirmed", () => {
    expect(accessLedgerSource).toContain('import { authenticatedFetch } from "@/lib/authenticatedFetch"');
    expect(accessLedgerSource).toContain("const fetch = authenticatedFetch;");
    expect(accessLedgerSource).toContain("api/admin/testers/founder-roster-preview");
    expect(accessLedgerSource).toContain("api/admin/testers/provision-founder-roster");
    expect(accessLedgerSource).toContain("Confirm approved tester access");
    expect(accessLedgerSource).toContain("will keep every password, profile, post, media item, community record, and saved item");
  });
});
