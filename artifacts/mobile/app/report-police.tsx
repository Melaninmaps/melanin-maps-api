import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
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
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

const ENCOUNTER_TYPES = [
  {
    id: "police_stop",
    icon: "alert-circle" as const,
    label: "Police Stop / Questioning",
    desc: "Stopped, questioned, or followed without cause",
    color: "#DC2626",
  },
  {
    id: "ice_activity",
    icon: "alert-octagon" as const,
    label: "ICE Activity",
    desc: "ICE agents spotted or enforcement activity observed",
    color: "#7C2D12",
  },
  {
    id: "racial_profiling",
    icon: "eye" as const,
    label: "Racial Profiling",
    desc: "Targeted because of race, appearance, or neighborhood",
    color: "#B45309",
  },
  {
    id: "excessive_force",
    icon: "shield-off" as const,
    label: "Excessive Force / Misconduct",
    desc: "Witness or victim of excessive or unlawful police force",
    color: "#991B1B",
  },
  {
    id: "checkpoint",
    icon: "map-pin" as const,
    label: "Checkpoint / Roadblock",
    desc: "Police or ICE checkpoint affecting travel in the area",
    color: "#1E40AF",
  },
  {
    id: "other_encounter",
    icon: "flag" as const,
    label: "Other Encounter",
    desc: "Any other law enforcement interaction the community should know about",
    color: "#374151",
  },
];

const SEVERITY_OPTIONS = [
  { id: "low", label: "Low", sub: "Informational", color: "#2D7A4F", bg: "#2D7A4F15" },
  { id: "medium", label: "Medium", sub: "Use caution", color: "#C9922B", bg: "#C9922B15" },
  { id: "high", label: "High", sub: "Avoid area", color: "#DC2626", bg: "#DC262615" },
  { id: "critical", label: "Critical", sub: "Active danger", color: "#7C2D12", bg: "#7C2D1215" },
];

interface FormData {
  encounterType: string;
  severity: string;
  city: string;
  neighborhood: string;
  description: string;
  isAnonymous: boolean;
}

const INITIAL: FormData = {
  encounterType: "",
  severity: "medium",
  city: "",
  neighborhood: "",
  description: "",
  isAnonymous: true,
};

function Toggle({ label, sub, value, onToggle, colors }: {
  label: string; sub?: string; value: boolean; onToggle: () => void; colors: any;
}) {
  return (
    <TouchableOpacity
      style={[toggleS.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => { Haptics.selectionAsync(); onToggle(); }}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1 }}>
        <Text style={[toggleS.label, { color: colors.foreground }]}>{label}</Text>
        {sub && <Text style={[toggleS.sub, { color: colors.mutedForeground }]}>{sub}</Text>}
      </View>
      <View style={[toggleS.track, { backgroundColor: value ? colors.primary : colors.muted }]}>
        <View style={[toggleS.thumb, { transform: [{ translateX: value ? 20 : 2 }] }]} />
      </View>
    </TouchableOpacity>
  );
}

const toggleS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 14 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  track: { width: 44, height: 26, borderRadius: 13, justifyContent: "center" },
  thumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFF", position: "absolute",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
});

