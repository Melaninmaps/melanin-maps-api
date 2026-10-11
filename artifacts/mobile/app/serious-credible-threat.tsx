import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import { getApiBase } from "@/lib/api";

const CATEGORIES = [
  {
    id: "imminent_violence",
    label: "Imminent violence",
    description: "A credible risk of violence requiring restricted safety review.",
  },
  {
    id: "targeted_credible_threat",
    label: "Targeted credible threat",
    description: "A credible threat directed at a person or community.",
  },
  {
    id: "active_threat",
    label: "Active threat",
    description: "An ongoing serious threat that may require urgent safety action.",
  },
] as const;

type ThreatCategory = (typeof CATEGORIES)[number]["id"];

function includesPreciseLocation(value: string): boolean {
  return /\b\d{1,6}\b|\b(?:street|st|avenue|ave|road|rd|boulevard|blvd|highway|hwy|drive|dr|lane|ln|court|ct|latitude|longitude|lat|lng|lon)\b/i.test(value);
}

export default function SeriousCredibleThreatScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<ThreatCategory | null>(null);
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [privateReview, setPrivateReview] = useState(false);
  const [anonymousCityNotice, setAnonymousCityNotice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const areaIsSafe = useMemo(() => {
    const trimmedCity = city.trim();
    const trimmedRegion = region.trim();
    return trimmedCity.length > 0
      && trimmedCity.length <= 100
      && trimmedRegion.length > 0
      && trimmedRegion.length <= 100
      && !includesPreciseLocation(trimmedCity)
      && !includesPreciseLocation(trimmedRegion);
  }, [city, region]);

  const canSubmit = Boolean(category && areaIsSafe && privateReview && anonymousCityNotice && !submitting);

  const submit = async () => {
    if (!category || !areaIsSafe || !privateReview || !anonymousCityNotice || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) throw new Error("SIGN_IN_REQUIRED");
      const response = await fetch(`${getApiBase()}/api/safety/serious-credible-threats/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          consent: {
            privateReview: true,
            anonymousCityLevelNotice: true,
          },
          area: {
            city: city.trim(),
            region: region.trim(),
          },
        }),
      });
      if (response.status === 202) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSubmitted(true);
        return;
      }
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (body.error === "PRIVATE_REVIEW_UNAVAILABLE") {
        setError("Private review is unavailable right now. Your report was not saved. If there is immediate danger, call 911.");
      } else if (response.status === 401) {
        setError("Sign in again before submitting a protected safety report.");
      } else {
        setError("This report could not be submitted. Review the city and state, then try again.");
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (cause) {
      const message = cause instanceof Error && cause.message === "SIGN_IN_REQUIRED"
        ? "Sign in again before submitting a protected safety report."
        : "Private review is unavailable right now. Your report was not saved. If there is immediate danger, call 911.";
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const topPadding = Math.max(insets.top, 24) + 12;
  if (submitted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPadding }]}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityLabel="Close serious threat report" onPress={() => router.back()} style={styles.iconButton}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Private safety review</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}><Feather name="check" size={28} color="#FFFFFF" /></View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Submitted for private review</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Your report is pending restricted review. It has not created a public alert, notified other members, or contacted emergency services.</Text>
          <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shield" size={18} color={colors.primary} />
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>Any future city-level notice requires independent evidence, a private reviewer decision, and a separate publishing process.</Text>
          </View>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => router.replace("/safety-hub")}>
            <Text style={styles.primaryButtonText}>Return to Safety Hub</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Serious Threat Report</Text>
        <View style={styles.iconButton} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 32 }]} keyboardShouldPersistTaps="handled">
          <View style={styles.emergencyCard}>
            <Feather name="phone-call" size={20} color="#FFFFFF" />
            <View style={styles.flex}>
              <Text style={styles.emergencyTitle}>Immediate danger?</Text>
              <Text style={styles.emergencyText}>Call 911 now. This private report does not contact emergency services.</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Call 911" onPress={() => { void Linking.openURL("tel:911"); }} style={styles.callButton}>
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.intro, { color: colors.mutedForeground }]}>Use this only for a serious, credible threat. Do not include a street, venue, coordinates, names, or a narrative. This form records only a threat category and city/region for private review.</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Threat category</Text>
          <View style={styles.optionList}>
            {CATEGORIES.map((item) => {
              const selected = category === item.id;
              return (
                <TouchableOpacity key={item.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setCategory(item.id)} style={[styles.option, { backgroundColor: colors.card, borderColor: selected ? colors.primary : colors.border }]}>
                  <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.mutedForeground }]}>{selected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
                  <View style={styles.flex}>
                    <Text style={[styles.optionTitle, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>City and state/region only</Text>
          <Text style={[styles.help, { color: colors.mutedForeground }]}>No street, venue, neighborhood, landmark, or coordinates.</Text>
          <View style={styles.fieldRow}>
            <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={colors.mutedForeground} autoCapitalize="words" style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
            <TextInput value={region} onChangeText={setRegion} placeholder="State / region" placeholderTextColor={colors.mutedForeground} autoCapitalize="characters" style={[styles.regionInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
          </View>
          {city.length > 0 && !areaIsSafe ? <Text accessibilityRole="alert" style={styles.validationError}>Use only a city and state/region. Remove any address, number, or location detail.</Text> : null}

          <Text style={[styles.label, { color: colors.foreground }]}>Explicit consent</Text>
          <ConsentRow value={privateReview} onPress={() => setPrivateReview((value) => !value)} colors={colors} title="Allow restricted private review" description="I understand this report is retained only for a restricted safety-review process." />
          <ConsentRow value={anonymousCityNotice} onPress={() => setAnonymousCityNotice((value) => !value)} colors={colors} title="Allow an anonymized city-level notice if separately approved" description="My identity and this form's details are never included in a public notice." />

          {error ? <Text accessibilityRole="alert" style={styles.submitError}>{error}</Text> : null}
          <TouchableOpacity accessibilityRole="button" disabled={!canSubmit} onPress={() => { void submit(); }} style={[styles.primaryButton, { backgroundColor: canSubmit ? colors.primary : colors.muted }]}>
            <Text style={styles.primaryButtonText}>{submitting ? "Submitting…" : "Submit for private review"}</Text>
          </TouchableOpacity>
          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>Submitting does not verify a threat, publish a notice, notify others, or trigger emergency services.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function ConsentRow({ value, onPress, colors, title, description }: { value: boolean; onPress: () => void; colors: ReturnType<typeof useColors>; title: string; description: string }) {
  return (
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={onPress} style={[styles.consentRow, { backgroundColor: colors.card, borderColor: value ? colors.primary : colors.border }]}>
      <View style={[styles.checkbox, { borderColor: value ? colors.primary : colors.mutedForeground, backgroundColor: value ? colors.primary : "transparent" }]}>{value ? <Feather name="check" size={14} color="#FFFFFF" /> : null}</View>
      <View style={styles.flex}>
        <Text style={[styles.optionTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  iconButton: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 20, gap: 14 },
  emergencyCard: { backgroundColor: "#B42318", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  emergencyTitle: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 },
  emergencyText: { color: "#FFFFFF", fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 2 },
  callButton: { backgroundColor: "#FFFFFF", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9 },
  callButtonText: { color: "#B42318", fontFamily: "Inter_700Bold", fontSize: 13 },
  intro: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 4 },
  label: { fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 8 },
  help: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: -8 },
  optionList: { gap: 9 },
  option: { borderWidth: 1.5, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  radio: { width: 20, height: 20, borderWidth: 2, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 1 },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 18 },
  optionDescription: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 2 },
  fieldRow: { flexDirection: "row", gap: 10 },
  input: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14 },
  regionInput: { width: 128, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14 },
  validationError: { color: "#B42318", fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 17 },
  consentRow: { borderWidth: 1.5, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  primaryButton: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 6 },
  primaryButtonText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 },
  submitError: { color: "#B42318", fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 19, marginTop: 2 },
  footerNote: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, textAlign: "center", marginBottom: 8 },
  successWrap: { flex: 1, padding: 28, alignItems: "center", justifyContent: "center", gap: 18 },
  successIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#16803C", justifyContent: "center", alignItems: "center" },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 21, textAlign: "center" },
  body: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, textAlign: "center" },
  noticeCard: { width: "100%", borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  noticeText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
});
