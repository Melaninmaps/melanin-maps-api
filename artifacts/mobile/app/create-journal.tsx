import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}

const COVER_EMOJIS = ["✈️", "🗺️", "🌍", "🎒", "🏝️", "🏙️", "🌃", "🎷", "🍑", "✊🏾", "🇧🇷", "🇬🇭", "🚗", "📸", "💃🏾", "🙏🏾"];

export default function CreateJournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [coverEmoji, setCoverEmoji] = useState("✈️");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const addCity = () => {
    const c = cityInput.trim();
    if (c && !cities.includes(c) && cities.length < 10) {
      setCities(prev => [...prev, c]);
      setCityInput("");
    }
  };

  const removeCity = (c: string) => setCities(prev => prev.filter(x => x !== c));

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Please give your journal a title.");
      return;
    }
    if (!isAuthenticated) {
      router.push("/login" as never);
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${getApiBase()}/api/journals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), cities, coverEmoji, isPublic }),
      });
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Journal Created!",
          isPublic ? "Your trip journal is now live and discoverable by the community." : "Your journal has been saved privately.",
          [{ text: "View Journals", onPress: () => router.replace("/journals" as never) }]
        );
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/journals" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Create Trip Journal</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.heroRow, { backgroundColor: colors.secondary }]}>
          <Text style={styles.heroEmoji}>{coverEmoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              {title.trim() || "Your journal title"}
            </Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              {isPublic ? "Public · Visible to community" : "Private · Only you"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Cover Emoji</Text>
          <View style={styles.emojiGrid}>
            {COVER_EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[
                  styles.emojiBtn,
                  {
                    backgroundColor: e === coverEmoji ? colors.primary + "20" : colors.secondary,
                    borderColor: e === coverEmoji ? colors.primary : "transparent",
                  },
                ]}
                onPress={() => setCoverEmoji(e)}
              >
                <Text style={styles.emojiBtnTxt}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Title <Text style={{ color: colors.destructive }}>*</Text></Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="My Weekend in Atlanta"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={(t) => t.length <= 80 && setTitle(t)}
            returnKeyType="next"
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{title.length}/80</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Description <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Tell the community what made this trip memorable…"
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={(t) => t.length <= 300 && setDescription(t)}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{description.length}/300</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Cities / Destinations</Text>
          <View style={styles.cityInputRow}>
            <TextInput
              style={[styles.cityInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Atlanta, Accra, New Orleans…"
              placeholderTextColor={colors.mutedForeground}
              value={cityInput}
              onChangeText={setCityInput}
              onSubmitEditing={addCity}
              returnKeyType="done"
            />
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={addCity}>
              <Feather name="plus" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {cities.length > 0 && (
            <View style={styles.cityTags}>
              {cities.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cityTag, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}
                  onPress={() => removeCity(c)}
                >
                  <Text style={[styles.cityTagTxt, { color: colors.primary }]}>{c}</Text>
                  <Feather name="x" size={12} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Share with community</Text>
            <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
              {isPublic ? "Others can save and follow this journal" : "Only visible to you"}
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: title.trim() ? colors.primary : colors.muted }]}
          onPress={handleSubmit}
          disabled={!title.trim() || saving}
          activeOpacity={0.85}
        >
          <Feather name="book-open" size={18} color={title.trim() ? "#FFFFFF" : colors.mutedForeground} />
          <Text style={[styles.submitTxt, { color: title.trim() ? "#FFFFFF" : colors.mutedForeground }]}>
            {saving ? "Publishing…" : "Publish Journal"}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Your journal is community content. Others can save and follow it, but cannot edit or remove it. You may delete it from your profile at any time.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 38, height: 38, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  scroll: { padding: 20, gap: 22 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16 },
  heroEmoji: { fontSize: 36 },
  heroTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 100 },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  emojiBtnTxt: { fontSize: 22 },
  cityInputRow: { flexDirection: "row", gap: 8 },
  cityInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  addBtn: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cityTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cityTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  cityTagTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  toggleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  toggleSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16 },
  submitTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  disclaimer: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
});
