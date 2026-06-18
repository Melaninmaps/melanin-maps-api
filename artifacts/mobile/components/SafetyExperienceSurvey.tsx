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
  businessName: string;
  onClose: () => void;
  onSubmit?: (data: SafetySurveyData) => void;
}

export interface SafetySurveyData {
  overallSafety: number;
  returnAlone: number;
  wouldRecommend: number;
  timeOfDay: string;
  groupType: string;
  incidentOccurred: boolean;
  comments: string;
}

const TIMES = ["Morning", "Afternoon", "Evening", "Night"];
const GROUPS = ["Solo", "With Partner", "With Friends", "With Family", "With Kids"];

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const colors = useColors();
  return (
    <View style={sr.starRow}>
      <Text style={[sr.starLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={sr.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(n); }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Feather name="star" size={28} color={n <= value ? "#D4873A" : "#E5E7EB"} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function SafetyExperienceSurvey({ visible, businessName, onClose, onSubmit }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SafetySurveyData>({
    overallSafety: 0,
    returnAlone: 0,
    wouldRecommend: 0,
    timeOfDay: "",
    groupType: "",
    incidentOccurred: false,
    comments: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setStep(0);
    setData({ overallSafety: 0, returnAlone: 0, wouldRecommend: 0, timeOfDay: "", groupType: "", incidentOccurred: false, comments: "" });
    setSubmitted(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const canNext = () => {
    if (step === 0) return data.overallSafety > 0 && data.returnAlone > 0 && data.wouldRecommend > 0;
    if (step === 1) return data.timeOfDay !== "" && data.groupType !== "";
    return true;
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 2) { setStep(step + 1); return; }
    setSubmitted(true);
    onSubmit?.(data);
  };

  const STEPS = ["Safety Ratings", "Visit Context", "Comments"];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Rate Safety Experience</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>{businessName}</Text>
            </View>
            <View style={{ width: 22 }} />
          </View>

          {/* Step indicator */}
          {!submitted && (
            <View style={styles.stepBar}>
              {STEPS.map((s, i) => (
                <View key={s} style={styles.stepItem}>
                  <View style={[styles.stepDot, {
                    backgroundColor: i <= step ? "#C4622D" : colors.border,
                    width: i === step ? 28 : 8,
                  }]} />
                  {i < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: i < step ? "#C4622D" : colors.border }]} />}
                </View>
              ))}
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {submitted ? (
              <View style={styles.thankYou}>
                <View style={[styles.thankIcon, { backgroundColor: "#C4622D18" }]}>
                  <Feather name="shield" size={40} color="#C4622D" />
                </View>
                <Text style={[styles.thankTitle, { color: colors.foreground }]}>Thank You!</Text>
                <Text style={[styles.thankSub, { color: colors.mutedForeground }]}>
                  Your safety experience helps the community make informed decisions. Your feedback matters.
                </Text>
                <TouchableOpacity style={[styles.doneBtn, { backgroundColor: "#C4622D" }]} onPress={handleClose}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : step === 0 ? (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>How safe did you feel?</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Rate your safety experience at {businessName}
                </Text>
                <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <StarRow label="Overall Safety" value={data.overallSafety} onChange={(v) => setData({ ...data, overallSafety: v })} />
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <StarRow label="Comfortable returning alone?" value={data.returnAlone} onChange={(v) => setData({ ...data, returnAlone: v })} />
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <StarRow label="Would recommend to others?" value={data.wouldRecommend} onChange={(v) => setData({ ...data, wouldRecommend: v })} />
                </View>
              </View>
            ) : step === 1 ? (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Tell us about your visit</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Context helps us surface more accurate safety scores
                </Text>
                <Text style={[styles.groupLabel, { color: colors.foreground }]}>Time of visit</Text>
                <View style={styles.chipGrid}>
                  {TIMES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, {
                        backgroundColor: data.timeOfDay === t ? "#C4622D" : colors.card,
                        borderColor: data.timeOfDay === t ? "#C4622D" : colors.border,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setData({ ...data, timeOfDay: t }); }}
                    >
                      <Text style={[styles.chipText, { color: data.timeOfDay === t ? "#FBF7F0" : colors.foreground }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.groupLabel, { color: colors.foreground, marginTop: 16 }]}>Who were you with?</Text>
                <View style={styles.chipGrid}>
                  {GROUPS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, {
                        backgroundColor: data.groupType === g ? "#C4622D" : colors.card,
                        borderColor: data.groupType === g ? "#C4622D" : colors.border,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setData({ ...data, groupType: g }); }}
                    >
                      <Text style={[styles.chipText, { color: data.groupType === g ? "#FBF7F0" : colors.foreground }]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.groupLabel, { color: colors.foreground, marginTop: 16 }]}>Did any incident occur?</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {["No", "Yes"].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, {
                        flex: 1,
                        justifyContent: "center",
                        backgroundColor: (opt === "Yes") === data.incidentOccurred ? "#DC2626" : colors.card,
                        borderColor: (opt === "Yes") === data.incidentOccurred ? "#DC2626" : colors.border,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setData({ ...data, incidentOccurred: opt === "Yes" }); }}
                    >
                      <Text style={[styles.chipText, {
                        color: (opt === "Yes") === data.incidentOccurred ? "#FBF7F0" : colors.foreground,
                        textAlign: "center",
                      }]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Anything else to share?</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Optional — your comments help future visitors
                </Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Describe your experience, what made you feel safe or unsafe..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={5}
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
                style={[styles.nextBtn, { backgroundColor: canNext() ? "#C4622D" : colors.border, flex: 1 }]}
                onPress={handleNext}
                disabled={!canNext()}
              >
                <Text style={[styles.nextBtnText, { color: canNext() ? "#FBF7F0" : colors.mutedForeground }]}>
                  {step === 2 ? "Submit" : "Next"}
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

const sr = StyleSheet.create({
  starRow: { gap: 10 },
  starLabel: { fontFamily: "Inter_500Medium", fontSize: 14, marginBottom: 8 },
  stars: { flexDirection: "row", gap: 6 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  stepBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 4,
  },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  stepDot: { height: 8, borderRadius: 4 },
  stepLine: { flex: 1, height: 2, borderRadius: 1 },
  body: { padding: 20, paddingBottom: 8 },
  stepContent: { gap: 12 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  stepSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 8 },
  ratingCard: { borderRadius: 16, padding: 18, borderWidth: 1, gap: 16 },
  divider: { height: 1 },
  groupLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 8 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 130,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  thankYou: { alignItems: "center", gap: 16, paddingTop: 40 },
  thankIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  thankTitle: { fontFamily: "Inter_700Bold", fontSize: 26 },
  thankSub: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 24, paddingHorizontal: 16 },
  doneBtn: { marginTop: 8, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FBF7F0" },
});
