import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type ItineraryDay = {
  day: string;
  theme: string;
  activities: { time: string; title: string; description: string; location?: string }[];
  meals: { meal: string; restaurant: string; cuisine: string; note?: string | null }[];
};

type ItineraryOption = {
  id: number;
  title: string;
  destination: string;
  dates: string;
  theme: string;
  budget: string;
  whyItWorks: string;
  safetyNote: string;
  days: ItineraryDay[];
};

type GroupItineraryContent = {
  summary: string;
  memberCount: number;
  sharedInterests: string[];
  options: ItineraryOption[];
  generatedAt: string;
};

const TRIP_LENGTHS = [
  { value: "Weekend (2 days)", label: "Weekend" },
  { value: "3-4 Days", label: "3–4 Days" },
  { value: "1 Week", label: "1 Week" },
];

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export default function PlanTripScreen() {
  const { id, groupName, memberCount } = useLocalSearchParams<{
    id: string;
    groupName?: string;
    memberCount?: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [tripLength, setTripLength] = useState(TRIP_LENGTHS[0].value);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GroupItineraryContent | null>(null);
  const [expandedOption, setExpandedOption] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const numMembers = parseInt(memberCount ?? "2", 10);

  const generate = async () => {
    if (!id) return;
    setLoading(true);
    setResult(null);
    setSaved(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const apiBase = getApiBase();
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${apiBase}/api/groups/${id}/plan-trip`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ destination: destination.trim() || undefined, tripLength }),
      });
      if (res.ok) {
        const data = await res.json() as { itinerary: { content: GroupItineraryContent } };
        setResult(data.itinerary.content);
        setExpandedOption(data.itinerary.content.options?.[0]?.id ?? null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSaved(true);
      } else {
        const err = await res.json() as { error?: string };
        Alert.alert("Couldn't generate plan", err.error ?? "Please try again.");
      }
    } catch {
      Alert.alert("Error", "Could not connect. Try again.");
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Plan a Trip Together</Text>
          {groupName ? (
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>{groupName}</Text>
          ) : null}
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {!result && !loading && (
          <>
            <View style={[styles.heroBanner, { backgroundColor: "#2D7A4F18" }]}>
              <View style={styles.heroIconWrap}>
                <Feather name="map" size={28} color="#2D7A4F" />
              </View>
              <View style={styles.heroText}>
                <Text style={[styles.heroTitle, { color: colors.foreground }]}>AI Group Planner</Text>
                <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
                  KinfolkAI will read all {numMembers} members&apos; travel preferences and suggest{" "}
                  <Text style={{ fontFamily: "Inter_600SemiBold" }}>3 trip options</Text> tailored to your crew — with
                  community-verified spots, cultural landmarks, and safety ratings.
                </Text>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>DESTINATION (OPTIONAL)</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="map-pin" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="e.g. Atlanta, New Orleans, Miami..."
                placeholderTextColor={colors.mutedForeground}
                value={destination}
                onChangeText={setDestination}
                returnKeyType="done"
              />
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>TRIP LENGTH</Text>
            <View style={styles.chipRow}>
              {TRIP_LENGTHS.map((tl) => {
                const active = tripLength === tl.value;
                return (
                  <TouchableOpacity
                    key={tl.value}
                    style={[
                      styles.chip,
                      { borderColor: active ? "#2D7A4F" : colors.border, backgroundColor: active ? "#2D7A4F18" : colors.card },
                    ]}
                    onPress={() => { setTripLength(tl.value); Haptics.selectionAsync(); }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, { color: active ? "#2D7A4F" : colors.foreground }]}>{tl.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: "#2D7A4F" }]}
              onPress={() => void generate()}
              activeOpacity={0.85}
            >
              <Feather name="zap" size={18} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>Generate Itinerary</Text>
            </TouchableOpacity>
          </>
        )}

        {loading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#2D7A4F" />
            <Text style={[styles.loadingTitle, { color: colors.foreground }]}>Analyzing preferences...</Text>
            <Text style={[styles.loadingSubtitle, { color: colors.mutedForeground }]}>
              KinfolkAI is reading all {numMembers} members&apos; travel preferences and crafting personalized trip options.
            </Text>
          </View>
        )}

        {result && (
          <>
            <View style={[styles.resultHeader, { backgroundColor: "#2D7A4F18" }]}>
              <Feather name="check-circle" size={18} color="#2D7A4F" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultTitle, { color: colors.foreground }]}>Your Trip Plans Are Ready!</Text>
                <Text style={[styles.resultSummary, { color: colors.mutedForeground }]}>{result.summary}</Text>
              </View>
            </View>

            {result.sharedInterests?.length > 0 && (
              <View style={styles.interestsRow}>
                {result.sharedInterests.map((interest) => (
                  <View key={interest} style={[styles.interestChip, { backgroundColor: "#C9922B18" }]}>
                    <Text style={styles.interestChipText}>{interest}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.options?.map((option) => (
              <ItineraryCard
                key={option.id}
                option={option}
                expanded={expandedOption === option.id}
                onToggle={() => {
                  setExpandedOption((prev) => (prev === option.id ? null : option.id));
                  Haptics.selectionAsync();
                }}
                colors={colors}
              />
            ))}

            {saved && (
              <View style={[styles.savedBadge, { backgroundColor: "#2D7A4F18" }]}>
                <Feather name="save" size={14} color="#2D7A4F" />
                <Text style={styles.savedBadgeText}>Plan saved to your group — all members can view it</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.regenerateBtn, { borderColor: "#2D7A4F" }]}
              onPress={() => { setResult(null); setSaved(false); }}
              activeOpacity={0.75}
            >
              <Feather name="refresh-cw" size={15} color="#2D7A4F" />
              <Text style={[styles.regenerateBtnText, { color: "#2D7A4F" }]}>Generate New Options</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

type ColorsType = ReturnType<typeof import("@/hooks/useColors").useColors>;

function ItineraryCard({
  option,
  expanded,
  onToggle,
  colors,
}: {
  option: ItineraryOption;
  expanded: boolean;
  onToggle: () => void;
  colors: ColorsType;
}) {
  return (
    <View style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.optionHeader} onPress={onToggle} activeOpacity={0.75}>
        <View style={styles.optionHeaderLeft}>
          <Text style={[styles.optionTitle, { color: colors.foreground }]}>{option.title}</Text>
          <View style={styles.optionMeta}>
            <Feather name="map-pin" size={11} color={colors.mutedForeground} />
            <Text style={[styles.optionMetaText, { color: colors.mutedForeground }]}>{option.destination}</Text>
            <Text style={[styles.optionMetaDot, { color: colors.mutedForeground }]}>·</Text>
            <Text style={[styles.optionMetaText, { color: colors.mutedForeground }]}>{option.dates}</Text>
          </View>
          <View style={styles.optionBadges}>
            <View style={[styles.optionBadge, { backgroundColor: "#C9922B18" }]}>
              <Text style={[styles.optionBadgeText, { color: "#C9922B" }]}>{option.theme}</Text>
            </View>
            <View style={[styles.optionBadge, { backgroundColor: "#2D7A4F18" }]}>
              <Text style={[styles.optionBadgeText, { color: "#2D7A4F" }]}>{option.budget}</Text>
            </View>
          </View>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.optionBody}>
          <Text style={[styles.whyText, { color: colors.foreground, borderTopColor: colors.border }]}>
            {option.whyItWorks}
          </Text>
          <View style={[styles.safetyRow, { backgroundColor: "#2D7A4F12" }]}>
            <Feather name="shield" size={13} color="#2D7A4F" />
            <Text style={styles.safetyText}>{option.safetyNote}</Text>
          </View>

          {option.days?.map((day) => (
            <View key={day.day} style={[styles.dayBlock, { borderTopColor: colors.border }]}>
              <Text style={[styles.dayLabel, { color: "#2D7A4F" }]}>{day.day} — {day.theme}</Text>

              {day.activities?.map((act, i) => (
                <View key={i} style={styles.activityRow}>
                  <Text style={[styles.actTime, { color: colors.mutedForeground }]}>{act.time}</Text>
                  <View style={styles.actBody}>
                    <Text style={[styles.actTitle, { color: colors.foreground }]}>{act.title}</Text>
                    <Text style={[styles.actDesc, { color: colors.mutedForeground }]}>{act.description}</Text>
                    {act.location ? (
                      <View style={styles.actLocation}>
                        <Feather name="map-pin" size={10} color={colors.mutedForeground} />
                        <Text style={[styles.actLocationText, { color: colors.mutedForeground }]}>{act.location}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}

              {day.meals?.length > 0 && (
                <View style={[styles.mealsSection, { backgroundColor: colors.background }]}>
                  {day.meals.map((meal, i) => (
                    <View key={i} style={styles.mealRow}>
                      <Feather name="coffee" size={12} color="#C9922B" />
                      <Text style={[styles.mealLabel, { color: colors.mutedForeground }]}>{meal.meal}:</Text>
                      <Text style={[styles.mealName, { color: colors.foreground }]}>{meal.restaurant}</Text>
                      <Text style={[styles.mealCuisine, { color: colors.mutedForeground }]}>({meal.cuisine})</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  scroll: { padding: 16, gap: 14 },
  heroBanner: { flexDirection: "row", gap: 14, padding: 16, borderRadius: 16, alignItems: "flex-start" },
  heroIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#2D7A4F22", alignItems: "center", justifyContent: "center" },
  heroText: { flex: 1, gap: 6 },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  heroSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8, marginBottom: -6 },
  inputBox: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, padding: 0 },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, alignItems: "center" },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 54, borderRadius: 16, marginTop: 4 },
  generateBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
  loadingState: { alignItems: "center", paddingTop: 60, gap: 16 },
  loadingTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  loadingSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", maxWidth: 280, lineHeight: 21 },
  resultHeader: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, alignItems: "flex-start" },
  resultTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 4 },
  resultSummary: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  interestsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  interestChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: "#C9922B" },
  optionCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  optionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 16, gap: 12 },
  optionHeaderLeft: { flex: 1, gap: 6 },
  optionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  optionMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  optionMetaText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  optionMetaDot: { fontFamily: "Inter_400Regular", fontSize: 12 },
  optionBadges: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  optionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  optionBadgeText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  optionBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  whyText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, borderTopWidth: 1, paddingTop: 10 },
  safetyRow: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 10, alignItems: "flex-start" },
  safetyText: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#2D7A4F", flex: 1, lineHeight: 18 },
  dayBlock: { gap: 8, borderTopWidth: 1, paddingTop: 12 },
  dayLabel: { fontFamily: "Inter_700Bold", fontSize: 13 },
  activityRow: { flexDirection: "row", gap: 10 },
  actTime: { fontFamily: "Inter_500Medium", fontSize: 11, width: 54, paddingTop: 2 },
  actBody: { flex: 1, gap: 2 },
  actTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  actDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  actLocation: { flexDirection: "row", alignItems: "center", gap: 4 },
  actLocationText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  mealsSection: { borderRadius: 10, padding: 10, gap: 6 },
  mealRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  mealLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  mealName: { fontFamily: "Inter_600SemiBold", fontSize: 12, flex: 1 },
  mealCuisine: { fontFamily: "Inter_400Regular", fontSize: 11 },
  savedBadge: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 12, alignItems: "center" },
  savedBadgeText: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#2D7A4F", flex: 1 },
  regenerateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 14, borderWidth: 1.5 },
  regenerateBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
