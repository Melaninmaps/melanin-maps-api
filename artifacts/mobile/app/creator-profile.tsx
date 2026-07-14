import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

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

const CREATOR_CATEGORIES = [
  "Travel", "Food & Dining", "Natural Hair", "Beauty & Style",
  "Real Estate", "Relocation", "Health & Wellness", "Fitness",
  "Finance", "Business", "Entertainment", "Community & Culture",
  "Education", "Parenting & Family", "Sports", "Spirituality",
];

const PLATFORMS = [
  { key: "tiktok", label: "TikTok", icon: "♪", placeholder: "https://tiktok.com/@yourhandle" },
  { key: "instagram", label: "Instagram", icon: "◈", placeholder: "https://instagram.com/yourhandle" },
  { key: "youtube", label: "YouTube", icon: "▶", placeholder: "https://youtube.com/@yourchannel" },
  { key: "facebook", label: "Facebook", icon: "f", placeholder: "https://facebook.com/yourpage" },
  { key: "pinterest", label: "Pinterest", icon: "📌", placeholder: "https://pinterest.com/yourprofile" },
  { key: "twitter", label: "X / Twitter", icon: "𝕏", placeholder: "https://x.com/yourhandle" },
];

interface CreatorProfileData {
  bio: string;
  categories: string[];
  platforms: { platform: string; handle: string; url: string }[];
  primaryPlatform: string;
  city: string;
  state: string;
  isPublic: boolean;
}

const EMPTY: CreatorProfileData = {
  bio: "", categories: [], platforms: [], primaryPlatform: "",
  city: "", state: "", isPublic: true,
};

