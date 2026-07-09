import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const TRAVEL_STYLES = [
  "Explorer", "Foodie", "Culture Seeker", "Nightlife", "Wellness",
  "Shopper", "History Buff", "Business Traveler", "Adventure Seeker", "Relaxation",
];
const CITIES = [
  "Atlanta", "Houston", "Chicago", "Washington DC", "New York",
  "New Orleans", "Los Angeles", "Miami", "Dallas", "Philadelphia",
  "Detroit", "Baltimore", "Memphis", "Charlotte",
];
const COMPANIONS = ["Solo", "Partner", "Friends", "Family", "Work Colleagues"];
const BUDGETS = ["Budget", "Mid-range", "Luxury"];
const TRIP_LENGTHS = ["Day trip", "Weekend getaway", "3–5 days", "A week or more"];
const INTERESTS = [
  "Restaurants", "Bars & Nightlife", "Salons & Spas", "Shopping", "Hotels",
  "Entertainment", "Fitness", "Coffee Shops", "Art & Culture",
  "Outdoor Activities", "Minority-Owned Only",
];
const SAFETY_PRIORITIES = [
  { id: "top", label: "Top priority — always filter by safety score", weight: 1.0 },
  { id: "high", label: "High priority — strongly prefer safer places", weight: 0.75 },
  { id: "moderate", label: "Moderate — balance safety with other factors", weight: 0.50 },
  { id: "low", label: "Low priority — I decide case by case", weight: 0.30 },
  { id: "off", label: "Show me everything — I'll assess myself", weight: 0.20 },
];
const ACCESSIBILITY_NEEDS = [
  "Wheelchair accessible", "Quiet spaces", "Sensory-friendly",
  "Gender-neutral restrooms", "Service animal friendly",
];

const TOTAL_STEPS = 4;

