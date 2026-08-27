import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: OnboardingPreferences) => void;
}

export interface OnboardingPreferences {
  travelStyle: string[];
  cities: string[];
  groupType: string;
  budget: string;
  interests: string[];
  accessibilityNeeds: string[];
}

const TRAVEL_STYLES = [
  { id: "explorer", label: "Explorer", emoji: "🗺️", sub: "Off-the-beaten-path" },
  { id: "foodie", label: "Foodie", emoji: "🍽️", sub: "Food & culinary" },
  { id: "cultural", label: "Cultural", emoji: "🎭", sub: "Arts & history" },
  { id: "nightlife", label: "Night Owl", emoji: "🌙", sub: "Bars & clubs" },
  { id: "wellness", label: "Wellness", emoji: "🧘🏾", sub: "Spas & fitness" },
  { id: "shopaholic", label: "Shopper", emoji: "🛍️", sub: "Retail & markets" },
];

const CITIES = ["Philadelphia", "Atlanta", "Houston", "Chicago", "Los Angeles", "New York", "DC", "Detroit", "New Orleans", "Miami", "Baltimore", "Charlotte"];

const GROUP_TYPES = [
  { id: "solo", label: "Solo", emoji: "🧍🏾" },
  { id: "couple", label: "Couple", emoji: "👫🏾" },
  { id: "friends", label: "Friend Group", emoji: "👯🏾" },
  { id: "family", label: "Family", emoji: "👨🏾‍👩🏾‍👧🏾" },
  { id: "business", label: "Business", emoji: "💼" },
];

const BUDGETS = [
  { id: "budget", label: "$", sub: "Budget-friendly" },
  { id: "mid", label: "$$", sub: "Mid-range" },
  { id: "upscale", label: "$$$", sub: "Upscale" },
  { id: "luxury", label: "$$$$", sub: "Luxury" },
];

const INTERESTS = [
  "Black History", "Live Music", "Natural Hair", "Black Art", "Soul Food", "Jazz & Blues",
  "Community Events", "Black Bookstores", "Fitness & Wellness", "HBCU Culture", "Black Fashion", "Spiritual Spaces",
];

const ACCESSIBILITY = [
  "Wheelchair Accessible", "Service Animal Friendly", "Quiet Spaces", "Sensory-Friendly",
  "Large Print Available", "Sign Language", "Gender-Neutral Restrooms", "None needed",
];

const STORAGE_KEY = "mapping_with_melanin_preferences";

