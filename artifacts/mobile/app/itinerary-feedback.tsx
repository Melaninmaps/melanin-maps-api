import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

const WOULD_USE_AGAIN = [
  { id: "absolutely", label: "Absolutely — already planning my next one" },
  { id: "yes", label: "Yes, I would use it again" },
  { id: "maybe", label: "Maybe, with some improvements" },
  { id: "probably_not", label: "Probably not" },
  { id: "no", label: "No — it missed the mark" },
];
const WHAT_WORKED = [
  "Great restaurant picks", "Good safety scores", "Realistic timing",
  "Matched my budget", "Black-owned focus", "Good neighborhood variety",
  "Accurate descriptions", "Easy to follow", "Discovered new places", "Felt culturally relevant",
];
const WHAT_TO_IMPROVE = [
  "More diverse categories", "Better safety context", "More budget options",
  "Longer itineraries", "Better time estimates", "More local gems",
  "Clearer directions", "More nightlife options", "More family-friendly options", "Better Black-owned coverage",
];

const TOTAL_STEPS = 4;

const OVERALL_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
const ACCURACY_LABELS = ["", "Very inaccurate", "Somewhat off", "Mostly accurate", "Accurate", "Spot on"];
const USEFUL_LABELS = ["", "Not useful", "Slightly useful", "Helpful", "Very helpful", "Extremely useful"];

function StarRow({ value, onChange, size = 30, color, labels }: {
  value: number; onChange: (v: number) => void; size?: number; color: string; labels?: string[];
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity activeOpacity={0.85} key={n} onPress={() => onChange(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Feather name="star" size={size} color={n <= value ? color : "#D4D0C8"} />
          </TouchableOpacity>
        ))}
      </View>
      {labels && value > 0 && (
        <Text style={[styles.ratingHint, { color }]}>{labels[value]}</Text>
      )}
    </View>
  );
}

