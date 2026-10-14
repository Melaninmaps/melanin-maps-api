import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/lib/api";

const AUTH_TOKEN_KEY = "auth_session_token";
type Preference = { participationEnabled: boolean; collectionEnabled: boolean };

async function token(): Promise<string | null> { try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); } catch { return null; } }

export function CommunityIntelligencePreferenceRow() {
  const colors = useColors();
  const [preference, setPreference] = useState<Preference | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const auth = await token();
        if (!auth) throw new Error();
        const response = await fetch(`${getApiBase()}/api/kinfolk/community-intelligence/settings`, { headers: { Authorization: `Bearer ${auth}` } });
        if (!response.ok) throw new Error();
        if (active) setPreference(await response.json() as Preference);
      } catch { if (active) setError("Community Intelligence participation is unavailable right now."); }
    })();
    return () => { active = false; };
  }, []);

  const update = async (participationEnabled: boolean) => {
    setSaving(true); setError(null);
    try {
      const auth = await token();
      if (!auth) throw new Error();
      const response = await fetch(`${getApiBase()}/api/kinfolk/community-intelligence/settings`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` }, body: JSON.stringify({ participationEnabled }),
      });
      if (!response.ok) throw new Error();
      setPreference(await response.json() as Preference);
    } catch { setError("Your Community Intelligence choice was not changed."); }
    finally { setSaving(false); }
  };

  const collectionEnabled = preference?.collectionEnabled === true;
  return <View style={styles.wrap} accessibilityLabel="Community Intelligence participation">
    <View style={[styles.icon, { backgroundColor: colors.primary + "15" }]}><Feather name="users" color={colors.primary} size={16} /></View>
    <View style={styles.body}><Text style={[styles.title, { color: colors.foreground }]}>Community Intelligence</Text>
      {preference === null && !error ? <ActivityIndicator size="small" color={colors.primary} style={styles.loading} /> : collectionEnabled ? <Text style={[styles.copy, { color: colors.mutedForeground }]}>Choose whether your structured feedback on planning suggestions can help improve future category ordering. Chat text, private memory, locations, and documents are never included.</Text> : <Text style={[styles.copy, { color: colors.mutedForeground }]}>Community learning is currently off. You can still see planning suggestions; no feedback is collected or used for learning.</Text>}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
    <Switch value={preference?.participationEnabled === true} disabled={!collectionEnabled || saving || preference === null} onValueChange={(value) => void update(value)} trackColor={{ false: colors.border, true: colors.primary + "A0" }} thumbColor={preference?.participationEnabled ? colors.primary : "#f4f4f5"} accessibilityLabel="Participate in Community Intelligence" />
  </View>;
}

const styles = StyleSheet.create({ wrap: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 14 }, icon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" }, body: { flex: 1 }, title: { fontSize: 14, fontFamily: "Inter_600SemiBold" }, copy: { marginTop: 2, fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" }, loading: { alignSelf: "flex-start", marginTop: 8 }, error: { color: "#8A1C12", marginTop: 4, fontSize: 11, lineHeight: 16, fontFamily: "Inter_500Medium" } });