export function OnboardingPreferenceSurvey({ visible, onClose, onSubmit }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<OnboardingPreferences>({
    travelStyle: [],
    cities: [],
    groupType: "",
    budget: "",
    interests: [],
    accessibilityNeeds: [],
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (visible) {
      try {
        const saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        if (saved) queueMicrotask(() => setPrefs(JSON.parse(saved)));
      } catch {}
    }
  }, [visible]);

  const reset = () => { setStep(0); setSubmitted(false); };
  const handleClose = () => { reset(); onClose(); };

  const toggle = (key: keyof OnboardingPreferences, val: string) => {
    Haptics.selectionAsync();
    setPrefs((p) => {
      const arr = p[key] as string[];
      return { ...p, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  };

  const canNext = () => {
    if (step === 0) return prefs.travelStyle.length > 0;
    if (step === 1) return prefs.cities.length > 0;
    if (step === 2) return prefs.groupType !== "" && prefs.budget !== "";
    return true;
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 3) { setStep(step + 1); return; }
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
    setSubmitted(true);
    onSubmit?.(prefs);
  };

  const STEPS = ["Travel Style", "Cities of Interest", "Trip Details", "Interests"];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Your Preferences</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Personalize your discovery feed</Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        {!submitted && (
          <>
            <View style={styles.stepBar}>
              {STEPS.map((s, i) => (
                <View key={s} style={styles.stepItem}>
                  <View style={[styles.stepDot, { backgroundColor: i <= step ? "#C4622D" : colors.border, width: i === step ? 28 : 8 }]} />
                  {i < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: i < step ? "#C4622D" : colors.border }]} />}
                </View>
              ))}
            </View>
            <View style={styles.stepLabelRow}>
              <Text style={[styles.stepCounter, { color: colors.mutedForeground }]}>Step {step + 1} of {STEPS.length}</Text>
              <Text style={[styles.stepName, { color: colors.primary }]}>{STEPS[step]}</Text>
            </View>
          </>
        )}

        <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          {submitted ? (
            <View style={styles.thankYou}>
              <View style={[styles.thankIcon, { backgroundColor: "#C4622D18" }]}>
                <Text style={{ fontSize: 48 }}>✊🏾</Text>
              </View>
              <Text style={[styles.thankTitle, { color: colors.foreground }]}>All Set!</Text>
              <Text style={[styles.thankSub, { color: colors.mutedForeground }]}>
                Your preferences are saved. Your Discover feed and For You section will now be personalized to your tastes.
              </Text>
              <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Personalized for</Text>
                <Text style={[styles.previewValue, { color: colors.foreground }]}>
                  {prefs.travelStyle.slice(0, 2).join(", ")} · {prefs.cities.slice(0, 2).join(", ")}
                </Text>
              </View>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: "#C4622D" }]} onPress={handleClose}>
                <Text style={styles.doneBtnText}>Explore the App</Text>
                <Feather name="arrow-right" size={16} color="#FBF7F0" />
              </TouchableOpacity>
            </View>
          ) : step === 0 ? (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>What&apos;s your travel style?</Text>
              <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Select all that apply — we&apos;ll tailor recommendations to match</Text>
              <View style={styles.styleGrid}>
                {TRAVEL_STYLES.map((s) => {
                  const sel = prefs.travelStyle.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.styleCard, {
                        backgroundColor: sel ? "#C4622D10" : colors.card,
                        borderColor: sel ? "#C4622D" : colors.border,
                      }]}
                      onPress={() => toggle("travelStyle", s.id)}
                    >
                      <Text style={{ fontSize: 28 }}>{s.emoji}</Text>
                      <Text style={[styles.styleName, { color: colors.foreground }]}>{s.label}</Text>
                      <Text style={[styles.styleSub, { color: colors.mutedForeground }]}>{s.sub}</Text>
                      {sel && (
                        <View style={[styles.checkBadge, { backgroundColor: "#C4622D" }]}>
                          <Feather name="check" size={10} color="#FBF7F0" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : step === 1 ? (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Cities of interest</Text>
              <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Which cities are you planning to visit or live in?</Text>
              <View style={styles.chipGrid}>
                {CITIES.map((c) => {
                  const sel = prefs.cities.includes(c);
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, {
                        backgroundColor: sel ? "#C4622D" : colors.card,
                        borderColor: sel ? "#C4622D" : colors.border,
                      }]}
                      onPress={() => toggle("cities", c)}
                    >
                      {sel && <Feather name="check" size={12} color="#FBF7F0" />}
                      <Text style={[styles.chipText, { color: sel ? "#FBF7F0" : colors.foreground }]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : step === 2 ? (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>How do you travel?</Text>
              <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Group type and budget help us surface the right spots</Text>
              <Text style={[styles.groupLabel, { color: colors.foreground }]}>Who do you travel with?</Text>
              <View style={styles.groupGrid}>
                {GROUP_TYPES.map((g) => {
                  const sel = prefs.groupType === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.groupCard, {
                        backgroundColor: sel ? "#C4622D10" : colors.card,
                        borderColor: sel ? "#C4622D" : colors.border,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setPrefs((p) => ({ ...p, groupType: g.id })); }}
                    >
                      <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
                      <Text style={[styles.groupCardText, { color: colors.foreground }]}>{g.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.groupLabel, { color: colors.foreground, marginTop: 20 }]}>Budget range</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {BUDGETS.map((b) => {
                  const sel = prefs.budget === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.budgetCard, {
                        backgroundColor: sel ? "#C4622D" : colors.card,
                        borderColor: sel ? "#C4622D" : colors.border,
                        flex: 1,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setPrefs((p) => ({ ...p, budget: b.id })); }}
                    >
                      <Text style={[styles.budgetSymbol, { color: sel ? "#FBF7F0" : colors.foreground }]}>{b.label}</Text>
                      <Text style={[styles.budgetSub, { color: sel ? "rgba(251,247,240,0.75)" : colors.mutedForeground }]}>{b.sub}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>What matters to you?</Text>
              <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Pick your interests and any accessibility needs</Text>
              <Text style={[styles.groupLabel, { color: colors.foreground }]}>Interests</Text>
              <View style={styles.chipGrid}>
                {INTERESTS.map((interest) => {
                  const sel = prefs.interests.includes(interest);
                  return (
                    <TouchableOpacity
                      key={interest}
                      style={[styles.chip, {
                        backgroundColor: sel ? "#C4622D" : colors.card,
                        borderColor: sel ? "#C4622D" : colors.border,
                      }]}
                      onPress={() => toggle("interests", interest)}
                    >
                      <Text style={[styles.chipText, { color: sel ? "#FBF7F0" : colors.foreground }]}>{interest}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.groupLabel, { color: colors.foreground, marginTop: 16 }]}>Accessibility needs</Text>
              <View style={styles.chipGrid}>
                {ACCESSIBILITY.map((a) => {
                  const sel = prefs.accessibilityNeeds.includes(a);
                  return (
                    <TouchableOpacity
                      key={a}
                      style={[styles.chip, {
                        backgroundColor: sel ? "#2D7A4F" : colors.card,
                        borderColor: sel ? "#2D7A4F" : colors.border,
                      }]}
                      onPress={() => toggle("accessibilityNeeds", a)}
                    >
                      <Text style={[styles.chipText, { color: sel ? "#FBF7F0" : colors.foreground }]}>{a}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
                {step === 3 ? "Save Preferences" : "Next"}
              </Text>
              <Feather name={step === 3 ? "check" : "arrow-right"} size={16} color={canNext() ? "#FBF7F0" : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, gap: 12 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  stepBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 14, paddingBottom: 4, gap: 4 },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  stepDot: { height: 8, borderRadius: 4 },
  stepLine: { flex: 1, height: 2, borderRadius: 1 },
  stepLabelRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 12 },
  stepCounter: { fontFamily: "Inter_400Regular", fontSize: 12 },
  stepName: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  body: { padding: 20, paddingBottom: 8 },
  stepContent: { gap: 14 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  stepSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  groupLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 4 },
  styleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  styleCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  styleName: { fontFamily: "Inter_700Bold", fontSize: 14 },
  styleSub: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" },
  checkBadge: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  groupGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  groupCard: { alignItems: "center", gap: 6, padding: 14, borderRadius: 14, borderWidth: 1, minWidth: "28%" },
  groupCardText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  budgetCard: { alignItems: "center", gap: 4, padding: 14, borderRadius: 14, borderWidth: 1 },
  budgetSymbol: { fontFamily: "Inter_700Bold", fontSize: 18 },
  budgetSub: { fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  backBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  thankYou: { alignItems: "center", gap: 16, paddingTop: 40 },
  thankIcon: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  thankTitle: { fontFamily: "Inter_700Bold", fontSize: 28 },
  thankSub: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 24, paddingHorizontal: 8 },
  previewCard: { width: "100%", borderRadius: 14, borderWidth: 1, padding: 16, gap: 4 },
  previewLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  previewValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  doneBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FBF7F0" },
});
