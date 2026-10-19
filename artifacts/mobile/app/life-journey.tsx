import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import * as Haptics from "expo-haptics";

interface JourneyStep {
  id: string;
  label: string;
  explored?: boolean;
  exploredAt?: string;
  /** Legacy plans are still readable but are never shown as completion scores. */
  completed?: boolean;
  completedAt?: string;
}

interface JourneyPhase {
  id: string;
  title: string;
  icon: string;
  description: string;
  categories: string[];
  status?: "available" | "upcoming" | "active" | "completed";
  steps: JourneyStep[];
  aiInsight?: string;
}

interface Journey {
  id: string;
  journeyType: string;
  title: string;
  city?: string;
  state?: string;
  status: "active" | "paused" | "completed";
  phases: JourneyPhase[];
  aiContext?: string;
  createdAt: string;
}

interface JourneyType {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export default function LifeJourneyScreen() {
  const colors = useColors();
  const router = useRouter();
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [journeyTypes, setJourneyTypes] = useState<JourneyType[]>([]);
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [smartMatches, setSmartMatches] = useState<{
    matches: { category: string; fromCity: string; savedCount: number; matches: { name: string; category: string; city: string; verified: boolean }[] }[];
    message: string | null;
    destinationCity?: string;
  } | null>(null);

  const [selectedType, setSelectedType] = useState<string>("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);

  const JOURNEY_NEEDS: Record<string, { label: string; emoji: string }[]> = {
    moving: [
      { label: "Moving Company", emoji: "🚚" }, { label: "Home Repair", emoji: "🔧" },
      { label: "Home Organizer", emoji: "📦" }, { label: "Cleaning Service", emoji: "🧹" },
      { label: "Storage Unit", emoji: "🏪" }, { label: "Real Estate Agent", emoji: "🏠" },
      { label: "Healthcare Provider", emoji: "🏥" }, { label: "Schools / Childcare", emoji: "🎓" },
      { label: "Community & Church", emoji: "🤝🏾" }, { label: "Financial / Banking", emoji: "🏦" },
      { label: "Hair & Beauty", emoji: "✂️" }, { label: "Mental Health", emoji: "💆🏾" },
    ],
    "new-to-city": [
      { label: "Hair & Beauty", emoji: "✂️" }, { label: "Healthcare Provider", emoji: "🏥" },
      { label: "Gym & Fitness", emoji: "💪🏾" }, { label: "Community Groups", emoji: "🤝🏾" },
      { label: "Place of Worship", emoji: "⛪" }, { label: "Professional Networking", emoji: "💼" },
      { label: "Restaurants & Food", emoji: "🍽️" }, { label: "Mental Health", emoji: "💆🏾" },
      { label: "Financial Services", emoji: "🏦" }, { label: "Transportation", emoji: "🚗" },
    ],
    "starting-business": [
      { label: "Business Attorney", emoji: "⚖️" }, { label: "Accountant / CPA", emoji: "📊" },
      { label: "Business Insurance", emoji: "🛡️" }, { label: "Coworking Space", emoji: "💻" },
      { label: "Marketing & Design", emoji: "🎨" }, { label: "Business Mentor", emoji: "🤝🏾" },
      { label: "Mental Health Support", emoji: "💆🏾" }, { label: "Bookkeeper", emoji: "📚" },
      { label: "Web / Tech Support", emoji: "🌐" }, { label: "Product Suppliers", emoji: "📦" },
    ],
    "new-baby": [
      { label: "OB-GYN / Midwife", emoji: "👶🏾" }, { label: "Pediatrician", emoji: "🏥" },
      { label: "Childcare / Daycare", emoji: "🏫" }, { label: "Postpartum Support", emoji: "💆🏾" },
      { label: "Lactation Consultant", emoji: "🤱🏾" }, { label: "Parent Groups", emoji: "🤝🏾" },
      { label: "Nutritionist", emoji: "🥗" }, { label: "Mental Health", emoji: "🧠" },
      { label: "Baby Essentials Shop", emoji: "🧸" }, { label: "Doula", emoji: "💛" },
    ],
    "getting-married": [
      { label: "Wedding Venue", emoji: "💒" }, { label: "Caterer", emoji: "🍽️" },
      { label: "Photographer", emoji: "📸" }, { label: "Hair & Makeup", emoji: "💄" },
      { label: "Wedding Planner", emoji: "📋" }, { label: "Florist", emoji: "🌸" },
      { label: "DJ / Entertainment", emoji: "🎵" }, { label: "Officiant", emoji: "📖" },
      { label: "Honeymoon Travel", emoji: "✈️" }, { label: "Legal / Name Change", emoji: "⚖️" },
    ],
    college: [
      { label: "Financial Aid Help", emoji: "🎓" }, { label: "Tutoring", emoji: "📚" },
      { label: "Mental Health", emoji: "💆🏾" }, { label: "Career Coaching", emoji: "💼" },
      { label: "Internship Search", emoji: "🔍" }, { label: "Housing", emoji: "🏠" },
      { label: "Community / Greek Life", emoji: "🤝🏾" }, { label: "Healthcare", emoji: "🏥" },
    ],
    "career-change": [
      { label: "Career Coach", emoji: "🎯" }, { label: "Resume Writer", emoji: "📝" },
      { label: "Training / Certification", emoji: "🎓" }, { label: "Networking Groups", emoji: "🤝🏾" },
      { label: "Mental Health Support", emoji: "💆🏾" }, { label: "Financial Planning", emoji: "💰" },
      { label: "Coworking Space", emoji: "💻" }, { label: "Recruiter", emoji: "🔍" },
    ],
    retirement: [
      { label: "Financial Advisor", emoji: "💰" }, { label: "Estate Planning", emoji: "📋" },
      { label: "Healthcare / Medicare", emoji: "🏥" }, { label: "Senior Community", emoji: "🤝🏾" },
      { label: "Downsizing Help", emoji: "🏠" }, { label: "Wellness & Fitness", emoji: "💪🏾" },
      { label: "Travel Planning", emoji: "✈️" }, { label: "Hobbies & Classes", emoji: "🎨" },
    ],
    "business-growth": [
      { label: "Brand & Logo Design", emoji: "🎨" }, { label: "Social Media Strategy", emoji: "📱" },
      { label: "Customer Loyalty Program", emoji: "⭐" }, { label: "Hiring & Staffing", emoji: "👥" },
      { label: "Bookkeeper / Accountant", emoji: "📊" }, { label: "Business Coach / Mentor", emoji: "🤝🏾" },
      { label: "Commercial Real Estate", emoji: "🏢" }, { label: "Marketing Agency", emoji: "📣" },
      { label: "Tech & POS Systems", emoji: "💻" }, { label: "Community Events", emoji: "🎉" },
      { label: "Press & PR", emoji: "📰" }, { label: "Supplier / Wholesale", emoji: "📦" },
    ],
    "business-repair": [
      { label: "Business Coach", emoji: "🤝🏾" }, { label: "Financial Relief Programs", emoji: "💊" },
      { label: "Contractor / Repairs", emoji: "🔧" }, { label: "Accountant / Debt Help", emoji: "📊" },
      { label: "Customer Service Training", emoji: "💬" }, { label: "Legal Counsel", emoji: "⚖️" },
      { label: "Marketing Reset", emoji: "🎯" }, { label: "Community Re-engagement", emoji: "❤️🏾" },
      { label: "Mental Health / Burnout", emoji: "💆🏾" }, { label: "Staffing Fix", emoji: "👥" },
    ],
  };

  const toggleNeed = (label: string) => {
    setSelectedNeeds((prev) =>
      prev.includes(label) ? prev.filter((n) => n !== label) : [...prev, label],
    );
    Haptics.selectionAsync();
  };

  const getApiBase = () =>
    process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

  const getToken = async () => {
    try { return await SecureStore.getItemAsync("auth_session_token"); } catch { return null; }
  };

  const authHeaders = (token: string | null): Record<string, string> =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const apiBase = getApiBase();
      const token = await getToken();
      const headers = authHeaders(token);
      const [typesRes, journeysRes] = await Promise.all([
        fetch(`${apiBase}/api/journeys/types/list`),
        isAuthenticated ? fetch(`${apiBase}/api/journeys`, { headers }) : Promise.resolve(null),
      ]);

      if (typesRes.ok) {
        const d = await typesRes.json() as { types: JourneyType[] };
        setJourneyTypes(d.types);
      }
      if (journeysRes?.ok) {
        const d = await journeysRes.json() as { journeys: Journey[] };
        setJourneys(d.journeys);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { queueMicrotask(() => { void loadData(); }); }, [loadData]);

  // Apply preset param from business dashboard navigation
  useEffect(() => {
    if (preset && journeyTypes.length > 0) {
      const match = journeyTypes.find((t) => t.id === preset);
      if (match) {
        queueMicrotask(() => { setSelectedType(match.id); });
        queueMicrotask(() => { setView("create"); });
      }
    }
  }, [preset, journeyTypes]);

  const loadSmartMatches = useCallback(async (journeyId: string) => {
    try {
      const apiBase = getApiBase();
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${apiBase}/api/journeys/${journeyId}/smart-matches`, {
        headers: authHeaders(token),
      });
      if (res.ok) {
        const data = await res.json() as { matches: typeof smartMatches extends null ? never : NonNullable<typeof smartMatches>["matches"]; message: string | null; destinationCity?: string };
        setSmartMatches(data);
      }
    } catch { /* non-critical */ }
  }, []);

  const createJourney = async () => {
    if (!selectedType) { Alert.alert("Pick a journey type first"); return; }
    setCreating(true);
    try {
      const apiBase = getApiBase();
      const token = await getToken();
      const res = await fetch(`${apiBase}/api/journeys`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({
          journeyType: selectedType,
          city: city.trim(),
          state: state.trim(),
          selectedNeeds: selectedNeeds.length > 0 ? selectedNeeds.join(", ") : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create journey");
      const d = await res.json() as { journey: Journey };
      setJourneys((prev) => [d.journey, ...prev]);
      setActiveJourney(d.journey);
      setView("detail");
      void loadSmartMatches(d.journey.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Couldn't create journey", "Something went wrong. Please try again.");
    } finally { setCreating(false); }
  };

  const hasExplored = (step: JourneyStep) => step.explored ?? step.completed ?? false;

  const toggleReflection = async (journey: Journey, phaseId: string, stepId: string, explored: boolean) => {
    const optimistic: Journey = {
      ...journey,
      phases: journey.phases.map((p) =>
        p.id !== phaseId ? p : {
          ...p,
          steps: p.steps.map((s) => s.id === stepId ? { ...s, explored } : s),
        }
      ),
    };
    setActiveJourney(optimistic);
    setJourneys((prev) => prev.map((j) => j.id === journey.id ? optimistic : j));

    try {
      const apiBase = getApiBase();
      const token = await getToken();
      const res = await fetch(`${apiBase}/api/journeys/${journey.id}/step`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ phaseId, stepId, explored }),
      });
      if (res.ok) {
        const d = await res.json() as { journey: Journey };
        setActiveJourney(d.journey);
        setJourneys((prev) => prev.map((j) => j.id === journey.id ? d.journey : j));
        if (explored) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch { /* silent */ }
  };

  const primaryGold = "#CA922B";

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={primaryGold} />
      </View>
    );
  }

  if (view === "create") {
    return (
      <>
      <ScrollView
        keyboardDismissMode="on-drag" style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setView("list")} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Start a Journey</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ padding: 16 }}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>What&apos;s happening in your life?</Text>

          <View style={styles.typeGrid}>
            {journeyTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  { backgroundColor: colors.card, borderColor: selectedType === type.id ? primaryGold : colors.border },
                ]}
                onPress={() => setSelectedType(type.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={[styles.typeLabel, { color: colors.foreground }]}>{type.label}</Text>
                <Text style={[styles.typeDesc, { color: colors.mutedForeground }]}>{type.description}</Text>
                {selectedType === type.id && (
                  <View style={[styles.selectedCheck, { backgroundColor: primaryGold }]}>
                    <Feather name="check" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedType && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 24 }]}>Where? (optional)</Text>
              <View style={styles.locationRow}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, flex: 2 }]}
                  placeholder="City"
                  placeholderTextColor={colors.mutedForeground}
                  value={city}
                  onChangeText={setCity}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, flex: 1, marginLeft: 8 }]}
                  placeholder="State"
                  placeholderTextColor={colors.mutedForeground}
                  value={state}
                  onChangeText={setState}
                />
              </View>

              {JOURNEY_NEEDS[selectedType] && (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
                    What do you need help with?
                  </Text>
                  <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                    Tap everything that applies — even things you haven&apos;t thought about yet
                  </Text>
                  <View style={styles.chipsWrap}>
                    {JOURNEY_NEEDS[selectedType]!.map((need) => {
                      const active = selectedNeeds.includes(need.label);
                      return (
                        <TouchableOpacity
                          key={need.label}
                          style={[
                            styles.chip,
                            { borderColor: active ? primaryGold : colors.border, backgroundColor: active ? primaryGold + "18" : colors.card },
                          ]}
                          onPress={() => toggleNeed(need.label)}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.chipEmoji}>{need.emoji}</Text>
                          <Text style={[styles.chipLabel, { color: active ? primaryGold : colors.foreground }]}>{need.label}</Text>
                          {active && <Feather name="check" size={11} color={primaryGold} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={[styles.sectionHint, { color: colors.mutedForeground, marginTop: 20 }]}>
                Private details are not collected here yet. Choose the help areas above. / Aún no recopilamos detalles privados aquí. Elige las áreas de ayuda de arriba.
              </Text>

              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: primaryGold, opacity: creating ? 0.7 : 1 }]}
                onPress={createJourney}
                activeOpacity={0.85}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.createBtnText}>Build My Journey</Text>
                    <Text style={styles.createBtnSub}>KinfolkAI™ will create your personalized guide</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      </>
    );
  }

  if (view === "detail" && activeJourney) {
    return (
      <ScrollView
        keyboardDismissMode="on-drag" style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setView("list")} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{activeJourney.title}</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ padding: 16 }}>
          {activeJourney.aiContext && (
            <View style={[styles.aiContextCard, { backgroundColor: "#CA922B14", borderColor: "#CA922B30" }]}>
              <Text style={styles.aiContextEmoji}>✨</Text>
              <Text style={[styles.aiContextText, { color: colors.foreground }]}>{activeJourney.aiContext}</Text>
            </View>
          )}

          {smartMatches && smartMatches.matches.length > 0 && (
            <View style={[styles.smartMatchSection, { backgroundColor: colors.card, borderColor: "#7C3AED30" }]}>
              <View style={styles.smartMatchHeader}>
                <Text style={styles.smartMatchIcon}>🔗</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.smartMatchTitle, { color: colors.foreground }]}>Smart Match™</Text>
                  <Text style={[styles.smartMatchSub, { color: colors.mutedForeground }]}>
                    Based on what you loved before — now in {smartMatches.destinationCity}
                  </Text>
                </View>
              </View>
              {smartMatches.matches.map((bridge) => (
                <View key={bridge.category} style={[styles.smartMatchBridge, { borderTopColor: colors.border }]}>
                  <View style={styles.smartMatchCatRow}>
                    <Text style={[styles.smartMatchCat, { color: "#7C3AED" }]}>{bridge.category}</Text>
                    <Text style={[styles.smartMatchFrom, { color: colors.mutedForeground }]}>
                      {bridge.savedCount} saved in {bridge.fromCity}
                    </Text>
                  </View>
                  {bridge.matches.slice(0, 3).map((biz) => (
                    <View key={biz.name} style={styles.smartMatchBiz}>
                      <Text style={[styles.smartMatchBizName, { color: colors.foreground }]}>{biz.name}</Text>
                      {biz.verified && (
                        <View style={[styles.verifiedPill, { backgroundColor: "#DCFCE7" }]}>
                          <Text style={{ fontSize: 9, color: "#16A34A", fontWeight: "700" }}>✓ Verified</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
              <TouchableOpacity
                style={[styles.smartMatchCta, { backgroundColor: "#7C3AED15", borderColor: "#7C3AED30" }]}
                onPress={() => router.push("/travel" as any)}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 13, color: "#7C3AED", fontWeight: "600" }}>
                  Ask KinfolkAI™ to tell me more about these →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.journeyPromiseCard, { backgroundColor: "#CA922B0D", borderColor: "#CA922B30" }]}>
            <Feather name="compass" size={17} color={primaryGold} />
            <Text style={[styles.journeyPromiseText, { color: colors.foreground }]}>Your story is still unfolding. This guide will be here whenever you&apos;re curious to return.</Text>
          </View>

          <TouchableOpacity
            style={[styles.kinfolkBtn, { backgroundColor: colors.card, borderColor: "#CA922B40" }]}
            onPress={() => router.push("/travel" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.kinfolkBtnIcon, { backgroundColor: "#CA922B20" }]}>
              <Text style={{ fontSize: 16 }}>✨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kinfolkBtnTitle, { color: colors.foreground }]}>Ask KinfolkAI™ about your journey</Text>
              <Text style={[styles.kinfolkBtnSub, { color: colors.mutedForeground }]}>I know exactly where you are — let&apos;s talk next steps</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          {activeJourney.phases.map((phase) => {
            return (
              <View
                key={phase.id}
                style={[
                  styles.phaseCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.phaseHeader}>
                  <View style={styles.phaseTitleRow}>
                    <Text style={styles.phaseIcon}>{phase.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.phaseTitle, { color: colors.foreground }]}>{phase.title}</Text>
                      <Text style={[styles.phaseDesc, { color: colors.mutedForeground }]}>{phase.description}</Text>
                    </View>
                  </View>
                  <Text style={[styles.phaseAvailability, { color: colors.mutedForeground }]}>Available whenever you&apos;re ready</Text>
                </View>

                {phase.steps.length > 0 && (
                  <View style={[styles.stepsWrap, { borderTopColor: colors.border }]}>
                    {phase.steps.map((step) => {
                      const explored = hasExplored(step);
                      return (
                        <Pressable
                          key={step.id}
                          style={styles.stepRow}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: explored }}
                          accessibilityLabel={`${explored ? "Remove from" : "Keep in"} your Journey: ${step.label}`}
                          onPress={() => { void toggleReflection(activeJourney, phase.id, step.id, !explored); }}
                        >
                          <View style={[styles.checkbox, { borderColor: explored ? primaryGold : colors.border, backgroundColor: explored ? "#CA922B18" : "transparent" }]}>
                            {explored && <Feather name="bookmark" size={10} color={primaryGold} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.stepLabel, { color: colors.foreground }]}>{step.label}</Text>
                            {explored && <Text style={[styles.stepReflection, { color: colors.mutedForeground }]}>Kept in your Journey</Text>}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {phase.aiInsight && (
                  <View style={[styles.insightWrap, { backgroundColor: "#CA922B08", borderTopColor: "#CA922B20" }]}>
                    <Text style={{ fontSize: 12, color: primaryGold }}>✨ {phase.aiInsight}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  return (
    <>
    <ScrollView
        keyboardDismissMode="on-drag" style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Life Journey</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 16 }}>
        {journeys.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your journey starts here</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tell KinfolkAI™ what&apos;s happening in your life and get a personalized step-by-step guide — from finding the right neighborhood to discovering your community.
            </Text>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: primaryGold }]}
              onPress={() => { if (!isAuthenticated) { Alert.alert("Sign in", "Please sign in to create a journey."); return; } setView("create"); }}
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>Start a Journey</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: colors.foreground }]}>Your Journeys</Text>
              <TouchableOpacity activeOpacity={0.85}
                style={[styles.newBtn, { backgroundColor: primaryGold + "20", borderColor: primaryGold + "40" }]}
                onPress={() => setView("create")}
              >
                <Feather name="plus" size={14} color={primaryGold} />
                <Text style={{ fontSize: 13, color: primaryGold, fontWeight: "600", marginLeft: 4 }}>New</Text>
              </TouchableOpacity>
            </View>

            {journeys.map((journey) => {
              return (
                <TouchableOpacity
                  key={journey.id}
                  style={[styles.journeyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => { setActiveJourney(journey); setView("detail"); void loadSmartMatches(journey.id); }}
                  activeOpacity={0.85}
                >
                  <View style={styles.journeyCardHeader}>
                    <Text style={[styles.journeyTitle, { color: colors.foreground }]}>{journey.title}</Text>
                    {journey.city && (
                      <View style={styles.journeyCity}>
                        <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                        <Text style={[styles.journeyCityText, { color: colors.mutedForeground }]}>{journey.city}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.journeyMetaText, { color: colors.mutedForeground, marginTop: 8 }]}>Your story is still unfolding</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>How it works</Text>
          {[
            { icon: "🗣️", text: "Tell KinfolkAI™ what's happening in your life" },
            { icon: "🗺️", text: "Get a personalized, phase-by-phase guide" },
            { icon: "✨", text: "Keep the invitations that matter to you — nothing expires" },
            { icon: "🔗", text: "Every question you ask connects back to your journey" },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  sectionLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 },
  sectionHint: { fontSize: 12, marginBottom: 12, lineHeight: 17 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 7 },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: "500" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: { width: "47%", borderRadius: 12, borderWidth: 1.5, padding: 14, position: "relative" },
  typeIcon: { fontSize: 24, marginBottom: 6 },
  typeLabel: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  typeDesc: { fontSize: 12, lineHeight: 16 },
  selectedCheck: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  locationRow: { flexDirection: "row" },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 15 },
  textarea: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: "top", marginBottom: 4 },
  limitBanner: { flexDirection: "row", alignItems: "center", gap: 8, margin: 16, marginBottom: 0, borderRadius: 10, borderWidth: 1, padding: 10 },
  limitBannerText: { flex: 1, fontSize: 12, color: "#DC2626", fontFamily: "Inter_400Regular", lineHeight: 16 },
  limitBannerCta: { fontSize: 12, fontWeight: "700", color: "#DC2626", textDecorationLine: "underline" },
  createBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 20 },
  createBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  createBtnSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", marginBottom: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptySub: { fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 20 },
  startBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13 },
  startBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  listTitle: { fontSize: 18, fontWeight: "700" },
  newBtn: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  journeyCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  journeyCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  journeyTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  journeyCity: { flexDirection: "row", alignItems: "center", gap: 3, marginLeft: 8 },
  journeyCityText: { fontSize: 12 },
  journeyMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  journeyMetaText: { fontSize: 12 },
  progressCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  progressPct: { fontSize: 14, fontWeight: "700" },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  progressStat: { fontSize: 12, marginTop: 6 },
  kinfolkBtn: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16, gap: 10 },
  kinfolkBtnIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  kinfolkBtnTitle: { fontSize: 14, fontWeight: "600" },
  kinfolkBtnSub: { fontSize: 12, marginTop: 1 },
  smartMatchSection: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  smartMatchHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  smartMatchIcon: { fontSize: 22 },
  smartMatchTitle: { fontSize: 15, fontWeight: "700" },
  smartMatchSub: { fontSize: 12, marginTop: 2 },
  smartMatchBridge: { borderTopWidth: 1, paddingTop: 10, marginTop: 10 },
  smartMatchCatRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  smartMatchCat: { fontSize: 13, fontWeight: "700" },
  smartMatchFrom: { fontSize: 11 },
  smartMatchBiz: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 3 },
  smartMatchBizName: { fontSize: 13, flex: 1 },
  verifiedPill: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  smartMatchCta: { marginTop: 12, borderRadius: 8, borderWidth: 1, padding: 10, alignItems: "center" },
  journeyPromiseCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 13, marginBottom: 12 },
  journeyPromiseText: { flex: 1, fontSize: 13, lineHeight: 19 },
  aiContextCard: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12, gap: 8, alignItems: "flex-start" },
  aiContextEmoji: { fontSize: 16 },
  aiContextText: { fontSize: 13, lineHeight: 19, flex: 1 },
  phaseCard: { borderRadius: 12, borderWidth: 1.5, marginBottom: 10, overflow: "hidden" },
  phaseHeader: { padding: 14 },
  phaseTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  phaseIcon: { fontSize: 22, marginTop: 2 },
  phaseTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  phaseDesc: { fontSize: 12, lineHeight: 16 },
  phaseAvailability: { fontSize: 11, marginTop: 8 },
  doneBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start" },
  phaseBar: { height: 4, borderRadius: 2, overflow: "hidden", marginTop: 8 },
  phaseFill: { height: 4, borderRadius: 2 },
  phaseStat: { fontSize: 11, marginTop: 3 },
  stepsWrap: { borderTopWidth: 1, paddingVertical: 4 },
  stepRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  stepLabel: { fontSize: 14, flex: 1, lineHeight: 20 },
  stepReflection: { fontSize: 11, marginTop: 1 },
  insightWrap: { borderTopWidth: 1, padding: 12 },
  infoCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginTop: 8 },
  infoTitle: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  infoIcon: { fontSize: 16 },
  infoText: { fontSize: 13, lineHeight: 18, flex: 1 },
});