function Chip({ label, selected, onPress, multi = false, color, primaryForeground, secondary, border, foreground }: {
  label: string; selected: boolean; onPress: () => void; multi?: boolean;
  color: string; primaryForeground: string; secondary: string; border: string; foreground: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: selected ? color : secondary, borderColor: selected ? color : border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {multi && selected && <Feather name="check" size={11} color={primaryForeground} style={{ marginRight: 2 }} />}
      <Text style={[styles.chipTxt, { color: selected ? primaryForeground : foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function OnboardingPreferenceSurveyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState(1);
  const [travelStyle, setTravelStyle] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [companions, setCompanions] = useState("");
  const [budget, setBudget] = useState("");
  const [tripLength, setTripLength] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [safetyPriority, setSafetyPriority] = useState("");
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleStyle = (s: string) => {
    setTravelStyle((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const canNext1 = travelStyle.length > 0;
  const canNext2 = selectedCities.length >= 1;
  const canNext3 = companions.length > 0 && budget.length > 0;
  const canNext4 = interests.length >= 1 && safetyPriority.length > 0;
  const canGoNext = step === 1 ? canNext1 : step === 2 ? canNext2 : step === 3 ? canNext3 : canNext4;

  const next = () => setStep((s) => s + 1);

  const toggleCity = (c: string) => {
    setSelectedCities((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const toggleInterest = (i: string) => {
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const toggleAccess = (a: string) => {
    setAccessibility((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const safetyObj = SAFETY_PRIORITIES.find((s) => s.id === safetyPriority);
  const blackOwnedWeight = interests.includes("Minority-Owned Only") ? 1.0 : 0;

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
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>Preferences Saved!</Text>
          <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
            Your personalization profile has been built. Your For You feed will now match your travel style.
          </Text>
          <View style={[styles.profileRow, { backgroundColor: colors.secondary }]}>
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: colors.primary }]} numberOfLines={1}>{travelStyle.join(", ")}</Text>
              <Text style={[styles.profileKey, { color: colors.mutedForeground }]}>Travel Style</Text>
            </View>
            <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: colors.primary }]}>{selectedCities.length}</Text>
              <Text style={[styles.profileKey, { color: colors.mutedForeground }]}>Cities</Text>
            </View>
            <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />
            <View style={styles.profileItem}>
              <Text style={[styles.profileVal, { color: colors.primary }]}>{Math.round((safetyObj?.weight ?? 0) * 100)}%</Text>
              <Text style={[styles.profileKey, { color: colors.mutedForeground }]}>Safety Weight</Text>
            </View>
            {blackOwnedWeight > 0 && (
              <>
                <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />
                <View style={styles.profileItem}>
                  <Text style={[styles.profileVal, { color: colors.primary }]}>100%</Text>
                  <Text style={[styles.profileKey, { color: colors.mutedForeground }]}>Minority-Owned</Text>
                </View>
              </>
            )}
          </View>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          >
            <Text style={[styles.doneBtnTxt, { color: colors.primaryForeground }]}>View My For You</Text>
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Travel Preferences</Text>
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
        {/* Step 1 — Travel Style */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>✈️ Travel Style</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              How do you like to travel? Pick all that apply
            </Text>
            <View style={styles.chips}>
              {TRAVEL_STYLES.map((s) => (
                <Chip key={s} label={s} selected={travelStyle.includes(s)} multi onPress={() => toggleStyle(s)}
                  color={colors.primary} primaryForeground={colors.primaryForeground}
                  secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
              ))}
            </View>
          </View>
        )}

        {/* Step 2 — Cities */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>🗺️ Cities of Interest</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Select at least one city — your feed will prioritize these
            </Text>
            <View style={styles.chips}>
              {CITIES.map((c) => (
                <Chip key={c} label={c} selected={selectedCities.includes(c)} multi onPress={() => toggleCity(c)}
                  color={colors.primary} primaryForeground={colors.primaryForeground}
                  secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
              ))}
            </View>
            {selectedCities.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Feather name="map-pin" size={14} color={colors.primary} />
                <Text style={[styles.countTxt, { color: colors.primary }]}>{selectedCities.length} {selectedCities.length === 1 ? "city" : "cities"} selected</Text>
              </View>
            )}
          </View>
        )}

        {/* Step 3 — Companions + Context */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>👥 Travel Context</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Travel companions and budget are required
            </Text>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Travel companions</Text>
              <View style={styles.chips}>
                {COMPANIONS.map((c) => (
                  <Chip key={c} label={c} selected={companions === c} onPress={() => { setCompanions(c); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Budget range</Text>
              <View style={styles.chips}>
                {BUDGETS.map((b) => (
                  <Chip key={b} label={b} selected={budget === b} onPress={() => { setBudget(b); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Typical trip length <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <View style={styles.chips}>
                {TRIP_LENGTHS.map((t) => (
                  <Chip key={t} label={t} selected={tripLength === t} onPress={() => { setTripLength(t); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 4 — Interests + Safety Priority */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>🎯 Interests & Safety</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              At least one interest and a safety priority are required — these power your personalization
            </Text>

            <View style={styles.qBlock}>
              <View style={styles.qLabelRow}>
                <Text style={[styles.qLabel, { color: colors.foreground }]}>What are you most interested in?</Text>
              </View>
              <View style={styles.chips}>
                {INTERESTS.map((i) => (
                  <Chip key={i} label={i} selected={interests.includes(i)} multi onPress={() => toggleInterest(i)}
                    color={i === "Minority-Owned Only" ? colors.accent : colors.primary}
                    primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>How important is safety scoring to you?</Text>
              <View style={{ gap: 10 }}>
                {SAFETY_PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.priorityCard,
                      { backgroundColor: safetyPriority === p.id ? colors.primary + "12" : colors.card, borderColor: safetyPriority === p.id ? colors.primary : colors.border },
                    ]}
                    onPress={() => { setSafetyPriority(p.id); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.priorityTxt, { color: colors.foreground }]}>{p.label}</Text>
                    </View>
                    <Text style={[styles.priorityWeight, { color: safetyPriority === p.id ? colors.primary : colors.mutedForeground }]}>
                      {Math.round(p.weight * 100)}%
                    </Text>
                    {safetyPriority === p.id && <Feather name="check-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Any accessibility needs? <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <View style={styles.chips}>
                {ACCESSIBILITY_NEEDS.map((a) => (
                  <Chip key={a} label={a} selected={accessibility.includes(a)} multi onPress={() => toggleAccess(a)}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
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
            style={[styles.nextBtn, { backgroundColor: canNext4 ? colors.primary : colors.muted }]}
            onPress={handleSubmit}
            disabled={!canNext4}
          >
            <Feather name="check" size={18} color={canNext4 ? colors.primaryForeground : colors.mutedForeground} />
            <Text style={[styles.nextTxt, { color: canNext4 ? colors.primaryForeground : colors.mutedForeground }]}>Save Preferences</Text>
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
  qBlock: { gap: 10 },
  qLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  qLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  countBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  countTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  priorityCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  priorityTxt: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  priorityWeight: { fontSize: 13, fontFamily: "Inter_700Bold", minWidth: 36, textAlign: "right" },
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17, borderRadius: 16 },
  nextTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 18 },
  doneCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23 },
  profileRow: { flexDirection: "row", borderRadius: 16, padding: 16, gap: 0, alignSelf: "stretch" },
  profileItem: { flex: 1, alignItems: "center", gap: 4 },
  profileVal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  profileKey: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  profileDivider: { width: 1, marginVertical: 4 },
  doneBtn: { alignItems: "center", paddingVertical: 17, paddingHorizontal: 40, borderRadius: 16 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
