import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";
import {
  requestPersistentSafetyPermissions,
  startPersistentSafetyLocationCollection,
  stopPersistentSafetyLocationCollection,
  syncPersistentSafetyPermissionState,
} from "@/lib/persistentSafetyLocation";

const CONSENT_VERSION = "mwm-persistent-safety-location-v1";
const CONTACT_CONSENT_VERSION = "mwm-persistent-safety-location-family-impact-v1";

type Permission = "granted" | "denied" | "restricted" | "not_requested" | "unknown";
type Settings = {
  available: boolean;
  enabled: boolean;
  paused: boolean;
  backgroundOptIn: boolean;
  foregroundPermission: Permission;
  backgroundPermission: Permission;
  locationState: "current" | "stale" | "unavailable";
  lastSuccessfulLocationAt: string | null;
  accuracyMeters: number | null;
  freshnessPolicyConfigured: boolean;
};
type Contact = { trustedShareId: string; contactName: string; eligible: boolean; allowedForEmergencyImpact: boolean };

function permissionLabel(permission: Permission): string {
  if (permission === "granted") return "Allowed";
  if (permission === "denied") return "Not allowed";
  if (permission === "restricted") return "Restricted by device settings";
  if (permission === "not_requested") return "Not requested";
  return "Unknown — check device settings";
}

