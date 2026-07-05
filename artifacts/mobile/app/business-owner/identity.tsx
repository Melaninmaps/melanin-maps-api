import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
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
import DiasporaFlagPicker from "@/components/DiasporaFlagPicker";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}
async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

// ─── Option sets ────────────────────────────────────────────────
const OWNERSHIP_BADGES = [
  "Black-Owned", "Minority-Owned", "Woman-Owned", "Veteran-Owned", "Family-Owned",
  "LGBTQ+-Owned", "Nonprofit", "Social Enterprise", "Melanated Diaspora-Owned",
];
const COMMUNITY_VALUES = [
  "Community", "Family", "Culture", "Education", "Health",
  "Wellness", "Sustainability", "Creativity", "Entrepreneurship", "Youth Development",
];
const AUDIENCES = [
  "Families", "Solo Travelers", "Professionals", "Tourists", "College Students",
  "Seniors", "Children", "LGBTQ+ Community", "Pet Owners", "Digital Nomads",
  "Remote Workers", "Event Planners", "Small Businesses", "Large Groups",
];
const ACCESSIBILITY = [
  "Wheelchair Accessible", "Service Animals Welcome", "Gender-Neutral Restroom",
  "Outdoor Seating", "Kid Friendly", "Quiet Environment", "Sensory Friendly",
  "Parking Available", "Public Transit Nearby",
];
const VIBES = [
  "☕ Cozy", "🎉 Lively", "💼 Professional", "👨🏾‍👩🏾‍👧🏾 Family Friendly",
  "🎶 Great Music", "💕 Romantic", "🏃 Quick Stop", "📚 Quiet",
  "🎨 Creative", "🌿 Relaxed", "💎 Luxury", "🏙 Trendy",
];
const HIGHLIGHTS = [
  "Celebrating 10+ years", "Newly opened", "Currently expanding",
  "Locally owned & operated", "Introducing new services", "Award-winning",
  "Under new ownership", "Recently renovated",
];
const GIVING_BACK = [
  "Mentor youth", "Sponsor schools", "Support nonprofits",
  "Offer scholarships", "Host community events", "Volunteer regularly",
  "Donate a % of profits", "Partner with HBCUs",
];
const GROWTH_GOALS = [
  "Increase visibility", "Reach travelers", "Connect with locals",
  "Sell products online", "Book appointments", "Promote events",
  "Recruit employees", "Build community", "Improve customer feedback",
  "Expand into new markets",
];

// ─── Types ───────────────────────────────────────────────────────
type Identity = {
  businessStory?: string | null;
  missionStatement?: string | null;
  whyStarted?: string | null;
  whatCustomersShouldKnow?: string | null;
  ownershipBadges: string[];
  diasporaCountries: string[];
  communityValues: string[];
  audiencesServed: string[];
  accessibilityFeatures: string[];
  vibes: string[];
  employeeCount?: number | null;
  isHiring: boolean;
  hasInternships: boolean;
  hasVolunteerOpportunities: boolean;
  currentHighlights: string[];
  communityInitiatives: string[];
  growthGoals: string[];
};

const EMPTY: Identity = {
  businessStory: "",
  missionStatement: "",
  whyStarted: "",
  whatCustomersShouldKnow: "",
  ownershipBadges: [],
  diasporaCountries: [],
  communityValues: [],
  audiencesServed: [],
  accessibilityFeatures: [],
  vibes: [],
  employeeCount: null,
  isHiring: false,
  hasInternships: false,
  hasVolunteerOpportunities: false,
  currentHighlights: [],
  communityInitiatives: [],
  growthGoals: [],
};

// ─── Completion score ────────────────────────────────────────────
function completionScore(id: Identity): number {
  const checks = [
    !!id.businessStory?.trim(),
    !!id.missionStatement?.trim(),
    !!id.whyStarted?.trim(),
    id.ownershipBadges.length > 0,
    id.communityValues.length > 0,
    id.audiencesServed.length > 0,
    id.accessibilityFeatures.length > 0,
    id.vibes.length > 0,
    id.employeeCount != null,
    id.currentHighlights.length > 0,
    id.communityInitiatives.length > 0,
    id.growthGoals.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// ─── Sub-components ──────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle && <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>{subtitle}</Text>}
    </View>
  );
}

