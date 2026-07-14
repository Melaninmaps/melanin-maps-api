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
  completed: boolean;
  completedAt?: string;
}

interface JourneyPhase {
  id: string;
  title: string;
  icon: string;
  description: string;
  categories: string[];
  status: "upcoming" | "active" | "completed";
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
    matches: Array<{ category: string; fromCity: string; savedCount: number; matches: Array<{ name: string; category: string; city: string; verified: boolean }> }>;
    message: string | null;
    destinationCity?: string;
  } | null>(null);

  const [selectedType, setSelectedType] = useState<string>("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);

  const JOURNEY_NEEDS: Record<string, Array<{ label: string; emoji: string }>> = {
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

  useEffect(() => { void loadData(); }, [loadData]);

  // Apply preset param from business dashboard navigation
  useEffect(() => {
    if (preset && journeyTypes.length > 0) {
      const match = journeyTypes.find((t) => t.id === preset);
      if (match) {
        setSelectedType(match.id);
        setView("create");
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
          description: description.trim(),
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

  const toggleStep = async (journey: Journey, phaseId: string, stepId: string, completed: boolean) => {
    const optimistic: Journey = {
      ...journey,
      phases: journey.phases.map((p) =>
        p.id !== phaseId ? p : {
          ...p,
          steps: p.steps.map((s) => s.id === stepId ? { ...s, completed } : s),
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
        body: JSON.stringify({ phaseId, stepId, completed }),
      });
      if (res.ok) {
        const d = await res.json() as { journey: Journey };
        setActiveJourney(d.journey);
        setJourneys((prev) => prev.map((j) => j.id === journey.id ? d.journey : j));
        if (completed) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch { /* silent */ }
  };

  const phaseProgress = (phase: JourneyPhase) => {
    const done = phase.steps.filter((s) => s.completed).length;
    return { done, total: phase.steps.length, pct: phase.steps.length ? done / phase.steps.length : 0 };
  };

  const journeyProgress = (journey: Journey) => {
    const allSteps = journey.phases.flatMap((p) => p.steps);
    const done = allSteps.filter((s) => s.completed).length;
    return { done, total: allSteps.length, pct: allSteps.length ? done / allSteps.length : 0 };
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
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>What's happening in your life?</Text>

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
                    Tap everything that applies — even things you haven't thought about yet
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

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Anything else KinfolkAI™ should know? (optional)</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder={`e.g. "Single mom, moving with two kids, budget is tight — need to find affordable options and a good school district"`}
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

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
    );
  }

  if (view === "detail" && activeJourney) {
    const prog = journeyProgress(activeJourney);
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

          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>Overall Progress</Text>
              <Text style={[styles.progressPct, { color: primaryGold }]}>{Math.round(prog.pct * 100)}%</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${prog.pct * 100}%` as any, backgroundColor: primaryGold }]} />
            </View>
            <Text style={[styles.progressStat, { color: colors.mutedForeground }]}>{prog.done} of {prog.total} steps complete</Text>
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
              <Text style={[styles.kinfolkBtnSub, { color: colors.mutedForeground }]}>I know exactly where you are — let's talk next steps</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          {activeJourney.phases.map((phase) => {
            const pp = phaseProgress(phase);
            const isActive = phase.status === "active";
            const isDone = phase.status === "completed";
            return (
              <View
                key={phase.id}
                style={[
                  styles.phaseCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isActive ? primaryGold + "60" : isDone ? "#16A34A30" : colors.border,
                    opacity: phase.status === "upcoming" ? 0.65 : 1,
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
                    {isDone && (
                      <View style={[styles.doneBadge, { backgroundColor: "#DCFCE7" }]}>
                        <Text style={{ fontSize: 10, color: "#16A34A", fontWeight: "700" }}>✓ Done</Text>
                      </View>
                    )}
                    {isActive && (
                      <View style={[styles.doneBadge, { backgroundColor: "#CA922B20", borderColor: "#CA922B40" }]}>
                        <Text style={{ fontSize: 10, color: primaryGold, fontWeight: "700" }}>Active</Text>
                      </View>
                    )}
                  </View>

                  {(isActive || isDone) && (
                    <View style={{ marginTop: 6 }}>
                      <View style={[styles.phaseBar, { backgroundColor: colors.border }]}>
                        <View style={[styles.phaseFill, { width: `${pp.pct * 100}%` as any, backgroundColor: isDone ? "#16A34A" : primaryGold }]} />
                      </View>
                      <Text style={[styles.phaseStat, { color: colors.mutedForeground }]}>{pp.done}/{pp.total} steps</Text>
                    </View>
                  )}
                </View>

                {(isActive || isDone) && phase.steps.length > 0 && (
                  <View style={[styles.stepsWrap, { borderTopColor: colors.border }]}>
                    {phase.steps.map((step) => (
                      <Pressable
                        key={step.id}
                        style={styles.stepRow}
                        onPress={() => {
                          if (phase.status !== "upcoming") {
                            void toggleStep(activeJourney, phase.id, step.id, !step.completed);
                          }
                        }}
                      >
                        <View style={[styles.checkbox, { borderColor: step.completed ? "#16A34A" : colors.border, backgroundColor: step.completed ? "#DCFCE7" : "transparent" }]}>
                          {step.completed && <Feather name="check" size={10} color="#16A34A" />}
                        </View>
                        <Text style={[styles.stepLabel, { color: step.completed ? colors.mutedForeground : colors.foreground, textDecorationLine: step.completed ? "line-through" : "none" }]}>
                          {step.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {phase.aiInsight && isActive && (
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
              Tell KinfolkAI™ what's happening in your life and get a personalized step-by-step guide — from finding the right neighborhood to discovering your community.
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
              const prog = journeyProgress(journey);
              const activePhase = journey.phases.find((p) => p.status === "active");
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

                  <View style={{ marginTop: 8 }}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressFill, { width: `${prog.pct * 100}%` as any, backgroundColor: primaryGold }]} />
                    </View>
                    <View style={styles.journeyMeta}>
                      <Text style={[styles.journeyMetaText, { color: colors.mutedForeground }]}>{Math.round(prog.pct * 100)}% complete</Text>
                      {activePhase && (
                        <Text style={[styles.journeyMetaText, { color: primaryGold }]}>{activePhase.icon} {activePhase.title}</Text>
                      )}
                    </View>
                  </View>
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
            { icon: "✅", text: "Check off steps as you go — KinfolkAI™ remembers everything" },
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
  aiContextCard: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12, gap: 8, alignItems: "flex-start" },
  aiContextEmoji: { fontSize: 16 },
  aiContextText: { fontSize: 13, lineHeight: 19, flex: 1 },
  phaseCard: { borderRadius: 12, borderWidth: 1.5, marginBottom: 10, overflow: "hidden" },
  phaseHeader: { padding: 14 },
  phaseTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  phaseIcon: { fontSize: 22, marginTop: 2 },
  phaseTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  phaseDesc: { fontSize: 12, lineHeight: 16 },
  doneBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start" },
  phaseBar: { height: 4, borderRadius: 2, overflow: "hidden", marginTop: 8 },
  phaseFill: { height: 4, borderRadius: 2 },
  phaseStat: { fontSize: 11, marginTop: 3 },
  stepsWrap: { borderTopWidth: 1, paddingVertical: 4 },
  stepRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  stepLabel: { fontSize: 14, flex: 1, lineHeight: 20 },
  insightWrap: { borderTopWidth: 1, padding: 12 },
  infoCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginTop: 8 },
  infoTitle: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  infoIcon: { fontSize: 16 },
  infoText: { fontSize: 13, lineHeight: 18, flex: 1 },
});