export default function ReportPoliceScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [cityFocused, setCityFocused] = useState(false);
  const [neighFocused, setNeighFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const selectedType = ENCOUNTER_TYPES.find((t) => t.id === form.encounterType);
  const selectedSeverity = SEVERITY_OPTIONS.find((s) => s.id === form.severity)!;

  const animateTo = (next: number, dir: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: dir * -28, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(dir * 28);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  };

  const goNext = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); animateTo(step + 1, 1); };
  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) animateTo(step - 1, -1);
    else router.back();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const targetName = form.neighborhood.trim()
        ? `${form.neighborhood.trim()}, ${form.city.trim()}`
        : form.city.trim();

      const sessionToken = await SecureStore.getItemAsync("auth_session_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionToken) headers["Authorization"] = `Bearer ${sessionToken}`;

      const res = await fetch(`${API_BASE}/api/reports`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          category: form.encounterType,
          targetType: "neighborhood",
          targetName,
          description: form.description.trim(),
          severity: form.severity,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      animateTo(3, 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Submission Failed", `${msg}\n\nPlease try again.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed1 = form.encounterType !== "" && form.severity !== "";
  const canProceed2 = form.city.trim().length > 0 && form.description.trim().length > 10;
  const isSuccess = step === 3;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {isSuccess ? "Report Submitted" : "Report Police or ICE"}
          </Text>
          {!isSuccess && (
            <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>Step {step} of 2</Text>
          )}
        </View>
        <View style={{ width: 22 }} />
      </View>

      {!isSuccess && (
        <View style={[styles.progressWrap, { backgroundColor: colors.background }]}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <Animated.View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(step / 2) * 100}%` }]} />
          </View>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {isSuccess ? (
          <ScrollView contentContainerStyle={[styles.successWrap, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
            <View style={styles.successTop}>
              <View style={[styles.successIconBg, { backgroundColor: "#DC262615" }]}>
                <View style={styles.successIconInner}>
                  <Feather name="shield" size={48} color="#DC2626" />
                </View>
                <View style={[styles.successCheck, { backgroundColor: "#22C55E", borderColor: colors.background }]}>
                  <Feather name="check" size={18} color="#FFF" />
                </View>
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Report Received — Community Alerted</Text>
              <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
                Your report has been submitted{form.isAnonymous ? " anonymously" : ""}. Our team reviews every report within{" "}
                <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>24 hours</Text>. Verified reports are posted as real-time alerts to nearby community members.
              </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Report Summary</Text>
              {[
                { icon: selectedType?.icon ?? "alert-circle", label: "Type", value: selectedType?.label ?? "", color: selectedType?.color ?? colors.primary },
                { icon: "alert-triangle", label: "Severity", value: selectedSeverity.label, color: selectedSeverity.color },
                { icon: "map-pin", label: "Location", value: form.neighborhood ? `${form.neighborhood}, ${form.city}` : form.city, color: colors.primary },
                { icon: "user", label: "Submitted", value: form.isAnonymous ? "Anonymously" : `As ${[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "You"}`, color: colors.mutedForeground },
              ].map((row) => (
                <View key={row.label} style={styles.summaryRow}>
                  <Feather name={row.icon as any} size={15} color={row.color} />
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]} numberOfLines={1}>{row.value}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.nextStepsCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.nextStepsTitle, { color: colors.foreground }]}>What Happens Next</Text>
                {[
                  "Moderation team reviews your report",
                  "Verified reports appear as community alerts",
                  "Repeat locations are escalated automatically",
                ].map((item, i) => (
                  <View key={i} style={styles.nextStepRow}>
                    <View style={[styles.nextStepDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.nextStepText, { color: colors.mutedForeground }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Back to Discover</Text>
              <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep(1); setForm(INITIAL); }} activeOpacity={0.7}>
              <Text style={[styles.anotherLink, { color: colors.primary }]}>Submit another report</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 120 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

              {step === 1 && (
                <View>
                  <Text style={[styles.stepTitle, { color: colors.foreground }]}>What type of encounter?</Text>
                  <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                    Select the type that best describes what happened or what you witnessed.
                  </Text>

                  <View style={styles.typeGrid}>
                    {ENCOUNTER_TYPES.map((type) => {
                      const selected = form.encounterType === type.id;
                      return (
                        <TouchableOpacity
                          key={type.id}
                          style={[
                            styles.typeCard,
                            { backgroundColor: selected ? type.color + "15" : colors.card, borderColor: selected ? type.color : colors.border },
                          ]}
                          onPress={() => { Haptics.selectionAsync(); setForm((f) => ({ ...f, encounterType: type.id })); }}
                          activeOpacity={0.82}
                        >
                          <View style={[styles.typeIconWrap, { backgroundColor: type.color + "20" }]}>
                            <Feather name={type.icon} size={20} color={type.color} />
                          </View>
                          <Text style={[styles.typeLabel, { color: colors.foreground }]}>{type.label}</Text>
                          <Text style={[styles.typeDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{type.desc}</Text>
                          {selected && (
                            <View style={[styles.typeCheck, { backgroundColor: type.color }]}>
                              <Feather name="check" size={10} color="#FFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Severity Level</Text>
                  <View style={styles.severityRow}>
                    {SEVERITY_OPTIONS.map((sev) => {
                      const selected = form.severity === sev.id;
                      return (
                        <TouchableOpacity
                          key={sev.id}
                          style={[styles.sevBtn, { backgroundColor: selected ? sev.bg : colors.card, borderColor: selected ? sev.color : colors.border }]}
                          onPress={() => { Haptics.selectionAsync(); setForm((f) => ({ ...f, severity: sev.id })); }}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.sevDot, { backgroundColor: sev.color }]} />
                          <Text style={[styles.sevLabel, { color: selected ? sev.color : colors.foreground }]}>{sev.label}</Text>
                          <Text style={[styles.sevSub, { color: colors.mutedForeground }]}>{sev.sub}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {step === 2 && (
                <View>
                  <Text style={[styles.stepTitle, { color: colors.foreground }]}>Location & Details</Text>
                  <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                    Be as specific as you're comfortable with. More detail helps the community stay safer.
                  </Text>

                  {selectedType && (
                    <View style={[styles.typeChip, { backgroundColor: selectedType.color + "15", borderColor: selectedType.color + "40" }]}>
                      <Feather name={selectedType.icon} size={14} color={selectedType.color} />
                      <Text style={[styles.typeChipText, { color: selectedType.color }]}>{selectedType.label}</Text>
                      <View style={[styles.sevBadge, { backgroundColor: selectedSeverity.color }]}>
                        <Text style={styles.sevBadgeText}>{selectedSeverity.label}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, { color: colors.foreground }]}>City / Area *</Text>
                    <TextInput
                      value={form.city}
                      onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                      placeholder="e.g. Philadelphia, PA"
                      placeholderTextColor={colors.mutedForeground}
                      onFocus={() => setCityFocused(true)}
                      onBlur={() => setCityFocused(false)}
                      style={[styles.input, { backgroundColor: colors.card, borderColor: cityFocused ? colors.primary : colors.border, color: colors.foreground }]}
                    />
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Neighborhood / Street</Text>
                    <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>Optional — helps narrow the location</Text>
                    <TextInput
                      value={form.neighborhood}
                      onChangeText={(v) => setForm((f) => ({ ...f, neighborhood: v }))}
                      placeholder="e.g. West Philly, Germantown Ave"
                      placeholderTextColor={colors.mutedForeground}
                      onFocus={() => setNeighFocused(true)}
                      onBlur={() => setNeighFocused(false)}
                      style={[styles.input, { backgroundColor: colors.card, borderColor: neighFocused ? colors.primary : colors.border, color: colors.foreground }]}
                    />
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Description *</Text>
                    <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                      What happened? When? Any details the community should know to stay safe.
                    </Text>
                    <TextInput
                      value={form.description}
                      onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                      placeholder="Describe what you witnessed or experienced..."
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      numberOfLines={5}
                      onFocus={() => setDescFocused(true)}
                      onBlur={() => setDescFocused(false)}
                      style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: descFocused ? colors.primary : colors.border, color: colors.foreground }]}
                    />
                    <Text style={[styles.charCount, { color: form.description.length > 10 ? colors.mutedForeground : colors.destructive }]}>
                      {form.description.length} chars {form.description.length <= 10 ? "(min 10)" : ""}
                    </Text>
                  </View>

                  <Toggle
                    label="Submit Anonymously"
                    sub="Your name won't be shown on the alert. Recommended."
                    value={form.isAnonymous}
                    onToggle={() => setForm((f) => ({ ...f, isAnonymous: !f.isAnonymous }))}
                    colors={colors}
                  />

                  <View style={[styles.disclaimer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Feather name="lock" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
                      All reports are reviewed before publication. False or malicious reports will not be posted and may result in account restrictions.
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {!isSuccess && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
          {step > 1 && (
            <TouchableOpacity style={[styles.backFooterBtn, { backgroundColor: colors.secondary }]} onPress={goBack} activeOpacity={0.8}>
              <Feather name="arrow-left" size={18} color={colors.foreground} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: (step === 1 ? canProceed1 : canProceed2) && !submitting ? colors.primary : colors.muted }]}
            onPress={step === 2 ? () => { void handleSubmit(); } : goNext}
            activeOpacity={0.85}
            disabled={!(step === 1 ? canProceed1 : canProceed2) || submitting}
          >
            {step === 2 && <Feather name="send" size={16} color={canProceed2 && !submitting ? colors.primaryForeground : colors.mutedForeground} />}
            <Text style={[styles.nextBtnText, { color: (step === 1 ? canProceed1 : canProceed2) && !submitting ? colors.primaryForeground : colors.mutedForeground }]}>
              {step === 2 ? (submitting ? "Submitting…" : "Submit Report") : "Continue"}
            </Text>
            {step === 1 && <Feather name="arrow-right" size={16} color={(step === 1 ? canProceed1 : canProceed2) ? colors.primaryForeground : colors.mutedForeground} />}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerCenter: { alignItems: "center", gap: 2 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  headerStep: { fontFamily: "Inter_400Regular", fontSize: 12 },
  progressWrap: { paddingHorizontal: 20, paddingVertical: 10 },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  scroll: { padding: 20, gap: 0 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 6 },
  stepSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 20 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  typeCard: { width: "47%", padding: 14, borderRadius: 14, borderWidth: 1.5, gap: 8, position: "relative" },
  typeIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  typeDesc: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15 },
  typeCheck: { position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 12 },
  severityRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  sevBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, alignItems: "center", gap: 4 },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  sevLabel: { fontFamily: "Inter_700Bold", fontSize: 13 },
  sevSub: { fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 20 },
  typeChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sevBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#FFF" },
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 4 },
  fieldHint: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15 },
  textarea: { height: 120, textAlignVertical: "top", paddingTop: 12 },
  charCount: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4, textAlign: "right" },
  disclaimer: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  disclaimerText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, flex: 1 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 12, padding: 16, paddingTop: 14, borderTopWidth: 1 },
  backFooterBtn: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  nextBtn: { flex: 1, height: 52, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  successWrap: { padding: 24, gap: 20, alignItems: "center" },
  successTop: { alignItems: "center", gap: 16 },
  successIconBg: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", position: "relative" },
  successIconInner: { alignItems: "center", justifyContent: "center" },
  successCheck: { position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 20, textAlign: "center", lineHeight: 28 },
  successBody: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: "center" },
  summaryCard: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 18, gap: 14 },
  summaryTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 13, width: 70 },
  summaryValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  nextStepsCard: { width: "100%", flexDirection: "row", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  nextStepsTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 6 },
  nextStepRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nextStepDot: { width: 6, height: 6, borderRadius: 3 },
  nextStepText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  doneBtn: { width: "100%", height: 52, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  anotherLink: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginTop: 4 },
});
