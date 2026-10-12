import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import * as TaskManager from "expo-task-manager";
import { getApiBase } from "@/lib/api";

export const PERSISTENT_SAFETY_LOCATION_TASK = "mwm-persistent-safety-location-v1";

type ApiPermissionState = "granted" | "denied" | "restricted" | "not_requested" | "unknown";

type ApiLocation = {
  latitude: number;
  longitude: number;
  capturedAt: string;
  accuracyMeters: number;
  platform: "ios" | "android";
  background: boolean;
};

function permissionState(status: Location.PermissionStatus | undefined): ApiPermissionState {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  if (status === "undetermined") return "not_requested";
  return "unknown";
}

async function currentPermissionState(): Promise<{ foregroundPermission: ApiPermissionState; backgroundPermission: ApiPermissionState }> {
  if (Platform.OS === "web") return { foregroundPermission: "unknown", backgroundPermission: "unknown" };
  const [foreground, background] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
  ]);
  return {
    foregroundPermission: permissionState(foreground.status),
    backgroundPermission: permissionState(background.status),
  };
}

function toApiLocation(location: Location.LocationObject, background: boolean): ApiLocation | null {
  const { latitude, longitude, accuracy } = location.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(accuracy) || accuracy === null || accuracy < 0) return null;
  return {
    latitude,
    longitude,
    accuracyMeters: accuracy,
    capturedAt: new Date(location.timestamp).toISOString(),
    platform: Platform.OS === "android" ? "android" : "ios",
    background,
  };
}

async function postCurrentFix(location: Location.LocationObject, background: boolean): Promise<void> {
  const token = await SecureStore.getItemAsync("auth_session_token");
  const payload = toApiLocation(location, background);
  if (!token || !payload) return;
  const permissions = await currentPermissionState();
  // No raw location is queued to AsyncStorage or logged. If a device is offline,
  // the update is deliberately dropped and the server eventually reports stale.
  await fetch(`${getApiBase()}/api/safety/persistent-location/fix`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ location: payload, ...permissions }),
  }).catch(() => undefined);
}

if (Platform.OS !== "web") {
  TaskManager.defineTask(PERSISTENT_SAFETY_LOCATION_TASK, async ({ data, error }) => {
    if (error || !data || typeof data !== "object") return;
    const locations = (data as { locations?: Location.LocationObject[] }).locations;
    const newest = Array.isArray(locations) ? locations.at(-1) : undefined;
    if (!newest) return;
    await postCurrentFix(newest, true);
  });
}

export async function requestPersistentSafetyPermissions(): Promise<{
  foregroundPermission: ApiPermissionState;
  backgroundPermission: ApiPermissionState;
}> {
  if (Platform.OS === "web") return { foregroundPermission: "unknown", backgroundPermission: "unknown" };
  let foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== "granted") foreground = await Location.requestForegroundPermissionsAsync();
  let background = await Location.getBackgroundPermissionsAsync();
  // This call is made only from the member's explicit Enable Safety Location
  // action after the first-party disclosure, never at app launch.
  if (foreground.status === "granted" && background.status !== "granted") {
    background = await Location.requestBackgroundPermissionsAsync();
  }
  return { foregroundPermission: permissionState(foreground.status), backgroundPermission: permissionState(background.status) };
}

export async function startPersistentSafetyLocationCollection(): Promise<void> {
  if (Platform.OS === "web") throw new Error("Persistent Safety Location is available only in the native app");
  const permissions = await currentPermissionState();
  if (permissions.foregroundPermission !== "granted" || permissions.backgroundPermission !== "granted") {
    throw new Error("Background permission is required before Safety Location can run in the background");
  }
  const registered = await TaskManager.isTaskRegisteredAsync(PERSISTENT_SAFETY_LOCATION_TASK);
  if (!registered) {
    await Location.startLocationUpdatesAsync(PERSISTENT_SAFETY_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5 * 60_000,
      distanceInterval: 250,
      deferredUpdatesInterval: 5 * 60_000,
      pausesUpdatesAutomatically: true,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Safety Location protection is active",
        notificationBody: "Mapping With Melanin is checking only whether a qualifying emergency may affect you. Stop anytime in Safety Hub.",
        notificationColor: "#CA922B",
      },
    });
  }
  // A new foreground fix is useful immediately; failures stay private and do
  // not change the server consent record.
  const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
  if (current) await postCurrentFix(current, false);
}

export async function stopPersistentSafetyLocationCollection(): Promise<void> {
  if (Platform.OS === "web") return;
  const registered = await TaskManager.isTaskRegisteredAsync(PERSISTENT_SAFETY_LOCATION_TASK);
  if (registered) await Location.stopLocationUpdatesAsync(PERSISTENT_SAFETY_LOCATION_TASK);
}

export async function syncPersistentSafetyPermissionState(): Promise<{ foregroundPermission: ApiPermissionState; backgroundPermission: ApiPermissionState }> {
  const permissions = await currentPermissionState();
  const token = await SecureStore.getItemAsync("auth_session_token");
  if (!token) return permissions;
  await fetch(`${getApiBase()}/api/safety/persistent-location/permissions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(permissions),
  }).catch(() => undefined);
  return permissions;
}
