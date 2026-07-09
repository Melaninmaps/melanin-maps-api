import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";

const AUTH_TOKEN_KEY = "auth_session_token";
async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    const { getItemAsync } = await import("expo-secure-store");
    return await getItemAsync(AUTH_TOKEN_KEY);
  } catch { return null; }
}
function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}
import {
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
import { useAuth } from "@/lib/auth";

const EMOJIS = ["📍", "☕", "🍽️", "📚", "💅🏾", "🛍️", "✈️", "👨🏾‍👩🏾‍👧🏾", "🌙", "🎷", "💼", "🏪", "🤎", "🌿", "🎁", "🏋🏾", "🎭", "🌸"];
const CATEGORIES = ["Food", "Culture", "Travel", "Family", "Wellness", "Shopping", "Nightlife", "Professional"];

export default function CreateListScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [emoji, setEmoji] = useState("📍");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const handlePublish = async () => {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    if (!title.trim()) { Alert.alert("Add a title", "Your list needs a name."); return; }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const token = await getToken();
      const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/lists`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, category: category || null, coverEmoji: emoji, isPublic }),
      });
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("List created! 🎉", `"${title.trim()}" is now ${isPublic ? "live in the community" : "saved privately"}.`, [
          { text: "View Lists", onPress: () => router.replace("/community-lists" as never) },
        ]);
      } else {
        throw new Error("Failed");
      }
    } catch {
      Alert.alert("Oops", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const canPublish = title.trim().length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/community-lists" as never)}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Create a List</Text>
        <TouchableOpacity activeOpacity={0.85}
          style={[styles.publishBtn, { backgroundColor: canPublish ? colors.primary : colors.muted }]}
          onPress={handlePublish}
          disabled={!canPublish || saving}
        >
          <Text style={[styles.publishTxt, { color: canPublish ? "#FFF" : colors.mutedForeground }]}>
            {saving ? "Saving…" : "Publish"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Live Preview */}
        <View style={[styles.previewCard, { backgroundColor: "#CA922B" }]}>
          <Text style={styles.previewEmoji}>{emoji}</Text>
          <Text style={styles.previewTitle} numberOfLines={2}>{title.trim() || "Your list title…"}</Text>
          {description.trim() ? <Text style={styles.previewDesc} numberOfLines={2}>{description.trim()}</Text> : null}
          <View style={styles.previewMeta}>
            {category ? <View style={styles.previewChip}><Text style={styles.previewChipTxt}>{category}</Text></View> : null}
            <Text style={styles.previewVis}>{isPublic ? "🌍 Public" : "🔒 Private"}</Text>
          </View>
        </View>

        {/* Emoji Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Cover emoji</Text>
          <View style={styles.emojiGrid}>
            {EMOJIS.map(e => (
              <TouchableOpacity activeOpacity={0.85}
                key={e}
                style={[styles.emojiBtn, { backgroundColor: e === emoji ? colors.primary + "22" : colors.secondary, borderColor: e === emoji ? colors.primary : "transparent", borderWidth: e === emoji ? 2 : 0 }]}
                onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setEmoji(e); }}
              >
                <Text style={styles.emojiBtnTxt}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>List title <Text style={{ color: "#DC2626" }}>*</Text></Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. minority-owned brunch spots in Chicago"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={(t) => t.length <= 80 && setTitle(t)}
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{title.length}/80</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Description <Text style={[{ color: colors.mutedForeground }]}>(optional)</Text></Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="What makes this list special?"
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={(t) => t.length <= 200 && setDescription(t)}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{description.length}/200</Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Category <Text style={[{ color: colors.mutedForeground }]}>(optional)</Text></Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity activeOpacity={0.85}
                key={c}
                style={[styles.catChip, { backgroundColor: category === c ? colors.primary : colors.secondary, borderColor: category === c ? colors.primary : colors.border }]}
                onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setCategory(prev => prev === c ? "" : c); }}
              >
                <Text style={[styles.catTxt, { color: category === c ? "#FFF" : colors.foreground }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Visibility */}
        <View style={[styles.visRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.visLeft}>
            <Text style={{ fontSize: 20 }}>{isPublic ? "🌍" : "🔒"}</Text>
            <View>
              <Text style={[styles.visTitle, { color: colors.foreground }]}>{isPublic ? "Public list" : "Private list"}</Text>
              <Text style={[styles.visSub, { color: colors.mutedForeground }]}>{isPublic ? "Visible to the whole community" : "Only visible to you"}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.toggle, { backgroundColor: isPublic ? colors.primary : colors.muted }]}
            onPress={() => setIsPublic(p => !p)}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleThumb, { transform: [{ translateX: isPublic ? 20 : 2 }] }]} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 10 },
  back: { width: 38, height: 38, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold" },
  publishBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  publishTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 16, gap: 20 },
  previewCard: { borderRadius: 14, padding: 16, gap: 8 },
  previewEmoji: { fontSize: 32 },
  previewTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF" },
  previewDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  previewMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  previewChip: { backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  previewChipTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  previewVis: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  section: { gap: 10 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  emojiBtnTxt: { fontSize: 22 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80 },
  charCount: { fontSize: 11, textAlign: "right", fontFamily: "Inter_400Regular" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  catTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  visRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1 },
  visLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  visTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  visSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: "center" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFF" },
});
