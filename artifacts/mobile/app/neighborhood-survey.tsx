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

const CITIES = [
  "Atlanta", "Houston", "Chicago", "Los Angeles", "New York",
  "Washington DC", "Detroit", "New Orleans", "Baltimore", "Philadelphia",
  "Miami", "Charlotte", "Dallas", "Memphis", "Oakland",
];

const DIMENSIONS = [
  { id: "safety_day", label: "Daytime Safety", icon: "sun" as const },
  { id: "safety_night", label: "Nighttime Safety", icon: "moon" as const },
  { id: "diversity", label: "Diversity & Inclusion", icon: "users" as const },
  { id: "schools", label: "Schools & Education", icon: "book" as const },
  { id: "cost", label: "Cost of Living", icon: "dollar-sign" as const },
  { id: "walkability", label: "Walkability", icon: "map-pin" as const },
  { id: "community", label: "Community Feel", icon: "heart" as const },
  { id: "blackowned", label: "Black-Owned Businesses", icon: "shopping-bag" as const },
];

const SENTIMENTS = [
  { id: "positive", label: "Helpful & Respectful", emoji: "👍" },
  { id: "neutral", label: "Mixed / Neutral", emoji: "🤷" },
  { id: "negative", label: "Harmful / Unsafe", emoji: "⚠️" },
  { id: "none", label: "No Experience", emoji: "🚫" },
];

const TOTAL_STEPS = 4;

function StarRating({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Feather name={n <= value ? "star" : "star"} size={28} color={n <= value ? color : "#D4D0C8"} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function NeighborhoodSurveyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState(1);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [sentiment, setSentiment] = useState("");
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const setRating = (id: string, v: number) => {
    setRatings((r) => ({ ...r, [id]: v }));
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const canNext1 = city.trim().length > 0 && neighborhood.trim().length > 0;
  const canNext2 = Object.keys(ratings).length >= 4;
  const canSubmit = sentiment.length > 0;

  const next = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
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
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>Survey Submitted!</Text>
          <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
            Thank you for helping your community make safer, more informed decisions.
          </Text>
          <View style={[styles.doneStat, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.doneStatNum, { color: colors.primary }]}>+25</Text>
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Neighborhood Survey</Text>
          <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>
            Step {step} of {TOTAL_STEPS}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(step / TOTAL_STEPS) * 100}%` as any }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Location */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>📍 Where are you rating?</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Your specific neighborhood helps others in the community
            </Text>

            <View style={{ gap: 8, marginTop: 8 }}>
              <Text style={[styles.label, { color: colors.foreground }]}>City</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }} contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}>
                {CITIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.cityChip,
                      { backgroundColor: city === c ? colors.primary : colors.secondary, borderColor: city === c ? colors.primary : colors.border },
                    ]}
                    onPress={() => setCity(c)}
                  >
                    <Text style={[styles.cityChipTxt, { color: city === c ? colors.primaryForeground : colors.foreground }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ gap: 8, marginTop: 16 }}>
              <Text style={[styles.label, { color: colors.foreground }]}>Neighborhood / Area</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Old Fourth Ward, Harlem, Hyde Park…"
                placeholderTextColor={colors.mutedForeground}
                value={neighborhood}
                onChangeText={setNeighborhood}
              />
            </View>
          </View>
        )}

        {/* Step 2: Ratings */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>⭐ Rate the Neighborhood</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              {neighborhood}, {city} — rate at least 4 categories
            </Text>
            <View style={{ gap: 20, marginTop: 8 }}>
              {DIMENSIONS.map((d) => (
                <View key={d.id} style={[styles.ratingRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.ratingLabel}>
                    <View style={[styles.ratingIconBox, { backgroundColor: colors.secondary }]}>
                      <Feather name={d.icon} size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.ratingLabelTxt, { color: colors.foreground }]}>{d.label}</Text>
                  </View>
                  <StarRating
                    value={ratings[d.id] ?? 0}
                    onChange={(v) => setRating(d.id, v)}
                    color={colors.primary}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Police sentiment */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>🚔 Police Sentiment</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              How would you describe your experience with local police in this area?
            </Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              {SENTIMENTS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.sentimentCard,
                    {
                      backgroundColor: sentiment === s.id ? colors.primary + "15" : colors.card,
                      borderColor: sentiment === s.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSentiment(s.id);
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 26 }}>{s.emoji}</Text>
                  <Text style={[styles.sentimentTxt, { color: colors.foreground }]}>{s.label}</Text>
                  {sentiment === s.id && <Feather name="check-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 4: Comments */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>💬 Anything to Add?</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Tips, warnings, or highlights for the community (optional)
            </Text>
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Share what visitors should know about this neighborhood…"
              placeholderTextColor={colors.mutedForeground}
              value={comments}
              onChangeText={setComments}
              multiline
              textAlignVertical="top"
            />
            <View style={[styles.anonRow, { backgroundColor: colors.secondary }]}>
              <Feather name="eye-off" size={18} color={colors.mutedForeground} />
              <Text style={[styles.anonTxt, { color: colors.mutedForeground }]}>
                Surveys are always shared anonymously with the community
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: (step === 1 ? canNext1 : canNext2) ? colors.primary : colors.muted }]}
            onPress={next}
            disabled={step === 1 ? !canNext1 : !canNext2}
          >
            <Text style={[styles.nextTxt, { color: (step === 1 ? canNext1 : canNext2) ? colors.primaryForeground : colors.mutedForeground }]}>
              Continue
            </Text>
            <Feather name="arrow-right" size={18} color={(step === 1 ? canNext1 : canNext2) ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: canSubmit ? colors.primary : colors.muted }]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Feather name="send" size={18} color={canSubmit ? colors.primaryForeground : colors.mutedForeground} />
            <Text style={[styles.nextTxt, { color: canSubmit ? colors.primaryForeground : colors.mutedForeground }]}>
              Submit Survey
            </Text>
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
  stepContent: { gap: 16 },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30 },
  stepSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  cityChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  cityChipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ratingRow: {
    gap: 10, paddingBottom: 16, borderBottomWidth: 1,
  },
  ratingLabel: { flexDirection: "row", alignItems: "center", gap: 10 },
  ratingIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ratingLabelTxt: { fontSize: 15, fontFamily: "Inter_500Medium" },
  sentimentCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 14, borderWidth: 1.5,
  },
  sentimentTxt: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  textarea: {
    borderWidth: 1, borderRadius: 14, padding: 14,
    fontSize: 15, fontFamily: "Inter_400Regular",
    minHeight: 140,
  },
  anonRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 14, borderRadius: 12,
  },
  anonTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  footer: {
    paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 17, borderRadius: 16,
  },
  nextTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  doneWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 20,
  },
  doneCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23 },
  doneStat: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
  },
  doneStatNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  doneStatLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  doneBtn: { alignItems: "center", paddingVertical: 17, paddingHorizontal: 40, borderRadius: 16 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
