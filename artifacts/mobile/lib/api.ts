import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiBase, STAGING_ORIGIN } from "./api-origin";

export { getApiBase, STAGING_ORIGIN } from "./api-origin";

export function assertBuild106StagingApiOrigin(): string {
  const origin = getApiBase();
  if (origin !== STAGING_ORIGIN) {
    throw new Error("Staging build blocked: API origin mismatch");
  }
  return origin;
}

/**
 * Returns the established bearer token for protected native API reads. Web
 * retains cookie credentials rather than copying a browser session into a
 * header. Callers must still use `getApiBase()` for the canonical origin.
 */
export async function getMemberApiHeaders(): Promise<Record<string, string>> {
  if (Platform.OS === "web") return {};
  const token = await SecureStore.getItemAsync("auth_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
