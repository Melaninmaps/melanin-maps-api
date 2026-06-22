import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
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

interface Props {
  visible: boolean;
  destination: string;
  onClose: () => void;
  onSubmit?: (data: ItineraryFeedbackData) => void;
}

export interface ItineraryFeedbackData {
  overallRating: number;
  accuracyRating: number;
  safetyRating: number;
  wouldUseAgain: boolean | null;
  whatWorked: string[];
  whatToImprove: string[];
  comments: string;
}

const WORKED_OPTIONS = [
  "Accurate business info",
  "Great neighborhood picks",
  "Good safety tips",
  "Diverse recommendations",
  "Well-paced itinerary",
  "Matched my travel style",
  "Family-friendly options",
  "Budget-appropriate",
];

const IMPROVE_OPTIONS = [
  "More Black-owned spots",
  "Better safety details",
  "More budget options",
  "Better neighborhood context",
  "More dining variety",
  "Add nightlife options",
  "Include transit tips",
  "More local hidden gems",
];

function StarRating({ label, value, onChange, color = "#D4873A" }: { label: string; value: number; onChange: (v: number) => void; color?: string }) {
  const colors = useColors();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[star.label, { color: colors.foreground }]}>{label}</Text>
      <View style={star.row}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(n); }} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Feather name="star" size={32} color={n <= value ? color : "#E5E7EB"} />
          </TouchableOpacity>
        ))}
        <Text style={[star.val, { color: value > 0 ? color : colors.mutedForeground }]}>
          {value > 0 ? ["", "Poor", "Fair", "Good", "Great", "Excellent"][value] : ""}
        </Text>
      </View>
    </View>
  );
}

