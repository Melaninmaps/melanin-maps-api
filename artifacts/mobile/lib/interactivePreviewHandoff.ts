export const INTERACTIVE_PREVIEW_URL = "https://www.mappingwithmelanin.com/preview";

export type InteractivePreviewBrowser = {
  canOpenURL: (url: string) => Promise<boolean>;
  openURL: (url: string) => Promise<unknown>;
};

export type InteractivePreviewOpenResult = "opened" | "unavailable";

/**
 * Opens the public, interactive Kinfolk preview without requiring authentication
 * or passing member data to the website. The caller keeps the member on the
 * native Preview screen when a device browser is unavailable.
 */
export async function openInteractivePreview(
  browser: InteractivePreviewBrowser,
): Promise<InteractivePreviewOpenResult> {
  try {
    const supported = await browser.canOpenURL(INTERACTIVE_PREVIEW_URL);
    if (!supported) return "unavailable";

    await browser.openURL(INTERACTIVE_PREVIEW_URL);
    return "opened";
  } catch {
    return "unavailable";
  }
}
