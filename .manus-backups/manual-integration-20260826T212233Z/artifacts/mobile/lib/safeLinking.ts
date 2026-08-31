import { Alert, Linking, Platform } from "react-native";
import { normalizeExternalUrl } from "@/lib/urlSafety";

export { normalizeExternalUrl } from "@/lib/urlSafety";

function showUnavailable(message = "This link is unavailable right now."): void {
  Alert.alert("Link unavailable", message);
}

export async function openExternalUrl(value: unknown): Promise<boolean> {
  const url = normalizeExternalUrl(value);
  if (!url) {
    showUnavailable("This link is invalid or incomplete.");
    return false;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      showUnavailable();
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    showUnavailable();
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
