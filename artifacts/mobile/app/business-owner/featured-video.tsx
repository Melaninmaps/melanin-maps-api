import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
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
import { VIDEO_PURPOSES, detectPlatform, type VideoPurpose } from "@/components/FeaturedVideoCard";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}
async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

const URL_RE = /^https?:\/\/.+\..+/i;
const SUPPORTED = ["YouTube", "TikTok", "Instagram", "Facebook", "Vimeo"];

export default function FeaturedVideoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoPurpose, setVideoPurpose] = useState<VideoPurpose | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const platform = videoUrl.trim() ? detectPlatform(videoUrl.trim()) : null;
  const platformLabel = platform && platform !== "unknown" ? platform.charAt(0).toUpperCase() + platform.slice(1) : null;
  const urlValid = !videoUrl.trim() || (URL_RE.test(videoUrl.trim()) && platform !== "unknown");

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${getApiBase()}/api/businesses/mine`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as {
          business?: {
            id: string;
            featuredVideoUrl?: string | null;
            featuredVideoTitle?: string | null;
            featuredVideoPurpose?: string | null;
          }
        };
        const biz = data.business;
        if (biz) {
          setBusinessId(biz.id);
          setVideoUrl(biz.featuredVideoUrl ?? "");
          setVideoTitle(biz.featuredVideoTitle ?? "");
          setVideoPurpose((biz.featuredVideoPurpose as VideoPurpose) ?? "");
        }
      }
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    if (!businessId) return;
    const url = videoUrl.trim();
    if (url && !urlValid) {
      setError("Please enter a valid YouTube, TikTok, Instagram, Facebook, or Vimeo link.");
      return;
    }
    setError("");
    setSaving(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      const res = await fetch(`${getApiBase()}/api/businesses/${businessId}/featured-video`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          videoUrl: url || null,
          videoTitle: videoTitle.trim() || null,
          videoPurpose: videoPurpose || null,
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to save. Please try again.");
        return;
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Could not connect. Please try again."); }
    finally { setSaving(false); }
  };

  const handleClear = async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      const token = await getToken();
      await fetch(`${getApiBase()}/api/businesses/${businessId}/featured-video`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ videoUrl: null }),
      });
      setVideoUrl(""); setVideoTitle(""); setVideoPurpose("");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }
    finally { setSaving(false); }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>🎥 Featured Video</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Explainer */}
          <View style={[s.explainer, { backgroundColor: colors.primary + "0C", borderColor: colors.primary + "25" }]}>
            <Text style={{ fontSize: 26, textAlign: "center" }}>🎥</Text>
            <Text style={[s.explainerTitle, { color: colors.foreground }]}>See Us in Action</Text>
            <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
              Pin one video that best tells your story. It appears at the top of your business profile. Every tap sends viewers to your channel — growing your audience, not ours.
            </Text>
          </View>

          {/* Supported platforms */}
          <View style={s.platformRow}>
            {SUPPORTED.map(p => (
              <View key={p} style={[s.platformChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.platformChipText, { color: colors.mutedForeground }]}>{p}</Text>
              </View>
            ))}
          </View>

          {/* Video URL */}
          <Text style={[s.label, { color: colors.foreground }]}>Video URL</Text>
          <View style={[s.urlRow, { backgroundColor: colors.card, borderColor: !urlValid && videoUrl ? "#DC2626" : colors.border }]}>
            <Feather name="link" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
            <TextInput
              style={[s.urlInput, { color: colors.foreground }]}
              placeholder="https://youtube.com/watch?v=…"
              placeholderTextColor={colors.mutedForeground}
              value={videoUrl}
              onChangeText={t => { setVideoUrl(t); setError(""); setSaved(false); }}
              autoCapitalize="none"
              keyboardType="url"
              autoCorrect={false}
            />
            {platformLabel && (
              <View style={[s.detectedBadge, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[s.detectedText, { color: colors.primary }]}>{platformLabel}</Text>
              </View>
            )}
          </View>
          {!urlValid && videoUrl ? (
            <Text style={s.urlError}>Only YouTube, TikTok, Instagram, Facebook, and Vimeo links are supported.</Text>
          ) : null}

          {/* Examples */}
          <View style={[s.examplesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.examplesTitle, { color: colors.foreground }]}>Great video ideas:</Text>
            {["Meet the Owner", "Customer Experience", "Restaurant Tour", "Before & After", "Product Demo", "Community Story"].map(ex => (
              <View key={ex} style={s.exampleRow}>
                <Text style={{ color: colors.primary }}>✓</Text>
                <Text style={[s.exampleText, { color: colors.mutedForeground }]}>{ex}</Text>
              </View>
            ))}
          </View>

          {/* Purpose */}
          <Text style={[s.label, { color: colors.foreground }]}>What does this video showcase?</Text>
          <View style={s.purposeGrid}>
            {VIDEO_PURPOSES.map(p => {
              const active = videoPurpose === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.8}
                  style={[s.purposeChip, { backgroundColor: active ? colors.primary + "15" : colors.card, borderColor: active ? colors.primary : colors.border }]}
                  onPress={() => { setVideoPurpose(active ? "" : p.id); setSaved(false); }}
                >
                  <Text style={{ fontSize: 14 }}>{p.emoji}</Text>
                  <Text style={[s.purposeLabel, { color: active ? colors.primary : colors.foreground }]}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {videoPurpose && (
            <View style={[s.badgePreview, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Text style={[s.badgePreviewText, { color: colors.primary }]}>
                🎥 {VIDEO_PURPOSES.find(p => p.id === videoPurpose)?.label}
              </Text>
              <Text style={[s.badgePreviewSub, { color: colors.mutedForeground }]}>This badge will show on your profile</Text>
            </View>
          )}

          {/* Custom title */}
          <Text style={[s.label, { color: colors.foreground }]}>Video Caption (optional)</Text>
          <TextInput
            style={[s.titleInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder='e.g. "Meet Chef Jasmine" or "First-Time Client Transformation"'
            placeholderTextColor={colors.mutedForeground}
            value={videoTitle}
            onChangeText={t => { setVideoTitle(t.slice(0, 150)); setSaved(false); }}
            maxLength={150}
          />
          <Text style={[s.charHint, { color: colors.mutedForeground }]}>{150 - videoTitle.length} characters left</Text>

          {!!error && (
            <View style={s.errorRow}>
              <Feather name="alert-circle" size={13} color="#DC2626" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {saved && (
            <View style={[s.successRow, { backgroundColor: "#D1FAE5", borderColor: "#6EE7B7" }]}>
              <Feather name="check-circle" size={14} color="#065F46" />
              <Text style={[s.successText, { color: "#065F46" }]}>Featured video saved!</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator size="small" color="#FFF" /> : (
              <Text style={s.saveBtnText}>Save Featured Video</Text>
            )}
          </TouchableOpacity>

          {videoUrl ? (
            <TouchableOpacity activeOpacity={0.8} style={s.clearBtn} onPress={handleClear} disabled={saving}>
              <Text style={[s.clearBtnText, { color: colors.mutedForeground }]}>Remove featured video</Text>
            </TouchableOpacity>
          ) : null}
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
  scroll: { padding: 20, gap: 14 },
  explainer: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 8, alignItems: "center" },
  explainerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, textAlign: "center" },
  explainerSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, textAlign: "center" },
  platformRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  platformChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  platformChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  label: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: -6 },
  urlRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  urlInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  detectedBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  detectedText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  urlError: { color: "#DC2626", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: -10 },
  examplesCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  examplesTitle: { fontFamily: "Inter_700Bold", fontSize: 13, marginBottom: 4 },
  exampleRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  exampleText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  purposeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  purposeChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 7 },
  purposeLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  badgePreview: { borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
  badgePreviewText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  badgePreviewSub: { fontFamily: "Inter_400Regular", fontSize: 11 },
  titleInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14 },
  charHint: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "right", marginTop: -10 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { color: "#DC2626", fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  successRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  successText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
  clearBtn: { alignItems: "center", paddingVertical: 10 },
  clearBtnText: { fontFamily: "Inter_400Regular", fontSize: 13, textDecorationLine: "underline" },
});
