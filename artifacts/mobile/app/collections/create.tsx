import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function getToken() { try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); } catch { return null; } }
async function authHeaders(): Promise<Record<string, string>> { const t = await getToken(); return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }; }

const EMOJI_PICKS = ["📌", "🗺️", "💡", "🏙️", "🍽️", "✈️", "💼", "🏥", "🎓", "🤝", "🌍", "🎨", "🏋️", "🏠", "📚", "🌱", "🎵", "💰", "🧘", "⚡"];

export default function CreateCollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverEmoji, setCoverEmoji] = useState("📌");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0;

  const handleCreate = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const h = await authHeaders();
      const token = await getToken();
      if (!token) {
        Alert.alert("Sign in required", "Please sign in to create a collection.");
        setSaving(false);
        return;
      }
      const res = await fetch(`${getApiBase()}/api/collections`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined, coverEmoji, isPublic }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        Alert.alert("Error", err.error ?? "Failed to create collection");
        return;
      }
      const data = await res.json() as { collection: { id: string } };
      router.replace({ pathname: "/collections/[id]", params: { id: data.collection.id } } as never);
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>New Collection</Text>
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: canSave ? "#CA922B" : colors.muted, opacity: saving ? 0.6 : 1 }]}
              onPress={handleCreate}
              disabled={!canSave || saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.saveTxt}>Create</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
        keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        >
          {/* Emoji picker */}
          <Text style={[s.label, { color: colors.mutedForeground }]}>Cover Emoji</Text>
          <View style={s.emojiGrid}>
            {EMOJI_PICKS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[s.emojiBtn, { backgroundColor: colors.card, borderColor: coverEmoji === e ? "#CA922B" : colors.border }]}
                onPress={() => setCoverEmoji(e)}
                activeOpacity={0.7}
              >
                <Text style={s.emojiTxt}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected emoji preview */}
          <View style={[s.previewBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={s.previewEmoji}>{coverEmoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.previewTitle, { color: colors.foreground }]} numberOfLines={1}>
                {title.trim() || "Your collection title"}
              </Text>
              <Text style={[s.previewSub, { color: colors.mutedForeground }]}>
                {isPublic ? "Public collection" : "Private collection"} · 0 items
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[s.label, { color: colors.mutedForeground, marginTop: 20 }]}>Title *</Text>
          <TextInput
            style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder="e.g. Moving to Atlanta, Best of Philly, Diabetes Resources"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            returnKeyType="next"
          />
          <Text style={[s.charCount, { color: colors.mutedForeground }]}>{title.length}/100</Text>

          {/* Description */}
          <Text style={[s.label, { color: colors.mutedForeground }]}>Description</Text>
          <TextInput
            style={[s.input, s.multiline, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder="What will this collection help people find or do?"
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            maxLength={300}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Text style={[s.charCount, { color: colors.mutedForeground }]}>{description.length}/300</Text>

          {/* Visibility toggle */}
          <View style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.toggleLabel, { color: colors.foreground }]}>
                {isPublic ? "🌍 Public collection" : "🔒 Private collection"}
              </Text>
              <Text style={[s.toggleSub, { color: colors.mutedForeground }]}>
                {isPublic
                  ? "Anyone can browse and follow this collection"
                  : "Only you can see this collection"}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: colors.muted, true: "#CA922B" }}
              thumbColor="#fff"
            />
          </View>

          {/* Tips */}
          <View style={[s.tipsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.tipsTitle, { color: colors.foreground }]}>💡 Collection ideas</Text>
            {[
              "Moving to [City] — businesses, services & housing tips",
              "Managing Type 2 Diabetes — doctors, gyms, recipes",
              "Community restaurants in Atlanta",
              "Philadelphia nightlife & events",
              "HBCUs & scholarships resources",
            ].map((tip) => (
              <Text key={tip} style={[s.tip, { color: colors.mutedForeground }]}>· {tip}</Text>
            ))}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700" },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, minWidth: 70, alignItems: "center" },
  saveTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  emojiBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  emojiTxt: { fontSize: 22 },
  previewBadge: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 4 },
  previewEmoji: { fontSize: 32 },
  previewTitle: { fontSize: 15, fontWeight: "700" },
  previewSub: { fontSize: 12, marginTop: 2 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 4 },
  multiline: { minHeight: 80 },
  charCount: { fontSize: 11, textAlign: "right", marginBottom: 16 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  toggleLabel: { fontSize: 15, fontWeight: "600", marginBottom: 3 },
  toggleSub: { fontSize: 12 },
  tipsBox: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 6 },
  tipsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  tip: { fontSize: 12, lineHeight: 18 },
});