function Chip({ label, selected, onPress, color, primaryForeground, secondary, border, foreground }: {
  label: string; selected: boolean; onPress: () => void;
  color: string; primaryForeground: string; secondary: string; border: string; foreground: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: selected ? color : secondary, borderColor: selected ? color : border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {selected && <Feather name="check" size={11} color={primaryForeground} style={{ marginRight: 2 }} />}
      <Text style={[styles.chipTxt, { color: selected ? primaryForeground : foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function computeScore(overall: number, accuracy: number, usefulness: number): number {
  if (!overall) return 0;
  const acc = accuracy || 0;
  const use = usefulness || 0;
  return Math.round((overall * 0.40 + acc * 0.35 + use * 0.25) / 5 * 100);
}

export default function ItineraryFeedbackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState(1);
  const [overallRating, setOverallRating] = useState(0);
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [usefulnessRating, setUsefulnessRating] = useState(0);
  const [wouldUseAgain, setWouldUseAgain] = useState("");
  const [whatWorked, setWhatWorked] = useState<string[]>([]);
  const [whatToImprove, setWhatToImprove] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const allRatingsFilled = overallRating > 0 && accuracyRating > 0 && usefulnessRating > 0;
  const score = computeScore(overallRating, accuracyRating, usefulnessRating);

  const canNext1 = overallRating > 0;
  const canNext2 = wouldUseAgain.length > 0;
  const canGoNext = step === 1 ? canNext1 : step === 2 ? canNext2 : true;

  const next = () => setStep((s) => s + 1);

  const toggleMulti = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (submitted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.doneWrap, { paddingTop: topPad }]}>
          <View style={[styles.doneCircle, { backgroundColor: colors.success + "20" }]}>
            <Feather name="check-circle" size={56} color={colors.success} />
          </View>
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>Feedback Submitted!</Text>
          <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
            Your feedback helps us make AI itineraries smarter and more culturally relevant.
          </Text>
          <View style={[styles.scoreCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <Text style={[styles.scoreNum, { color: colors.primary }]}>{score}</Text>
            <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Itinerary Score / 100</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          >
            <Text style={[styles.doneBtnTxt, { color: colors.primaryForeground }]}>Back to For You</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85}
          style={styles.back}
          onPress={() => step > 1 ? setStep((s) => s - 1) : router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Rate This Itinerary</Text>
          <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>Step {step} of {TOTAL_STEPS}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(step / TOTAL_STEPS) * 100}%` as any }]} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1 — Star Ratings */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>⭐ Rate the Itinerary</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Overall quality is required — accuracy and usefulness are optional but improve the score
            </Text>

            <View style={[styles.ratingBlock, { borderColor: colors.border }]}>
              <View style={styles.ratingBlockHeader}>
                <Text style={[styles.ratingBlockTitle, { color: colors.foreground }]}>Overall quality</Text>
                <Text style={[styles.ratingWeight, { color: colors.mutedForeground }]}>40%</Text>
              </View>
              <StarRow value={overallRating} onChange={(v) => { setOverallRating(v); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                size={34} color={colors.primary} labels={OVERALL_LABELS} />
            </View>

            <View style={[styles.ratingBlock, { borderColor: colors.border }]}>
              <View style={styles.ratingBlockHeader}>
                <Text style={[styles.ratingBlockTitle, { color: colors.foreground }]}>Accuracy of recommendations</Text>
                <Text style={[styles.ratingWeight, { color: colors.mutedForeground }]}>35%</Text>
              </View>
              <StarRow value={accuracyRating} onChange={(v) => { setAccuracyRating(v); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                size={34} color={colors.accent} labels={ACCURACY_LABELS} />
            </View>

            <View style={[styles.ratingBlock, { borderColor: colors.border }]}>
              <View style={styles.ratingBlockHeader}>
                <Text style={[styles.ratingBlockTitle, { color: colors.foreground }]}>How useful was it for planning?</Text>
                <Text style={[styles.ratingWeight, { color: colors.mutedForeground }]}>25%</Text>
              </View>
              <StarRow value={usefulnessRating} onChange={(v) => { setUsefulnessRating(v); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                size={34} color={colors.primary} labels={USEFUL_LABELS} />
            </View>

            {allRatingsFilled && (
              <View style={[styles.liveScore, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.liveScoreLabel, { color: colors.mutedForeground }]}>Itinerary Score</Text>
                <Text style={[styles.liveScoreNum, { color: colors.primary }]}>
                  {score}<Text style={[styles.liveScoreOf, { color: colors.mutedForeground }]}>/100</Text>
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 2 — Would Use Again */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>🔄 Would You Use AI Itineraries Again?</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Select the option that best describes your experience
            </Text>
            <View style={{ gap: 10 }}>
              {WOULD_USE_AGAIN.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionCard,
                    { backgroundColor: wouldUseAgain === opt.id ? colors.primary + "12" : colors.card, borderColor: wouldUseAgain === opt.id ? colors.primary : colors.border },
                  ]}
                  onPress={() => { setWouldUseAgain(opt.id); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionTxt, { color: colors.foreground }]}>{opt.label}</Text>
                  {wouldUseAgain === opt.id && <Feather name="check-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3 — What Worked + What to Improve */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>💬 What Worked?</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Both sections are optional — select as many as apply
            </Text>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>What worked well?</Text>
              <View style={styles.chips}>
                {WHAT_WORKED.map((t) => (
                  <Chip key={t} label={t} selected={whatWorked.includes(t)}
                    onPress={() => toggleMulti(whatWorked, setWhatWorked, t)}
                    color={colors.success} primaryForeground="#FFF"
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>What needs improvement?</Text>
              <View style={styles.chips}>
                {WHAT_TO_IMPROVE.map((t) => (
                  <Chip key={t} label={t} selected={whatToImprove.includes(t)}
                    onPress={() => toggleMulti(whatToImprove, setWhatToImprove, t)}
                    color={colors.accent} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 4 — Open Comments */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>✍️ Any Other Feedback?</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Optional — share anything else that would help us improve
            </Text>
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Share your thoughts on the AI itinerary experience…"
              placeholderTextColor={colors.mutedForeground}
              value={comments}
              onChangeText={(t) => t.length <= 500 && setComments(t)}
              multiline
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{comments.length}/500</Text>

            <View style={[styles.anonRow, { backgroundColor: colors.secondary }]}>
              <Feather name="eye-off" size={16} color={colors.mutedForeground} />
              <Text style={[styles.anonTxt, { color: colors.mutedForeground }]}>
                Feedback is always collected anonymously to improve the AI model
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.nextBtn, { backgroundColor: canGoNext ? colors.primary : colors.muted }]}
            onPress={next}
            disabled={!canGoNext}
          >
            <Text style={[styles.nextTxt, { color: canGoNext ? colors.primaryForeground : colors.mutedForeground }]}>Continue</Text>
            <Feather name="arrow-right" size={18} color={canGoNext ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <Feather name="send" size={18} color={colors.primaryForeground} />
            <Text style={[styles.nextTxt, { color: colors.primaryForeground }]}>Submit Feedback</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerStep: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressTrack: { height: 3 },
  progressFill: { height: 3 },
  scroll: { padding: 20 },
  stepContent: { gap: 20 },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30 },
  stepSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginTop: -8 },
  ratingBlock: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  ratingBlockHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ratingBlockTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  ratingWeight: { fontSize: 12, fontFamily: "Inter_500Medium" },
  ratingHint: { fontSize: 13, fontFamily: "Inter_500Medium" },
  liveScore: { borderWidth: 1, borderRadius: 14, padding: 16, alignItems: "center", gap: 4 },
  liveScoreLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  liveScoreNum: { fontSize: 36, fontFamily: "Inter_700Bold" },
  liveScoreOf: { fontSize: 16, fontFamily: "Inter_400Regular" },
  optionCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, borderWidth: 1.5, gap: 12 },
  optionTxt: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", lineHeight: 21 },
  qBlock: { gap: 10 },
  qLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  textarea: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 140 },
  charCount: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  anonRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12 },
  anonTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17, borderRadius: 16 },
  nextTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 18 },
  doneCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23 },
  scoreCard: { borderWidth: 1, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 40, alignItems: "center", gap: 4 },
  scoreNum: { fontSize: 48, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  doneBtn: { alignItems: "center", paddingVertical: 17, paddingHorizontal: 40, borderRadius: 16 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
