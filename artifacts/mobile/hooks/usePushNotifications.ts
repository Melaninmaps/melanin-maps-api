import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiBase } from "@/lib/api";

const AUTH_TOKEN_KEY = "auth_session_token";
const EAS_PROJECT_ID = "0f873107-7787-46ab-9a04-685c2a6756b1";

interface PermissionResult {
  status: string;
}

/**
 * Registers the current signed-in member's device only after the operating
 * system grants notification permission. Registration is intentionally not
 * cached by token: a shared device can switch accounts, and the API must then
 * transfer that device token to the current authenticated member.
 */
export async function registerPushToken(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const authToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY).catch(() => null);
    const apiBase = getApiBase();
    if (!authToken || !apiBase) return;

    const Notifications = await import("expo-notifications").catch(() => null);
    if (!Notifications) return;

    const existing = (await Notifications.getPermissionsAsync()) as PermissionResult;
    const finalStatus = existing.status === "granted"
      ? "granted"
      : ((await Notifications.requestPermissionsAsync()) as PermissionResult).status;
    if (finalStatus !== "granted") return;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
    if (!tokenData?.data) return;

    await fetch(`${apiBase}/api/notifications/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: tokenData.data, platform: Platform.OS }),
    });
  } catch {
    // Push registration remains optional. The device can be enabled from
    // Notifications settings if permission or network access is unavailable.
  }
}