function NarrativeField({
  label, value, onChangeText, placeholder, multiline = true,
}: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string; multiline?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        style={[styles.textArea, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

function ChipGrid({
  options, selected, onToggle, max,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void; max?: number }) {
  const colors = useColors();
  return (
    <View style={styles.chipGrid}>
      {options.map(opt => {
        const active = selected.includes(opt);
        const atMax = max != null && selected.length >= max && !active;
        return (
          <TouchableOpacity activeOpacity={0.85}
            key={opt}
            style={[
              styles.chip,
              { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "22" : colors.card },
              atMax && { opacity: 0.4 },
            ]}
            onPress={() => {
              if (atMax) return;
              if (Platform.OS !== "web") Haptics.selectionAsync();
              onToggle(opt);
            }}
            disabled={atMax}
          >
            <Text style={[styles.chipTxt, { color: active ? colors.primary : colors.mutedForeground }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Toggle({
  label, value, onPress,
}: { label: string; value: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity activeOpacity={0.85} style={[styles.toggleRow, { borderColor: colors.border }]} onPress={onPress}>
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.togglePill, { backgroundColor: value ? colors.primary : colors.border }]}>
        <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 18 : 2 }] }]} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────
export default function BusinessIdentityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Identity>(EMPTY);

  const set = <K extends keyof Identity>(key: K, val: Identity[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const toggle = (key: keyof Pick<Identity, "ownershipBadges" | "communityValues" | "audiencesServed" | "accessibilityFeatures" | "vibes" | "currentHighlights" | "communityInitiatives" | "growthGoals">, val: string) => {
    setForm(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  };

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/businesses/mine/identity`, { headers });
      if (res.ok) {
        const data = await res.json() as { identity: Identity };
        setForm({ ...EMPTY, ...data.identity });
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/businesses/mine/identity`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(form),
      });
      if (res.ok) {
        Alert.alert("Saved!", "Your business identity has been updated.");
      } else {
        Alert.alert("Error", "Could not save. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const pct = completionScore(form);
  const pctColor = pct >= 80 ? "#2D7A4F" : pct >= 50 ? "#C9922B" : colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Business Identity</Text>
        <TouchableOpacity activeOpacity={0.85} style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving || loading}>
          <Text style={styles.saveBtnTxt}>{saving ? "Saving…" : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 60 }]} showsVerticalScrollIndicator={false}>

        {/* Profile Completion Meter */}
        <View style={[styles.meterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.meterTop}>
            <Text style={[styles.meterLabel, { color: colors.foreground }]}>Profile Completion</Text>
            <Text style={[styles.meterPct, { color: pctColor }]}>{pct}%</Text>
          </View>
          <View style={[styles.meterTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.meterFill, { width: `${pct}%` as any, backgroundColor: pctColor }]} />
          </View>
          <Text style={[styles.meterHint, { color: colors.mutedForeground }]}>
            {pct < 100
              ? "More complete profiles attract more customers. No rush — fill in what feels right."
              : "🎉 Your profile is complete! Customers will love getting to know your business."}
          </Text>
        </View>

        {/* Section 1: Your Story */}
        <SectionHeader title="1. Your Story" subtitle="Help customers connect with who you are, not just what you sell." />

        <NarrativeField
          label="What's your story?"
          value={form.businessStory ?? ""}
          onChangeText={v => set("businessStory", v)}
          placeholder="Why did you start this business? What inspired you? What does it mean to your community?"
        />
        <NarrativeField
          label="Mission Statement"
          value={form.missionStatement ?? ""}
          onChangeText={v => set("missionStatement", v)}
          placeholder="What is your business here to do?"
          multiline={false}
        />
        <NarrativeField
          label="Why did you start this business?"
          value={form.whyStarted ?? ""}
          onChangeText={v => set("whyStarted", v)}
          placeholder="The moment or motivation that made you start..."
        />
        <NarrativeField
          label="One thing every customer should know"
          value={form.whatCustomersShouldKnow ?? ""}
          onChangeText={v => set("whatCustomersShouldKnow", v)}
          placeholder="e.g. We've been family-owned for 25 years. Every purchase funds a scholarship."
          multiline={false}
        />

        {/* Section 2: Ownership */}
        <SectionHeader title="2. Ownership" subtitle="Share the badges that apply to your business. You choose what to disclose." />
        <ChipGrid options={OWNERSHIP_BADGES} selected={form.ownershipBadges} onToggle={v => toggle("ownershipBadges", v)} />

        {form.ownershipBadges.includes("Melanated Diaspora-Owned") && (
          <View style={styles.diasporaWrap}>
            <Text style={[styles.diasporaLabel, { color: colors.foreground }]}>🌍 Countries of Origin</Text>
            <Text style={[styles.diasporaSub, { color: colors.mutedForeground }]}>
              Show customers which countries your heritage is rooted in.
            </Text>
            <DiasporaFlagPicker
              selected={form.diasporaCountries}
              onToggle={(code) =>
                setForm((prev) => ({
                  ...prev,
                  diasporaCountries: prev.diasporaCountries.includes(code)
                    ? prev.diasporaCountries.filter((c) => c !== code)
                    : [...prev.diasporaCountries, code],
                }))
              }
              label="Select your countries of origin"
            />
          </View>
        )}

        {/* Section 3: Community Values */}
        <SectionHeader title="3. Community Values" subtitle="What does your business value most? Choose up to 5." />
        <ChipGrid options={COMMUNITY_VALUES} selected={form.communityValues} onToggle={v => toggle("communityValues", v)} max={5} />

        {/* Section 4: Who You Serve */}
        <SectionHeader title="4. Who You Serve" subtitle="Which audiences does your business frequently serve?" />
        <ChipGrid options={AUDIENCES} selected={form.audiencesServed} onToggle={v => toggle("audiencesServed", v)} />

        {/* Section 5: Accessibility */}
        <SectionHeader title="5. Accessibility" subtitle="Let customers know what accommodations you offer." />
        <ChipGrid options={ACCESSIBILITY} selected={form.accessibilityFeatures} onToggle={v => toggle("accessibilityFeatures", v)} />

        {/* Section 6: Your Vibe */}
        <SectionHeader title="6. Your Vibe" subtitle="People choose experiences based on atmosphere. What's yours?" />
        <ChipGrid options={VIBES} selected={form.vibes} onToggle={v => toggle("vibes", v)} />

        {/* Section 7: Your Team */}
        <SectionHeader title="7. Your Team" subtitle="Help customers discover employment and community opportunities." />
        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Number of Employees</Text>
          <TextInput
            style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            value={form.employeeCount != null ? String(form.employeeCount) : ""}
            onChangeText={v => set("employeeCount", v === "" ? null : parseInt(v, 10) || null)}
            placeholder="e.g. 12"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
          />
        </View>
        <Toggle label="Currently Hiring" value={form.isHiring} onPress={() => set("isHiring", !form.isHiring)} />
        <Toggle label="Internship Opportunities" value={form.hasInternships} onPress={() => set("hasInternships", !form.hasInternships)} />
        <Toggle label="Volunteer Opportunities" value={form.hasVolunteerOpportunities} onPress={() => set("hasVolunteerOpportunities", !form.hasVolunteerOpportunities)} />

        {/* Section 8: Current Highlights */}
        <SectionHeader title="8. What's New?" subtitle="What would you like customers to know right now?" />
        <ChipGrid options={HIGHLIGHTS} selected={form.currentHighlights} onToggle={v => toggle("currentHighlights", v)} />

        {/* Section 9: Giving Back */}
        <SectionHeader title="9. Giving Back" subtitle="Show your community impact. This may appear on your public profile." />
        <ChipGrid options={GIVING_BACK} selected={form.communityInitiatives} onToggle={v => toggle("communityInitiatives", v)} />

        {/* Growth Goals */}
        <SectionHeader title="10. Growth Goals" subtitle="How can Mapping With Melanin™ help your business grow? KinfolkAI will personalize recommendations based on your goals." />
        <ChipGrid options={GROWTH_GOALS} selected={form.growthGoals} onToggle={v => toggle("growthGoals", v)} />

        {/* Bottom save button */}
        <TouchableOpacity activeOpacity={0.85} style={[styles.bottomSave, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving || loading}>
          <Feather name="check" size={18} color="#FFF" />
          <Text style={styles.bottomSaveTxt}>{saving ? "Saving…" : "Save Business Identity"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 6 },

  meterCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 10, gap: 8,
  },
  meterTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meterLabel: { fontSize: 15, fontWeight: "700" },
  meterPct: { fontSize: 22, fontWeight: "800" },
  meterTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  meterFill: { height: 8, borderRadius: 4 },
  meterHint: { fontSize: 12, lineHeight: 17 },

  sectionHeader: { marginTop: 24, marginBottom: 10, gap: 3 },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  sectionSub: { fontSize: 12, lineHeight: 17 },

  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  textArea: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14,
    minHeight: 90, lineHeight: 20,
  },
  textInput: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14,
  },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
  },
  chipTxt: { fontSize: 13, fontWeight: "500" },

  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: 1, marginBottom: 2,
  },
  toggleLabel: { fontSize: 14, fontWeight: "500" },
  togglePill: { width: 44, height: 26, borderRadius: 13, justifyContent: "center" },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
  },

  diasporaWrap: {
    marginTop: 12,
    marginBottom: 4,
    gap: 6,
  },
  diasporaLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  diasporaSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },

  bottomSave: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 32,
  },
  bottomSaveTxt: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
