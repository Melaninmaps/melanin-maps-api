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
  onClose: () => void;
  onSubmit?: (data: NeighborhoodSurveyData) => void;
}

export interface NeighborhoodSurveyData {
  city: string;
  neighborhood: string;
  daytime: number;
  nighttime: number;
  walkability: number;
  transit: number;
  atmosphere: string;
  safetyTips: string[];
  comments: string;
}

const CITIES = ["Atlanta", "Houston", "Chicago", "Los Angeles", "New York", "DC", "Detroit", "New Orleans", "Baltimore", "Philadelphia"];
const ATMOSPHERE_OPTIONS = [
  { id: "welcoming", label: "Welcoming" },
  { id: "neutral", label: "Neutral" },
  { id: "uncomfortable", label: "Uncomfortable" },
  { id: "mixed", label: "Mixed" },
];
const SAFETY_TIPS_OPTIONS = [
  "Well-lit streets at night",
  "Active foot traffic",
  "Security cameras visible",
  "Community watch present",
  "Safe for solo women",
  "LGBTQ+ friendly",
  "Family-friendly area",
  "Avoid after midnight",
  "Stay near main streets",
  "Park in well-lit areas",
];

function RatingSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const colors = useColors();
  const LABELS = ["", "Unsafe", "Below Avg", "Average", "Good", "Excellent"];
  return (
    <View style={rs.wrap}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={[rs.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[rs.val, { color: value > 0 ? "#C4622D" : colors.mutedForeground }]}>
          {value > 0 ? LABELS[value] : "Tap to rate"}
        </Text>
      </View>
      <View style={rs.row}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => { Haptics.selectionAsync(); onChange(n); }}
            style={[rs.block, { backgroundColor: n <= value ? "#C4622D" : colors.border }]}
          />
        ))}
      </View>
    </View>
  );
}

