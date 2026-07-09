import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import * as SecureStore from "expo-secure-store";

const CITIES = [
  "Atlanta", "Houston", "Chicago", "Washington DC", "New York",
  "New Orleans", "Los Angeles", "Miami", "Dallas", "Philadelphia",
  "Detroit", "Baltimore", "Memphis", "Charlotte", "Other",
];
const VISIT_PURPOSES = [
  "Dining out", "Shopping", "Nightlife", "Sightseeing",
  "Staying nearby", "Commuting", "Just passing through",
];
const VISIT_FREQ = ["First time", "Occasionally", "Regularly", "I live here"];
const ATMOSPHERES = [
  { id: "very_welcoming", label: "Very welcoming", score: 5 },
  { id: "mostly_welcoming", label: "Mostly welcoming", score: 4 },
  { id: "neutral", label: "Neutral", score: 3 },
  { id: "slightly_unwelcoming", label: "Slightly unwelcoming", score: 2 },
  { id: "uncomfortable", label: "Uncomfortable", score: 1 },
];
const ACCESSIBILITY_FEATURES = [
  "Wheelchair accessible sidewalks", "Good street lighting", "Accessible public transit",
  "Gender-neutral restrooms nearby", "Family-friendly spaces", "LGBTQ+ friendly businesses", "None noticed",
];
const VISITOR_TIPS = [
  "Great for solo travelers", "Better with a group at night", "Keep valuables hidden",
  "Use rideshare after dark", "Parking can be tricky", "Very family friendly",
  "Active street life", "Quiet and residential",
];

const TOTAL_STEPS = 5;

const CULTURALLY_CONNECTED_OPTIONS = [
  { id: "very_connected", label: "Very connected — felt right at home" },
  { id: "somewhat_connected", label: "Somewhat connected" },
  { id: "neutral", label: "Neutral" },
  { id: "somewhat_disconnected", label: "Somewhat disconnected" },
  { id: "not_connected", label: "Not culturally connected" },
];