export default function PersistentSafetyLocationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(async () => ({ "Content-Type": "application/json", ...(await getMemberApiHeaders()) }), []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const protectedHeaders = await getMemberApiHeaders();
      const [settingsResponse, contactsResponse] = await Promise.all([
        fetch(`${getApiBase()}/api/safety/persistent-location`, { headers: protectedHeaders }),
        fetch(`${getApiBase()}/api/safety/persistent-location/contacts`, { headers: protectedHeaders }),
      ]);
      if (!settingsResponse.ok) throw new Error("Safety Location settings are unavailable right now.");
      const settingsData = await settingsResponse.json() as Settings;
      setSettings(settingsData);
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json() as { contacts?: Contact[] };
        setContacts(contactsData.contacts ?? []);
      }
      if (settingsData.enabled) void syncPersistentSafetyPermissionState();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Safety Location settings are unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && settings?.enabled) {
        void syncPersistentSafetyPermissionState().then(() => void load());
      }
    });
    return () => subscription.remove();
  }, [load, settings?.enabled]);

  const enable = async () => {
    if (!settings?.available || saving) return;
    setSaving(true);
    try {
      const permissions = await requestPersistentSafetyPermissions();
      const response = await fetch(`${getApiBase()}/api/safety/persistent-location/consent`, {
        method: "PUT",
        headers: await headers(),
        body: JSON.stringify({
          enabled: true,
          consentVersion: CONSENT_VERSION,
          disclosureAcknowledged: true,
          backgroundOptIn: true,
          ...permissions,
        }),
      });
      if (!response.ok) throw new Error("The server did not confirm your Safety Location choice.");
      if (permissions.foregroundPermission === "granted" && permissions.backgroundPermission === "granted") {
        await startPersistentSafetyLocationCollection();
      }
      await load();
      if (permissions.foregroundPermission !== "granted" || permissions.backgroundPermission !== "granted") {
        Alert.alert(
          "Permission needed",
          "Your choice was saved, but Safety Location cannot run in the background until location permission is allowed in device settings. MWM will not collect a location while permission is unavailable.",
        );
      }
    } catch (cause) {
      Alert.alert("Safety Location not enabled", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const pause = async (paused: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      if (paused) await stopPersistentSafetyLocationCollection();
      const response = await fetch(`${getApiBase()}/api/safety/persistent-location/pause`, {
        method: "PATCH", headers: await headers(), body: JSON.stringify({ paused }),
      });
      if (!response.ok) throw new Error("The server did not confirm this protection change.");
      if (!paused) {
        const permissions = await syncPersistentSafetyPermissionState();
        if (permissions.foregroundPermission === "granted" && permissions.backgroundPermission === "granted") await startPersistentSafetyLocationCollection();
      }
      await load();
    } catch (cause) {
      Alert.alert("Safety Location not updated", cause instanceof Error ? cause.message : "Please try again.");
    } finally { setSaving(false); }
  };

  const revoke = () => Alert.alert(
    "Turn off Safety Location?",
    "This immediately stops future collection, deletes the current stored location, and removes every emergency-contact permission for this Safety Location setting. It does not change your separate Trusted Live Location sessions.",
    [
      { text: "Keep on", style: "cancel" },
      {
        text: "Turn off", style: "destructive", onPress: () => void (async () => {
          setSaving(true);
          try {
            await stopPersistentSafetyLocationCollection();
            const response = await fetch(`${getApiBase()}/api/safety/persistent-location/consent`, { method: "DELETE", headers: await getMemberApiHeaders() });
            if (!response.ok) throw new Error("The server did not confirm that Safety Location was turned off.");
            await load();
          } catch (cause) {
            Alert.alert("Safety Location not turned off", cause instanceof Error ? cause.message : "Please try again.");
          } finally { setSaving(false); }
        })(),
      },
    ],
  );

  const deleteCurrentLocation = () => Alert.alert(
    "Delete current Safety Location?",
    "This removes the current stored location now. Your consent remains on, but MWM cannot assess your location again until a new device update is received.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: () => void (async () => {
          setSaving(true);
          try {
            const response = await fetch(`${getApiBase()}/api/safety/persistent-location/location`, { method: "DELETE", headers: await getMemberApiHeaders() });
            if (!response.ok) throw new Error("The server did not confirm deletion.");
            await load();
          } catch (cause) {
            Alert.alert("Location not deleted", cause instanceof Error ? cause.message : "Please try again.");
          } finally { setSaving(false); }
        })(),
      },
    ],
  );

  const updateContact = async (contact: Contact, enabled: boolean) => {
    if (!settings?.enabled || settings.paused || saving) return;
    setSaving(true);
    try {
      const response = await fetch(`${getApiBase()}/api/safety/persistent-location/contacts/${contact.trustedShareId}`, {
        method: "PUT",
        headers: await headers(),
        body: JSON.stringify(enabled ? { enabled: true, consentVersion: CONTACT_CONSENT_VERSION } : { enabled: false }),
      });
      if (!response.ok) throw new Error("The server did not confirm this contact choice.");
      await load();
    } catch (cause) {
      Alert.alert("Emergency contact not updated", cause instanceof Error ? cause.message : "Please try again.");
    } finally { setSaving(false); }
  };

  const startConfirmation = () => Alert.alert(
    "Enable Safety Location",
    "Allow Mapping with Melanin to use your location to check whether you may be affected by an emergency. Your trusted contacts cannot see your live location. If a qualifying emergency may affect you, MWM may notify only the contacts you separately authorize. Location updates depend on your device permissions, battery, connectivity, and settings; protection and alerts are not guaranteed.",
    [{ text: "Not now", style: "cancel" }, { text: "Continue", onPress: () => void enable() }],
  );

  const stateCopy = settings?.locationState === "current"
    ? "A current location is available privately for emergency matching. It is not visible to contacts."
    : settings?.locationState === "stale"
      ? "Your last location is no longer current enough for emergency matching. Your safety is unknown until a new update arrives."
      : "No current location is available. MWM cannot assess whether an emergency may affect you until a new update arrives.";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}> 
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Safety Location</Text>
        <View style={styles.back} />
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator color="#CA922B" size="large" /></View> : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}>
          <View style={[styles.hero, { backgroundColor: "#CA922B18", borderColor: "#CA922B40" }]}> 
            <Feather name="shield" size={23} color="#8C5A0B" />
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Private emergency protection — never family surveillance</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Mapping With Melanin can privately assess whether a qualifying emergency may affect you. Trusted contacts cannot open a map, see a location, view a timestamp, or follow your movement.</Text>
          </View>

          {error && <View style={[styles.notice, { borderColor: "#B91C1C", backgroundColor: "#FEF2F2" }]}><Text style={styles.errorText}>{error}</Text></View>}
          {settings && !settings.available && <View style={[styles.notice, { borderColor: "#D97706", backgroundColor: "#FFFBEB" }]}><Text style={styles.noticeTitle}>Not active in this environment</Text><Text style={styles.body}>Safety Location is not available until its secure server configuration is approved. No location collection is running.</Text></View>}

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.row}><View style={styles.grow}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Enable Safety Location</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>A separate choice from Temporary Trusted Live Sharing. This does not give contacts live-location access.</Text></View><Switch value={Boolean(settings?.enabled)} disabled={!settings?.available || saving} onValueChange={(value) => value ? startConfirmation() : revoke()} trackColor={{ true: "#CA922B", false: colors.border }} /></View>
            {settings?.enabled && <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.statusTitle, { color: colors.foreground }]}>Protection status</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>{stateCopy}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Last successful update: {settings.lastSuccessfulLocationAt ? new Date(settings.lastSuccessfulLocationAt).toLocaleString() : "Unavailable"}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Background permission: {permissionLabel(settings.backgroundPermission)}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Foreground permission: {permissionLabel(settings.foregroundPermission)}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Emergency matching uses only a current, sufficiently accurate update. It never proves that you are safe.</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.action, { borderColor: colors.border }]} disabled={saving} onPress={() => void pause(!settings.paused)}><Text style={[styles.actionText, { color: colors.foreground }]}>{settings.paused ? "Resume protection" : "Pause protection"}</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.action, { borderColor: colors.border }]} disabled={saving} onPress={deleteCurrentLocation}><Text style={[styles.actionText, { color: colors.foreground }]}>Delete current location</Text></TouchableOpacity>
              </View>
              <TouchableOpacity disabled={saving} onPress={revoke} style={styles.revoke}><Text style={styles.revokeText}>Turn off and revoke consent</Text></TouchableOpacity>
            </>}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Emergency contacts</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Choose each accepted MWM contact separately. A selected contact may receive only a limited qualifying-emergency notice and a check-in option. They never receive your GPS coordinates, address, route, or live map.</Text>
            {contacts.filter((contact) => contact.eligible).length === 0 ? <Text style={[styles.meta, { color: colors.mutedForeground }]}>Add and accept a trusted contact first. You control each authorization here.</Text> : contacts.filter((contact) => contact.eligible).map((contact) => (
              <View key={contact.trustedShareId} style={[styles.contactRow, { borderTopColor: colors.border }]}>
                <View style={styles.grow}><Text style={[styles.contactName, { color: colors.foreground }]}>{contact.contactName}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{contact.allowedForEmergencyImpact ? "May receive limited emergency-impact notices" : "Not authorized for Safety Location notices"}</Text></View>
                <Switch value={contact.allowedForEmergencyImpact} disabled={!settings?.enabled || settings.paused || saving} onValueChange={(value) => void updateContact(contact, value)} trackColor={{ true: "#CA922B", false: colors.border }} />
              </View>
            ))}
            <TouchableOpacity onPress={() => router.push("/trusted-safety-share" as never)} style={styles.manageLink}><Text style={styles.manageLinkText}>Manage trusted contacts</Text></TouchableOpacity>
          </View>

          <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.noticeTitle, { color: colors.foreground }]}>Your limits and controls</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Pause removes the current stored location. Turning off Safety Location immediately blocks future collection, deletes the current stored location, and removes these contact permissions. Device restart, battery restrictions, poor connectivity, a permission change, or an unavailable app can prevent updates. MWM does not promise continuous protection or guaranteed alerts.</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 }, back: { width: 36, minHeight: 36, justifyContent: "center" }, headerTitle: { fontFamily: "Inter_700Bold", fontSize: 19 }, center: { flex: 1, justifyContent: "center", alignItems: "center" }, content: { padding: 20, gap: 14 }, hero: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 9 }, heroTitle: { fontFamily: "Inter_700Bold", fontSize: 16, lineHeight: 22 }, card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 }, row: { flexDirection: "row", gap: 12, alignItems: "center" }, grow: { flex: 1 }, cardTitle: { fontFamily: "Inter_700Bold", fontSize: 16 }, body: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 }, divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 }, statusTitle: { fontFamily: "Inter_700Bold", fontSize: 14 }, meta: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 }, actions: { gap: 8, marginTop: 2 }, action: { borderWidth: 1, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, alignItems: "center" }, actionText: { fontFamily: "Inter_600SemiBold", fontSize: 13 }, revoke: { paddingVertical: 9, alignItems: "center" }, revokeText: { color: "#B42318", fontFamily: "Inter_700Bold", fontSize: 13 }, contactRow: { paddingTop: 12, marginTop: 2, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 12, alignItems: "center" }, contactName: { fontFamily: "Inter_600SemiBold", fontSize: 14 }, manageLink: { paddingTop: 4 }, manageLinkText: { color: "#8C5A0B", fontFamily: "Inter_700Bold", fontSize: 13 }, notice: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 7 }, noticeTitle: { fontFamily: "Inter_700Bold", fontSize: 14 }, errorText: { color: "#991B1B", fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18 },
});
