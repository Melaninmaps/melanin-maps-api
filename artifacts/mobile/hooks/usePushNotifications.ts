import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const PUSH_TOKEN_KEY = "@melanin_maps_push_token";
const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface PermissionResult {
  status: string;
}

export async function registerPushToken(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    // @ts-ignore - expo-notifications removed; graceful no-op
    const Notifications = await import("expo-notifications").catch(() => null);
    if (!Notifications) return;

    const existing = (await Notifications.getPermissionsAsync()) as PermissionResult;
    const finalStatus =
      existing.status === "granted"
        ? "granted"
        : ((await Notifications.requestPermissionsAsync()) as PermissionResult).status;

    if (finalStatus !== "granted") return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (cached === pushToken) return;

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken);

    const authToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY).catch(() => null);
    const apiBase = getApiBase();
    if (authToken && apiBase) {
      await fetch(`${apiBase}/api/push-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: pushToken }),
      });
    }
  } catch {
  }
}
