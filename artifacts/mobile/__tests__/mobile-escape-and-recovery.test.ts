import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

const reviewSheetSource = source("../components/WriteReviewModal.tsx");
const initialPasswordSource = source("../app/set-initial-password.tsx");
const authSource = source("../lib/auth.tsx");
const authSessionSignalsSource = source("../lib/authSessionSignals.ts");
const crashLoggerSource = source("../lib/crashLogger.ts");
const errorFallbackSource = source("../components/ErrorFallback.tsx");
const layoutSource = source("../app/_layout.tsx");
const profileSource = source("../app/(tabs)/profile.tsx");

describe("mobile dismissal and recovery contracts", () => {
  it("keeps review writing dismissible by backdrop, close button, and downward swipe", () => {
    expect(reviewSheetSource).toContain("PanResponder.create");
    expect(reviewSheetSource).toContain("gesture.dy > 72 || gesture.vy > 1.1");
    expect(reviewSheetSource).toContain('accessibilityLabel="Close review"');
    expect(reviewSheetSource).toContain("onPress={handleClose}");
  });

  it("lets a temporary-password tester leave by signing out, without bypassing the password-change requirement", () => {
    expect(initialPasswordSource).toContain("const { refreshUser, logout } = useAuth()");
    expect(initialPasswordSource).toContain("await logout().catch(() => {})");
    expect(initialPasswordSource).toContain('router.replace("/login")');
    expect(initialPasswordSource).toContain('accessibilityLabel="Sign out and return to sign in"');
    expect(layoutSource).toContain('router.replace("/set-initial-password" as Href)');
  });

  it("completes local logout even if a SecureStore read fails", () => {
    expect(authSource).toContain("let token: string | null = null");
    expect(authSource).toContain("Local logout must still complete if a device storage read is briefly");
    expect(authSource).toContain("setUser(null)");
  });

  it("tries an in-app boundary reset before offering an explicit full reload", () => {
    expect(errorFallbackSource).toContain("const handleTryAgain = () =>");
    expect(errorFallbackSource).toContain("resetError()");
    expect(errorFallbackSource).toContain("const handleReload = async () =>");
    expect(errorFallbackSource).toContain('accessibilityLabel="Reload application"');
  });

  it("gives a root-boundary failure an explicit local-only sign-in reset", () => {
    expect(authSource).toContain("export async function clearStoredAuthSession");
    expect(authSource).toContain("SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)");
    expect(authSource).toContain("SecureStore.deleteItemAsync(FRESH_LOGIN_KEY)");
    expect(authSource).toContain("SecureStore.deleteItemAsync(APPLE_USER_ID_KEY)");
    expect(errorFallbackSource).toContain("await clearStoredAuthSession()");
    expect(errorFallbackSource).toContain('accessibilityLabel="Reset app sign-in and return to sign in"');
    expect(errorFallbackSource).toContain("Your account and saved data stay intact.");
  });

  it("reconciles a verified configured-API 401 instead of leaving Profile stale", () => {
    expect(authSessionSignalsSource).toContain("registerUnauthorizedApiResponseHandler");
    expect(authSessionSignalsSource).toContain("notifyUnauthorizedApiResponse");
    expect(crashLoggerSource).toContain("function isConfiguredApiRequest");
    expect(crashLoggerSource).toContain("function requestHasAuthorization");
    expect(crashLoggerSource).toContain("resp.status === 401");
    expect(crashLoggerSource).toContain("isConfiguredApiRequest(url)");
    expect(crashLoggerSource).toContain("requestHasAuthorization(input, init)");
    expect(crashLoggerSource).toContain("notifyUnauthorizedApiResponse()");
    expect(authSource).toContain("return registerUnauthorizedApiResponseHandler");
    expect(authSource).toContain("await expireSession()");
  });

  it("leaves a contained Profile failure with a safe sign-out escape", () => {
    expect(profileSource).toContain("onRecoverSession: () => void");
    expect(profileSource).toContain("const recoverProfileSession = useCallback");
    expect(profileSource).toContain('accessibilityLabel="Sign out and return to sign in"');
    expect(profileSource).toContain('router.replace("/login?recovery=1" as never)');
  });
});
