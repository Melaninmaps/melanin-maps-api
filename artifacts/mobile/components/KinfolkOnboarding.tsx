import React, { useState } from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const ONBOARDING_KEY = "@melanin_maps_kinfolk_onboarding";
const GOLD = "#C9922B";
const { width } = Dimensions.get("window");

const CATEGORIES = [
  { id: "Food & Drink", emoji: "🍽" },
  { id: "Music & Live Events", emoji: "🎵" },
  { id: "Culture & Art", emoji: "🎨" },
  { id: "Beauty & Wellness", emoji: "💆🏾" },
  { id: "History", emoji: "📚" },
  { id: "Nightlife", emoji: "🌙" },
  { id: "Outdoors", emoji: "🌿" },
  { id: "Family-Friendly", emoji: "👨‍👩‍👧" },
  { id: "Shopping", emoji: "🛍" },
  { id: "Coffee", emoji: "☕" },
  { id: "Spiritual", emoji: "🙏🏾" },
  { id: "Sports", emoji: "⚽" },
];

const BUDGET_OPTIONS = [
  { id: "budget", label: "Budget-friendly", desc: "Hidden gems that don't break the bank", emoji: "💵" },
  { id: "mid", label: "Mid-range", desc: "Good vibes at a fair price", emoji: "💳" },
  { id: "luxury", label: "Luxury", desc: "The full experience, no limits", emoji: "✨" },
  { id: "any", label: "It depends", desc: "Mix it up based on the vibe", emoji: "🤷🏾" },
];

const TRIP_STYLE_OPTIONS = [
  { id: "solo", label: "Solo traveler", emoji: "🧍🏾" },
  { id: "couple", label: "Couples getaway", emoji: "💑" },
  { id: "family", label: "Family trip", emoji: "👨🏾‍👩🏾‍👧🏾‍👦🏾" },
  { id: "group", label: "Friend group", emoji: "👥" },
  { id: "business", label: "Work trip", emoji: "💼" },
  { id: "spiritual", label: "Spiritual journey", emoji: "🙏🏾" },
];

const COMPANION_OPTIONS = [
  { id: "solo", label: "Just me", emoji: "🧍🏾" },
  { id: "partner", label: "Me & my partner", emoji: "💑" },
  { id: "family", label: "The whole family", emoji: "👨🏾‍👩🏾‍👧🏾‍👦🏾" },
  { id: "friends", label: "The crew", emoji: "👥" },
];

const LIFESTYLE_SERVICE_OPTIONS = [
  { id: "barber", label: "Barber", emoji: "💈" },
  { id: "loctician", label: "Loctician", emoji: "🫱🏾‍🫲🏾" },
  { id: "natural_hair_stylist", label: "Natural Hair Stylist", emoji: "✂️" },
  { id: "braider", label: "Braider", emoji: "🪢" },
  { id: "nail_tech", label: "Nail Tech", emoji: "💅🏾" },
  { id: "esthetician", label: "Esthetician / Skincare", emoji: "🧖🏾" },
  { id: "massage_therapist", label: "Massage Therapist", emoji: "🙌🏾" },
  { id: "personal_trainer", label: "Personal Trainer", emoji: "🏋🏾" },
  { id: "therapist_counselor", label: "Therapist / Counselor", emoji: "🧠" },
  { id: "chiropractor", label: "Chiropractor", emoji: "🦴" },
  { id: "dentist", label: "Dentist", emoji: "🦷" },
  { id: "primary_care_doctor", label: "Primary Care Doctor", emoji: "🩺" },
  { id: "financial_advisor", label: "Financial Advisor", emoji: "📊" },
  { id: "tax_preparer", label: "Tax Preparer", emoji: "🧾" },
  { id: "attorney", label: "Attorney", emoji: "⚖️" },
  { id: "realtor", label: "Realtor", emoji: "🏠" },
  { id: "tutor", label: "Tutor / Academic Coach", emoji: "📚" },
  { id: "life_coach", label: "Life Coach", emoji: "🌟" },
  { id: "photographer", label: "Photographer", emoji: "📸" },
  { id: "caterer", label: "Caterer / Personal Chef", emoji: "👨🏾‍🍳" },
];

export async function shouldShowKinfolkOnboarding(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === null;
  } catch { return false; }
}

