import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
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
import {
  SOCIAL_VIDEO_PLATFORM_OPTIONS,
  SOCIAL_VIDEO_PLATFORMS,
  type SocialVideoPlatform,
} from "@workspace/constants";
import { useColors } from "@/hooks/useColors";
import { cacheSocialVideoPreferences } from "@/hooks/useSocialVideoPreferences";

function apiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

export default function SocialVideoPreferencesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<SocialVideoPlatform[]>([...SOCIAL_VIDEO_PLATFORMS]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const token = Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token");
        const response = await fetch(`${apiBase()}/api/users/me/content-preferences`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const body = await response.json() as { socialVideoPlatforms?: SocialVideoPlatform[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Could not load choices.");
        if (active && Array.isArray(body.socialVideoPlatforms)) setSelected(body.socialVideoPlatforms);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Could not load choices.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  function toggle(platform: SocialVideoPlatform) {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    setMessage("");
    setSelected((current) => current.includes(platform)
      ? current.filter((item) => item !== platform)
      : [...current, platform]);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const token = Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token");
      const response = await fetch(`${apiBase()}/api/users/me/content-preferences`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ socialVideoPlatforms: selected }),
      });
      const body = await response.json() as { socialVideoPlatforms?: SocialVideoPlatform[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save choices.");
      const saved = body.socialVideoPlatforms ?? selected;
      setSelected(saved);
      await cacheSocialVideoPreferences(saved);
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessage(saved.length === 0
        ? "Social-provider videos are hidden. MWM-uploaded videos and photos still appear."
        : "Saved across the app and website.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save choices.");
    } finally {
      setSaving(false);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/settings")} style={styles.back}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Video Sources</Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={[styles.heading, { color: colors.foreground }]}>Videos you want to see</Text>
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>Tell us which platforms you use. Reviews and photos stay visible; only social-provider videos from deselected platforms are hidden.</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.list}>
            {SOCIAL_VIDEO_PLATFORM_OPTIONS.map((option) => {
              const active = selected.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={0.75}
                  onPress={() => toggle(option.id)}
                  style={[styles.option, { backgroundColor: colors.card, borderColor: active ? colors.primary : colors.border }]}
                >
                  <View style={[styles.check, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}>
                    {active ? <Feather name="check" size={15} color="#FFFFFF" /> : null}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, { color: colors.foreground }]}>{option.label}</Text>
                    <Text style={[styles.optionSub, { color: colors.mutedForeground }]}>{option.helperText}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={loading || saving}
          onPress={() => void save()}
          style={[styles.save, { backgroundColor: colors.primary, opacity: loading || saving ? 0.55 : 1 }]}
        >
          {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Feather name="save" size={17} color="#FFFFFF" />}
          <Text style={styles.saveText}>{saving ? "Saving…" : "Save video choices"}</Text>
        </TouchableOpacity>
        {message ? <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.foreground }]}>{message}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 40, height: 40, justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { padding: 20 },
  heading: { fontSize: 24, fontFamily: "PlayfairDisplay_700Bold", marginBottom: 8 },
  intro: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginBottom: 20 },
  loader: { marginVertical: 32 },
  list: { gap: 10 },
  option: { minHeight: 68, borderWidth: 1, borderRadius: 15, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  optionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  save: { minHeight: 50, borderRadius: 25, marginTop: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveText: { color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_700Bold" },
  message: { marginTop: 14, textAlign: "center", fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
});
