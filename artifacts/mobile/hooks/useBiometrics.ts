import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";

export const BIOMETRICS_ENABLED_KEY = "@melanin_maps_biometrics_enabled";
export const FRESH_LOGIN_KEY = "@melanin_maps_fresh_login";
const AUTH_TOKEN_KEY = "auth_session_token";

export async function getBiometricCapabilities(): Promise<{ isSupported: boolean; label: string }> {
  if ((Platform.OS as string) === "web") return { isSupported: false, label: "Biometrics" };
  const has = await LocalAuthentication.hasHardwareAsync();
  if (!has) return { isSupported: false, label: "Biometrics" };
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return { isSupported: false, label: "Biometrics" };
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  let label = "Biometrics";
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    label = Platform.OS === "ios" ? "Face ID" : "Face Recognition";
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    label = Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
  }
  return { isSupported: true, label };
}

export async function isBiometricsEnabled(): Promise<boolean> {
  if ((Platform.OS as string) === "web") return false;
  try { return (await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY)) === "1"; }
  catch { return false; }
}

export async function hasStoredToken(): Promise<boolean> {
  if ((Platform.OS as string) === "web") return false;
  try { return !!(await SecureStore.getItemAsync(AUTH_TOKEN_KEY)); }
  catch { return false; }
}

export async function enableBiometrics(label: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: `Confirm to enable ${label}`,
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });
  if (result.success) {
    await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, "1");
    return true;
  }
  return false;
}

export async function disableBiometrics(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
}

export async function authenticateWithBiometrics(label: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: `Sign in with ${label}`,
    cancelLabel: "Use Password",
    disableDeviceFallback: false,
  });
  return result.success;
}

export function useBiometricSettings() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [label, setLabel] = useState("Biometrics");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { isSupported: sup, label: lbl } = await getBiometricCapabilities();
    const enabled = await isBiometricsEnabled();
    setIsSupported(sup);
    setLabel(lbl);
    setIsEnabled(enabled);
    setLoading(false);
  }, []);

  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);

  const toggle = useCallback(async (value: boolean): Promise<boolean> => {
    if (value) {
      const ok = await enableBiometrics(label);
      if (ok) setIsEnabled(true);
      return ok;
    } else {
      await disableBiometrics();
      setIsEnabled(false);
      return true;
    }
  }, [label]);

  return { isSupported, isEnabled, label, loading, toggle, refresh };
}