export function NeighborhoodSafetySurvey({ visible, onClose, onSubmit }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<NeighborhoodSurveyData>({
    city: "",
    neighborhood: "",
    daytime: 0,
    nighttime: 0,
    walkability: 0,
    transit: 0,
    atmosphere: "",
    safetyTips: [],
    comments: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setStep(0);
    setData({ city: "", neighborhood: "", daytime: 0, nighttime: 0, walkability: 0, transit: 0, atmosphere: "", safetyTips: [], comments: "" });
    setSubmitted(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleTip = (tip: string) => {
    Haptics.selectionAsync();
    setData((d) => ({
      ...d,
      safetyTips: d.safetyTips.includes(tip) ? d.safetyTips.filter((t) => t !== tip) : [...d.safetyTips, tip],
    }));
  };

  const canNext = () => {
    if (step === 0) return data.city !== "" && data.neighborhood.trim() !== "";
    if (step === 1) return data.daytime > 0 && data.nighttime > 0 && data.walkability > 0 && data.transit > 0;
    if (step === 2) return data.atmosphere !== "";
    return true;
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 2) { setStep(step + 1); return; }
    setSubmitted(true);
    onSubmit?.(data);
  };

  const STEPS = ["Location", "Safety Ratings", "Community Insights"];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Rate a Neighborhood</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Help the community stay safe</Text>
            </View>
            <View style={{ width: 22 }} />
          </View>

          {!submitted && (
            <View style={styles.stepBar}>
              {STEPS.map((s, i) => (
                <View key={s} style={styles.stepItem}>
                  <View style={[styles.stepDot, { backgroundColor: i <= step ? "#C4622D" : colors.border, width: i === step ? 28 : 8 }]} />
                  {i < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: i < step ? "#C4622D" : colors.border }]} />}
                </View>
              ))}
            </View>
          )}

          <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {submitted ? (
              <View style={styles.thankYou}>
                <View style={[styles.thankIcon, { backgroundColor: "#2D7A4F18" }]}>
                  <Feather name="map-pin" size={40} color="#2D7A4F" />
                </View>
                <Text style={[styles.thankTitle, { color: colors.foreground }]}>Rating Submitted!</Text>
                <Text style={[styles.thankSub, { color: colors.mutedForeground }]}>
                  Your neighborhood insight helps the community plan safer trips. Thank you for contributing.
                </Text>
                <TouchableOpacity style={[styles.doneBtn, { backgroundColor: "#C4622D" }]} onPress={handleClose}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : step === 0 ? (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Which neighborhood?</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Select your city and enter the neighborhood name</Text>
                <Text style={[styles.groupLabel, { color: colors.foreground }]}>City</Text>
                <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {CITIES.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.chip, {
                          backgroundColor: data.city === c ? "#C4622D" : colors.card,
                          borderColor: data.city === c ? "#C4622D" : colors.border,
                        }]}
                        onPress={() => { Haptics.selectionAsync(); setData({ ...data, city: c }); }}
                      >
                        <Text style={[styles.chipText, { color: data.city === c ? "#FBF7F0" : colors.foreground }]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <Text style={[styles.groupLabel, { color: colors.foreground }]}>Neighborhood name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="e.g. Sweet Auburn, Midtown, Bronzeville..."
                  placeholderTextColor={colors.mutedForeground}
                  value={data.neighborhood}
                  onChangeText={(t) => setData({ ...data, neighborhood: t })}
                />
              </View>
            ) : step === 1 ? (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Safety Ratings</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Rate {data.neighborhood || "this neighborhood"} across key dimensions
                </Text>
                <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <RatingSlider label="Daytime Safety" value={data.daytime} onChange={(v) => setData({ ...data, daytime: v })} />
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <RatingSlider label="Nighttime Safety" value={data.nighttime} onChange={(v) => setData({ ...data, nighttime: v })} />
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <RatingSlider label="Walkability" value={data.walkability} onChange={(v) => setData({ ...data, walkability: v })} />
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <RatingSlider label="Public Transit Safety" value={data.transit} onChange={(v) => setData({ ...data, transit: v })} />
                </View>
              </View>
            ) : (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Community Insights</Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Share your experience of this neighborhood's atmosphere</Text>

                <Text style={[styles.groupLabel, { color: colors.foreground }]}>
                  How would you describe the community atmosphere?
                  <Text style={{ color: "#DC2626" }}> *</Text>
                </Text>
                <View style={styles.chipGrid}>
                  {ATMOSPHERE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.chip, {
                        backgroundColor: data.atmosphere === opt.id ? "#C4622D" : colors.card,
                        borderColor: data.atmosphere === opt.id ? "#C4622D" : colors.border,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setData({ ...data, atmosphere: opt.id }); }}
                    >
                      <Text style={[styles.chipText, { color: data.atmosphere === opt.id ? "#FBF7F0" : colors.foreground }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.groupLabel, { color: colors.foreground, marginTop: 16 }]}>Safety tips to share (select all that apply)</Text>
                <View style={styles.chipGrid}>
                  {SAFETY_TIPS_OPTIONS.map((tip) => (
                    <TouchableOpacity
                      key={tip}
                      style={[styles.chip, {
                        backgroundColor: data.safetyTips.includes(tip) ? "#C4622D" : colors.card,
                        borderColor: data.safetyTips.includes(tip) ? "#C4622D" : colors.border,
                      }]}
                      onPress={() => toggleTip(tip)}
                    >
                      <Text style={[styles.chipText, { color: data.safetyTips.includes(tip) ? "#FBF7F0" : colors.foreground }]}>{tip}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.groupLabel, { color: colors.foreground, marginTop: 16 }]}>Additional comments</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Share anything else about safety in this area..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={4}
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

const rs = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: "Inter_500Medium", fontSize: 14 },
  val: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  row: { flexDirection: "row", gap: 6 },
  block: { flex: 1, height: 10, borderRadius: 5 },
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
  stepContent: { gap: 12 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  stepSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 4 },
  groupLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 4 },
  ratingCard: { borderRadius: 16, padding: 18, borderWidth: 1, gap: 16 },
  divider: { height: 1 },
  textInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  sentimentRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  sentimentText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14 },
  textArea: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 110, lineHeight: 22 },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  backBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  thankYou: { alignItems: "center", gap: 16, paddingTop: 40 },
  thankIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  thankTitle: { fontFamily: "Inter_700Bold", fontSize: 26 },
  thankSub: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 24, paddingHorizontal: 16 },
  doneBtn: { marginTop: 8, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FBF7F0" },
});
