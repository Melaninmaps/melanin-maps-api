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

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "Government",
  "Retail", "Legal", "Media", "Non-Profit", "Hospitality", "Other",
];

const DIMENSIONS = [
  { id: "inclusion", label: "Inclusion & Belonging", icon: "heart" as const, desc: "Do you feel welcomed and valued?" },
  { id: "promotion", label: "Promotion Opportunities", icon: "trending-up" as const, desc: "Fair path to advancement?" },
  { id: "leadership", label: "Leadership Diversity", icon: "users" as const, desc: "Diverse people in leadership?" },
  { id: "culture", label: "Workplace Culture", icon: "smile" as const, desc: "Overall day-to-day environment" },
  { id: "pay_equity", label: "Pay Equity", icon: "dollar-sign" as const, desc: "Fair compensation regardless of race" },
  { id: "work_life", label: "Work-Life Balance", icon: "clock" as const, desc: "Reasonable hours & flexibility" },
];

const RECOMMEND = [
  { id: "yes", emoji: "👍", label: "Yes, definitely" },
  { id: "maybe", emoji: "🤔", label: "Maybe / It depends" },
  { id: "no", emoji: "👎", label: "No, I wouldn't" },
];

const TOTAL_STEPS = 4;

function StarRating({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Feather name="star" size={26} color={n <= value ? color : "#D4D0C8"} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function EmployerSurveyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState(1);
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [recommend, setRecommend] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [isAnon, setIsAnon] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const setRating = (id: string, v: number) => {
    setRatings((r) => ({ ...r, [id]: v }));
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const canNext1 = company.trim().length > 0 && industry.length > 0;
  const canNext2 = Object.keys(ratings).length >= 4;
  const canNext3 = recommend.length > 0;

  const next = () => setStep((s) => s + 1);

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
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>Review Submitted!</Text>
          <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
            Your employer review helps Black professionals make better career decisions.
          </Text>
          <View style={[styles.doneStat, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.doneStatNum, { color: colors.primary }]}>+30</Text>
            <Text style={[styles.doneStatLabel, { color: colors.mutedForeground }]}>Community Points earned</Text>
          </View>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          >
            <Text style={[styles.doneBtnTxt, { color: colors.primaryForeground }]}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => (step > 1 ? setStep((s) => s - 1) : router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Employer Survey</Text>
          <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>Step {step} of {TOTAL_STEPS}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(step / TOTAL_STEPS) * 100}%` as any }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Company info */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>💼 About Your Employer</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Current or former employer — all reviews are anonymous
            </Text>

            <View style={{ gap: 6 }}>
              <Text style={[styles.label, { color: colors.foreground }]}>Company Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Google, Delta, City of Atlanta…"
                placeholderTextColor={colors.mutedForeground}
                value={company}
                onChangeText={setCompany}
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[styles.label, { color: colors.foreground }]}>City (optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="City where you worked"
                placeholderTextColor={colors.mutedForeground}
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={{ gap: 10 }}>
              <Text style={[styles.label, { color: colors.foreground }]}>Industry</Text>
              <View style={styles.industryGrid}>
                {INDUSTRIES.map((ind) => (
                  <TouchableOpacity
                    key={ind}
                    style={[
                      styles.industryChip,
                      { backgroundColor: industry === ind ? colors.primary : colors.secondary, borderColor: industry === ind ? colors.primary : colors.border },
                    ]}
                    onPress={() => setIndustry(ind)}
                  >
                    <Text style={[styles.industryTxt, { color: industry === ind ? colors.primaryForeground : colors.foreground }]}>
                      {ind}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 2: Dimension ratings */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>⭐ Rate Your Experience</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              {company} — rate at least 4 categories
            </Text>
            <View style={{ gap: 0 }}>
              {DIMENSIONS.map((d, i) => (
                <View
                  key={d.id}
                  style={[
                    styles.ratingBlock,
                    { borderBottomColor: colors.border, borderBottomWidth: i < DIMENSIONS.length - 1 ? 1 : 0 },
                  ]}
                >
                  <View style={styles.ratingLabelRow}>
                    <View style={[styles.ratingIconBox, { backgroundColor: colors.secondary }]}>
                      <Feather name={d.icon} size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ratingLabelTxt, { color: colors.foreground }]}>{d.label}</Text>
                      <Text style={[styles.ratingDesc, { color: colors.mutedForeground }]}>{d.desc}</Text>
                    </View>
                  </View>
                  <StarRating value={ratings[d.id] ?? 0} onChange={(v) => setRating(d.id, v)} color={colors.primary} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Recommend */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>🤔 Would You Recommend?</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Would you recommend {company} to other Black professionals?
            </Text>
            <View style={{ gap: 12, marginTop: 8 }}>
              {RECOMMEND.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.recommendCard,
                    {
                      backgroundColor: recommend === r.id ? colors.primary + "12" : colors.card,
                      borderColor: recommend === r.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setRecommend(r.id);
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 28 }}>{r.emoji}</Text>
                  <Text style={[styles.recommendTxt, { color: colors.foreground }]}>{r.label}</Text>
                  {recommend === r.id && <Feather name="check-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 4: Written review */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>✍️ Written Review</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Share more detail to help the community (optional)
            </Text>
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Share your experience — what was great, what could be better, any advice for Black employees…"
              placeholderTextColor={colors.mutedForeground}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.anonToggle, { backgroundColor: colors.secondary, borderColor: isAnon ? colors.primary : colors.border }]}
              onPress={() => setIsAnon(!isAnon)}
              activeOpacity={0.8}
            >
              <View style={[styles.anonCheck, { backgroundColor: isAnon ? colors.primary : "transparent", borderColor: isAnon ? colors.primary : colors.mutedForeground }]}>
                {isAnon && <Feather name="check" size={12} color="#FFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.anonLabel, { color: colors.foreground }]}>Post anonymously</Text>
                <Text style={[styles.anonSub, { color: colors.mutedForeground }]}>
                  Your name won't be visible to other users
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: (step === 1 ? canNext1 : step === 2 ? canNext2 : canNext3) ? colors.primary : colors.muted }]}
            onPress={next}
            disabled={!(step === 1 ? canNext1 : step === 2 ? canNext2 : canNext3)}
          >
            <Text style={[styles.nextTxt, { color: (step === 1 ? canNext1 : step === 2 ? canNext2 : canNext3) ? colors.primaryForeground : colors.mutedForeground }]}>
              Continue
            </Text>
            <Feather name="arrow-right" size={18} color={(step === 1 ? canNext1 : step === 2 ? canNext2 : canNext3) ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <Feather name="send" size={18} color={colors.primaryForeground} />
            <Text style={[styles.nextTxt, { color: colors.primaryForeground }]}>Submit Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerStep: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressTrack: { height: 3 },
  progressFill: { height: 3 },
  scroll: { padding: 20 },
  stepContent: { gap: 18 },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30 },
  stepSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  industryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  industryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  industryTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ratingBlock: { paddingVertical: 16, gap: 10 },
  ratingLabelRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ratingIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 2 },
  ratingLabelTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  ratingDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  recommendCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 14, borderWidth: 1.5,
  },
  recommendTxt: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  textarea: {
    borderWidth: 1, borderRadius: 14, padding: 14,
    fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 140,
  },
  anonToggle: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1.5,
  },
  anonCheck: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  anonLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  anonSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 17, borderRadius: 16,
  },
  nextTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 },
  doneCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23 },
  doneStat: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  doneStatNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  doneStatLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  doneBtn: { alignItems: "center", paddingVertical: 17, paddingHorizontal: 40, borderRadius: 16 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