export function PostItineraryFeedbackSurvey({ visible, destination, onClose, onSubmit }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ItineraryFeedbackData>({
    overallRating: 0,
    accuracyRating: 0,
    safetyRating: 0,
    wouldUseAgain: null,
    whatWorked: [],
    whatToImprove: [],
    comments: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setStep(0);
    setData({ overallRating: 0, accuracyRating: 0, safetyRating: 0, wouldUseAgain: null, whatWorked: [], whatToImprove: [], comments: "" });
    setSubmitted(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const toggle = (key: "whatWorked" | "whatToImprove", val: string) => {
    Haptics.selectionAsync();
    setData((d) => {
      const arr = d[key];
      return { ...d, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  };

  const canNext = () => {
    if (step === 0) return data.overallRating > 0 && data.accuracyRating > 0 && data.safetyRating > 0 && data.wouldUseAgain !== null;
    return true;
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 2) { setStep(step + 1); return; }
    setSubmitted(true);
    onSubmit?.(data);
  };

  const STEPS = ["Ratings", "What Worked / Improve", "Comments"];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Rate this Itinerary</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>{destination}</Text>
            </View>
            <View style={{ width: 22 }} />
          </View>

          {!submitted && (
            <View style={styles.stepBar}>
              {STEPS.map((s, i) => (
                <View key={s} style={styles.stepItem}>
                  <View style={[styles.stepDot, { backgroundColor: i <= step ? "#D4873A" : colors.border, width: i === step ? 28 : 8 }]} />
                  {i < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: i < step ? "#D4873A" : colors.border }]} />}
                </View>
              ))}
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {submitted ? (
              <View style={styles.thankYou}>
                <View style={[styles.thankIcon, { backgroundColor: "#D4873A18" }]}>
                  <Feather name="map" size={44} color="#D4873A" />
                </View>
                <Text style={[styles.thankTitle, { color: colors.foreground }]}>Feedback Received!</Text>
                <Text style={[styles.thankSub, { color: colors.mutedForeground }]}>
                  Your feedback helps us improve AI trip planning for the entire community. Thank you!
                </Text>
                {data.overallRating >= 4 && (
                  <View style={[styles.sharePrompt, { backgroundColor: "#C4622D10", borderColor: "#C4622D30" }]}>
                    <Text style={{ fontSize: 20 }}>🙌</Text>
                    <Text style={[styles.shareText, { color: colors.foreground }]}>
                      Glad you loved it! Share this itinerary with your community.
                    </Text>
                  </View>
                )}
                <TouchableOpacity style={[styles.doneBtn, { backgroundColor: "#D4873A" }]} onPress={handleClose}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : step === 0 ? (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>How was this itinerary?</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Rate the AI trip plan for {destination || "your destination"}</Text>
                <StarRating label="Overall quality" value={data.overallRating} onChange={(v) => setData({ ...data, overallRating: v })} />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <StarRating label="Accuracy of recommendations" value={data.accuracyRating} onChange={(v) => setData({ ...data, accuracyRating: v })} color="#C4622D" />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <StarRating label="Safety information quality" value={data.safetyRating} onChange={(v) => setData({ ...data, safetyRating: v })} color="#2D7A4F" />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.groupLabel, { color: colors.foreground }]}>Would you use AI trip planning again?</Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {[
                    { val: true, label: "Yes, definitely!", icon: "thumbs-up" as const, color: "#2D7A4F" },
                    { val: false, label: "Not sure", icon: "thumbs-down" as const, color: "#DC2626" },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={String(opt.val)}
                      style={[styles.yesNoCard, {
                        flex: 1,
                        backgroundColor: data.wouldUseAgain === opt.val ? opt.color + "15" : colors.card,
                        borderColor: data.wouldUseAgain === opt.val ? opt.color : colors.border,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setData({ ...data, wouldUseAgain: opt.val }); }}
                    >
                      <Feather name={opt.icon} size={22} color={data.wouldUseAgain === opt.val ? opt.color : colors.mutedForeground} />
                      <Text style={[styles.yesNoText, { color: data.wouldUseAgain === opt.val ? opt.color : colors.foreground }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : step === 1 ? (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>What worked & what to improve?</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Help us build better itineraries</Text>
                <Text style={[styles.groupLabel, { color: "#2D7A4F" }]}>✓ What worked well</Text>
                <View style={styles.chipGrid}>
                  {WORKED_OPTIONS.map((w) => {
                    const sel = data.whatWorked.includes(w);
                    return (
                      <TouchableOpacity
                        key={w}
                        style={[styles.chip, { backgroundColor: sel ? "#2D7A4F" : colors.card, borderColor: sel ? "#2D7A4F" : colors.border }]}
                        onPress={() => toggle("whatWorked", w)}
                      >
                        <Text style={[styles.chipText, { color: sel ? "#FBF7F0" : colors.foreground }]}>{w}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.groupLabel, { color: "#DC2626", marginTop: 8 }]}>↗ What could be better</Text>
                <View style={styles.chipGrid}>
                  {IMPROVE_OPTIONS.map((w) => {
                    const sel = data.whatToImprove.includes(w);
                    return (
                      <TouchableOpacity
                        key={w}
                        style={[styles.chip, { backgroundColor: sel ? "#DC2626" : colors.card, borderColor: sel ? "#DC2626" : colors.border }]}
                        onPress={() => toggle("whatToImprove", w)}
                      >
                        <Text style={[styles.chipText, { color: sel ? "#FBF7F0" : colors.foreground }]}>{w}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Any final thoughts?</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Optional — free-form feedback goes directly to our AI team</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="What would make this AI trip planner more useful for Black travelers?"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={6}
                  value={data.comments}
                  onChangeText={(t) => setData({ ...data, comments: t })}
                  textAlignVertical="top"
                />
              </View>
            )}
          </ScrollView>

          {!submitted && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              {step > 0 && (
                <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => setStep(step - 1)}>
                  <Text style={[styles.backBtnText, { color: colors.foreground }]}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: canNext() ? "#D4873A" : colors.border, flex: 1 }]}
                onPress={handleNext}
                disabled={!canNext()}
              >
                <Text style={[styles.nextBtnText, { color: canNext() ? "#FBF7F0" : colors.mutedForeground }]}>
                  {step === 2 ? "Submit Feedback" : "Next"}
                </Text>
                {step < 2 && <Feather name="arrow-right" size={16} color={canNext() ? "#FBF7F0" : colors.mutedForeground} />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const star = StyleSheet.create({
  label: { fontFamily: "Inter_500Medium", fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  val: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginLeft: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, gap: 12 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  stepBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 14, gap: 4 },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  stepDot: { height: 8, borderRadius: 4 },
  stepLine: { flex: 1, height: 2, borderRadius: 1 },
  body: { padding: 20, paddingBottom: 8 },
  stepContent: { gap: 16 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  stepSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  groupLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 4 },
  divider: { height: 1 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  yesNoCard: { alignItems: "center", gap: 8, padding: 16, borderRadius: 16, borderWidth: 1.5 },
  yesNoText: { fontFamily: "Inter_600SemiBold", fontSize: 13, textAlign: "center" },
  textArea: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 140, lineHeight: 22 },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  backBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  thankYou: { alignItems: "center", gap: 16, paddingTop: 40 },
  thankIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  thankTitle: { fontFamily: "Inter_700Bold", fontSize: 26 },
  thankSub: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 24, paddingHorizontal: 8 },
  sharePrompt: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, width: "100%" },
  shareText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 20 },
  doneBtn: { marginTop: 4, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FBF7F0" },
});