export async function markKinfolkOnboardingDone(): Promise<void> {
  try { await AsyncStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
}

export async function resetKinfolkOnboarding(): Promise<void> {
  try { await AsyncStorage.removeItem(ONBOARDING_KEY); } catch {}
}

interface Props {
  visible: boolean;
  onComplete: () => void;
}

export function KinfolkOnboarding({ visible, onComplete }: Props) {
  const colors = useColors();
  const { update } = useUserPreferences();
  const [step, setStep] = useState(0);
  const [favCats, setFavCats] = useState<string[]>([]);
  const [budget, setBudget] = useState("any");
  const [tripStyles, setTripStyles] = useState<string[]>([]);
  const [companion, setCompanion] = useState("solo");
  const [lifestyleServices, setLifestyleServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleCat(id: string) {
    setFavCats((p) => p.includes(id) ? p.filter((c) => c !== id) : [...p, id]);
  }

  function toggleTripStyle(id: string) {
    setTripStyles((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]);
  }

  function toggleLifestyleService(id: string) {
    setLifestyleServices((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]);
  }

  async function handleFinish() {
    setSaving(true);
    await update({ favoriteCategories: favCats, budgetRange: budget, tripStyle: tripStyles, travelCompanion: companion, lifestyleServices });
    await markKinfolkOnboardingDone();
    setSaving(false);
    onComplete();
  }

  const totalSteps = 6;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.progressRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= step ? colors.primary : colors.border }]} />
          ))}
        </View>

        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <View style={styles.centered}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
                <Ionicons name="sparkles" size={44} color={colors.primary} />
              </View>
              <Text style={[styles.heading, { color: colors.text }]}>Hey, kinfolk 👋🏾</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                I'm KinfolkAI™ — your personal life companion. Let me learn your taste so every recommendation feels like it was made just for you.
              </Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground, marginTop: 8 }]}>
                Takes less than a minute. You can always update this later.
              </Text>
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>What do you love?</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                Pick everything that speaks to you — I'll prioritize these in every city.
              </Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map((c) => {
                  const sel = favCats.includes(c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catChip, { backgroundColor: sel ? colors.primary : colors.card, borderColor: sel ? colors.primary : colors.border }]}
                      onPress={() => toggleCat(c.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.catEmoji}>{c.emoji}</Text>
                      <Text style={[styles.catLabel, { color: sel ? "#fff" : colors.text }]}>{c.id}</Text>
                      {sel && <Ionicons name="checkmark-circle" size={14} color="#fff" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>What's your budget vibe?</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                I'll match recommendations to how you like to spend.
              </Text>
              <View style={styles.optionsList}>
                {BUDGET_OPTIONS.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.optionCard, { backgroundColor: budget === b.id ? colors.primary + "14" : colors.card, borderColor: budget === b.id ? colors.primary : colors.border }]}
                    onPress={() => setBudget(b.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.optionEmoji}>{b.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, { color: colors.text }]}>{b.label}</Text>
                      <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{b.desc}</Text>
                    </View>
                    {budget === b.id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>How do you travel?</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                Pick all that describe you — I'll tailor spots for your travel style.
              </Text>
              <View style={styles.catGrid}>
                {TRIP_STYLE_OPTIONS.map((s) => {
                  const sel = tripStyles.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.catChip, { backgroundColor: sel ? colors.primary : colors.card, borderColor: sel ? colors.primary : colors.border }]}
                      onPress={() => toggleTripStyle(s.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.catEmoji}>{s.emoji}</Text>
                      <Text style={[styles.catLabel, { color: sel ? "#fff" : colors.text }]}>{s.label}</Text>
                      {sel && <Ionicons name="checkmark-circle" size={14} color="#fff" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>Who's rolling with you?</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                I'll tailor spots based on your travel crew.
              </Text>
              <View style={styles.optionsList}>
                {COMPANION_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.optionCard, { backgroundColor: companion === c.id ? colors.primary + "14" : colors.card, borderColor: companion === c.id ? colors.primary : colors.border }]}
                    onPress={() => setCompanion(c.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.optionEmoji}>{c.emoji}</Text>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{c.label}</Text>
                    {companion === c.id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 5 && (
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>Your go-to services 💈</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                Tell me what you regularly use — I'll find Black-owned providers in every new city without you having to ask.
              </Text>
              <View style={[styles.serviceHint, { backgroundColor: GOLD + "14", borderColor: GOLD + "30" }]}>
                <Ionicons name="sparkles" size={14} color={GOLD} />
                <Text style={[styles.serviceHintText, { color: colors.text }]}>
                  Going out of town for a month? I'll have your barber, nail tech, loctician — everything — already lined up.
                </Text>
              </View>
              <View style={styles.catGrid}>
                {LIFESTYLE_SERVICE_OPTIONS.map((s) => {
                  const sel = lifestyleServices.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.catChip, { backgroundColor: sel ? colors.primary : colors.card, borderColor: sel ? colors.primary : colors.border }]}
                      onPress={() => toggleLifestyleService(s.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.catEmoji}>{s.emoji}</Text>
                      <Text style={[styles.catLabel, { color: sel ? "#fff" : colors.text }]}>{s.label}</Text>
                      {sel && <Ionicons name="checkmark-circle" size={14} color="#fff" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={[styles.learnBadge, { backgroundColor: GOLD + "14", borderColor: GOLD + "30", marginTop: 20 }]}>
                <Ionicons name="bulb-outline" size={16} color={GOLD} />
                <Text style={[styles.learnText, { color: colors.text }]}>
                  KinfolkAI™ gets smarter every time you use it. Thumbs up a spot? I remember. Thumbs down? I won't do it again.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.footerRow}>
            {step > 0 ? (
              <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => setStep((s) => s - 1)}>
                <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => { void markKinfolkOnboardingDone(); onComplete(); }}>
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
              </TouchableOpacity>
            )}
            {step < totalSteps - 1 ? (
              <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={() => setStep((s) => s + 1)}>
                <Text style={styles.nextBtnText}>{step === 0 ? "Let's go →" : "Next →"}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={handleFinish} disabled={saving}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.nextBtnText}>{saving ? "Saving…" : "Save my taste"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progressRow: { flexDirection: "row", justifyContent: "center", gap: 6, paddingTop: 20, paddingBottom: 4 },
  dot: { width: 22, height: 4, borderRadius: 2 },
  scroll: { padding: 24, paddingBottom: 16 },
  centered: { alignItems: "center", paddingTop: 24 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  heading: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 12, textAlign: "center" },
  subheading: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 23, textAlign: "center", marginBottom: 8 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 24, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10 },
  catEmoji: { fontSize: 16 },
  catLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  optionsList: { gap: 10, marginTop: 8 },
  optionCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, borderWidth: 1.5, padding: 16 },
  optionEmoji: { fontSize: 24 },
  optionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 2 },
  optionDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  serviceHint: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12 },
  serviceHintText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  learnBadge: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  learnText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  footer: { borderTopWidth: 1, padding: 16 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skipText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  backBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
  backBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  nextBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});
