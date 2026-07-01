import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const GOLD = "#C9922B";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReloBiz {
  name: string;
  category: string;
  description: string;
  neighborhood?: string;
  whyForYou?: string;
  phone?: string | null;
  website?: string | null;
  verified?: boolean;
  platformVerified?: boolean;
  saved?: boolean;
}

interface LocationSuggestion {
  area: string;
  distanceMiles: number;
  vibe: string;
  why: string;
  minorityBiz?: string;
}

interface ReloMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  businesses?: ReloBiz[];
  locationSuggestions?: LocationSuggestion[];
  insight?: string;
  checklistItems?: string[];
  nextPhaseHint?: string;
  proactiveSuggestions?: string[];
  phase?: { id: string; title: string; icon: string };
}

interface SetupData {
  fromCity: string;
  toCity: string;
  toState: string;
  timeline: string;
  familySize: string;
  budget: string;
  homeType: string;
  hasKids: boolean;
  hasPets: boolean;
  needs: string[];
}

const PHASES = [
  { id: "neighborhoods", icon: "🏘️", title: "Neighborhoods" },
  { id: "realtors",      icon: "🏠", title: "Realtor" },
  { id: "mortgage",      icon: "💰", title: "Financing" },
  { id: "movers",        icon: "🚚", title: "Movers" },
  { id: "utilities",     icon: "⚡", title: "Utilities" },
  { id: "healthcare",    icon: "🏥", title: "Healthcare" },
  { id: "schools",       icon: "🎓", title: "Schools" },
  { id: "salons",        icon: "✂️", title: "Beauty" },
  { id: "restaurants",   icon: "🍽️", title: "Food" },
  { id: "community",     icon: "🤝🏾", title: "Community" },
  { id: "employment",    icon: "💼", title: "Career" },
  { id: "safety",        icon: "🛡️", title: "Safety" },
];

const FAMILY_OPTIONS = [
  { id: "solo",        label: "Just me",          icon: "🧑🏾" },
  { id: "couple",      label: "Me & my partner",  icon: "👫🏾" },
  { id: "family-kids", label: "Family with kids", icon: "👨🏾‍👩🏾‍👧🏾" },
  { id: "family-teens",label: "Family with teens",icon: "👨🏾‍👩🏾‍👦🏾" },
];

const BUDGET_OPTIONS = [
  { id: "budget",  label: "Budget",    emoji: "💵" },
  { id: "mid",     label: "Mid-range", emoji: "💳" },
  { id: "luxury",  label: "Luxury",    emoji: "✨" },
];

const TIMELINE_OPTIONS = [
  { id: "asap",     label: "ASAP" },
  { id: "1-3mo",   label: "1-3 months" },
  { id: "3-6mo",   label: "3-6 months" },
  { id: "explore", label: "Just exploring" },
];

