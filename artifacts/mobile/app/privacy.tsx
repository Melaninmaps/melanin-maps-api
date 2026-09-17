import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getAuthToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}

type ProfileVisibility = "public" | "private";
type PrivacySettings = { profileVisibility: ProfileVisibility; allowDm: boolean };
const DEFAULTS: PrivacySettings = { profileVisibility: "public", allowDm: true };

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const token = await getAuthToken();
        const base = getApiBase();
        if (!token || !base) return;
        const res = await fetch(`${base}/api/users/me/privacy`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok && active) setSettings({ ...DEFAULTS, ...(await res.json() as Partial<PrivacySettings>) });
      } catch {
        // Preserve safe defaults until the member can retry while connected.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const update = async (patch: Partial<PrivacySettings>) => {
    if (saving) return;
    const next = { ...settings, ...patch };
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    setSaving(true);
    try {
      const token = await getAuthToken();
      const base = getApiBase();
      if (!token || !base) throw new Error("Sign in and reconnect before changing a privacy setting.");
      const res = await fetch(`${base}/api/users/me/privacy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isPrivate: next.profileVisibility === "private", allowDm: next.allowDm }),
      });
      if (!res.ok) throw new Error("The privacy setting could not be saved.");
      setSettings(next);
    } catch (error) {
      Alert.alert("Could not save", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Header colors={colors} topPad={topPad} onBack={() => router.canGoBack() ? router.back() : router.replace("/settings")} />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header colors={colors} topPad={topPad} onBack={() => router.canGoBack() ? router.back() : router.replace("/settings")} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PROFILE VISIBILITY</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.descRow}>
            <Feather name="eye" size={18} color={colors.primary} />
            <Text style={[styles.descTxt, { color: colors.mutedForeground }]}>Choose whether other members can view your profile and activity.</Text>
          </View>
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          {(["public", "private"] as ProfileVisibility[]).map((visibility) => (
            <TouchableOpacity key={visibility} style={styles.visRow} onPress={() => void update({ profileVisibility: visibility })} disabled={saving} activeOpacity={0.75}>
              <View style={styles.visLeft}>
                <View style={[styles.radio, { borderColor: settings.profileVisibility === visibility ? colors.primary : colors.border }]}>
                  {settings.profileVisibility === visibility && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                </View>
                <View>
                  <Text style={[styles.visLabel, { color: colors.foreground }]}>{visibility === "public" ? "Public" : "Private"}</Text>
                  <Text style={[styles.visSub, { color: colors.mutedForeground }]}>{visibility === "public" ? "Members can view your profile" : "Only approved followers can view profile activity"}</Text>
                </View>
              </View>
              {settings.profileVisibility === visibility && <Feather name="check" size={16} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>MESSAGES</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}><Feather name="message-circle" size={16} color={colors.primary} /></View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Allow Direct Messages</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Let other members send you a message request.</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={() => void update({ allowDm: !settings.allowDm })} disabled={saving} accessibilityRole="switch" accessibilityState={{ checked: settings.allowDm }}>
              <View style={[styles.switchTrack, { backgroundColor: settings.allowDm ? colors.primary : colors.border }]}><View style={[styles.switchThumb, { transform: [{ translateX: settings.allowDm ? 20 : 2 }] }]} /></View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>LOCATION</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.descRow}>
            <Feather name="map-pin" size={18} color={colors.primary} />
            <Text style={[styles.descTxt, { color: colors.mutedForeground }]}>Mapping With Melanin asks for precise location only when you tap a nearby discovery or Safety action. You can change device permission anytime in system settings.</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>KINFOLKAI™</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.toggleRow} onPress={() => router.push("/kinfolk-settings" as never)} activeOpacity={0.75}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}><Feather name="zap" size={16} color={colors.primary} /></View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>KinfolkAI™ Settings</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Control AI memory, personalisation, and data.</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.border} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ colors, topPad, onBack }: { colors: ReturnType<typeof useColors>; topPad: number; onBack: () => void }) {
  return <View style={[styles.header, { paddingTop: topPad + 12 }]}>
    <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={onBack}><Feather name="arrow-left" size={22} color={colors.foreground} /></TouchableOpacity>
    <Text style={[styles.title, { color: colors.foreground }]}>Privacy & Safety</Text>
    <View style={{ width: 40 }} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 }, back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" }, title: { fontSize: 18, fontFamily: "Inter_700Bold" }, center: { flex: 1, alignItems: "center", justifyContent: "center" }, scroll: { paddingHorizontal: 20 }, sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 }, card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 24 }, descRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 }, descTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 }, sep: { height: 1 }, visRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }, visLeft: { flexDirection: "row", alignItems: "center", gap: 12 }, radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" }, radioDot: { width: 10, height: 10, borderRadius: 5 }, visLabel: { fontSize: 15, fontFamily: "Inter_500Medium" }, visSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 }, toggleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }, rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" }, rowContent: { flex: 1 }, rowLabel: { fontSize: 15, fontFamily: "Inter_400Regular" }, rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 }, switchTrack: { width: 44, height: 26, borderRadius: 13, justifyContent: "center" }, switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFF", position: "absolute", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
});
