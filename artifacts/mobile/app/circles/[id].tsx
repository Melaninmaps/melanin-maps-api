import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { useAuth } from "@/lib/auth";

function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}
async function authHeaders() {
  const token = await SecureStore.getItemAsync("auth_session_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

type Suggestion = { id: number; placeName: string; placeType: string; note: string | null; upvotes: number; userId: string; createdAt: string };
type Plan = { id: number; title: string; planDate: string | null; vibe: string | null; budget: string | null; curatorMode: string | null; itinerary: { summary: string; stops: { time: string; title: string; type: string; note?: string }[]; kinfolkNote?: string } | null; status: string; inCount: number; maybeCount: number; outCount: number; createdBy: string };
type Member = { id: number; userId: string; role: string; joinedAt: string };
type Adventure = { id: number; title: string; adventureDate: string; places: { name: string; type: string }[] | null; note: string | null };
type CircleDetail = { id: number; name: string; emoji: string; type: string; privacy: string; hostUserId: string; description: string | null; city: string | null };
type SavedPlace = { businessId: string; businessName: string | null; category: string | null; savedAt: string };

const VIBES = ["🍽️ Foodie", "🎨 Arts", "🌿 Outdoors", "🎉 Nightlife", "👨‍👩‍👧 Family", "💰 Budget", "✨ Luxury", "💕 Date Night", "🧘 Relax", "🎮 Adventure", "🎵 Live Music", "🎭 Culture"];
const BUDGETS = ["$25", "$50", "$100", "Unlimited"];
const WINDOWS = ["Saturday Morning", "Saturday Afternoon", "Saturday Evening", "Sunday Morning", "Sunday Afternoon", "Sunday Evening", "Flexible"];
const PLACE_TYPES = ["restaurant", "cafe", "museum", "park", "bar", "event", "activity", "shopping", "other"];

const CURATOR_MODES = [
  { id: "votes", emoji: "🗳", label: "Circle votes", desc: "Top-voted spots lead the plan" },
  { id: "random", emoji: "🎲", label: "Surprise me", desc: "Kinfolk picks — nobody knows" },
  { id: "by_member", emoji: "👤", label: "A member's taste", desc: "Their KinfolkAI prefs drive the plan" },
] as const;

type CuratorMode = "votes" | "random" | "by_member";

const GOLD = "#C9922B";

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [loading, setLoading] = useState(true);
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [myVotes, setMyVotes] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<"suggest" | "plan" | "members" | "memory">("suggest");
  const [isHost, setIsHost] = useState(false);

  // ── Suggest modal state ──────────────────────────────────────────────────────
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [sugName, setSugName] = useState("");
  const [sugType, setSugType] = useState("restaurant");
  const [sugNote, setSugNote] = useState("");
  const [savingSug, setSavingSug] = useState(false);

  // ── Saved places quick-suggest state ─────────────────────────────────────────
  const [showSavedSheet, setShowSavedSheet] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [addingSavedId, setAddingSavedId] = useState<string | null>(null);

  // ── Plan modal state ─────────────────────────────────────────────────────────
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [curatorMode, setCuratorMode] = useState<CuratorMode>("votes");
  const [curatorMemberId, setCuratorMemberId] = useState<string>("");
  const [planVibe, setPlanVibe] = useState("");
  const [planBudget, setPlanBudget] = useState("$50");
  const [planWindows, setPlanWindows] = useState<string[]>([]);
  const [planDate, setPlanDate] = useState("");
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // ── Adventure modal state ────────────────────────────────────────────────────
  const [showAdventureModal, setShowAdventureModal] = useState(false);
  const [advTitle, setAdvTitle] = useState("");
  const [advDate, setAdvDate] = useState("");
  const [advNote, setAdvNote] = useState("");
  const [savingAdv, setSavingAdv] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/circles/${id}`, { headers });
      if (!res.ok) { Alert.alert("Not found", "This circle no longer exists."); router.back(); return; }
      const data = await res.json() as { circle: CircleDetail; members: Member[]; suggestions: Suggestion[]; plans: Plan[]; membership: { role: string } | null };
      setCircle(data.circle);
      setMembers(data.members ?? []);
      setSuggestions(data.suggestions ?? []);
      setPlans(data.plans ?? []);
      setIsHost(data.membership?.role === "host" || data.circle.hostUserId === user?.id);
    } catch { Alert.alert("Error", "Couldn't load this circle."); }
    finally { setLoading(false); }
  }, [id, user?.id]);

  const loadAdventures = useCallback(async () => {
    if (!id) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/circles/${id}/adventures`, { headers });
      if (res.ok) { const d = await res.json() as { adventures: Adventure[] }; setAdventures(d.adventures); }
    } catch {}
  }, [id]);

  const loadSavedPlaces = useCallback(async () => {
    if (!id || loadingSaved) return;
    setLoadingSaved(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/circles/${id}/saved-places`, { headers });
      if (res.ok) {
        const d = await res.json() as { savedPlaces: SavedPlace[] };
        setSavedPlaces(d.savedPlaces ?? []);
      }
    } catch {}
    finally { setLoadingSaved(false); }
  }, [id, loadingSaved]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (activeTab === "memory") void loadAdventures(); }, [activeTab, loadAdventures]);

  const addSuggestion = async () => {
    if (!sugName.trim()) { Alert.alert("Required", "Enter a place name."); return; }
    setSavingSug(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/circles/${id}/suggestions`, {
        method: "POST", headers, body: JSON.stringify({ placeName: sugName.trim(), placeType: sugType, note: sugNote.trim() || undefined }),
      });
      const data = await res.json() as { suggestion?: Suggestion; error?: string };
      if (!res.ok) { Alert.alert("Error", data.error ?? "Try again."); return; }
      setSuggestions((prev) => [data.suggestion!, ...prev]);
      setSugName(""); setSugType("restaurant"); setSugNote("");
      setShowSuggestModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { Alert.alert("Error", "Couldn't save suggestion."); }
    finally { setSavingSug(false); }
  };

  const addSavedPlaceAsSuggestion = async (sp: SavedPlace) => {
    setAddingSavedId(sp.businessId);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/circles/${id}/suggestions`, {
        method: "POST", headers,
        body: JSON.stringify({ placeName: sp.businessName, placeType: sp.category ?? "restaurant", businessId: sp.businessId }),
      });
      const data = await res.json() as { suggestion?: Suggestion; error?: string };
      if (!res.ok) { Alert.alert("Error", data.error ?? "Try again."); return; }
      setSuggestions((prev) => [data.suggestion!, ...prev]);
      setShowSavedSheet(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { Alert.alert("Error", "Couldn't add suggestion."); }
    finally { setAddingSavedId(null); }
  };

  const upvote = async (sugId: number) => {
    setSuggestions((prev) => prev.map((s) => s.id === sugId ? { ...s, upvotes: s.upvotes + 1 } : s));
    try {
      const headers = await authHeaders();
      await fetch(`${getApiBase()}/api/circles/${id}/suggestions/${sugId}/upvote`, { method: "POST", headers });
    } catch {}
  };

  const vote = async (planId: number, v: string) => {
    const prev = myVotes[planId];
    setMyVotes((m) => ({ ...m, [planId]: v }));
    setPlans((ps) => ps.map((p) => {
      if (p.id !== planId) return p;
      const delta = (field: "inCount" | "maybeCount" | "outCount", key: string) =>
        (prev === key ? -1 : 0) + (v === key ? 1 : 0);
      return { ...p, inCount: p.inCount + delta("inCount", "in"), maybeCount: p.maybeCount + delta("maybeCount", "maybe"), outCount: p.outCount + delta("outCount", "out") };
    }));
    try {
      const headers = await authHeaders();
      await fetch(`${getApiBase()}/api/circles/${id}/plans/${planId}/vote`, { method: "POST", headers, body: JSON.stringify({ vote: v }) });
    } catch {}
  };

  const generatePlan = async () => {
    if (curatorMode !== "random" && !planVibe) { Alert.alert("Choose a vibe", "Pick a vibe for the plan."); return; }
    if (curatorMode === "by_member" && !curatorMemberId) { Alert.alert("Pick a member", "Choose which member's taste to use."); return; }
    setGeneratingPlan(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/circles/${id}/plans`, {
        method: "POST", headers,
        body: JSON.stringify({
          vibe: planVibe,
          budget: planBudget.replace("$", ""),
          availabilityWindows: planWindows,
          planDate: planDate || undefined,
          curatorMode,
          curatorMemberId: curatorMemberId || undefined,
          title: planVibe ? `${planVibe} Day` : undefined,
        }),
      });
      const data = await res.json() as { plan?: Plan; error?: string };
      if (!res.ok) { Alert.alert("Error", data.error ?? "Try again."); return; }
      setPlans((prev) => [data.plan!, ...prev]);
      setShowPlanModal(false);
      setPlanVibe(""); setPlanWindows([]); setCuratorMode("votes"); setCuratorMemberId("");
      setActiveTab("plan");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { Alert.alert("Error", "Couldn't generate plan."); }
    finally { setGeneratingPlan(false); }
  };

  const logAdventure = async () => {
    if (!advTitle.trim() || !advDate.trim()) { Alert.alert("Required", "Enter a title and date."); return; }
    setSavingAdv(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/circles/${id}/adventures`, {
        method: "POST", headers, body: JSON.stringify({ title: advTitle.trim(), adventureDate: advDate.trim(), note: advNote.trim() || undefined }),
      });
      const data = await res.json() as { adventure?: Adventure; error?: string };
      if (!res.ok) { Alert.alert("Error", data.error ?? "Try again."); return; }
      setAdventures((prev) => [data.adventure!, ...prev]);
      setAdvTitle(""); setAdvDate(""); setAdvNote("");
      setShowAdventureModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { Alert.alert("Error", "Couldn't log adventure."); }
    finally { setSavingAdv(false); }
  };

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!circle) return null;

  const TABS: { key: typeof activeTab; label: string; icon: string }[] = [
    { key: "suggest", label: "Suggest", icon: "star" },
    { key: "plan", label: "Plan", icon: "map" },
    { key: "members", label: "Members", icon: "users" },
    { key: "memory", label: "Memory Lane", icon: "clock" },
  ];

  const curatorModeLabel: Record<string, string> = {
    votes: "🗳 Circle Votes",
    random: "🎲 Surprise",
    by_member: "👤 Member's Taste",
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontSize: 24 }}>{circle.emoji}</Text>
          <Text style={[s.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{circle.name}</Text>
        </View>
        {isHost ? (
          <TouchableOpacity activeOpacity={0.85} style={s.settingsBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="settings" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : <View style={{ width: 38 }} />}
      </View>

      {/* Tab Bar */}
      <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity activeOpacity={0.85}
            key={t.key}
            style={[s.tabBtn, activeTab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(t.key)}
          >
            <Feather name={t.icon as any} size={14} color={activeTab === t.key ? colors.primary : colors.mutedForeground} />
            <Text style={[s.tabLabel, { color: activeTab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SUGGEST TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "suggest" && (
        <View style={{ flex: 1 }}>
          <View style={[s.privacyBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shield" size={12} color={colors.primary} />
            <Text style={[s.privacyText, { color: colors.mutedForeground }]}>
              Only what you share here is visible to your Circle — never your profile, reviews, search history, or private activity.
            </Text>
          </View>
          <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPad + 120 }}>
            {suggestions.length === 0 ? (
              <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 36 }}>💡</Text>
                <Text style={[s.emptyTitle, { color: colors.foreground }]}>No suggestions yet</Text>
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Be the first to suggest a place for your Circle to visit!</Text>
              </View>
            ) : suggestions.map((sug) => (
              <View key={sug.id} style={[s.sugCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sugName, { color: colors.foreground }]}>{sug.placeName}</Text>
                  <Text style={[s.sugType, { color: colors.mutedForeground }]}>{sug.placeType}</Text>
                  {sug.note ? <Text style={[s.sugNote, { color: colors.mutedForeground }]}>{sug.note}</Text> : null}
                </View>
                <TouchableOpacity activeOpacity={0.85} style={[s.upvoteBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]} onPress={() => upvote(sug.id)}>
                  <Feather name="thumbs-up" size={13} color={colors.primary} />
                  <Text style={[s.upvoteCount, { color: colors.primary }]}>{sug.upvotes}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          {/* Two-button action row */}
          <View style={[s.fabRow, { bottom: bottomPad + 20 }]}>
            <TouchableOpacity activeOpacity={0.85}
              style={[s.fabSecondary, { backgroundColor: colors.card, borderColor: colors.primary }]}
              onPress={() => { void loadSavedPlaces(); setShowSavedSheet(true); }}
            >
              <Text style={{ fontSize: 16 }}>📌</Text>
              <Text style={[s.fabSecondaryText, { color: colors.primary }]}>From saved places</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[s.fab, { backgroundColor: colors.primary }]} onPress={() => setShowSuggestModal(true)}>
              <Feather name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── PLAN TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === "plan" && (
        <View style={{ flex: 1 }}>
          <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: bottomPad + 100 }}>
            <View style={[s.kinfolkHero, { backgroundColor: colors.primary }]}>
              <Text style={s.kinfolkHeroEmoji}>🗺️✊🏾</Text>
              <Text style={s.kinfolkHeroTitle}>Kinfolk Plans The Day</Text>
              <Text style={s.kinfolkHeroSub}>Pick a vibe, budget, and how to plan — Kinfolk builds the perfect itinerary for your Circle.</Text>
              <TouchableOpacity style={[s.planBtn, { backgroundColor: "#FFFFFF" }]} onPress={() => setShowPlanModal(true)} activeOpacity={0.85}>
                <Text style={[s.planBtnText, { color: colors.primary }]}>✨ Build a Plan</Text>
              </TouchableOpacity>
            </View>

            {plans.length === 0 ? (
              <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 36 }}>📋</Text>
                <Text style={[s.emptyTitle, { color: colors.foreground }]}>No plans yet</Text>
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Tap "Build a Plan" and let Kinfolk create the perfect day for your Circle.</Text>
              </View>
            ) : plans.map((plan) => (
              <View key={plan.id} style={[s.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.planCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.planTitle, { color: colors.foreground }]}>{plan.title}</Text>
                    {plan.planDate ? <Text style={[s.planMeta, { color: colors.mutedForeground }]}>📅 {plan.planDate}</Text> : null}
                    {plan.vibe ? <Text style={[s.planMeta, { color: colors.mutedForeground }]}>{plan.vibe}</Text> : null}
                    {plan.budget ? <Text style={[s.planMeta, { color: colors.mutedForeground }]}>💰 {plan.budget === "unlimited" ? "Unlimited" : `~$${plan.budget}/person`}</Text> : null}
                    {plan.curatorMode ? (
                      <View style={[s.curatorBadge, { backgroundColor: GOLD + "14", borderColor: GOLD + "30" }]}>
                        <Text style={[s.curatorBadgeText, { color: GOLD }]}>{curatorModeLabel[plan.curatorMode] ?? plan.curatorMode}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: plan.status === "confirmed" ? "#2D7A4F20" : colors.secondary, borderColor: plan.status === "confirmed" ? "#2D7A4F40" : colors.border }]}>
                    <Text style={[s.statusText, { color: plan.status === "confirmed" ? "#2D7A4F" : colors.mutedForeground }]}>{plan.status}</Text>
                  </View>
                </View>

                {plan.itinerary?.summary && (
                  <Text style={[s.itinerarySummary, { color: colors.mutedForeground }]}>{plan.itinerary.summary}</Text>
                )}

                {plan.itinerary?.stops && plan.itinerary.stops.length > 0 && (
                  <View style={[s.stopsWrap, { borderColor: colors.border }]}>
                    {plan.itinerary.stops.map((stop, i) => (
                      <View key={i} style={[s.stopRow, i < plan.itinerary!.stops.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Text style={[s.stopTime, { color: colors.primary }]}>{stop.time}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.stopTitle, { color: colors.foreground }]}>{stop.title}</Text>
                          {stop.note ? <Text style={[s.stopNote, { color: colors.mutedForeground }]}>{stop.note}</Text> : null}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {plan.itinerary?.kinfolkNote ? (
                  <View style={[s.kinfolkNote, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
                    <Text style={[s.kinfolkNoteText, { color: colors.primary }]}>✊🏾 {plan.itinerary.kinfolkNote}</Text>
                  </View>
                ) : null}

                <View style={s.voteRow}>
                  {[
                    { v: "in", label: "I'm In 🙌", active: "#2D7A4F", bg: "#2D7A4F18" },
                    { v: "maybe", label: "Maybe 🤔", active: "#C9922B", bg: "#C9922B18" },
                    { v: "out", label: "Not This Time", active: "#DC2626", bg: "#DC262618" },
                  ].map(({ v, label, active, bg }) => (
                    <TouchableOpacity activeOpacity={0.85}
                      key={v}
                      style={[s.voteBtn, { backgroundColor: myVotes[plan.id] === v ? bg : colors.secondary, borderColor: myVotes[plan.id] === v ? active : colors.border }]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); vote(plan.id, v); }}
                    >
                      <Text style={[s.voteBtnText, { color: myVotes[plan.id] === v ? active : colors.mutedForeground }]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={s.voteCounts}>
                  <Text style={[s.voteCount, { color: "#2D7A4F" }]}>{plan.inCount} in</Text>
                  <Text style={[s.voteCount, { color: "#C9922B" }]}>{plan.maybeCount} maybe</Text>
                  <Text style={[s.voteCount, { color: colors.mutedForeground }]}>{plan.outCount} out</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── MEMBERS TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "members" && (
        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: bottomPad + 40 }}>
          {isHost && (
            <View style={[s.hostBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}>
              <Feather name="award" size={14} color={colors.primary} />
              <Text style={[s.hostBannerText, { color: colors.primary }]}>You're the Circle Host — you can invite, remove members, and manage settings.</Text>
            </View>
          )}
          {members.map((m) => (
            <View key={m.id} style={[s.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.memberAvatar, { backgroundColor: colors.primary }]}>
                <Feather name="user" size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.memberId, { color: colors.foreground }]}>{m.userId === user?.id ? "You" : "Member"}</Text>
                <Text style={[s.memberRole, { color: colors.mutedForeground }]}>{m.role === "host" ? "👑 Circle Host" : "Member"}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── MEMORY LANE TAB ──────────────────────────────────────────────────── */}
      {activeTab === "memory" && (
        <View style={{ flex: 1 }}>
          <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPad + 100 }}>
            <View style={[s.memoryHero, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 28 }}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.memoryHeroTitle, { color: colors.foreground }]}>Memory Lane</Text>
                <Text style={[s.memoryHeroSub, { color: colors.mutedForeground }]}>Every adventure your Circle has shared. Kinfolk remembers.</Text>
              </View>
            </View>
            {adventures.length === 0 ? (
              <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 36 }}>🌟</Text>
                <Text style={[s.emptyTitle, { color: colors.foreground }]}>No adventures yet</Text>
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>After your first outing, log it here. Over time, Kinfolk will suggest new experiences based on what your Circle loved.</Text>
              </View>
            ) : adventures.map((adv) => (
              <View key={adv.id} style={[s.adventureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.advHeader}>
                  <Text style={[s.advTitle, { color: colors.foreground }]}>📍 {adv.title}</Text>
                  <Text style={[s.advDate, { color: colors.mutedForeground }]}>{adv.adventureDate}</Text>
                </View>
                {adv.places && adv.places.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {adv.places.map((p, i) => (
                      <View key={i} style={[s.placeChip, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                        <Text style={[s.placeChipText, { color: colors.primary }]}>{p.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {adv.note ? <Text style={[s.advNote, { color: colors.mutedForeground }]}>{adv.note}</Text> : null}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity activeOpacity={0.85} style={[s.fab, { backgroundColor: colors.primary, bottom: bottomPad + 20, right: 20 }]} onPress={() => setShowAdventureModal(true)}>
            <Feather name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ════════════════ MODALS ════════════════ */}

      {/* Manual Suggest Modal */}
      <Modal visible={showSuggestModal} animationType="slide" transparent onRequestClose={() => setShowSuggestModal(false)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowSuggestModal(false)} />
          <View style={[s.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Suggest a Place</Text>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Place Name</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={sugName} onChangeText={setSugName}
              placeholder="Restaurant, museum, park…" placeholderTextColor={colors.mutedForeground}
            />
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Type</Text>
            <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {PLACE_TYPES.map((t) => (
                <TouchableOpacity activeOpacity={0.85} key={t} style={[s.chip, { backgroundColor: sugType === t ? colors.primary : colors.card, borderColor: sugType === t ? colors.primary : colors.border }]} onPress={() => setSugType(t)}>
                  <Text style={[s.chipText, { color: sugType === t ? "#FFFFFF" : colors.foreground }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Note <Text style={{ color: colors.mutedForeground + "80" }}>(optional)</Text></Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={sugNote} onChangeText={setSugNote}
              placeholder="Why this place? Any tips?" placeholderTextColor={colors.mutedForeground}
            />
            <TouchableOpacity activeOpacity={0.85} style={[s.modalBtn, { backgroundColor: colors.primary }]} onPress={addSuggestion} disabled={savingSug}>
              {savingSug ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.modalBtnText}>Add Suggestion</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Saved Places Quick-Suggest Sheet */}
      <Modal visible={showSavedSheet} animationType="slide" transparent onRequestClose={() => setShowSavedSheet(false)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowSavedSheet(false)} />
          <View style={[s.modalSheet, { backgroundColor: colors.background, maxHeight: "75%" }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.modalTitle, { color: colors.foreground }]}>📌 From Your Saved Places</Text>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginBottom: 12 }]}>
              Tap any saved business to instantly suggest it to the circle.
            </Text>
            {loadingSaved ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 24 }} />
            ) : savedPlaces.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 24, gap: 8 }}>
                <Text style={{ fontSize: 32 }}>🔖</Text>
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>You haven't saved any places yet. Heart businesses on the Discover tab to save them here.</Text>
              </View>
            ) : (
              <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
                {savedPlaces.map((sp) => (
                  <TouchableOpacity activeOpacity={0.85}
                    key={sp.businessId}
                    style={[s.savedRow, { borderBottomColor: colors.border }]}
                    onPress={() => addSavedPlaceAsSuggestion(sp)}
                    disabled={addingSavedId === sp.businessId}
                  >
                    <View style={[s.savedIcon, { backgroundColor: colors.primary + "15" }]}>
                      <Feather name="bookmark" size={14} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.savedName, { color: colors.foreground }]}>{sp.businessName ?? sp.businessId}</Text>
                      {sp.category ? <Text style={[s.savedCat, { color: colors.mutedForeground }]}>{sp.category}</Text> : null}
                    </View>
                    {addingSavedId === sp.businessId
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <Feather name="plus-circle" size={20} color={colors.primary} />
                    }
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Build Plan Modal */}
      <Modal visible={showPlanModal} animationType="slide" transparent onRequestClose={() => setShowPlanModal(false)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowPlanModal(false)} />
          <View style={[s.modalSheet, { backgroundColor: colors.background, maxHeight: "92%" }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
            <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Build a Plan ✨</Text>

              {/* ── How should Kinfolk plan? ── */}
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>How should Kinfolk plan?</Text>
              <View style={{ gap: 8, marginBottom: 4 }}>
                {CURATOR_MODES.map((mode) => {
                  const selected = curatorMode === mode.id;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      style={[s.curatorOption, {
                        backgroundColor: selected ? colors.primary + "12" : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      }]}
                      onPress={() => { setCuratorMode(mode.id); setCuratorMemberId(""); }}
                      activeOpacity={0.8}
                    >
                      <Text style={s.curatorEmoji}>{mode.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.curatorLabel, { color: colors.foreground }]}>{mode.label}</Text>
                        <Text style={[s.curatorDesc, { color: colors.mutedForeground }]}>{mode.desc}</Text>
                      </View>
                      {selected && <Feather name="check-circle" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Member picker when by_member mode selected */}
              {curatorMode === "by_member" && (
                <View style={{ marginTop: 4, marginBottom: 4 }}>
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Which member's taste?</Text>
                  <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {members.map((m) => {
                      const selected = curatorMemberId === m.userId;
                      const label = m.userId === user?.id ? "Me (you)" : m.role === "host" ? "👑 Host" : "Member";
                      return (
                        <TouchableOpacity activeOpacity={0.85}
                          key={m.id}
                          style={[s.chip, {
                            backgroundColor: selected ? colors.primary : colors.card,
                            borderColor: selected ? colors.primary : colors.border,
                          }]}
                          onPress={() => setCuratorMemberId(m.userId)}
                        >
                          <Feather name="user" size={12} color={selected ? "#fff" : colors.mutedForeground} />
                          <Text style={[s.chipText, { color: selected ? "#FFFFFF" : colors.foreground }]}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <View style={[s.memberTasteHint, { backgroundColor: GOLD + "12", borderColor: GOLD + "25" }]}>
                    <Text style={[s.memberTasteHintText, { color: colors.mutedForeground }]}>
                      ✨ Kinfolk uses this member's personal preferences — favorite categories, budget, dietary notes, and lifestyle services — to build the plan.
                    </Text>
                  </View>
                </View>
              )}

              {/* Vibe picker (hidden for random/by_member) */}
              {curatorMode === "votes" && (
                <>
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>What's the Vibe?</Text>
                  <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {VIBES.map((v) => (
                      <TouchableOpacity activeOpacity={0.85} key={v} style={[s.chip, { backgroundColor: planVibe === v ? colors.primary : colors.card, borderColor: planVibe === v ? colors.primary : colors.border }]} onPress={() => setPlanVibe(v)}>
                        <Text style={[s.chipText, { color: planVibe === v ? "#FFFFFF" : colors.foreground }]}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Budget */}
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Budget per Person</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {BUDGETS.map((b) => (
                  <TouchableOpacity activeOpacity={0.85} key={b} style={[s.chip, { backgroundColor: planBudget === b ? colors.primary : colors.card, borderColor: planBudget === b ? colors.primary : colors.border }]} onPress={() => setPlanBudget(b)}>
                    <Text style={[s.chipText, { color: planBudget === b ? "#FFFFFF" : colors.foreground }]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Availability */}
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>When are you free?</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {WINDOWS.map((w) => {
                  const sel = planWindows.includes(w);
                  return (
                    <TouchableOpacity activeOpacity={0.85} key={w} style={[s.chip, { backgroundColor: sel ? colors.primary : colors.card, borderColor: sel ? colors.primary : colors.border }]}
                      onPress={() => setPlanWindows((prev) => sel ? prev.filter((x) => x !== w) : [...prev, w])}>
                      <Text style={[s.chipText, { color: sel ? "#FFFFFF" : colors.foreground }]}>{w}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date */}
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Date <Text style={{ color: colors.mutedForeground + "80" }}>(optional)</Text></Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={planDate} onChangeText={setPlanDate}
                placeholder="e.g. Saturday, Aug 17, This Weekend" placeholderTextColor={colors.mutedForeground}
              />

              <Text style={[s.privacyText, { color: colors.mutedForeground, marginTop: 8, lineHeight: 17 }]}>
                🔒 Kinfolk uses only shared suggestions and selected member preferences. Personal activity outside this circle is never used.
              </Text>
            </ScrollView>

            <TouchableOpacity activeOpacity={0.85} style={[s.modalBtn, { backgroundColor: colors.primary, marginTop: 12 }]} onPress={generatePlan} disabled={generatingPlan}>
              {generatingPlan ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={s.modalBtnText}>Kinfolk is planning…</Text>
                </View>
              ) : <Text style={s.modalBtnText}>✨ Generate Itinerary</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Log Adventure Modal */}
      <Modal visible={showAdventureModal} animationType="slide" transparent onRequestClose={() => setShowAdventureModal(false)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowAdventureModal(false)} />
          <View style={[s.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Log an Adventure 📍</Text>
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Title</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={advTitle} onChangeText={setAdvTitle}
              placeholder="Brunch at Sister's, Philly Museum Day…" placeholderTextColor={colors.mutedForeground}
            />
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Date</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={advDate} onChangeText={setAdvDate}
              placeholder="e.g. August 17, 2025" placeholderTextColor={colors.mutedForeground}
            />
            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Note <Text style={{ color: colors.mutedForeground + "80" }}>(optional)</Text></Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={advNote} onChangeText={setAdvNote}
              placeholder="Any memories from the day?" placeholderTextColor={colors.mutedForeground}
            />
            <TouchableOpacity activeOpacity={0.85} style={[s.modalBtn, { backgroundColor: colors.primary }]} onPress={logAdventure} disabled={savingAdv}>
              {savingAdv ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.modalBtnText}>Save Adventure</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 8 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  settingsBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 16, textAlign: "center" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 11 },
  tabLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  privacyBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, margin: 12, borderRadius: 10, borderWidth: 1 },
  privacyText: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1, lineHeight: 16 },
  emptyCard: { alignItems: "center", padding: 32, borderRadius: 18, borderWidth: 1, gap: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  sugCard: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  sugName: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 2 },
  sugType: { fontFamily: "Inter_400Regular", fontSize: 12, textTransform: "capitalize" },
  sugNote: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4, lineHeight: 17 },
  upvoteBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  upvoteCount: { fontFamily: "Inter_700Bold", fontSize: 13 },
  fabRow: { position: "absolute", right: 20, flexDirection: "row", alignItems: "center", gap: 10 },
  fab: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  fabSecondary: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 27, borderWidth: 1.5, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  fabSecondaryText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  kinfolkHero: { borderRadius: 20, padding: 22, alignItems: "center", gap: 10 },
  kinfolkHeroEmoji: { fontSize: 32 },
  kinfolkHeroTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#FFFFFF", textAlign: "center" },
  kinfolkHeroSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 20 },
  planBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  planBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  planCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  planCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  planTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 4 },
  planMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  curatorBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: "flex-start" },
  curatorBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  statusBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 11, textTransform: "capitalize" },
  itinerarySummary: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  stopsWrap: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  stopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12 },
  stopTime: { fontFamily: "Inter_700Bold", fontSize: 12, width: 60 },
  stopTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 2 },
  stopNote: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
  kinfolkNote: { borderRadius: 10, borderWidth: 1, padding: 12 },
  kinfolkNoteText: { fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 19 },
  voteRow: { flexDirection: "row", gap: 8 },
  voteBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  voteBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  voteCounts: { flexDirection: "row", gap: 14 },
  voteCount: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  hostBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  hostBannerText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 19 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  memberId: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  memberRole: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  memoryHero: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1 },
  memoryHeroTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  memoryHeroSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 2 },
  adventureCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  advHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  advTitle: { fontFamily: "Inter_700Bold", fontSize: 14, flex: 1 },
  advDate: { fontFamily: "Inter_400Regular", fontSize: 12 },
  advNote: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 4 },
  placeChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  placeChipText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34, elevation: 10, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 16 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 14, marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1, padding: 13, fontFamily: "Inter_400Regular", fontSize: 15 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  modalBtn: { borderRadius: 14, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  modalBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
  curatorOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  curatorEmoji: { fontSize: 22 },
  curatorLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  curatorDesc: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  memberTasteHint: { borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 8 },
  memberTasteHintText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  savedIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  savedName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  savedCat: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1, textTransform: "capitalize" },
});