export default function CreatorProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreatorProfileData>(EMPTY);
  const [platformUrls, setPlatformUrls] = useState<Record<string, string>>({});
  const [exists, setExists] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/creator-profile/me`, { headers });
      if (res.ok) {
        const data = await res.json() as { profile: CreatorProfileData | null };
        if (data.profile) {
          setForm(data.profile);
          setExists(true);
          const urlMap: Record<string, string> = {};
          data.profile.platforms.forEach((p) => { urlMap[p.platform] = p.url; });
          setPlatformUrls(urlMap);
        }
      }
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleSave = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const platforms = Object.entries(platformUrls)
        .filter(([, url]) => url.trim())
        .map(([platform, url]) => ({ platform, handle: url.trim(), url: url.trim() }));

      const body: CreatorProfileData = {
        ...form,
        platforms,
        primaryPlatform: platforms.some((p) => p.platform === form.primaryPlatform)
          ? form.primaryPlatform
          : (platforms[0]?.platform ?? ""),
      };

      const res = await fetch(`${getApiBase()}/api/creator-profile/me`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      setExists(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", "Your creator profile has been updated.");
    } catch {
      Alert.alert("Error", "Could not save. Please try again.");
    } finally { setSaving(false); }
  };

  if (!isAuthenticated) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Creator Profile</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={s.center}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🎥</Text>
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>Sign in required</Text>
          <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Log in to set up your creator profile.</Text>
          <TouchableOpacity activeOpacity={0.85} style={[s.saveBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/login" as never)}>
            <Text style={s.saveBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Creator Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={[s.scroll, { paddingBottom: bottomPad + 60 }]} showsVerticalScrollIndicator={false}>

          {/* Philosophy banner */}
          <View style={[s.banner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <Text style={{ fontSize: 22, marginBottom: 8 }}>🗺️</Text>
            <Text style={[s.bannerTitle, { color: colors.foreground }]}>Support at the Source</Text>
            <Text style={[s.bannerBody, { color: colors.mutedForeground }]}>
              Mapping With Melanin™ doesn't compete with your platforms — we send people{" "}
              <Text style={{ fontFamily: "Inter_700Bold", color: colors.primary }}>to</Text> them.
              Connect your channels so the community can discover your content alongside local businesses.
            </Text>
          </View>

          {/* Bio */}
          <View style={[s.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.groupLabel, { color: colors.foreground }]}>Creator Bio</Text>
            <TextInput
              style={[s.bioInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Tell the community what you create and why it matters…"
              placeholderTextColor={colors.mutedForeground}
              value={form.bio}
              onChangeText={(t) => setForm((p) => ({ ...p, bio: t }))}
              multiline
              maxLength={300}
            />
            <Text style={[s.charCount, { color: colors.mutedForeground }]}>{form.bio.length}/300</Text>
          </View>

          {/* Location */}
          <View style={[s.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.groupLabel, { color: colors.foreground }]}>Your City</Text>
            <Text style={[s.groupHelper, { color: colors.mutedForeground }]}>Shown when people browse creators by city</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={[s.textInput, { flex: 1.5, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Atlanta"
                placeholderTextColor={colors.mutedForeground}
                value={form.city}
                onChangeText={(t) => setForm((p) => ({ ...p, city: t }))}
              />
              <TextInput
                style={[s.textInput, { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="GA"
                placeholderTextColor={colors.mutedForeground}
                value={form.state}
                onChangeText={(t) => setForm((p) => ({ ...p, state: t.toUpperCase() }))}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Categories */}
          <View style={[s.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.groupLabel, { color: colors.foreground }]}>Content Categories</Text>
            <Text style={[s.groupHelper, { color: colors.mutedForeground }]}>Select all that apply — used to match you with relevant community searches</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {CREATOR_CATEGORIES.map((cat) => {
                const active = form.categories.includes(cat);
                return (
                  <TouchableOpacity activeOpacity={0.85}
                    key={cat}
                    style={[s.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "15" : colors.background }]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <Text style={[s.chipText, { color: active ? colors.primary : colors.mutedForeground, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular" }]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Platform URLs */}
          <View style={[s.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.groupLabel, { color: colors.foreground }]}>Your Channels</Text>
            <Text style={[s.groupHelper, { color: colors.mutedForeground }]}>Add the platforms where you create — we'll link people directly to your content</Text>
            {PLATFORMS.map(({ key, label, icon, placeholder }) => (
              <View key={key} style={[s.socialRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <View style={[s.socialIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={{ fontSize: 13, color: colors.primary, fontFamily: "Inter_700Bold" }}>{icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", marginBottom: 2 }}>{label}</Text>
                  <TextInput
                    style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground, padding: 0 }}
                    placeholder={placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={platformUrls[key] ?? ""}
                    onChangeText={(t) => setPlatformUrls((prev) => ({ ...prev, [key]: t }))}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {platformUrls[key] ? (
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setPlatformUrls((prev) => ({ ...prev, [key]: "" }))}>
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}

            {Object.values(platformUrls).some((u) => u.trim()) && (
              <View style={{ marginTop: 14 }}>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground, marginBottom: 4 }}>Primary Platform ⭐</Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginBottom: 8 }}>
                  Highlighted first when people view your creator profile
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {PLATFORMS.filter((p) => platformUrls[p.key]?.trim()).map((p) => {
                    const active = form.primaryPlatform === p.key;
                    return (
                      <TouchableOpacity activeOpacity={0.85}
                        key={p.key}
                        style={[s.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "15" : colors.background }]}
                        onPress={() => setForm((prev) => ({ ...prev, primaryPlatform: active ? "" : p.key }))}
                      >
                        <Text style={[s.chipText, { color: active ? colors.primary : colors.mutedForeground, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular" }]}>
                          {active ? "⭐ " : ""}{p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Visibility */}
          <View style={[s.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[s.groupLabel, { color: colors.foreground }]}>Public Profile</Text>
                <Text style={[s.groupHelper, { color: colors.mutedForeground }]}>Allow the community to discover your creator profile</Text>
              </View>
              <Switch
                value={form.isPublic}
                onValueChange={(v) => setForm((p) => ({ ...p, isPublic: v }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: saving ? colors.mutedForeground : colors.primary }]}
            onPress={() => void handleSave()}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={s.saveBtnText}>{exists ? "Save Changes" : "Create Creator Profile"}</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 17 },
  scroll: { padding: 16, gap: 16 },
  banner: { borderRadius: 20, borderWidth: 1, padding: 20, alignItems: "center", marginBottom: 4 },
  bannerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center", marginBottom: 8 },
  bannerBody: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: "center" },
  group: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  groupLabel: { fontFamily: "Inter_700Bold", fontSize: 15 },
  groupHelper: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  bioInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontFamily: "Inter_400Regular", fontSize: 14, minHeight: 90, textAlignVertical: "top" },
  charCount: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "right" },
  textInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  socialRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 6 },
  socialIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 6, textAlign: "center" },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginBottom: 24 },
  saveBtn: { marginTop: 8, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
});
