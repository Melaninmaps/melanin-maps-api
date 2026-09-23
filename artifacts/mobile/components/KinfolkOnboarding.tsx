import React, { useState } from "react";
import {
  Alert, Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

const ONBOARDING_KEY = "@melanin_maps_kinfolk_onboarding";
const GOLD = "#C9922B";
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

const RECOMMENDATION_LIFE_STAGES = [
  { id: "unspecified" as const, label: "Prefer not to say" },
  { id: "18_39" as const, label: "18–39" },
  { id: "40_64" as const, label: "40–64" },
  { id: "65_plus" as const, label: "65+" },
];

const SEX_ASSIGNED_AT_BIRTH_OPTIONS = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "intersex", label: "Intersex" },
  { id: "prefer_not_to_say", label: "Prefer not to say" },
];

const GENDER_IDENTITY_OPTIONS = [
  { id: "woman", label: "Woman" },
  { id: "man", label: "Man" },
  { id: "nonbinary", label: "Nonbinary" },
  { id: "another_identity", label: "Another identity" },
  { id: "prefer_not_to_say", label: "Prefer not to say" },
];

const COMMUNITY_CONTEXT_OPTIONS = [
  "Black woman",
  "Black / African American",
  "Black history & culture",
  "HBCU culture",
  "African & diaspora culture",
  "Caribbean culture",
  "Afro-Latino culture",
  "LGBTQ+ community",
  "Disability community",
  "Veteran community",
  "Faith & spiritual communities",
  "Minority-owned businesses",
  "Community-led events",
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
  const showAllSections = true;
  const [favCats, setFavCats] = useState<string[]>([]);
  const [specificInterests, setSpecificInterests] = useState("");
  const [recommendationLifeStage, setRecommendationLifeStage] = useState<"unspecified" | "18_39" | "40_64" | "65_plus">("unspecified");
  const [sexAssignedAtBirth, setSexAssignedAtBirth] = useState<string | null>(null);
  const [genderIdentity, setGenderIdentity] = useState<string | null>(null);
  const [allowMedicalContext, setAllowMedicalContext] = useState(false);
  const [communityContexts, setCommunityContexts] = useState<string[]>([]);
  const [useMemberContextByDefault, setUseMemberContextByDefault] = useState(false);
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

  function toggleCommunityContext(id: string) {
    setCommunityContexts((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  async function saveOptionalIdentityContext(): Promise<boolean> {
    if (!sexAssignedAtBirth && !genderIdentity) return true;
    try {
      const headers = await getMemberApiHeaders();
      if (!headers.Authorization) return false;
      const apiBase = getApiBase();
      const existingResponse = await fetch(`${apiBase}/api/me/identity-context`, { headers });
      if (!existingResponse.ok) return false;
      const current = await existingResponse.json() as { version?: number };
      const response = await fetch(`${apiBase}/api/me/identity-context`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedVersion: current.version ?? 0,
          ...(sexAssignedAtBirth ? { sexAssignedAtBirth } : {}),
          ...(genderIdentity ? { genderIdentity } : {}),
          allowMedicallyRelevantContext: allowMedicalContext,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function handleFinish() {
    setSaving(true);
    const enteredInterests = specificInterests
      .split(/[,\n]/)
      .map(value => value.trim())
      .filter(value => value.length >= 2 && value.length <= 80);
    const [saved, identitySaved] = await Promise.all([
      update({
      recommendationLifeStage,
      favoriteCategories: [...new Set([...favCats, ...enteredInterests])].slice(0, 50),
      budgetRange: budget,
      tripStyle: tripStyles,
      travelCompanion: companion,
      lifestyleServices,
      communities: communityContexts,
      personalizationContextCompleted: true,
      useMemberContextByDefault,
      }),
      saveOptionalIdentityContext(),
    ]);
    if (saved) await markKinfolkOnboardingDone();
    setSaving(false);
    if (saved) {
      if (!identitySaved && (sexAssignedAtBirth || genderIdentity)) {
        Alert.alert("Preferences saved", "Your optional identity context was not saved. You can add it later in Settings.");
      }
      onComplete();
    }
    else Alert.alert("Preferences not saved", "Kinfolk could not save those preferences. Nothing was marked complete; please try again.");
  }

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="pageSheet">
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.setupHeader}>
          <Text style={[styles.setupHeaderTitle, { color: colors.text }]}>Optional Kinfolk setup</Text>
          <Text style={[styles.setupHeaderCopy, { color: colors.mutedForeground }]}>Choose only what helps. Every section is private, editable, and skippable.</Text>
        </View>

        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {showAllSections && (
            <View style={styles.centered}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
                <Ionicons name="sparkles" size={44} color={colors.primary} />
              </View>
              <Text style={[styles.heading, { color: colors.text }]}>Hey, kinfolk 👋🏾</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                I&apos;m KinfolkAI™ — your personal life companion. Let me learn your taste so every recommendation feels like it was made just for you.
              </Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground, marginTop: 8 }]}>
                Takes less than a minute. You can always update this later.
              </Text>
            </View>
          )}

          {showAllSections && (
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>Start with what you choose to share</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>Everything on this page is optional, private, editable, and never shown on your profile. Kinfolk does not infer any of it from your activity.</Text>

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Age range <Text style={[styles.optionalText, { color: colors.mutedForeground }]}>optional</Text></Text>
              <Text style={[styles.sectionCopy, { color: colors.mutedForeground }]}>This replaces a date of birth. Use it only when age-relevant recommendations would help.</Text>
              <View style={styles.stackedOptions}>
                {RECOMMENDATION_LIFE_STAGES.map(option => (
                  <TouchableOpacity key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: recommendationLifeStage === option.id }}
                    style={[styles.contextOption, { backgroundColor: recommendationLifeStage === option.id ? colors.primary + "14" : colors.card, borderColor: recommendationLifeStage === option.id ? colors.primary : colors.border }]}
                    onPress={() => setRecommendationLifeStage(option.id)}>
                    <Text style={[styles.contextOptionText, { color: colors.text }]}>{option.label}</Text>
                    {recommendationLifeStage === option.id ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Sex assigned at birth <Text style={[styles.optionalText, { color: colors.mutedForeground }]}>optional</Text></Text>
              <Text style={[styles.sectionCopy, { color: colors.mutedForeground }]}>Only for health context when you turn on the consent below. It is never used to make a general recommendation.</Text>
              <View style={styles.stackedOptions}>
                {SEX_ASSIGNED_AT_BIRTH_OPTIONS.map(option => (
                  <TouchableOpacity key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sexAssignedAtBirth === option.id }}
                    style={[styles.contextOption, { backgroundColor: sexAssignedAtBirth === option.id ? colors.primary + "14" : colors.card, borderColor: sexAssignedAtBirth === option.id ? colors.primary : colors.border }]}
                    onPress={() => setSexAssignedAtBirth(option.id)}>
                    <Text style={[styles.contextOptionText, { color: colors.text }]}>{option.label}</Text>
                    {sexAssignedAtBirth === option.id ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                  </TouchableOpacity>
                ))}
              </View>
              {sexAssignedAtBirth && sexAssignedAtBirth !== "prefer_not_to_say" ? (
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: allowMedicalContext }}
                  onPress={() => setAllowMedicalContext((enabled) => !enabled)}
                  style={[styles.medicalConsent, { backgroundColor: allowMedicalContext ? colors.primary + "14" : colors.card, borderColor: allowMedicalContext ? colors.primary : colors.border }]}
                >
                  <Ionicons name={allowMedicalContext ? "checkbox" : "square-outline"} size={22} color={colors.primary} />
                  <Text style={[styles.medicalConsentText, { color: colors.text }]}>I want Kinfolk to consider this only when I ask a health question. It does not replace clinical care or change the source standards.</Text>
                </TouchableOpacity>
              ) : null}

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Gender identity <Text style={[styles.optionalText, { color: colors.mutedForeground }]}>optional</Text></Text>
              <View style={styles.stackedOptions}>
                {GENDER_IDENTITY_OPTIONS.map(option => (
                  <TouchableOpacity key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: genderIdentity === option.id }}
                    style={[styles.contextOption, { backgroundColor: genderIdentity === option.id ? colors.primary + "14" : colors.card, borderColor: genderIdentity === option.id ? colors.primary : colors.border }]}
                    onPress={() => setGenderIdentity(option.id)}>
                    <Text style={[styles.contextOptionText, { color: colors.text }]}>{option.label}</Text>
                    {genderIdentity === option.id ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Culture & community <Text style={[styles.optionalText, { color: colors.mutedForeground }]}>choose any or skip</Text></Text>
              <Text style={[styles.sectionCopy, { color: colors.mutedForeground }]}>Use it as a private default only if you choose the checkbox below. It is not a public label, a ranking rule, or an assumption about you.</Text>
              <View style={styles.stackedOptions}>
                {COMMUNITY_CONTEXT_OPTIONS.map(option => {
                  const selected = communityContexts.includes(option);
                  return (
                    <TouchableOpacity key={option}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      style={[styles.contextOption, { backgroundColor: selected ? colors.primary + "14" : colors.card, borderColor: selected ? colors.primary : colors.border }]}
                      onPress={() => toggleCommunityContext(option)}>
                      <Text style={[styles.contextOptionText, { color: colors.text }]}>{option}</Text>
                      <Ionicons name={selected ? "checkbox" : "square-outline"} size={21} color={selected ? colors.primary : colors.mutedForeground} />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{ checked: useMemberContextByDefault }}
                onPress={() => setUseMemberContextByDefault((enabled) => !enabled)}
                style={[styles.medicalConsent, { backgroundColor: useMemberContextByDefault ? colors.primary + "14" : colors.card, borderColor: useMemberContextByDefault ? colors.primary : colors.border }]}
              >
                <Ionicons name={useMemberContextByDefault ? "checkbox" : "square-outline"} size={22} color={colors.primary} />
                <Text style={[styles.medicalConsentText, { color: colors.text }]}>Use the context I selected as my private default in relevant Kinfolk and Library questions. I can say “general only,” “this is for a friend,” or change it anytime.</Text>
              </TouchableOpacity>
              <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>You can skip every option, remove it later, or ask a question with no personal context at all.</Text>
            </View>
          )}

          {showAllSections && (
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>What do you love?</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                Pick everything that speaks to you — I&apos;ll prioritize these in every city.
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
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Anything specific?</Text>
              <TextInput
                value={specificInterests}
                onChangeText={setSpecificInterests}
                placeholder="author events, candle making, board games"
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={[styles.specificInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              />
            </View>
          )}

          {showAllSections && (
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>What&apos;s your budget vibe?</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                I&apos;ll match recommendations to how you like to spend.
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

          {showAllSections && (
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>How do you travel?</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                Pick all that describe you — I&apos;ll tailor spots for your travel style.
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

          {showAllSections && (
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>Who&apos;s rolling with you?</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                I&apos;ll tailor spots based on your travel crew.
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

          {showAllSections && (
            <View>
              <Text style={[styles.heading, { color: colors.text }]}>Your go-to services 💈</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                Tell me what you regularly use — I&apos;ll find minority-owned providers in every new city without you having to ask.
              </Text>
              <View style={[styles.serviceHint, { backgroundColor: GOLD + "14", borderColor: GOLD + "30" }]}>
                <Ionicons name="sparkles" size={14} color={GOLD} />
                <Text style={[styles.serviceHintText, { color: colors.text }]}>
                  Going out of town for a month? I&apos;ll have your barber, nail tech, loctician — everything — already lined up.
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
                  KinfolkAI™ gets smarter every time you use it. Thumbs up a spot? I remember. Thumbs down? I won&apos;t do it again.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={() => { void markKinfolkOnboardingDone(); onComplete(); }}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={handleFinish} disabled={saving}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.nextBtnText}>{saving ? "Saving…" : "Save my setup"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  setupHeader: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 6 },
  setupHeaderTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  setupHeaderCopy: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 4 },
  scroll: { padding: 24, paddingBottom: 16 },
  centered: { alignItems: "center", paddingTop: 24 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  heading: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 12, textAlign: "center" },
  subheading: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 23, textAlign: "center", marginBottom: 8 },
  fieldLabel: { fontFamily: "Inter_700Bold", fontSize: 14, marginTop: 20, marginBottom: 6 },
  specificInput: { minHeight: 64, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14, textAlignVertical: "top" },
  ageChip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10 },
  optionalText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  sectionCopy: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginBottom: 8 },
  stackedOptions: { gap: 8 },
  contextOption: { minHeight: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  contextOptionText: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  medicalConsent: { borderRadius: 12, borderWidth: 1.5, marginTop: 10, padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  medicalConsentText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, flex: 1 },
  privacyNote: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 10 },
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
