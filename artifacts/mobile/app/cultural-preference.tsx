import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

const CULTURAL_IDENTITIES = [
  {
    key: "Black / African American",
    emoji: "🤎",
    sub: "African American, Afro-Caribbean, African diaspora",
  },
  {
    key: "Hispanic / Latino",
    emoji: "🧡",
    sub: "Mexican, Puerto Rican, Cuban, Central & South American",
  },
  {
    key: "Native American / Indigenous",
    emoji: "🌿",
    sub: "First Nations, American Indian, Alaska Native, Hawaiian",
  },
  {
    key: "Middle Eastern / North African",
    emoji: "🌙",
    sub: "Arab, Persian, Turkish, North African",
  },
  {
    key: "Multiracial",
    emoji: "🌈",
    sub: "Two or more racial identities",
  },
];

export default function CulturalPreferenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const loadPreference = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/kinfolk/preferences`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { preferences?: { preferredOwnershipTypes?: string[] } };
        setSelected((data.preferences?.preferredOwnershipTypes as string[] | undefined) ?? []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadPreference(); }, [loadPreference]);

  const toggle = (key: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/kinfolk/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ preferredOwnershipTypes: selected }),
      });
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Community Preference</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 40 }} showsVerticalScrollIndicator={false}>
          <View style={[s.explainer, { backgroundColor: colors.primary + "0C", borderColor: colors.primary + "25" }]}>
            <Text style={{ fontSize: 28, textAlign: "center" }}>🌍</Text>
            <Text style={[s.explainerTitle, { color: colors.foreground }]}>Your Community, Your Feed</Text>
            <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
              Mapping With Melanin celebrates all minority communities. Setting your preference helps us surface businesses and groups most relevant to your community — first.
            </Text>
            <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
              When no match is found nearby, we'll show you the highest-rated minority-owned alternatives.
            </Text>
          </View>

          <View style={s.list}>
            {CULTURAL_IDENTITIES.map((ci) => {
              const isSelected = selected.includes(ci.key);
              return (
                <TouchableOpacity
                  key={ci.key}
                  style={[s.identityCard, { backgroundColor: isSelected ? colors.primary + "12" : colors.card, borderColor: isSelected ? colors.primary : colors.border }]}
                  onPress={() => toggle(ci.key)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 28 }}>{ci.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.identityLabel, { color: colors.foreground }]}>{ci.key}</Text>
                    <Text style={[s.identitySub, { color: colors.mutedForeground }]}>{ci.sub}</Text>
                  </View>
                  <View style={[s.checkCircle, { backgroundColor: isSelected ? colors.primary : "transparent", borderColor: isSelected ? colors.primary : colors.border }]}>
                    {isSelected && <Feather name="check" size={14} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[s.noteCard, { backgroundColor: "#2D7A4F0C", borderColor: "#2D7A4F25" }]}>
            <Feather name="info" size={15} color="#2D7A4F" />
            <Text style={[s.noteText, { color: "#2D7A4F" }]}>
              You can select multiple identities. This preference only affects how results are sorted — it never excludes any minority-owned business from view.
            </Text>
          </View>

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: colors.primary, marginHorizontal: 20 }]}
            onPress={() => void handleSave()}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator size="small" color="#FFF" /> : (
              <Text style={s.saveBtnText}>Save Preference</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ alignItems: "center", paddingVertical: 14 }}
            onPress={() => { setSelected([]); }}
          >
            <Text style={[{ fontFamily: "Inter_400Regular", fontSize: 14 }, { color: colors.mutedForeground }]}>
              Clear preference (show all equally)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 17 },
  explainer: { margin: 16, borderRadius: 20, borderWidth: 1, padding: 20, gap: 10, alignItems: "center" },
  explainerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  explainerSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 21, textAlign: "center" },
  list: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  identityCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, borderWidth: 1.5, padding: 14 },
  identityLabel: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 3 },
  identitySub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  noteCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 16 },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, flex: 1 },
  saveBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
});
