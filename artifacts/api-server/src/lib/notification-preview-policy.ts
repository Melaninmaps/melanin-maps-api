export type NotificationPreviewPurpose =
  | "safety_checkin"
  | "safety_incident"
  | "trusted_safety_share"
  | "family_impact"
  | "member_task";

export type NotificationPreviewPolicy =
  | { classification: "routine" }
  | { classification: "sensitive"; purpose: NotificationPreviewPurpose };

export interface PreviewAwarePushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /**
   * Sensitive notifications are deliberately neutral on the provider/device
   * preview. Detailed content remains available only after authenticated,
   * in-app authorization. Detailed lock-screen preview opt-in is not
   * implemented, so this boundary fails closed.
   */
  preview?: NotificationPreviewPolicy;
}

const SENSITIVE_SCREENS = new Set(["safety", "safety-hub"]);
const SENSITIVE_TYPE_MARKERS = [
  "safety",
  "checkin",
  "police",
  "ice",
  "family_impact",
  "trusted",
];

function stringField(data: Record<string, unknown> | undefined, field: string): string | null {
  const value = data?.[field];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Preserves existing routine notifications while recognizing established safety
 * routes as sensitive even if a future caller omits an explicit classification.
 */
export function isSensitiveNotificationPreview(message: PreviewAwarePushMessage): boolean {
  const screen = stringField(message.data, "screen")?.toLocaleLowerCase();
  if (screen && SENSITIVE_SCREENS.has(screen)) return true;

  const type = stringField(message.data, "type")?.toLocaleLowerCase();
  if (type && SENSITIVE_TYPE_MARKERS.some((marker) => type.includes(marker))) return true;

  return message.preview?.classification === "sensitive";
}

/**
 * Returns the only payload permitted to leave the API for a sensitive push.
 * It carries an authorized destination screen, but strips identifiers, location,
 * relationship, health, task, and event detail from provider-visible data.
 */
export function preparePushMessageForProvider(message: PreviewAwarePushMessage): PreviewAwarePushMessage {
  if (!isSensitiveNotificationPreview(message)) {
    return { ...message, data: message.data ?? {} };
  }

  const requestedScreen = stringField(message.data, "screen")?.toLocaleLowerCase();
  const screen = requestedScreen && SENSITIVE_SCREENS.has(requestedScreen)
    ? requestedScreen
    : "notifications";

  return {
    title: "A private update is ready",
    body: "Open Mapping With Melanin to view it securely.",
    data: {
      screen,
      type: "private_update",
      preview: "neutral",
    },
    preview: message.preview ?? { classification: "sensitive", purpose: "safety_incident" },
  };
}
