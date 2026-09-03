import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedFetch } from "../lib/authenticatedFetch";

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
});
