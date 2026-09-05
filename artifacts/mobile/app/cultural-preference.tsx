import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { OWNERSHIP_FILTER_OPTIONS, ownershipDesignationFilterId } from "@workspace/constants";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export default function CulturalPreferenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const loadPreference = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/kinfolk/preferences`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { preferences?: { ownershipTypes?: string[] } };
        setSelected(((data.preferences?.ownershipTypes as string[] | undefined) ?? []).map(ownershipDesignationFilterId));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { queueMicrotask(() => { void loadPreference(); }); }, [loadPreference]);

  const toggle = (key: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]);
  };

  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return OWNERSHIP_FILTER_OPTIONS;
    return OWNERSHIP_FILTER_OPTIONS.filter((option) => option.label.toLocaleLowerCase().includes(normalized));
  }, [query]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/kinfolk/preferences`, {
        method: "PUT",
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
        <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Businesses to Support</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: bottomPad + 40 }} showsVerticalScrollIndicator={false}>
          <View style={[s.explainer, { backgroundColor: colors.primary + "0C", borderColor: colors.primary + "25" }]}>
            <Text style={{ fontSize: 28, textAlign: "center" }}>🌍</Text>
            <Text style={[s.explainerTitle, { color: colors.foreground }]}>Choose who you want to support</Text>
            <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
              Select any owner-provided business identities you want surfaced first. The full directory remains available.
            </Text>
            <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
              Owner self-identification is optional; documented verification is shown separately.
            </Text>
          </View>

          <View style={[s.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={17} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search ownership labels"
              placeholderTextColor={colors.mutedForeground}
              style={[s.searchInput, { color: colors.foreground }]}
            />
          </View>

          <View style={s.list}>
            {visibleOptions.map((option) => {
              const isSelected = selected.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[s.identityCard, { backgroundColor: isSelected ? colors.primary + "12" : colors.card, borderColor: isSelected ? colors.primary : colors.border }]}
                  onPress={() => toggle(option.id)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 24 }}>🤎</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.identityLabel, { color: colors.foreground }]}>{option.label}</Text>
                    <Text style={[s.identitySub, { color: colors.mutedForeground }]}>Owner-provided identity; verification is separate</Text>
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
              Select as many as you want. These choices only prioritize matching businesses; they never hide the rest of the directory.
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

          <TouchableOpacity activeOpacity={0.85}
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
  searchRow: { minHeight: 50, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, paddingVertical: 10 },
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
