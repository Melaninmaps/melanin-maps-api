import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hookSource = readFileSync(
  decodeURIComponent(new URL("../hooks/useBusinesses.ts", import.meta.url).pathname),
  "utf8",
);

describe("business discovery data contract", () => {
  it("never substitutes fixture businesses for an API response", () => {
    expect(hookSource).not.toContain('from "@/constants/data"');
    expect(hookSource).not.toContain("BUSINESSES");
    expect(hookSource).toContain("useState<Business[]>([])");
  });

  it("reports loading failures while preserving an empty API result as empty", () => {
    expect(hookSource).toContain("const BUSINESS_LOAD_ERROR");
    expect(hookSource).toContain("setBusinesses([]);");
    expect(hookSource).toContain("if (!Array.isArray(data.businesses))");
  });

  it("sends the saved session token as a bearer token on discovery requests", () => {
    expect(hookSource).toContain('import * as SecureStore from "expo-secure-store"');
    expect(hookSource).toContain('SecureStore.getItemAsync(AUTH_TOKEN_KEY)');
    expect(hookSource).toContain("Authorization: `Bearer ${token}`");
  });
});