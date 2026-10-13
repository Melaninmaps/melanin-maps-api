import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_OPERATION_DEADLINE_MS,
  AuthOperationTimeoutError,
  withAuthOperationDeadline,
} from "../lib/authOperationDeadline";

const authSource = readFileSync(
  fileURLToPath(new URL("../lib/auth.tsx", import.meta.url)),
  "utf8",
);
const rootLayoutSource = readFileSync(
  fileURLToPath(new URL("../app/_layout.tsx", import.meta.url)),
  "utf8",
);
const loginSource = readFileSync(
  fileURLToPath(new URL("../app/login.tsx", import.meta.url)),
  "utf8",
);
const authCompleteSource = readFileSync(
  fileURLToPath(new URL("../app/auth-complete.tsx", import.meta.url)),
  "utf8",
);

afterEach(() => {
  vi.useRealTimers();
});

describe("authentication operation deadline", () => {
  it("preserves a successful secure operation", async () => {
    await expect(
      withAuthOperationDeadline(Promise.resolve("ready"), "Secure sign-in restoration"),
    ).resolves.toBe("ready");
  });

  it("returns control when a native credential operation never settles", async () => {
    vi.useFakeTimers();
    const never = new Promise<never>(() => {});
    const outcome = withAuthOperationDeadline(
      never,
      "Secure sign-in restoration",
    ).catch((error) => error);

    await vi.advanceTimersByTimeAsync(AUTH_OPERATION_DEADLINE_MS);

    const error = await outcome;
    expect(error).toBeInstanceOf(AuthOperationTimeoutError);
    expect((error as Error).message).toContain("Secure sign-in restoration");
  });

  it("routes a bounded restoration failure to usable sign-in UI", () => {
    expect(authSource).toContain("setSessionRecoveryError(\"secure_storage\")");
    expect(authSource).toContain("void clearStoredAuthSession()");
    expect(rootLayoutSource).toContain("/login?recovery=${sessionRecoveryError}");
    expect(loginSource).toContain("Your saved sign-in could not be restored on this device");
  });

  it("bounds SSO and Apple credential persistence before navigation", () => {
    expect(authSource).toContain("export async function persistAuthSession");
    expect(authSource).toContain('"Secure sign-in verification"');
    expect(authSource).toContain("await persistAuthSession(token)");
    expect(authCompleteSource).toContain("await persistAuthSession(token)");
    expect(authCompleteSource).toContain('router.replace("/login?recovery=secure_storage")');
    expect(loginSource).toContain("await persistAuthSession(data.token, { appleUserId: credential.user })");
    expect(loginSource).toContain("could not save your secure session");
  });
});
