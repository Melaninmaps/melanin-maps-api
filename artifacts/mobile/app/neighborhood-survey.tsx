/**
 * Community Intelligence survey — a member-selected city and explicit consent
 * can contribute only to delayed, thresholded city aggregates. This screen never
 * requests device location or submits a neighborhood, address, or coordinates.
 */
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { ChipGrid } from "@/components/ChipGrid";
import { VoiceTextField } from "@/components/VoiceTextField";
import { WELCOME_RATING_CHIPS, WHAT_STOOD_OUT_CHIPS } from "@/config/chips";
import { getApiBase } from "@/lib/api";

const API_BASE = getApiBase();

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

type Stage = "rating" | "confirmed" | "expanding" | "done";

export default function NeighborhoodSurveyScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [city, setCity] = useState("");
  const [consented, setConsented] = useState(false);
  const [rating, setRating] = useState<string[]>([]);
  const [surveyId, setSurveyId] = useState<number | null>(null);
  const [whatStoodOut, setWhatStoodOut] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [stage, setStage] = useState<Stage>("rating");
  const [submitting, setSubmitting] = useState(false);
  const [patchSubmitting, setPatchSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function authorizedHeaders(): Promise<Record<string, string>> {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function handleSubmit() {
    const selectedCity = city.trim();
    if (!rating[0] || !selectedCity || !consented || submitting) {
      setError("Choose a city and rating, then confirm your optional aggregate consent before submitting.");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/surveys/welcome`, {
        method: "POST",
        headers: await authorizedHeaders(),
        body: JSON.stringify({
          welcomeRating: parseInt(rating[0], 10),
          city: selectedCity,
          communityIntelligenceConsent: true,
        }),
      });
      if (!res.ok) {
        setError(res.status === 401 ? "Sign in to submit an optional Community Intelligence response." : "Your response could not be submitted. Nothing was shared.");
        return;
      }
      const data = await res.json() as { survey?: { id?: number } };
      setSurveyId(data.survey?.id ?? null);
      setStage("confirmed");
    } catch {
      setError("Your response could not be submitted. Nothing was shared.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExpansionSubmit() {
    if (patchSubmitting) return;
    if (whatStoodOut.length === 0 && !comments.trim()) { setStage("done"); return; }
    setPatchSubmitting(true);
    try {
      if (surveyId) {
        await fetch(`${API_BASE}/api/surveys/${surveyId}`, {
          method: "PATCH",
          headers: await authorizedHeaders(),
          body: JSON.stringify({
            whatStoodOut: whatStoodOut.length ? whatStoodOut : undefined,
            comments: comments.trim() || undefined,
          }),
        });
      }
    } catch { /* The optional addition is non-critical and remains private. */ } finally {
      setPatchSubmitting(false);
      setStage("done");
    }
  }

  if (stage === "done") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close Community Intelligence survey" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.centerWrap}>
          <Feather name="check-circle" size={56} color={colors.success} />
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Thank you — this helps.</Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>Your optional response remains private and can only inform a delayed city aggregate after enough explicitly consented people contribute.</Text>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === "confirmed") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close Community Intelligence survey" onPress={() => setStage("done")}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Response recorded</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}>
          <View style={styles.confirmBanner}><Feather name="check-circle" size={20} color={colors.success} /><Text style={[styles.confirmBannerText, { color: colors.success }]}>Your city-level response is private.</Text></View>
          <Text style={[styles.bodyText, { color: colors.mutedForeground, marginTop: 20 }]}>You may add optional feedback. It is not shown to other members or used as a location signal.</Text>
          <TouchableOpacity onPress={() => setStage("expanding")} style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 20 }]}><Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>Want to add more?</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setStage("done")} style={styles.skipLink}><Text style={[styles.skipLinkText, { color: colors.mutedForeground }]}>Skip</Text></TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (stage === "expanding") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to survey response" onPress={() => setStage("confirmed")}><Feather name="arrow-left" size={22} color={colors.foreground} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>What stood out?</Text>
          <View style={{ width: 22 }} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} keyboardDismissMode="on-drag">
            <ChipGrid chips={WHAT_STOOD_OUT_CHIPS} selectedIds={whatStoodOut} onSelect={setWhatStoodOut} multiSelect />
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Anything you want to add?</Text>
            <VoiceTextField value={comments} onChangeText={setComments} placeholder="Only if you want to. This feedback stays private." draftKey="survey_comments_draft" />
            <View style={styles.equalRow}>
              <TouchableOpacity onPress={() => { void handleExpansionSubmit(); }} style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.primary }]}>{patchSubmitting ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>Add this</Text>}</TouchableOpacity>
              <TouchableOpacity onPress={() => setStage("done")} style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.secondary, borderWidth: 1.5, borderColor: colors.border }]}><Text style={[styles.primaryBtnLabel, { color: colors.foreground }]}>Skip</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}><Feather name="arrow-left" size={22} color={colors.foreground} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community Intelligence</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="shield" size={18} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>Choose a city yourself. Kinfolk does not request device location, a neighborhood, an address, or coordinates for this optional survey.</Text>
        </View>
        <Text style={[styles.inputLabel, { color: colors.foreground }]}>City</Text>
        <TextInput value={city} onChangeText={setCity} placeholder="For example, Philadelphia" placeholderTextColor={colors.mutedForeground} autoCapitalize="words" autoCorrect={false} accessibilityLabel="City for Community Intelligence survey" style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
        <Text style={[styles.questionText, { color: colors.foreground }]}>How welcoming did this city feel?</Text>
        <ChipGrid chips={WELCOME_RATING_CHIPS} selectedIds={rating} onSelect={setRating} columns={1} style={{ marginTop: 16 }} />
        <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: consented }} accessibilityLabel="Consent to delayed city aggregate participation" onPress={() => setConsented((current) => !current)} style={[styles.consentRow, { borderColor: consented ? colors.primary : colors.border, backgroundColor: colors.card }]}>
          <Feather name={consented ? "check-square" : "square"} size={20} color={consented ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.consentText, { color: colors.mutedForeground }]}>I choose to let this response contribute to a delayed city-level aggregate only after enough explicitly consented members participate. No individual response, location, timestamp, or history is shown.</Text>
        </TouchableOpacity>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <TouchableOpacity onPress={() => { void handleSubmit(); }} disabled={!rating[0] || !city.trim() || !consented || submitting} style={[styles.primaryBtn, { backgroundColor: rating[0] && city.trim() && consented ? colors.primary : colors.muted, marginTop: 24, opacity: submitting ? 0.7 : 1 }]}>
          {submitting ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Text style={[styles.primaryBtnLabel, { color: rating[0] && city.trim() && consented ? colors.primaryForeground : colors.mutedForeground }]}>Submit optional response</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  notice: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "flex-start" },
  noticeText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  inputLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 20, marginBottom: 8 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontFamily: "Inter_400Regular", fontSize: 15 },
  questionText: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30, marginTop: 24 },
  bodyText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  consentRow: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 20, alignItems: "flex-start" },
  consentText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  error: { color: "#B42318", fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 12, lineHeight: 18 },
  primaryBtn: { minHeight: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  primaryBtnLabel: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  skipLink: { alignItems: "center", paddingVertical: 10 },
  skipLinkText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  equalRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 14 },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  successBody: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  confirmBanner: { flexDirection: "row", alignItems: "center", gap: 10 },
  confirmBannerText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