function ScaleRating({ value, onChange, color, lowLabel, highLabel }: {
  value: number; onChange: (v: number) => void; color: string; lowLabel: string; highLabel: string;
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity activeOpacity={0.85}
            key={n}
            style={[
              styles.scaleBtn,
              { backgroundColor: n <= value ? color : "transparent", borderColor: n <= value ? color : "#D4D0C8" },
            ]}
            onPress={() => { onChange(n); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={[styles.scaleBtnTxt, { color: n <= value ? "#FFF" : "#888" }]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLow}>{lowLabel}</Text>
        <Text style={styles.scaleHigh}>{highLabel}</Text>
      </View>
    </View>
  );
}

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

function computeScores(daytime: number, nighttime: number, walkability: number, transit: number, atmosphereScore: number) {
  const s = (v: number) => v / 5 * 100;
  const safety = daytime && nighttime
    ? Math.round(s(daytime) * 0.30 + s(nighttime) * 0.40 + s(walkability || 0) * 0.20 + s(transit || 0) * 0.10)
    : 0;
  const community = atmosphereScore ? Math.round(s(atmosphereScore)) : 0;
  const walk = walkability
    ? Math.round(s(walkability) * 0.70 + s(transit || 0) * 0.30)
    : 0;
  return { safety, community, walk };
}

export default function NeighborhoodSurveyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState(1);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [visitPurpose, setVisitPurpose] = useState("");
  const [visitFreq, setVisitFreq] = useState("");
  const [daytimeSafety, setDaytimeSafety] = useState(0);
  const [nighttimeSafety, setNighttimeSafety] = useState(0);
  const [walkability, setWalkability] = useState(0);
  const [transitSafety, setTransitSafety] = useState(0);
  const [atmosphere, setAtmosphere] = useState("");
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [communityRating, setCommunityRating] = useState(0);
  const [culturallyConnected, setCulturallyConnected] = useState("");
  const [nominationName, setNominationName] = useState("");
  const [nominationCategory, setNominationCategory] = useState("");
  const [nominationSocialLink, setNominationSocialLink] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const atmosphereObj = ATMOSPHERES.find((a) => a.id === atmosphere);
  const scores = computeScores(daytimeSafety, nighttimeSafety, walkability, transitSafety, atmosphereObj?.score ?? 0);

  const canNext1 = city.length > 0 && visitPurpose.length > 0;
  const canNext2 = daytimeSafety > 0 && nighttimeSafety > 0;
  const canNext3 = atmosphere.length > 0;
  const canGoNext = step === 1 ? canNext1 : step === 2 ? canNext2 : step === 3 ? canNext3 : true;

  const next = () => setStep((s) => s + 1);

  const handleSubmit = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);

    const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

    try {
      const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${apiBase}/api/surveys`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          city,
          neighborhood: neighborhood || undefined,
          visitPurpose,
          visitFreq: visitFreq || undefined,
          daytimeSafety,
          nighttimeSafety,
          walkability: walkability || undefined,
          transitSafety: transitSafety || undefined,
          atmosphere,
          communityRating: communityRating || undefined,
          culturallyConnected: culturallyConnected || undefined,
          nomination: nominationName ? {
            name: nominationName,
            category: nominationCategory || undefined,
            socialLink: nominationSocialLink || undefined,
          } : undefined,
          accessibility,
          tips,
          comments: comments || undefined,
        }),
      });
    } catch {
      setSubmitted(false);
      Alert.alert("Submission Failed", "We couldn't save your survey. Please check your connection and try again.");
    }
  };

  const toggleMulti = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
    if (Platform.OS !== "web") Haptics.selectionAsync();
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
          <View style={[styles.scoresRow]}>
            {[
              { label: "Safety", val: scores.safety },
              { label: "Community", val: scores.community },
              { label: "Walkability", val: scores.walk },
            ].map((s) => (
              <View key={s.label} style={[styles.scoreCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
                <Text style={[styles.scoreNum, { color: colors.primary }]}>{s.val || "—"}</Text>
                <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.doneStat, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.doneStatNum, { color: colors.primary }]}>+25</Text>
            <Text style={[styles.doneStatLabel, { color: colors.mutedForeground }]}>Community Points earned</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85}
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
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85}
          style={styles.back}
          onPress={() => step > 1 ? setStep((s) => s - 1) : router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Neighborhood Survey</Text>
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
        {/* Step 1 — Location */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>📍 Location</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              City and visit type are required — neighborhood is optional
            </Text>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>City</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginBottom: 10 }]}
                placeholder="Search by city name or zip/postal code…"
                placeholderTextColor={colors.mutedForeground}
                value={city}
                onChangeText={setCity}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }} contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}>
                {CITIES.filter((c) => c !== "Other").map((c) => (
                  <TouchableOpacity activeOpacity={0.85}
                    key={c}
                    style={[styles.cityChip, { backgroundColor: city === c ? colors.primary : colors.secondary, borderColor: city === c ? colors.primary : colors.border }]}
                    onPress={() => setCity(c)}
                  >
                    <Text style={[styles.cityChipTxt, { color: city === c ? colors.primaryForeground : colors.foreground }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Neighborhood / Area <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Old Fourth Ward, Harlem, Hyde Park…"
                placeholderTextColor={colors.mutedForeground}
                value={neighborhood}
                onChangeText={setNeighborhood}
              />
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>What were you doing in this area?</Text>
              <View style={styles.chips}>
                {VISIT_PURPOSES.map((p) => (
                  <Chip key={p} label={p} selected={visitPurpose === p} onPress={() => setVisitPurpose(p)}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>How often do you visit this area? <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <View style={styles.chips}>
                {VISIT_FREQ.map((f) => (
                  <Chip key={f} label={f} selected={visitFreq === f} onPress={() => setVisitFreq(f)}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 2 — Safety Ratings */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>⭐ Safety Ratings</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              {neighborhood ? `${neighborhood}, ${city}` : city} — daytime and nighttime are required
            </Text>

            {[
              { id: "day", label: "Daytime safety", val: daytimeSafety, set: setDaytimeSafety, weight: "30% of Safety Score", color: colors.accent },
              { id: "night", label: "Nighttime safety", val: nighttimeSafety, set: setNighttimeSafety, weight: "40% of Safety Score", color: colors.primary },
              { id: "walk", label: "Walkability", val: walkability, set: setWalkability, weight: "20% Safety · 70% Walkability", color: colors.primary, optional: true },
              { id: "transit", label: "Public transit safety", val: transitSafety, set: setTransitSafety, weight: "10% Safety · 30% Walkability", color: colors.accent, optional: true },
            ].map((item) => (
              <View key={item.id} style={[styles.ratingBlock, { borderColor: colors.border }]}>
                <View style={styles.ratingBlockHeader}>
                  <Text style={[styles.ratingBlockTitle, { color: colors.foreground }]}>
                    {item.label}{item.optional && <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}> (optional)</Text>}
                  </Text>
                  <Text style={[styles.ratingWeight, { color: colors.mutedForeground }]}>{item.weight}</Text>
                </View>
                <ScaleRating value={item.val} onChange={item.set} color={item.color} lowLabel="Unsafe" highLabel="Very Safe" />
              </View>
            ))}

            {canNext2 && (
              <View style={[styles.liveScoreRow, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
                <Text style={[styles.liveScoreLabel, { color: colors.mutedForeground }]}>Safety Score Preview</Text>
                <Text style={[styles.liveScoreNum, { color: colors.primary }]}>{scores.safety}<Text style={[styles.liveScoreOf, { color: colors.mutedForeground }]}>/100</Text></Text>
              </View>
            )}
          </View>
        )}

        {/* Step 3 — Community Experience */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>🏘️ Community Experience</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Atmosphere is required — community questions are optional
            </Text>

            <View style={styles.qBlock}>
              <View style={styles.qLabelRow}>
                <Text style={[styles.qLabel, { color: colors.foreground }]}>Overall atmosphere</Text>
                <Text style={[styles.qWeight, { color: colors.mutedForeground }]}>50% of Community Score</Text>
              </View>
              <View style={{ gap: 10 }}>
                {ATMOSPHERES.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[
                      styles.atmosphereCard,
                      { backgroundColor: atmosphere === a.id ? colors.primary + "12" : colors.card, borderColor: atmosphere === a.id ? colors.primary : colors.border },
                    ]}
                    onPress={() => { setAtmosphere(a.id); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.atmosphereTxt, { color: colors.foreground }]}>{a.label}</Text>
                    {atmosphere === a.id && <Feather name="check-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Cultural connection <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <Text style={[{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: -4 }]}>How culturally connected did you feel in this neighborhood?</Text>
              <View style={{ gap: 8 }}>
                {CULTURALLY_CONNECTED_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.atmosphereCard,
                      { backgroundColor: culturallyConnected === opt.id ? colors.primary + "12" : colors.card, borderColor: culturallyConnected === opt.id ? colors.primary : colors.border },
                    ]}
                    onPress={() => { setCulturallyConnected(opt.id); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.atmosphereTxt, { color: colors.foreground }]}>{opt.label}</Text>
                    {culturallyConnected === opt.id && <Feather name="check-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <View style={styles.qLabelRow}>
                <Text style={[styles.qLabel, { color: colors.foreground }]}>Community vibe <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              </View>
              <Text style={[{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: -4 }]}>Rate the overall community feel (1 = poor, 5 = excellent)</Text>
              <ScaleRating value={communityRating} onChange={setCommunityRating} color={colors.primary} lowLabel="Poor" highLabel="Excellent" />
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Accessibility features noticed <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <View style={styles.chips}>
                {ACCESSIBILITY_FEATURES.map((f) => (
                  <Chip key={f} label={f} selected={accessibility.includes(f)} multi
                    onPress={() => toggleMulti(accessibility, setAccessibility, f)}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 4 — Tips + Comments */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>💬 Tips & Comments</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Completely optional — help other visitors know what to expect
            </Text>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Quick tips for visitors</Text>
              <View style={styles.chips}>
                {VISITOR_TIPS.map((t) => (
                  <Chip key={t} label={t} selected={tips.includes(t)} multi
                    onPress={() => toggleMulti(tips, setTips, t)}
                    color={colors.primary} primaryForeground={colors.primaryForeground}
                    secondary={colors.secondary} border={colors.border} foreground={colors.foreground} />
                ))}
              </View>
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Anything else the community should know?</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Share what visitors should know about this neighborhood…"
                placeholderTextColor={colors.mutedForeground}
                value={comments}
                onChangeText={(t) => t.length <= 500 && setComments(t)}
                multiline
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{comments.length}/500</Text>
            </View>

            <View style={[styles.anonRow, { backgroundColor: colors.secondary }]}>
              <Feather name="eye-off" size={16} color={colors.mutedForeground} />
              <Text style={[styles.anonTxt, { color: colors.mutedForeground }]}>
                Surveys are always shared anonymously with the community
              </Text>
            </View>
          </View>
        )}

        {/* Step 5 — Nominate a Business */}
        {step === 5 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>🏆 Nominate a Business</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Know a minority-owned business in this area? Help us find and verify it — everything here is optional.
            </Text>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Business name <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Trap Kitchen, The Fat Shallot…"
                placeholderTextColor={colors.mutedForeground}
                value={nominationName}
                onChangeText={setNominationName}
              />
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Category <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Restaurant, Barbershop, Boutique…"
                placeholderTextColor={colors.mutedForeground}
                value={nominationCategory}
                onChangeText={setNominationCategory}
              />
            </View>

            <View style={styles.qBlock}>
              <Text style={[styles.qLabel, { color: colors.foreground }]}>Instagram / website <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="@handle or https://…"
                placeholderTextColor={colors.mutedForeground}
                value={nominationSocialLink}
                onChangeText={setNominationSocialLink}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={[styles.anonRow, { backgroundColor: colors.secondary }]}>
              <Feather name="heart" size={16} color={colors.primary} />
              <Text style={[styles.anonTxt, { color: colors.mutedForeground }]}>
                Nominations are reviewed by our team and help us grow the community map.
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
            <Text style={[styles.nextTxt, { color: colors.primaryForeground }]}>Submit Survey</Text>
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
  qWeight: { fontSize: 11, fontFamily: "Inter_500Medium" },
  cityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  cityChipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ratingBlock: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 14 },
  ratingBlockHeader: { gap: 2 },
  ratingBlockTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  ratingWeight: { fontSize: 11, fontFamily: "Inter_500Medium" },
  scaleBtn: { width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  scaleBtnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  scaleLabels: { flexDirection: "row", justifyContent: "space-between" },
  scaleLow: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#999" },
  scaleHigh: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#999" },
  liveScoreRow: { borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  liveScoreLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  liveScoreNum: { fontSize: 28, fontFamily: "Inter_700Bold" },
  liveScoreOf: { fontSize: 14, fontFamily: "Inter_400Regular" },
  atmosphereCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1.5 },
  atmosphereTxt: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  textarea: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 130 },
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
  scoresRow: { flexDirection: "row", gap: 10 },
  scoreCard: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 4 },
  scoreNum: { fontSize: 26, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  doneStat: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  doneStatNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  doneStatLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  doneBtn: { alignItems: "center", paddingVertical: 17, paddingHorizontal: 40, borderRadius: 16 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
