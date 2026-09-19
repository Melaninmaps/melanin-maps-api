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
const errorFallbackSource = source("../components/ErrorFallback.tsx");
const layoutSource = source("../app/_layout.tsx");

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
});
