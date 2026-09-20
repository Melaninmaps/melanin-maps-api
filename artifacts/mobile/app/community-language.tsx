import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
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

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getAuthToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}

export default function CommunityLanguageScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [city, setCity] = useState("");
  const [usageExample, setUsageExample] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const submit = async () => {
    setSubmitted(false);
    setSubmitting(true);
    try {
      const token = await getAuthToken();
      const base = getApiBase();
      if (!token || !base) throw new Error("Please sign in again before sharing a language suggestion.");
      const response = await fetch(`${base}/api/community-language/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ term, meaning, city: city || undefined, usageExample: usageExample || undefined }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Your suggestion could not be sent. Please try again.");
      setTerm("");
      setMeaning("");
      setCity("");
      setUsageExample("");
      setSubmitted(true);
    } catch (error) {
      Alert.alert("Could not send suggestion", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: topPad + 12 }]}> 
        <TouchableOpacity accessibilityLabel="Back" activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/kinfolk-settings" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community language</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}> 
          <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}><Feather name="message-circle" size={22} color="#fff" /></View>
          <Text style={[styles.title, { color: colors.foreground }]}>Help Kinfolk understand your city</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>Share a local word or phrase and what it means. Suggestions are reviewed before they can help Kinfolk understand anyone else.</Text>
        </View>
        <View style={[styles.info, { backgroundColor: colors.secondary, borderColor: colors.border }]}> 
          <Feather name="shield" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>Kinfolk will not copy a dialect, guess anyone’s identity, or treat a suggestion as proof of a health, legal, safety, news, ownership, or business claim.</Text>
        </View>
        <Text style={[styles.label, { color: colors.foreground }]}>Word or phrase</Text>
        <TextInput value={term} onChangeText={setTerm} maxLength={60} placeholder="For example: bodega" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>What does it mean?</Text>
        <TextInput value={meaning} onChangeText={setMeaning} maxLength={280} multiline textAlignVertical="top" placeholder="Explain it in plain language" placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.multiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>City or region <Text style={{ color: colors.mutedForeground }}>(optional)</Text></Text>
        <TextInput value={city} onChangeText={setCity} maxLength={100} placeholder="For example: Philadelphia" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>How would someone use it? <Text style={{ color: colors.mutedForeground }}>(optional)</Text></Text>
        <TextInput value={usageExample} onChangeText={setUsageExample} maxLength={240} multiline textAlignVertical="top" placeholder="A short, non-personal example" placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.multiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
        {submitted && <View accessibilityRole="alert" style={[styles.success, { backgroundColor: "#ECFDF5", borderColor: "#86EFAC" }]}><Feather name="check-circle" size={16} color="#15803D" /><Text style={styles.successText}>Sent for review. Thank you for helping Kinfolk understand local context.</Text></View>}
        <TouchableOpacity disabled={submitting || !term.trim() || !meaning.trim()} activeOpacity={0.85} style={[styles.button, { backgroundColor: colors.primary }, (submitting || !term.trim() || !meaning.trim()) && styles.disabled]} onPress={() => { void submit(); }}>
          {submitting ? <ActivityIndicator color="#fff" /> : <><Feather name="send" size={16} color="#fff" /><Text style={styles.buttonText}>Send for review</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  back: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scroll: { padding: 20, paddingBottom: 48 },
  hero: { borderWidth: 1, borderRadius: 20, padding: 20, alignItems: "center", marginBottom: 16 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 6 },
  copy: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, textAlign: "center" },
  info: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", gap: 10, marginBottom: 24 },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 4 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 18 },
  multiline: { minHeight: 92 },
  success: { flexDirection: "row", gap: 9, alignItems: "flex-start", borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 16 },
  successText: { flex: 1, color: "#166534", fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 17 },
  button: { minHeight: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9, marginTop: 4 },
  disabled: { opacity: 0.45 },
  buttonText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
});
