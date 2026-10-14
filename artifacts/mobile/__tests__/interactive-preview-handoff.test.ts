import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  INTERACTIVE_PREVIEW_URL,
  openInteractivePreview,
} from "../lib/interactivePreviewHandoff";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("interactive preview browser handoff", () => {
  it("uses the live, canonical Mapping With Melanin preview URL", () => {
    expect(INTERACTIVE_PREVIEW_URL).toBe("https://www.mappingwithmelanin.com/preview");
  });

  it.each(["ios", "android"] as const)("opens the public preview through the %s browser handoff", async () => {
    const browser = {
      canOpenURL: vi.fn().mockResolvedValue(true),
      openURL: vi.fn().mockResolvedValue(undefined),
    };

    await expect(openInteractivePreview(browser)).resolves.toBe("opened");
    expect(browser.canOpenURL).toHaveBeenCalledWith(INTERACTIVE_PREVIEW_URL);
    expect(browser.openURL).toHaveBeenCalledWith(INTERACTIVE_PREVIEW_URL);
  });

  it("keeps the native route available when the device cannot open the preview", async () => {
    const browser = {
      canOpenURL: vi.fn().mockResolvedValue(false),
      openURL: vi.fn(),
    };

    await expect(openInteractivePreview(browser)).resolves.toBe("unavailable");
    expect(browser.openURL).not.toHaveBeenCalled();
  });

  it("returns an understandable fallback state when browser opening fails", async () => {
    const browser = {
      canOpenURL: vi.fn().mockResolvedValue(true),
      openURL: vi.fn().mockRejectedValue(new Error("browser unavailable")),
    };

    await expect(openInteractivePreview(browser)).resolves.toBe("unavailable");
  });
});

describe("native preview route contract", () => {
  const preview = source("../app/preview.tsx");

  it("offers the public interactive preview without a sign-in gate", () => {
    expect(preview).toContain('Open Interactive Preview');
    expect(preview).toContain('openInteractivePreview(Linking)');
    expect(preview).toContain('accessibilityLabel="Open the interactive website preview"');
    expect(preview).toContain('Interactive preview unavailable');
    expect(preview).not.toContain('webPaymentHandoffEnabled');
  });

  it("preserves the existing signup and login navigation", () => {
    expect(preview).toContain('const handleJoin = () => router.push("/signup" as never);');
    expect(preview).toContain('const handleLogin = () => router.push("/login" as never);');
    expect(preview).toContain('onPress={handleJoin}');
    expect(preview).toContain('onPress={handleLogin}');
  });
});
