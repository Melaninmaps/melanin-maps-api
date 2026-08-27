import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import { useColors } from "../hooks/useColors";
import { RATING_META, type AudienceRating } from "../components/AudienceRatingBadge";

function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

interface FamilySettings {
  allowEveryone: boolean;
  allowTeen: boolean;
  allowYoungAdult: boolean;
  allowAdult: boolean;
  familyModeEnabled: boolean;
}

const RATING_ORDER: AudienceRating[] = ["everyone", "teen", "young_adult", "adult"];

const RATING_EXAMPLES: Record<AudienceRating, string[]> = {
  everyone: ["Travel", "Restaurants", "Museums", "Parks", "Community events", "Business stories"],
  teen: ["College prep", "Career advice", "Dating safety", "Social issues", "Mental wellness"],
  young_adult: ["Workplace discrimination", "Police encounters", "Financial literacy", "Housing issues"],
  adult: ["Explicit discrimination", "Violence", "Legal issues", "Sexual health", "Graphic crime"],
};

export default function FamilySettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [settings, setSettings] = useState<FamilySettings>({
    allowEveryone: true,
    allowTeen: true,
    allowYoungAdult: true,
    allowAdult: true,
    familyModeEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) { setLoading(false); return; }
      const res = await fetch(`${getApiBase()}/api/family/guidance-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { settings: FamilySettings };
        setSettings(data.settings);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => { void fetchSettings(); }); }, [fetchSettings]);

  const save = async (next: FamilySettings) => {
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) return;
      await fetch(`${getApiBase()}/api/family/guidance-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(next),
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert("Error", "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof FamilySettings) => {
    if (key === "allowEveryone") return;
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      void save(next);
      return next;
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
        keyboardDismissMode="on-drag" style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.foreground }]}>Community Guidance</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Choose which content tiers are visible. These settings help you guide the experience for younger family members — not a content block.
      </Text>

      {/* Family Mode toggle */}
      <View style={[styles.familyModeCard, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B40" }]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.familyModeTitle, { color: "#92400E" }]}>🤎 Family Mode</Text>
            <Text style={[styles.familyModeDesc, { color: "#78350F" }]}>
              Curated content for families — travel, culture, history, STEM, and youth opportunities. Perfect for browsing together.
            </Text>
          </View>
          <Switch
            value={settings.familyModeEnabled}
            onValueChange={() => toggle("familyModeEnabled")}
            trackColor={{ true: "#F59E0B", false: colors.muted }}
            thumbColor="#fff"
          />
        </View>
        {settings.familyModeEnabled && (
          <TouchableOpacity
            style={[styles.familyModeBtn, { backgroundColor: "#F59E0B" }]}
            onPress={() => router.push("/family-mode")}
            activeOpacity={0.85}
          >
            <Text style={styles.familyModeBtnText}>Open Family Mode →</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONTENT TIERS</Text>

      {RATING_ORDER.map((rating) => {
        const meta = RATING_META[rating];
        const key = `allow${rating === "everyone" ? "Everyone" : rating === "teen" ? "Teen" : rating === "young_adult" ? "YoungAdult" : "Adult"}` as keyof FamilySettings;
        const isOn = settings[key] as boolean;
        const isRequired = rating === "everyone";

        return (
          <View key={rating} style={[styles.tierCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.tierHeader}>
              <View style={[styles.tierBadge, { backgroundColor: meta.bg, borderColor: meta.color + "40" }]}>
                <Text style={styles.tierEmoji}>{meta.emoji}</Text>
                <Text style={[styles.tierLabel, { color: meta.color }]}>{meta.label}</Text>
              </View>
              {isRequired ? (
                <View style={[styles.requiredTag, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.requiredText, { color: colors.mutedForeground }]}>Always on</Text>
                </View>
              ) : (
                <Switch
                  value={isOn}
                  onValueChange={() => toggle(key)}
                  trackColor={{ true: meta.color, false: colors.muted }}
                  thumbColor="#fff"
                />
              )}
            </View>
            <Text style={[styles.tierDesc, { color: colors.mutedForeground }]}>{meta.description}</Text>
            <View style={styles.exampleRow}>
              {RATING_EXAMPLES[rating].slice(0, 3).map((ex) => (
                <View key={ex} style={[styles.exTag, { backgroundColor: meta.bg, borderColor: meta.color + "30" }]}>
                  <Text style={[styles.exText, { color: meta.color }]}>{ex}</Text>
                </View>
              ))}
            </View>
            {!isOn && !isRequired && (
              <View style={[styles.hiddenBanner, { backgroundColor: colors.secondary }]}>
                <Feather name="eye-off" size={12} color={colors.mutedForeground} />
                <Text style={[styles.hiddenText, { color: colors.mutedForeground }]}>
                  {meta.label} content is hidden from this account
                </Text>
              </View>
            )}
          </View>
        );
      })}

      <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Community Guidance is informative, not restrictive. Content creators choose their audience rating, and moderators can adjust it. Each rating shows a reason so you always understand the context.
        </Text>
      </View>

      {saving && (
        <View style={styles.savingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.savingText, { color: colors.mutedForeground }]}>Saving…</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 20, paddingBottom: 60 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 8 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  familyModeCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24,
  },
  familyModeTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 4 },
  familyModeDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  familyModeBtn: {
    marginTop: 12, borderRadius: 10, paddingVertical: 10, alignItems: "center",
  },
  familyModeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, marginBottom: 12 },
  tierCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  tierHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  tierBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  tierEmoji: { fontSize: 14 },
  tierLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  tierDesc: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 10 },
  exampleRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  exTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  exText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  requiredTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  requiredText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  hiddenBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 10, padding: 8, borderRadius: 8,
  },
  hiddenText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  infoBox: {
    flexDirection: "row", gap: 10, padding: 14, borderRadius: 12,
    borderWidth: 1, marginTop: 8,
  },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, flex: 1 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  savingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, justifyContent: "center" },
  savingText: { fontFamily: "Inter_400Regular", fontSize: 13 },
});
