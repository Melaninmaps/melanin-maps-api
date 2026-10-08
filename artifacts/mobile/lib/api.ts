import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
export {
  assertBuild106StagingApiOrigin,
  getApiBase,
  getApiBaseForEnvironment,
  STAGING_ORIGIN,
} from "./apiOrigin";

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
