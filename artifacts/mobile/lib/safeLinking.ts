import { Alert, Linking, Platform } from "react-native";
import { getApiBase } from "@/lib/api";
import { normalizeExternalUrl } from "@/lib/urlSafety";

export { normalizeExternalUrl } from "@/lib/urlSafety";

export type OpenExternalUrlOptions = {
  kind?: "web" | "device";
  unavailableTitle?: string;
  unavailableMessage?: string;
};

function showUnavailable(
  message = "This link is unavailable right now.",
  title = "Link unavailable",
): void {
  Alert.alert(title, message);
}

function normalizeDeviceUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = trimmed.startsWith("/") ? `${getApiBase()}${trimmed}` : trimmed;
  try {
    const parsed = new URL(candidate);
    return new Set(["http:", "https:", "maps:", "geo:", "tel:", "sms:", "mailto:"])
      .has(parsed.protocol.toLowerCase())
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export async function openExternalUrl(
  value: unknown,
  options: OpenExternalUrlOptions = {},
): Promise<boolean> {
  const {
    kind = "web",
    unavailableTitle = "Link unavailable",
    unavailableMessage = "This link is invalid or cannot be opened on this device.",
  } = options;
  const url = kind === "device" ? normalizeDeviceUrl(value) : normalizeExternalUrl(value);
  if (!url) {
    showUnavailable(unavailableMessage, unavailableTitle);
    return false;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      showUnavailable(unavailableMessage, unavailableTitle);
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    showUnavailable(unavailableMessage, unavailableTitle);
    return false;
  }
}

export async function openMapDirections(
  latitude: number,
  longitude: number,
  label: string,
): Promise<boolean> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    showUnavailable("Directions are unavailable because this place has no valid coordinates.");
    return false;
  }

  const encodedLabel = encodeURIComponent(label);
  const nativeUrl = Platform.OS === "ios"
    ? `maps://?ll=${latitude},${longitude}&q=${encodedLabel}`
    : `geo:${latitude},${longitude}?q=${encodedLabel}`;
  const fallbackUrl =
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  try {
    if (await Linking.canOpenURL(nativeUrl)) {
      await Linking.openURL(nativeUrl);
      return true;
    }
    await Linking.openURL(fallbackUrl);
    return true;
  } catch {
    try {
      await Linking.openURL(fallbackUrl);
      return true;
    } catch {
      showUnavailable("Directions could not be opened on this device.");
      return false;
    }
  }
}