const NEEDS_LIST = [
  { label: "Real Estate Agent", emoji: "🏠" },
  { label: "Moving Company",    emoji: "🚚" },
  { label: "Home Repair",       emoji: "🔧" },
  { label: "Cleaning Service",  emoji: "🧹" },
  { label: "Healthcare Provider",emoji: "🏥" },
  { label: "Schools / Childcare",emoji: "🎓" },
  { label: "Financial / Banking",emoji: "🏦" },
  { label: "Hair & Beauty",     emoji: "✂️" },
  { label: "Mental Health",     emoji: "💆🏾" },
  { label: "Community & Church",emoji: "🤝🏾" },
  { label: "Job / Career",      emoji: "💼" },
  { label: "Storage Unit",      emoji: "🏪" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReloBizCard({
  biz,
  onSave,
  saved,
  colors,
}: {
  biz: ReloBiz;
  onSave: (biz: ReloBiz) => void;
  saved: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[bizS.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={bizS.header}>
        <View style={[bizS.badge, { backgroundColor: GOLD + "20" }]}>
          <Text style={[bizS.badgeText, { color: GOLD }]}>{biz.category}</Text>
        </View>
        {biz.verified && (
          <View style={[bizS.verBadge, { backgroundColor: "#16A34A18" }]}>
            <Ionicons name="checkmark-circle" size={11} color="#16A34A" />
            <Text style={[bizS.verText, { color: "#16A34A" }]}>Verified</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => { onSave(biz); Haptics.selectionAsync(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[bizS.saveBtn, saved && { backgroundColor: GOLD + "22" }]}
        >
          <Ionicons name={saved ? "people" : "people-outline"} size={16} color={saved ? GOLD : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
      <Text style={[bizS.name, { color: colors.text }]}>{biz.name}</Text>
      {biz.neighborhood && (
        <Text style={[bizS.hood, { color: colors.mutedForeground }]}>
          <Ionicons name="location-outline" size={11} /> {biz.neighborhood}
        </Text>
      )}
      <Text style={[bizS.desc, { color: colors.mutedForeground }]}>{biz.description}</Text>
      {biz.whyForYou && (
        <View style={[bizS.whyBox, { backgroundColor: GOLD + "12", borderColor: GOLD + "30" }]}>
          <Ionicons name="sparkles" size={12} color={GOLD} />
          <Text style={[bizS.whyText, { color: colors.text }]}>{biz.whyForYou}</Text>
        </View>
      )}
      {(biz.phone || biz.website) && (
        <View style={bizS.contactRow}>
          {biz.phone && (
            <View style={bizS.contactChip}>
              <Ionicons name="call-outline" size={12} color={colors.mutedForeground} />
              <Text style={[bizS.contactText, { color: colors.mutedForeground }]}>{biz.phone}</Text>
            </View>
          )}
          {biz.website && (
            <View style={bizS.contactChip}>
              <Ionicons name="globe-outline" size={12} color={colors.mutedForeground} />
              <Text style={[bizS.contactText, { color: colors.mutedForeground }]} numberOfLines={1}>{biz.website}</Text>
            </View>
          )}
        </View>
      )}
      {!saved && (
        <TouchableOpacity
          style={[bizS.addBtn, { borderColor: GOLD }]}
          onPress={() => { onSave(biz); Haptics.selectionAsync(); }}
        >
          <Ionicons name="add" size={14} color={GOLD} />
          <Text style={[bizS.addText, { color: GOLD }]}>Add to My Team</Text>
        </TouchableOpacity>
      )}
      {saved && (
        <View style={[bizS.savedBadge, { backgroundColor: GOLD + "18" }]}>
          <Ionicons name="checkmark-circle" size={14} color={GOLD} />
          <Text style={[bizS.savedText, { color: GOLD }]}>On your Relocation Team</Text>
        </View>
      )}
    </View>
  );
}

function LocationSuggestionCard({
  suggestion,
  onSelect,
  colors,
}: {
  suggestion: LocationSuggestion;
  onSelect: (area: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[locS.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => { onSelect(suggestion.area); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      activeOpacity={0.8}
    >
      <View style={locS.headerRow}>
        <View style={[locS.distBadge, { backgroundColor: GOLD + "22" }]}>
          <Text style={[locS.distText, { color: GOLD }]}>~{suggestion.distanceMiles} mi</Text>
        </View>
        <Text style={[locS.areaName, { color: colors.text }]} numberOfLines={1}>{suggestion.area}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
      </View>
      <Text style={[locS.vibe, { color: GOLD }]}>{suggestion.vibe}</Text>
      <Text style={[locS.why, { color: colors.mutedForeground }]}>{suggestion.why}</Text>
      {suggestion.minorityBiz && (
        <View style={[locS.bizRow, { borderTopColor: colors.border }]}>
          <Ionicons name="storefront-outline" size={12} color="#16A34A" />
          <Text style={[locS.bizText, { color: "#16A34A" }]}>{suggestion.minorityBiz}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const locS = StyleSheet.create({
  card:      { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  distBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  distText:  { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  areaName:  { fontFamily: "Inter_700Bold", fontSize: 14, flex: 1 },
  vibe:      { fontFamily: "Inter_600SemiBold", fontSize: 12, marginBottom: 4 },
  why:       { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, marginBottom: 4 },
  bizRow:    { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, paddingTop: 8, marginTop: 4 },
  bizText:   { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
});

const bizS = StyleSheet.create({
  card:       { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  header:     { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  badge:      { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:  { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  verBadge:   { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  verText:    { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  saveBtn:    { marginLeft: "auto", padding: 6, borderRadius: 8 },
  name:       { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 3 },
  hood:       { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 6 },
  desc:       { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 8 },
  whyBox:     { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, borderWidth: 1, padding: 8, marginBottom: 8 },
  whyText:    { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  contactRow: { flexDirection: "row", gap: 10, marginBottom: 10, flexWrap: "wrap" },
  contactChip:{ flexDirection: "row", alignItems: "center", gap: 4 },
  contactText:{ fontFamily: "Inter_400Regular", fontSize: 11 },
  addBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1.5, borderRadius: 8, paddingVertical: 7 },
  addText:    { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  savedBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 8, paddingVertical: 7 },
  savedText:  { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});

function PhaseStep({
  phase,
  active,
  completed,
  onPress,
  colors,
}: {
  phase: typeof PHASES[0];
  active: boolean;
  completed: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={phS.wrap} activeOpacity={0.7}>
      <View style={[
        phS.circle,
        { borderColor: active ? GOLD : completed ? "#16A34A" : colors.border, backgroundColor: active ? GOLD + "22" : completed ? "#16A34A18" : colors.background },
      ]}>
        <Text style={phS.icon}>{phase.icon}</Text>
        {completed && (
          <View style={phS.checkDot}>
            <Ionicons name="checkmark" size={8} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[phS.label, { color: active ? GOLD : completed ? "#16A34A" : colors.mutedForeground }]} numberOfLines={1}>
        {phase.title}
      </Text>
    </TouchableOpacity>
  );
}

const phS = StyleSheet.create({
  wrap:     { alignItems: "center", width: 64 },
  circle:   { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  icon:     { fontSize: 22 },
  label:    { fontFamily: "Inter_600SemiBold", fontSize: 10, textAlign: "center" },
  checkDot: { position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#16A34A", alignItems: "center", justifyContent: "center" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RelocationPlannerScreen() {
  const colors = useColors();
  const { preferences } = useUserPreferences();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);

  const [view, setView]         = useState<"setup" | "chat">("setup");
  const [setupStep, setSetupStep] = useState(1);
  const [setup, setSetup]       = useState<SetupData>({
    fromCity: "", toCity: "", toState: "", timeline: "",
    familySize: "", budget: "", homeType: "", hasKids: false, hasPets: false, needs: [],
  });

  const [messages, setMessages] = useState<ReloMessage[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set());
  const [team, setTeam]         = useState<ReloBiz[]>([]);
  const [teamOpen, setTeamOpen] = useState(false);

  const currentPhase = PHASES[currentPhaseIdx]!;

  // User's stored interests — sent with every API call so KinfolkAI can tailor location + business suggestions
  const userInterests = [
    ...(preferences?.lifestyleServices ?? []),
    ...(preferences?.culturalInterests ?? []),
    ...(preferences?.favoriteCategories ?? []),
  ];

  const getApiBase = () =>
    process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

  const getToken = async () => {
    try { return await SecureStore.getItemAsync("auth_session_token"); } catch { return null; }
  };

  const saveToTeam = useCallback((biz: ReloBiz) => {
    setTeam(prev => {
      const exists = prev.some(b => b.name === biz.name);
      if (exists) return prev.filter(b => b.name !== biz.name);
      return [...prev, { ...biz, saved: true }];
    });
  }, []);

  const isOnTeam = (biz: ReloBiz) => team.some(b => b.name === biz.name);

  const sendMessage = useCallback(async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || loading) return;

    setInput("");
    const userMsg: ReloMessage = { id: Date.now().toString(), role: "user", content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const apiBase = getApiBase();
      const token = await getToken();
      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const body = {
        messages: allMessages,
        fromCity: setup.fromCity,
        toCity: setup.toCity,
        toState: setup.toState,
        familySize: setup.familySize,
        budget: setup.budget,
        homeType: setup.homeType,
        hasKids: setup.hasKids,
        hasPets: setup.hasPets,
        currentPhase: currentPhase.id,
        needs: setup.needs,
        interests: userInterests,
      };

      const res = await fetch(`${apiBase}/api/kinfolk/relocation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json() as {
        reply: string;
        businesses: ReloBiz[];
        locationSuggestions?: LocationSuggestion[];
        proactiveSuggestions: string[];
        insight: string;
        checklistItems: string[];
        nextPhaseHint: string;
        phase: { id: string; title: string; icon: string };
        extraVerified?: ReloBiz[];
      };

      const allBiz = [
        ...(data.businesses ?? []),
        ...(data.extraVerified ?? []),
      ];

      const aiMsg: ReloMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply ?? "",
        businesses: allBiz,
        locationSuggestions: data.locationSuggestions,
        insight: data.insight,
        checklistItems: data.checklistItems,
        nextPhaseHint: data.nextPhaseHint,
        proactiveSuggestions: data.proactiveSuggestions,
        phase: data.phase,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I had trouble connecting. Check your network and try again.",
          businesses: [],
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [input, loading, messages, setup, currentPhase]);

  const startJourney = async () => {
    if (!setup.fromCity || !setup.toCity) {
      return;
    }
    setView("chat");
    const hasKids = setup.familySize.includes("kids") || setup.familySize.includes("teens");
    setSetup(prev => ({ ...prev, hasKids }));
    await sendFirstMessage(hasKids);
  };

  const sendFirstMessage = async (hasKids: boolean) => {
    setLoading(true);
    try {
      const apiBase = getApiBase();
      const token = await getToken();
      const body = {
        messages: [{
          role: "user",
          content: `I'm moving from ${setup.fromCity} to ${setup.toCity}${setup.toState ? `, ${setup.toState}` : ""}. ${setup.timeline ? `Timeline: ${setup.timeline}.` : ""} Family: ${setup.familySize || "solo"}. Budget: ${setup.budget || "mid"}. Plan: ${setup.homeType || "renting"}. ${hasKids ? "I have kids." : ""} ${setup.hasPets ? "I have pets." : ""} ${setup.needs.length > 0 ? `My main needs are: ${setup.needs.join(", ")}.` : ""} Start me off with finding the right neighborhood.`,
        }],
        fromCity: setup.fromCity,
        toCity: setup.toCity,
        toState: setup.toState,
        familySize: setup.familySize,
        budget: setup.budget,
        homeType: setup.homeType,
        hasKids,
        hasPets: setup.hasPets,
        currentPhase: "neighborhoods",
        needs: setup.needs,
        interests: userInterests,
      };

      const res = await fetch(`${apiBase}/api/kinfolk/relocation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      const data = await res.json() as {
        reply: string; businesses: ReloBiz[]; locationSuggestions?: LocationSuggestion[];
        proactiveSuggestions: string[]; insight: string; checklistItems: string[];
        nextPhaseHint: string; phase: { id: string; title: string; icon: string }; extraVerified?: ReloBiz[];
      };

      const allBiz = [...(data.businesses ?? []), ...(data.extraVerified ?? [])];
      const aiMsg: ReloMessage = {
        id: "first",
        role: "assistant",
        content: data.reply ?? "",
        businesses: allBiz,
        locationSuggestions: data.locationSuggestions,
        insight: data.insight,
        checklistItems: data.checklistItems,
        nextPhaseHint: data.nextPhaseHint,
        proactiveSuggestions: data.proactiveSuggestions,
        phase: data.phase,
      };
      setMessages([aiMsg]);
    } catch {
      setMessages([{
        id: "err",
        role: "assistant",
        content: `Let's get your move to ${setup.toCity} sorted! Starting with neighborhood research — finding the right community is everything.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const advancePhase = () => {
    setCompletedPhases(prev => new Set([...prev, currentPhase.id]));
    const next = Math.min(currentPhaseIdx + 1, PHASES.length - 1);
    setCurrentPhaseIdx(next);
    const nextPhase = PHASES[next]!;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sendMessage(`Let's move on to ${nextPhase.title}. What do I need to know?`);
  };

  // ── Setup Wizard ────────────────────────────────────────────────────────────
  if (view === "setup") {
    return (
      <View style={[s.flex, { backgroundColor: colors.background }]}>
        <View style={[s.setupHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.setupTitle, { color: colors.text }]}>Relocation Planner</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[s.progressBar, { backgroundColor: colors.border }]}>
          <View style={[s.progressFill, { backgroundColor: GOLD, width: `${(setupStep / 3) * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={s.setupBody} showsVerticalScrollIndicator={false}>
          {setupStep === 1 && (
            <>
              <Text style={[s.stepLabel, { color: GOLD }]}>STEP 1 OF 3</Text>
              <Text style={[s.stepHeading, { color: colors.text }]}>Where are you moving?</Text>
              <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
                Tell me where you're coming from and where you're headed — I'll tailor everything to your journey.
              </Text>

              <Text style={[s.fieldLabel, { color: colors.text }]}>Moving from</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Current city (e.g. Chicago)"
                placeholderTextColor={colors.mutedForeground}
                value={setup.fromCity}
                onChangeText={v => setSetup(p => ({ ...p, fromCity: v }))}
              />

              <Text style={[s.fieldLabel, { color: colors.text }]}>Moving to — City</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Destination city (e.g. Atlanta)"
                placeholderTextColor={colors.mutedForeground}
                value={setup.toCity}
                onChangeText={v => setSetup(p => ({ ...p, toCity: v }))}
              />

              <Text style={[s.fieldLabel, { color: colors.text }]}>State</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="State (e.g. GA)"
                placeholderTextColor={colors.mutedForeground}
                value={setup.toState}
                onChangeText={v => setSetup(p => ({ ...p, toState: v }))}
                autoCapitalize="characters"
                maxLength={2}
              />

              <Text style={[s.fieldLabel, { color: colors.text }]}>Timeline</Text>
              <View style={s.chipRow}>
                {TIMELINE_OPTIONS.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.chip, { borderColor: setup.timeline === t.id ? GOLD : colors.border, backgroundColor: setup.timeline === t.id ? GOLD + "18" : colors.card }]}
                    onPress={() => { setSetup(p => ({ ...p, timeline: t.id })); Haptics.selectionAsync(); }}
                  >
                    <Text style={[s.chipText, { color: setup.timeline === t.id ? GOLD : colors.mutedForeground }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[s.nextBtn, { backgroundColor: GOLD, opacity: setup.fromCity && setup.toCity ? 1 : 0.5 }]}
                onPress={() => { if (setup.fromCity && setup.toCity) setSetupStep(2); }}
                disabled={!setup.fromCity || !setup.toCity}
              >
                <Text style={s.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            </>
          )}

          {setupStep === 2 && (
            <>
              <Text style={[s.stepLabel, { color: GOLD }]}>STEP 2 OF 3</Text>
              <Text style={[s.stepHeading, { color: colors.text }]}>Tell me about your situation</Text>
              <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
                The more I know, the smarter my recommendations. I'll think ahead so you don't have to.
              </Text>

              <Text style={[s.fieldLabel, { color: colors.text }]}>Who's moving?</Text>
              <View style={s.chipRow}>
                {FAMILY_OPTIONS.map(f => (
                  <TouchableOpacity
                    key={f.id}
                    style={[s.chip, { borderColor: setup.familySize === f.id ? GOLD : colors.border, backgroundColor: setup.familySize === f.id ? GOLD + "18" : colors.card }]}
                    onPress={() => { setSetup(p => ({ ...p, familySize: f.id })); Haptics.selectionAsync(); }}
                  >
                    <Text style={[s.chipText, { color: setup.familySize === f.id ? GOLD : colors.mutedForeground }]}>{f.icon} {f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.fieldLabel, { color: colors.text }]}>Budget</Text>
              <View style={s.chipRow}>
                {BUDGET_OPTIONS.map(b => (
                  <TouchableOpacity
                    key={b.id}
                    style={[s.chip, { borderColor: setup.budget === b.id ? GOLD : colors.border, backgroundColor: setup.budget === b.id ? GOLD + "18" : colors.card }]}
                    onPress={() => { setSetup(p => ({ ...p, budget: b.id })); Haptics.selectionAsync(); }}
                  >
                    <Text style={[s.chipText, { color: setup.budget === b.id ? GOLD : colors.mutedForeground }]}>{b.emoji} {b.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.fieldLabel, { color: colors.text }]}>Home plan</Text>
              <View style={s.chipRow}>
                {[{ id: "renting", label: "🏢 Renting" }, { id: "buy", label: "🏠 Buying" }].map(h => (
                  <TouchableOpacity
                    key={h.id}
                    style={[s.chip, { borderColor: setup.homeType === h.id ? GOLD : colors.border, backgroundColor: setup.homeType === h.id ? GOLD + "18" : colors.card }]}
                    onPress={() => { setSetup(p => ({ ...p, homeType: h.id })); Haptics.selectionAsync(); }}
                  >
                    <Text style={[s.chipText, { color: setup.homeType === h.id ? GOLD : colors.mutedForeground }]}>{h.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.toggleRow}>
                <Text style={[s.toggleLabel, { color: colors.text }]}>I have pets 🐾</Text>
                <TouchableOpacity
                  style={[s.toggle, { backgroundColor: setup.hasPets ? GOLD : colors.border }]}
                  onPress={() => { setSetup(p => ({ ...p, hasPets: !p.hasPets })); Haptics.selectionAsync(); }}
                >
                  <View style={[s.toggleThumb, { marginLeft: setup.hasPets ? 18 : 2 }]} />
                </TouchableOpacity>
              </View>

              <View style={s.btnRow}>
                <TouchableOpacity style={[s.backBtn, { borderColor: colors.border }]} onPress={() => setSetupStep(1)}>
                  <Text style={[s.backBtnText, { color: colors.mutedForeground }]}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.nextBtn, { backgroundColor: GOLD, flex: 1 }]} onPress={() => setSetupStep(3)}>
                  <Text style={s.nextBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {setupStep === 3 && (
            <>
              <Text style={[s.stepLabel, { color: GOLD }]}>STEP 3 OF 3</Text>
              <Text style={[s.stepHeading, { color: colors.text }]}>What do you need?</Text>
              <Text style={[s.stepSub, { color: colors.mutedForeground }]}>
                Select everything that applies — I'll prioritize these first and think ahead for the rest.
              </Text>

              <View style={s.needsGrid}>
                {NEEDS_LIST.map(n => {
                  const sel = setup.needs.includes(n.label);
                  return (
                    <TouchableOpacity
                      key={n.label}
                      style={[s.needCard, { borderColor: sel ? GOLD : colors.border, backgroundColor: sel ? GOLD + "18" : colors.card }]}
                      onPress={() => {
                        setSetup(p => ({
                          ...p,
                          needs: sel ? p.needs.filter(x => x !== n.label) : [...p.needs, n.label],
                        }));
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text style={s.needEmoji}>{n.emoji}</Text>
                      <Text style={[s.needLabel, { color: sel ? GOLD : colors.text }]}>{n.label}</Text>
                      {sel && <Ionicons name="checkmark-circle" size={16} color={GOLD} style={s.needCheck} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[s.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.summaryTitle, { color: colors.text }]}>📦 Your Move</Text>
                <Text style={[s.summaryLine, { color: colors.mutedForeground }]}>
                  {setup.fromCity} → {setup.toCity}{setup.toState ? `, ${setup.toState}` : ""}
                </Text>
                <Text style={[s.summaryLine, { color: colors.mutedForeground }]}>
                  {setup.familySize || "Solo"} · {setup.budget || "Mid-range"} · {setup.homeType || "Renting"}
                </Text>
                {setup.hasPets && <Text style={[s.summaryLine, { color: colors.mutedForeground }]}>🐾 Pets included</Text>}
              </View>

              <View style={s.btnRow}>
                <TouchableOpacity style={[s.backBtn, { borderColor: colors.border }]} onPress={() => setSetupStep(2)}>
                  <Text style={[s.backBtnText, { color: colors.mutedForeground }]}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.nextBtn, { backgroundColor: GOLD, flex: 1 }]} onPress={startJourney}>
                  <Text style={s.nextBtnText}>Start My Journey 🚀</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Chat View ───────────────────────────────────────────────────────────────
  return (
    <View style={[s.flex, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.chatHeader, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setView("setup")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            Moving to {setup.toCity}
          </Text>
          <View style={[s.phasePill, { backgroundColor: GOLD + "22" }]}>
            <Text style={[s.phasePillText, { color: GOLD }]}>{currentPhase.icon} {currentPhase.title}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[s.teamBtn, { backgroundColor: GOLD + "22" }]}
          onPress={() => setTeamOpen(true)}
        >
          <Ionicons name="people" size={16} color={GOLD} />
          {team.length > 0 && (
            <View style={s.teamBadge}>
              <Text style={s.teamBadgeText}>{team.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Phase Stepper */}
      <View style={[s.stepperWrap, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.stepperScroll}>
          {PHASES.map((p, i) => (
            <PhaseStep
              key={p.id}
              phase={p}
              active={i === currentPhaseIdx}
              completed={completedPhases.has(p.id)}
              onPress={() => {
                if (i <= currentPhaseIdx || completedPhases.has(p.id)) {
                  setCurrentPhaseIdx(i);
                  sendMessage(`Tell me more about ${p.title}`);
                }
              }}
              colors={colors}
            />
          ))}
        </ScrollView>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={[s.msgList, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: msg }) => (
          <View style={msg.role === "user" ? s.userRow : s.aiBubbleWrap}>
            {msg.role === "user" ? (
              <View style={[s.userBubble, { backgroundColor: GOLD }]}>
                <Text style={s.userText}>{msg.content}</Text>
              </View>
            ) : (
              <View style={s.aiContent}>
                {/* AI avatar + message */}
                <View style={s.aiRow}>
                  <View style={[s.aiAvatar, { backgroundColor: GOLD + "22" }]}>
                    <Text style={s.aiAvatarText}>K</Text>
                  </View>
                  <View style={[s.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.aiText, { color: colors.text }]}>{msg.content}</Text>
                  </View>
                </View>

                {/* Insight callout */}
                {msg.insight && (
                  <View style={[s.insightBox, { backgroundColor: "#7C3AED14", borderColor: "#7C3AED30" }]}>
                    <Ionicons name="bulb-outline" size={14} color="#7C3AED" />
                    <Text style={[s.insightText, { color: colors.text }]}>{msg.insight}</Text>
                  </View>
                )}

                {/* Location suggestion cards */}
                {(msg.locationSuggestions ?? []).length > 0 && (
                  <View style={s.bizSection}>
                    <Text style={[s.bizSectionLabel, { color: colors.mutedForeground }]}>
                      📍 Areas to Explore
                    </Text>
                    {(msg.locationSuggestions ?? []).map((loc: LocationSuggestion, i: number) => (
                      <LocationSuggestionCard
                        key={`${loc.area}-${i}`}
                        suggestion={loc}
                        onSelect={(area) => sendMessage(`Tell me more about ${area} — what should I know before moving there?`)}
                        colors={colors}
                      />
                    ))}
                  </View>
                )}

                {/* Business cards */}
                {(msg.businesses ?? []).length > 0 && (
                  <View style={s.bizSection}>
                    <Text style={[s.bizSectionLabel, { color: colors.mutedForeground }]}>
                      🤎 Minority-Owned Recommendations
                    </Text>
                    {(msg.businesses ?? []).map((biz: ReloBiz, i: number) => (
                      <ReloBizCard
                        key={`${biz.name}-${i}`}
                        biz={biz}
                        onSave={saveToTeam}
                        saved={isOnTeam(biz)}
                        colors={colors}
                      />
                    ))}
                  </View>
                )}

                {/* Checklist */}
                {(msg.checklistItems ?? []).length > 0 && (
                  <View style={[s.checklistBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.checklistTitle, { color: colors.text }]}>✅ Phase Checklist</Text>
                    {(msg.checklistItems ?? []).map((item: string, i: number) => (
                      <View key={i} style={s.checkItem}>
                        <View style={[s.checkDot2, { borderColor: GOLD }]} />
                        <Text style={[s.checkText, { color: colors.mutedForeground }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Next phase hint */}
                {msg.nextPhaseHint && (
                  <View style={[s.nextHintBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.nextHintText, { color: colors.mutedForeground }]}>
                      <Text style={{ color: GOLD }}>Up next: </Text>{msg.nextPhaseHint}
                    </Text>
                    {currentPhaseIdx < PHASES.length - 1 && (
                      <TouchableOpacity style={[s.advanceBtn, { backgroundColor: GOLD }]} onPress={advancePhase}>
                        <Text style={s.advanceBtnText}>Next Phase →</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Suggestion chips */}
                {(msg.proactiveSuggestions ?? []).length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
                    {(msg.proactiveSuggestions ?? []).map((s2: string, i: number) => (
                      <TouchableOpacity
                        key={i}
                        style={[sugS.chip, { borderColor: colors.border, backgroundColor: colors.card }]}
                        onPress={() => sendMessage(s2)}
                      >
                        <Text style={[sugS.chipText, { color: colors.text }]}>{s2}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        )}
        ListFooterComponent={loading ? (
          <View style={s.loadingRow}>
            <View style={[s.aiAvatar, { backgroundColor: GOLD + "22" }]}>
              <Text style={s.aiAvatarText}>K</Text>
            </View>
            <View style={[s.loadingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Finding minority-owned businesses…</Text>
            </View>
          </View>
        ) : null}
      />

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[s.inputBar, { paddingBottom: insets.bottom + 8, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TextInput
            style={[s.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder={`Ask about ${currentPhase.title.toLowerCase()}…`}
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: input.trim() ? GOLD : colors.border }]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Your Team Modal */}
      <Modal visible={teamOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setTeamOpen(false)}>
        <View style={[s.flex, { backgroundColor: colors.background }]}>
          <View style={[s.teamHeader, { paddingTop: insets.top + 16 }]}>
            <Text style={[s.teamTitle, { color: colors.text }]}>Your Relocation Team</Text>
            <TouchableOpacity onPress={() => setTeamOpen(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={[s.teamSub, { color: colors.mutedForeground }]}>
            {team.length > 0
              ? `${team.length} minority-owned business${team.length === 1 ? "" : "es"} saved to your team`
              : "Add businesses to build your relocation team"}
          </Text>
          <ScrollView contentContainerStyle={s.teamList}>
            {team.length === 0 && (
              <View style={s.emptyTeam}>
                <Text style={s.emptyEmoji}>🤎</Text>
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                  Tap "Add to My Team" on any recommended business to save them here.
                </Text>
              </View>
            )}
            {team.map((biz, i) => (
              <ReloBizCard
                key={`team-${i}`}
                biz={biz}
                onSave={saveToTeam}
                saved={true}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const sugS = StyleSheet.create({
  chip:     { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
});

const s = StyleSheet.create({
  flex:           { flex: 1 },
  setupHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  setupTitle:     { fontFamily: "PlayfairDisplay_700Bold", fontSize: 18 },
  progressBar:    { height: 4, marginHorizontal: 16, borderRadius: 2, marginBottom: 4 },
  progressFill:   { height: 4, borderRadius: 2 },
  setupBody:      { padding: 20, paddingBottom: 60 },
  stepLabel:      { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.2, marginBottom: 8 },
  stepHeading:    { fontFamily: "PlayfairDisplay_700Bold", fontSize: 26, marginBottom: 8 },
  stepSub:        { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, marginBottom: 24 },
  fieldLabel:     { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 8 },
  input:          { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15, marginBottom: 20 },
  chipRow:        { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  chip:           { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8 },
  chipText:       { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  toggleRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  toggleLabel:    { fontFamily: "Inter_500Medium", fontSize: 15 },
  toggle:         { width: 44, height: 26, borderRadius: 13, justifyContent: "center" },
  toggleThumb:    { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" },
  nextBtn:        { borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  nextBtnText:    { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  btnRow:         { flexDirection: "row", gap: 12, marginTop: 8 },
  backBtn:        { borderWidth: 1.5, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  backBtnText:    { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  needsGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  needCard:       { width: "47%", borderRadius: 12, borderWidth: 1.5, padding: 12, position: "relative" },
  needEmoji:      { fontSize: 22, marginBottom: 6 },
  needLabel:      { fontFamily: "Inter_600SemiBold", fontSize: 12, lineHeight: 16 },
  needCheck:      { position: "absolute", top: 8, right: 8 },
  summaryBox:     { borderRadius: 12, borderWidth: 1.5, padding: 14, marginBottom: 20 },
  summaryTitle:   { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 6 },
  summaryLine:    { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 2 },
  chatHeader:     { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerCenter:   { flex: 1 },
  headerTitle:    { fontFamily: "PlayfairDisplay_700Bold", fontSize: 17 },
  phasePill:      { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  phasePillText:  { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  teamBtn:        { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  teamBadge:      { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  teamBadgeText:  { fontFamily: "Inter_700Bold", fontSize: 9, color: "#fff" },
  stepperWrap:    { borderBottomWidth: 1 },
  stepperScroll:  { paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  msgList:        { padding: 16 },
  userRow:        { alignItems: "flex-end", marginBottom: 16 },
  userBubble:     { maxWidth: "80%", borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  userText:       { fontFamily: "Inter_400Regular", fontSize: 14, color: "#fff", lineHeight: 20 },
  aiBubbleWrap:   { marginBottom: 20 },
  aiContent:      { gap: 10 },
  aiRow:          { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  aiAvatar:       { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  aiAvatarText:   { fontFamily: "PlayfairDisplay_700Bold", fontSize: 16, color: GOLD },
  aiBubble:       { flex: 1, borderRadius: 14, borderBottomLeftRadius: 4, borderWidth: 1.5, padding: 12 },
  aiText:         { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  insightBox:     { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginLeft: 44 },
  insightText:    { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 19 },
  bizSection:     { marginLeft: 44 },
  bizSectionLabel:{ fontFamily: "Inter_600SemiBold", fontSize: 12, marginBottom: 8, letterSpacing: 0.3 },
  checklistBox:   { borderRadius: 12, borderWidth: 1.5, padding: 12, marginLeft: 44, gap: 6 },
  checklistTitle: { fontFamily: "Inter_700Bold", fontSize: 13, marginBottom: 4 },
  checkItem:      { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  checkDot2:      { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, marginTop: 2, flexShrink: 0 },
  checkText:      { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 19 },
  nextHintBox:    { borderRadius: 12, borderWidth: 1.5, padding: 12, marginLeft: 44, gap: 10 },
  nextHintText:   { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  advanceBtn:     { borderRadius: 8, paddingVertical: 9, alignItems: "center" },
  advanceBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  chipScroll:     { marginLeft: 44 },
  loadingRow:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  loadingBubble:  { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1.5, padding: 12, flex: 1 },
  loadingText:    { fontFamily: "Inter_400Regular", fontSize: 13 },
  inputBar:       { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1 },
  textInput:      { flex: 1, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, maxHeight: 100 },
  sendBtn:        { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  teamHeader:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  teamTitle:      { fontFamily: "PlayfairDisplay_700Bold", fontSize: 22 },
  teamSub:        { fontFamily: "Inter_400Regular", fontSize: 14, paddingHorizontal: 20, marginBottom: 16 },
  teamList:       { padding: 16, paddingBottom: 60 },
  emptyTeam:      { alignItems: "center", padding: 40 },
  emptyEmoji:     { fontSize: 48, marginBottom: 16 },
  emptyText:      { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22 },
});
