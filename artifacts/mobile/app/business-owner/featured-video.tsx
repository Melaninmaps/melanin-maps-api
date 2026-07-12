import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
    if ((Platform.OS as string) === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

const URL_RE = /^https?:\/\/.+\..+/i;
const SUPPORTED = ["YouTube", "TikTok", "Instagram", "Facebook", "Vimeo"];

function isHostedUrl(url: string): boolean {
  return url.includes("storage.googleapis.com");
}

export default function FeaturedVideoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = (Platform.OS as string) === "web" ? 67 : insets.top;

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "link">("upload");

  // Hosted upload state
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // External link state
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
          const url = biz.featuredVideoUrl ?? "";
          if (url && isHostedUrl(url)) {
            setHostedUrl(url);
            setMode("upload");
          } else {
            setVideoUrl(url);
            setMode(url ? "link" : "upload");
          }
          setVideoTitle(biz.featuredVideoTitle ?? "");
          setVideoPurpose((biz.featuredVideoPurpose as VideoPurpose) ?? "");
        }
      }
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Upload hosted video ──────────────────────────────────────────────────────
  const handleUpload = async () => {
    if ((Platform.OS as string) === "web") {
      Alert.alert("Not supported", "Video upload is available on the mobile app.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your media library to upload a video.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
      videoMaxDuration: 300, // 5 min max
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("video", { uri: asset.uri, type: asset.mimeType ?? "video/mp4", name: "featured.mp4" } as unknown as Blob);
      const res = await fetch(`${getApiBase()}/api/businesses/mine/featured-video/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const e = await res.json() as { error?: string };
        throw new Error(e.error ?? "Upload failed");
      }
      const data = await res.json() as { featuredVideoUrl: string };
      setHostedUrl(data.featuredVideoUrl);
      if ((Platform.OS as string) !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Video uploaded!", "Your community introduction video is live on your listing.");
    } catch (err) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally { setUploading(false); }
  };

  const handleDeleteHosted = () => {
    Alert.alert("Remove video?", "This will remove your hosted community introduction video.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          try {
            const token = await getToken();
            await fetch(`${getApiBase()}/api/businesses/mine/featured-video/hosted`, {
              method: "DELETE",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setHostedUrl(null);
          } catch { Alert.alert("Error", "Failed to remove video."); }
        }
      },
    ]);
  };

  // ── Save external link ───────────────────────────────────────────────────────
  const handleSaveLink = async () => {
    if (!businessId) return;
    const url = videoUrl.trim();
    if (url && !urlValid) {
      setError("Please enter a valid YouTube, TikTok, Instagram, Facebook, or Vimeo link.");
      return;
    }
    setError("");
    setSaving(true);
    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      if ((Platform.OS as string) !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Could not connect. Please try again."); }
    finally { setSaving(false); }
  };

  const handleClearLink = async () => {
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
      if ((Platform.OS as string) !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }
    finally { setSaving(false); }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Featured Video</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Mode tabs */}
          <View style={[s.tabRow, { backgroundColor: colors.secondary }]}>
            {(["upload", "link"] as const).map(m => (
              <TouchableOpacity
                key={m}
                activeOpacity={0.8}
                style={[s.tab, mode === m && { backgroundColor: colors.primary }]}
                onPress={() => { setMode(m); setError(""); setSaved(false); }}
              >
                <Feather
                  name={m === "upload" ? "upload" : "link"}
                  size={13}
                  color={mode === m ? "#FFF" : colors.mutedForeground}
                />
                <Text style={[s.tabText, { color: mode === m ? "#FFF" : colors.mutedForeground }]}>
                  {m === "upload" ? "Upload to Platform" : "Link to Social"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === "upload" ? (
            <>
              {/* Upload explainer */}
              <View style={[s.explainer, { backgroundColor: colors.primary + "0C", borderColor: colors.primary + "25" }]}>
                <Text style={{ fontSize: 26, textAlign: "center" }}>🏠</Text>
                <Text style={[s.explainerTitle, { color: colors.foreground }]}>Community Introduction</Text>
                <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
                  Upload a video directly to the platform — no YouTube, no public feed. Speak directly to our community in a space that's built for you.
                </Text>
              </View>

              <View style={[s.bulletCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {[
                  "Hosted privately — only visible inside Mapping With Melanin",
                  "Great for personal introductions you wouldn't post publicly",
                  "Up to 5 minutes, any common video format",
                  "Plays inline on your business listing",
                ].map(b => (
                  <View key={b} style={s.bulletRow}>
                    <Feather name="check" size={13} color={colors.primary} />
                    <Text style={[s.bulletText, { color: colors.mutedForeground }]}>{b}</Text>
                  </View>
                ))}
              </View>

              {hostedUrl ? (
                <View style={[s.hostedCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
                  <View style={s.hostedRow}>
                    <View style={[s.playIcon, { backgroundColor: colors.primary + "18" }]}>
                      <Feather name="play-circle" size={26} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.hostedLabel, { color: colors.foreground }]}>Video uploaded</Text>
                      <Text style={[s.hostedSub, { color: colors.mutedForeground }]}>Hosted on Mapping With Melanin</Text>
                    </View>
                    <View style={[s.liveBadge, { backgroundColor: "#D1FAE5", borderColor: "#6EE7B7" }]}>
                      <Text style={{ color: "#065F46", fontSize: 10, fontFamily: "Inter_700Bold" }}>Live</Text>
                    </View>
                  </View>
                  <TouchableOpacity activeOpacity={0.8} style={s.removeBtn} onPress={handleDeleteHosted}>
                    <Text style={s.removeBtnText}>Remove video</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[s.uploadBtn, { backgroundColor: colors.primary }]}
                  onPress={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <ActivityIndicator size="small" color="#FFF" />
                      <Text style={s.uploadBtnText}>Uploading…</Text>
                    </>
                  ) : (
                    <>
                      <Feather name="upload" size={18} color="#FFF" />
                      <Text style={s.uploadBtnText}>Choose Video from Library</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Shared title + purpose fields */}
              <Text style={[s.label, { color: colors.foreground }]}>Video Caption (optional)</Text>
              <TextInput
                style={[s.titleInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder='e.g. "Meet the Owner" or "Why We Do This"'
                placeholderTextColor={colors.mutedForeground}
                value={videoTitle}
                onChangeText={t => { setVideoTitle(t.slice(0, 150)); setSaved(false); }}
                maxLength={150}
              />
              <Text style={[s.charHint, { color: colors.mutedForeground }]}>{150 - videoTitle.length} characters left</Text>

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

              {hostedUrl && (
                <TouchableOpacity
                  style={[s.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveLink}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? <ActivityIndicator size="small" color="#FFF" /> : (
                    <Text style={s.saveBtnText}>Save Caption & Purpose</Text>
                  )}
                </TouchableOpacity>
              )}

              {saved && (
                <View style={[s.successRow, { backgroundColor: "#D1FAE5", borderColor: "#6EE7B7" }]}>
                  <Feather name="check-circle" size={14} color="#065F46" />
                  <Text style={[s.successText, { color: "#065F46" }]}>Saved!</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Link explainer */}
              <View style={[s.explainer, { backgroundColor: colors.primary + "0C", borderColor: colors.primary + "25" }]}>
                <Text style={{ fontSize: 26, textAlign: "center" }}>🎥</Text>
                <Text style={[s.explainerTitle, { color: colors.foreground }]}>Link to Social</Text>
                <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
                  Pin one video from YouTube, TikTok, Instagram, Facebook, or Vimeo. Every tap sends viewers to your channel — growing your audience, not ours.
                </Text>
              </View>

              <View style={s.platformRow}>
                {SUPPORTED.map(p => (
                  <View key={p} style={[s.platformChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.platformChipText, { color: colors.mutedForeground }]}>{p}</Text>
                  </View>
                ))}
              </View>

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
                onPress={handleSaveLink}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator size="small" color="#FFF" /> : (
                  <Text style={s.saveBtnText}>Save Featured Video</Text>
                )}
              </TouchableOpacity>

              {videoUrl ? (
                <TouchableOpacity activeOpacity={0.8} style={s.clearBtn} onPress={handleClearLink} disabled={saving}>
                  <Text style={[s.clearBtnText, { color: colors.mutedForeground }]}>Remove featured video</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
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
  tabRow: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 9 },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  explainer: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 8, alignItems: "center" },
  explainerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, textAlign: "center" },
  explainerSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, textAlign: "center" },
  bulletCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  bulletRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bulletText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 19 },
  hostedCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 10 },
  hostedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  playIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  hostedLabel: { fontFamily: "Inter_700Bold", fontSize: 14 },
  hostedSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  liveBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  removeBtn: { alignItems: "center", paddingVertical: 6 },
  removeBtnText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#DC2626", textDecorationLine: "underline" },
  uploadBtn: { borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  uploadBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
  platformRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  platformChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  platformChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  label: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: -6 },
  urlRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  urlInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  detectedBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  detectedText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  urlError: { color: "#DC2626", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: -10 },
  purposeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  purposeChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 7 },
  purposeLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
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
