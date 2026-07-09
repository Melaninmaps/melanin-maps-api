import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMembership } from "@/hooks/useMembership";
import { UpgradeModal } from "@/components/UpgradeModal";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}
async function getToken(): Promise<string | null> {
  try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}
async function authHeaders(): Promise<Record<string, string>> {
  const t = await getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

type HubTab = "info" | "community" | "videos" | "places" | "opportunities" | "mentors";
const TABS: { id: HubTab; label: string; icon: string }[] = [
  { id: "info",          label: "Info",          icon: "shield" },
  { id: "community",     label: "Community",      icon: "users" },
  { id: "videos",        label: "Creators",       icon: "play-circle" },
  { id: "places",        label: "Places",         icon: "map-pin" },
  { id: "opportunities", label: "Opportunities",  icon: "briefcase" },
  { id: "mentors",       label: "Mentors",        icon: "star" },
];

const INTENT_OPTIONS = [
  { value: "visiting",  label: "Just Visiting",    emoji: "✈️",  desc: "Planning a trip or recently traveled" },
  { value: "local",     label: "I Live Here",       emoji: "🏠",  desc: "Current resident or citizen" },
  { value: "heritage",  label: "Family / Heritage", emoji: "👨‍👩‍👧", desc: "Cultural or family connection" },
  { value: "business",  label: "Business / Work",   emoji: "💼",  desc: "Professional or entrepreneurial interest" },
  { value: "general",   label: "General Interest",  emoji: "🌍",  desc: "Learning more about this topic" },
];

const INTENT_LABELS: Record<string, string> = {
  visiting: "✈️ Visiting",
  local: "🏠 Local",
  heritage: "👨‍👩‍👧 Heritage",
  business: "💼 Business",
  general: "🌍 General",
};

const TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
  location:  { emoji: "📍", label: "Location Hub",  color: "#2563EB" },
  medical:   { emoji: "🩺", label: "Health Hub",    color: "#DC2626" },
  wellness:  { emoji: "💪", label: "Wellness Hub",  color: "#6D28D9" },
  education: { emoji: "🎓", label: "Education Hub", color: "#0891B2" },
  business:  { emoji: "📈", label: "Business Hub",  color: "#059669" },
  community: { emoji: "✊🏾", label: "Community Hub", color: "#9333EA" },
  hobby:     { emoji: "🎯", label: "Interest Hub",  color: "#EA580C" },
  general:   { emoji: "✦",  label: "Community Hub", color: "#CA922B" },
};

const SOURCE_TYPE_LABEL: Record<string, string> = {
  government: "Official",
  academic:   "Research",
  editorial:  "Editorial",
  community:  "Community",
  industry:   "Industry",
};

type HubAction = { emoji: string; label: string; tab?: HubTab; route?: string };
function getHubActions(topicType: string, intent: string | null): HubAction[] {
  const always: HubAction[] = [
    { emoji: "💬", label: "Ask Community", tab: "community" },
    { emoji: "🎥", label: "Creator Videos", tab: "videos" },
    { emoji: "🤝", label: "Find a Mentor", tab: "mentors" },
    { emoji: "💼", label: "Opportunities", tab: "opportunities" },
  ];
  if (topicType === "location") {
    if (intent === "visiting") return [
      { emoji: "✈️", label: "Plan a Trip",       route: "/kinfolk" },
      { emoji: "🍽️", label: "Find Restaurants",  tab: "places" },
      { emoji: "🏨", label: "Find Hotels",        tab: "places" },
      { emoji: "🛡️", label: "Safety Info",        tab: "info" },
      { emoji: "🤝", label: "Meet a Local",       tab: "mentors" },
      { emoji: "🎉", label: "Events",             tab: "opportunities" },
      { emoji: "🛍️", label: "Shop Local",         tab: "places" },
      { emoji: "📖", label: "Learn the Culture",  tab: "info" },
      ...always,
    ];
    if (intent === "local") return [
      { emoji: "💼", label: "Find Jobs",          tab: "opportunities" },
      { emoji: "🏠", label: "Neighborhoods",      tab: "info" },
      { emoji: "👨‍⚕️", label: "Healthcare",         tab: "places" },
      { emoji: "🏫", label: "Schools",            tab: "places" },
      { emoji: "✊🏾", label: "Black Businesses",  tab: "places" },
      { emoji: "🤝", label: "Find Community",     tab: "community" },
      ...always,
    ];
    if (intent === "heritage") return [
      { emoji: "📖", label: "Cultural History",   tab: "info" },
      { emoji: "🏛️", label: "Historical Sites",   tab: "places" },
      { emoji: "👨‍👩‍👧", label: "Diaspora Groups",   tab: "community" },
      { emoji: "🎉", label: "Cultural Events",    tab: "opportunities" },
      { emoji: "🔍", label: "Trace Your Roots",   route: "/kinfolk" },
      ...always,
    ];
    if (intent === "business") return [
      { emoji: "🏢", label: "Find Offices",       tab: "places" },
      { emoji: "💼", label: "Job Listings",       tab: "opportunities" },
      { emoji: "📊", label: "Market Intel",       tab: "info" },
      { emoji: "🤝", label: "Network",            tab: "mentors" },
      ...always,
    ];
    return [
      { emoji: "📍", label: "Find Businesses",    tab: "places" },
      { emoji: "🛡️", label: "Safety Overview",    tab: "info" },
      ...always,
    ];
  }
  if (topicType === "medical" || topicType === "wellness") return [
    { emoji: "👨‍⚕️", label: "Find a Doctor",       tab: "places" },
    { emoji: "💬", label: "Support Groups",       tab: "community" },
    { emoji: "🥗", label: "Healthy Recipes",      tab: "info" },
    { emoji: "🏃", label: "Fitness Tips",         tab: "info" },
    { emoji: "🌿", label: "Wellness Resources",   tab: "info" },
    { emoji: "🤝", label: "Find a Mentor",        tab: "mentors" },
    { emoji: "💊", label: "Medication Info",      tab: "info" },
    ...always,
  ];
  if (topicType === "business") return [
    { emoji: "💼", label: "Job Listings",         tab: "opportunities" },
    { emoji: "📊", label: "Industry News",        tab: "info" },
    { emoji: "🏢", label: "Find Offices",         tab: "places" },
    { emoji: "🤝", label: "Professional Network", tab: "mentors" },
    { emoji: "📈", label: "Resources",            tab: "info" },
    ...always,
  ];
  if (topicType === "education") return [
    { emoji: "🎓", label: "Programs",             tab: "places" },
    { emoji: "💰", label: "Scholarships",         tab: "opportunities" },
    { emoji: "📚", label: "Study Resources",      tab: "info" },
    { emoji: "🤝", label: "Find a Mentor",        tab: "mentors" },
    ...always,
  ];
  return [{ emoji: "📍", label: "Find Places", tab: "places" }, ...always];
}

interface HubExpert {
  id: string; userId: string; badgeName: string; badgeEmoji: string;
  badgeType: string; isVerified: boolean; yearsOfExperience: number | null;
  experienceNote: string | null; displayName: string | null; avatarUrl: string | null;
  city: string | null; helpfulVotes: number;
}
interface HubRecommendation {
  id: string | null; name: string; canonicalName: string | null;
  category: string | null; memberCount: number; exists: boolean;
}

interface TrustedSource { name: string; url: string; type: string; emoji: string; forCommunity?: boolean }
interface Creator { id: string; firstName: string | null; lastName: string | null; username: string | null; profileImageUrl: string | null; homeCity: string | null }
interface HubBusiness { id: string; name: string; category: string; city: string; state: string; blackOwned?: boolean; verified?: boolean }
interface HubPost { id: string; content: string; createdAt: string; topicTag?: string | null; upvotes: number; commentsCount?: number | null }
interface HubData {
  topic: { id: string; topicName: string; canonicalName?: string | null; category: string; topicType?: string | null; entityType?: string | null; ownershipType?: string | null; isMinorityOwned?: boolean | null; description?: string | null };
  membersCount: number;
  isFollowing: boolean;
  userIntent: string | null;
  creators: Creator[];
  businesses: HubBusiness[];
  posts: HubPost[];
  trustedSources: TrustedSource[];
}

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function creatorInitials(c: Creator): string {
  return (((c.firstName?.[0] ?? "") + (c.lastName?.[0] ?? "")) || (c.username?.[0] ?? "M")).toUpperCase();
}
function creatorName(c: Creator): string {
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || `@${c.username ?? "member"}`;
}

export default function CommunityHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { subscription } = useMembership();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [activeTab, setActiveTab] = useState<HubTab>("info");
  const [hub, setHub] = useState<HubData | null>(null);
  const [brief, setBrief] = useState<string>("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showIntentPicker, setShowIntentPicker] = useState(false);
  const [userIntent, setUserIntent] = useState<string | null>(null);
  const [settingIntent, setSettingIntent] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [recommendations, setRecommendations] = useState<HubRecommendation[]>([]);
  const [experts, setExperts] = useState<HubExpert[]>([]);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [volunteerNote, setVolunteerNote] = useState("");
  const [volunteerYears, setVolunteerYears] = useState("");
  const [volunteering, setVolunteering] = useState(false);
  const tabScrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!topicId) return;
    setLoading(true);
    try {
      const h = await authHeaders();
      setIsAuthenticated(!!await getToken());
      const res = await fetch(`${getApiBase()}/api/knowledge/hubs/${topicId}`, { headers: h });
      if (res.ok) {
        const data = await res.json() as HubData;
        setHub(data);
        setIsFollowing(data.isFollowing);
        setUserIntent(data.userIntent);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [topicId]);

  const loadBrief = useCallback(async (topicName: string) => {
    setBriefLoading(true);
    try {
      const h = await authHeaders();
      const encoded = encodeURIComponent(topicName);
      const res = await fetch(`${getApiBase()}/api/topic-brief/${encoded}`, { headers: h });
      if (res.ok) {
        const data = await res.json() as { content?: string };
        setBrief(data.content ?? "");
      }
    } catch { /* silent */ } finally { setBriefLoading(false); }
  }, []);

  const loadExtras = useCallback(async (tid: string) => {
    try {
      const h = await authHeaders();
      const [recRes, expRes] = await Promise.all([
        fetch(`${getApiBase()}/api/knowledge/hubs/${tid}/recommendations`, { headers: h }),
        fetch(`${getApiBase()}/api/knowledge/hubs/${tid}/experts`, { headers: h }),
      ]);
      if (recRes.ok) { const d = await recRes.json() as { recommendations: HubRecommendation[] }; setRecommendations(d.recommendations ?? []); }
      if (expRes.ok) { const d = await expRes.json() as { experts: HubExpert[] }; setExperts(d.experts ?? []); }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (hub?.topic.topicName) loadBrief(hub.topic.topicName);
    if (topicId) loadExtras(topicId);
  }, [hub?.topic.topicName, loadBrief, loadExtras, topicId]);

  async function volunteerAsExpert() {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    setVolunteering(true);
    try {
      const h = await authHeaders();
      await fetch(`${getApiBase()}/api/knowledge/hubs/${topicId}/volunteer-expert`, {
        method: "POST", headers: h,
        body: JSON.stringify({ yearsOfExperience: volunteerYears ? Number(volunteerYears) : undefined, experienceNote: volunteerNote }),
      });
      setShowVolunteerModal(false);
      if (topicId) loadExtras(topicId);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { /* silent */ } finally { setVolunteering(false); }
  }

  async function toggleFollow() {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    setFollowLoading(true);
    try {
      const h = await authHeaders();
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`${getApiBase()}/api/knowledge/topics/${topicId}/follow`, { method, headers: h });
      if (res.status === 403) { setShowUpgrade(true); setFollowLoading(false); return; }
      if (res.ok) {
        const joined = !isFollowing;
        setIsFollowing(joined);
        if (joined && !userIntent) setTimeout(() => setShowIntentPicker(true), 600);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch { /* silent */ } finally { setFollowLoading(false); }
  }

  async function setIntent(intent: string) {
    setSettingIntent(true);
    setUserIntent(intent);
    try {
      const h = await authHeaders();
      await fetch(`${getApiBase()}/api/knowledge/hubs/${topicId}/intent`, {
        method: "PUT", headers: h, body: JSON.stringify({ intent }),
      });
    } catch { /* silent */ } finally {
      setSettingIntent(false);
      setShowIntentPicker(false);
    }
  }

  const typeMeta = TYPE_META[hub?.topic.topicType ?? "general"] ?? TYPE_META.general;
  const hubName = hub?.topic.canonicalName || hub?.topic.topicName || "";
  const blackOwnedBiz = hub?.businesses.filter((b) => b.blackOwned !== false) ?? [];
  const communityRec = hub?.businesses.filter((b) => b.blackOwned === false) ?? [];

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.root, { backgroundColor: colors.background }]}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: typeMeta.color + "18" }]}>
                  <Text style={{ fontSize: 11 }}>{typeMeta.emoji}</Text>
                  <Text style={[styles.typeBadgeTxt, { color: typeMeta.color }]}>{typeMeta.label}</Text>
                </View>
                {userIntent && (
                  <View style={[styles.intentBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.intentBadgeTxt, { color: colors.mutedForeground }]}>{INTENT_LABELS[userIntent]}</Text>
                  </View>
                )}
                {(hub?.membersCount ?? 0) > 0 && (
                  <View style={[styles.memberBadge, { backgroundColor: colors.secondary }]}>
                    <Feather name="users" size={9} color={colors.mutedForeground} />
                    <Text style={[styles.memberBadgeTxt, { color: colors.mutedForeground }]}>
                      {hub!.membersCount.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.hubName, { color: colors.foreground }]} numberOfLines={2}>{hubName}</Text>
              {hub?.topic.description ? (
                <Text style={[styles.hubDesc, { color: colors.mutedForeground }]} numberOfLines={1}>{hub.topic.description}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: isFollowing ? typeMeta.color : "transparent", borderColor: typeMeta.color }]}
              onPress={toggleFollow}
              disabled={followLoading}
              activeOpacity={0.8}
            >
              {followLoading
                ? <ActivityIndicator size="small" color={isFollowing ? "#fff" : typeMeta.color} />
                : <Text style={[styles.joinBtnTxt, { color: isFollowing ? "#fff" : typeMeta.color }]}>
                    {isFollowing ? "In Library" : "Join Hub"}
                  </Text>}
            </TouchableOpacity>
          </View>

          {/* ── Intent CTA (when following but intent not set) ── */}
          {isFollowing && !userIntent && (
            <TouchableOpacity
              style={[styles.intentCta, { backgroundColor: typeMeta.color + "12", borderColor: typeMeta.color + "30" }]}
              onPress={() => setShowIntentPicker(true)}
              activeOpacity={0.75}
            >
              <Text style={[styles.intentCtaTxt, { color: typeMeta.color }]}>
                What's your connection to {hub?.topic.topicName}? Personalize your hub →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Tab Bar ── */}
        <View style={[styles.tabBarWrapper, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <ScrollView ref={tabScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, active && { borderBottomColor: typeMeta.color }]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <Feather name={tab.icon as any} size={13} color={active ? typeMeta.color : colors.mutedForeground} />
                  <Text style={[styles.tabLabel, { color: active ? typeMeta.color : colors.mutedForeground }, active && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Tab Content ── */}
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* ══════════════ INFO TAB ══════════════ */}
          {activeTab === "info" && (
            <View>
              {/* Now What? Action Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
                {getHubActions(hub?.topic.topicType ?? "general", userIntent).map((action, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.actionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      if (action.tab) setActiveTab(action.tab);
                      else if (action.route) router.push(action.route as never);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={{ fontSize: 16 }}>{action.emoji}</Text>
                    <Text style={[styles.actionChipTxt, { color: colors.foreground }]}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* AI Brief */}
              <View style={[styles.section, styles.briefSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Feather name="zap" size={14} color={typeMeta.color} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI-Powered Overview</Text>
                  <View style={[styles.liveTag, { backgroundColor: typeMeta.color + "15" }]}>
                    <Text style={[styles.liveTagTxt, { color: typeMeta.color }]}>Live</Text>
                  </View>
                </View>
                {briefLoading ? (
                  <View style={styles.briefLoading}>
                    <ActivityIndicator size="small" color={typeMeta.color} />
                    <Text style={[styles.briefLoadingTxt, { color: colors.mutedForeground }]}>Generating personalized overview…</Text>
                  </View>
                ) : brief ? (
                  <Text style={[styles.briefText, { color: colors.foreground }]}>{brief}</Text>
                ) : (
                  <Text style={[styles.briefText, { color: colors.mutedForeground }]}>No overview available yet.</Text>
                )}
                {!subscription && (
                  <TouchableOpacity style={[styles.upgradeHint, { backgroundColor: "#CA922B10", borderColor: "#CA922B30" }]} onPress={() => setShowUpgrade(true)} activeOpacity={0.8}>
                    <Feather name="lock" size={11} color="#CA922B" />
                    <Text style={[styles.upgradeHintTxt, { color: "#CA922B" }]}>Upgrade for deeper research-backed analysis</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Trusted Sources */}
              {(hub?.trustedSources?.length ?? 0) > 0 && (
                <View style={[styles.section, { paddingHorizontal: 0 }]}>
                  <View style={[styles.sectionHeader, { paddingHorizontal: 14 }]}>
                    <Feather name="check-circle" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trusted Sources</Text>
                    <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>Verified • Reliable</Text>
                  </View>
                  <Text style={[styles.sectionSub, { color: colors.mutedForeground, paddingHorizontal: 14 }]}>
                    Information in this hub is drawn from these vetted organizations.
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sourcesRow}>
                    {hub!.trustedSources.map((src, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.sourceCard, { backgroundColor: colors.card, borderColor: src.forCommunity ? typeMeta.color + "40" : colors.border }]}
                        onPress={() => Linking.openURL(src.url)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.sourceEmoji}>{src.emoji}</Text>
                        <Text style={[styles.sourceName, { color: colors.foreground }]} numberOfLines={2}>{src.name}</Text>
                        <View style={[styles.sourceTypePill, { backgroundColor: src.forCommunity ? typeMeta.color + "15" : colors.secondary }]}>
                          <Text style={[styles.sourceTypeTxt, { color: src.forCommunity ? typeMeta.color : colors.mutedForeground }]}>
                            {src.forCommunity ? "For Us ✊🏾" : SOURCE_TYPE_LABEL[src.type] ?? src.type}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={[styles.infoNote, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[styles.infoNoteTxt, { color: colors.mutedForeground }]}>
                  Live news feeds, weather, exchange rates, and travel advisories are coming soon as real-time data integrations.
                </Text>
              </View>

              {/* Related Hubs */}
              {recommendations.length > 0 && (
                <View style={[styles.section, { paddingHorizontal: 0 }]}>
                  <View style={[styles.sectionHeader, { paddingHorizontal: 14 }]}>
                    <Feather name="compass" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>People Also Explore</Text>
                  </View>
                  <Text style={[styles.sectionSub, { color: colors.mutedForeground, paddingHorizontal: 14 }]}>
                    Hubs members of this community also find valuable.
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recsRow}>
                    {recommendations.map((rec, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.recCard, { backgroundColor: colors.card, borderColor: rec.exists ? typeMeta.color + "40" : colors.border }]}
                        onPress={() => rec.exists && rec.id ? router.push({ pathname: "/library-topic", params: { topicId: rec.id } } as never) : null}
                        activeOpacity={rec.exists ? 0.75 : 1}
                      >
                        <Text style={[styles.recName, { color: colors.foreground }]} numberOfLines={2}>{rec.canonicalName ?? rec.name}</Text>
                        {rec.exists && rec.memberCount > 0 && (
                          <Text style={[styles.recMembers, { color: colors.mutedForeground }]}>{rec.memberCount} members</Text>
                        )}
                        {!rec.exists && (
                          <View style={[styles.recNewBadge, { backgroundColor: typeMeta.color + "15" }]}>
                            <Text style={[styles.recNewTxt, { color: typeMeta.color }]}>New Hub</Text>
                          </View>
                        )}
                        {rec.exists && (
                          <View style={[styles.recJoinBadge, { backgroundColor: typeMeta.color + "15" }]}>
                            <Text style={[styles.recNewTxt, { color: typeMeta.color }]}>View Hub →</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* ══════════════ COMMUNITY TAB ══════════════ */}
          {activeTab === "community" && (
            <View>
              <View style={[styles.section, { paddingTop: 0 }]}>
                <View style={styles.sectionHeader}>
                  <Feather name="users" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community Discussions</Text>
                  {(hub?.posts.length ?? 0) > 0 && (
                    <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>{hub!.posts.length} posts</Text>
                  )}
                </View>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  Lived experiences, tips, and real talk from community members.
                </Text>
              </View>

              {hub?.posts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push("/(tabs)/community" as never)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.postContent, { color: colors.foreground }]} numberOfLines={4}>{post.content}</Text>
                  <View style={styles.postMeta}>
                    {post.topicTag && (
                      <View style={[styles.topicTagPill, { backgroundColor: typeMeta.color + "15" }]}>
                        <Text style={[styles.topicTagTxt, { color: typeMeta.color }]}>{post.topicTag}</Text>
                      </View>
                    )}
                    <View style={styles.postStats}>
                      <Feather name="arrow-up" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.postStatTxt, { color: colors.mutedForeground }]}>{post.upvotes}</Text>
                      {post.commentsCount != null && (
                        <>
                          <Feather name="message-circle" size={11} color={colors.mutedForeground} />
                          <Text style={[styles.postStatTxt, { color: colors.mutedForeground }]}>{post.commentsCount}</Text>
                        </>
                      )}
                      <Text style={[styles.postTime, { color: colors.mutedForeground }]}>{timeAgo(post.createdAt)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {(hub?.posts.length ?? 0) === 0 && (
                <View style={styles.emptyState}>
                  <Text style={{ fontSize: 36, marginBottom: 12 }}>💬</Text>
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Be the first to post</Text>
                  <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                    Share your experience, tips, or questions about {hub?.topic.topicName}.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: typeMeta.color }]}
                onPress={() => router.push("/(tabs)/community" as never)}
                activeOpacity={0.8}
              >
                <Feather name="edit-2" size={14} color="#fff" />
                <Text style={styles.ctaBtnTxt}>Write a Post</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════ CREATORS TAB ══════════════ */}
          {activeTab === "videos" && (
            <View>
              <View style={[styles.section, { paddingTop: 0 }]}>
                <View style={styles.sectionHeader}>
                  <Feather name="play-circle" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>MWM Creators</Text>
                </View>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  Content creators in our community with experience on this topic. Travel vlogs, food tours, safety walkthroughs, neighborhood guides, and more.
                </Text>
              </View>

              {hub?.creators.map((creator) => (
                <TouchableOpacity
                  key={creator.id}
                  style={[styles.creatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/profile/[id]", params: { id: creator.id } } as never)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.creatorAvatar, { backgroundColor: typeMeta.color + "20", overflow: "hidden" }]}>
                    {creator.profileImageUrl
                      ? <Image source={{ uri: creator.profileImageUrl }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                      : <Text style={[styles.creatorInitials, { color: typeMeta.color }]}>{creatorInitials(creator)}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.creatorName, { color: colors.foreground }]}>{creatorName(creator)}</Text>
                    {creator.homeCity && (
                      <View style={styles.creatorLocation}>
                        <Feather name="map-pin" size={10} color={colors.mutedForeground} />
                        <Text style={[styles.creatorLocationTxt, { color: colors.mutedForeground }]}>{creator.homeCity}</Text>
                      </View>
                    )}
                    <View style={[styles.creatorBadge, { backgroundColor: typeMeta.color + "15" }]}>
                      <Text style={[styles.creatorBadgeTxt, { color: typeMeta.color }]}>✦ MWM Creator</Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}

              {(hub?.creators.length ?? 0) === 0 && (
                <View style={styles.emptyState}>
                  <Text style={{ fontSize: 36, marginBottom: 12 }}>🎬</Text>
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No creators yet</Text>
                  <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                    MWM creators who tag their content to this hub will appear here.
                  </Text>
                </View>
              )}

              <View style={[styles.infoNote, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="film" size={13} color={colors.mutedForeground} />
                <Text style={[styles.infoNoteTxt, { color: colors.mutedForeground }]}>
                  Travel vlogs, food tours, neighborhood guides, and safety walkthroughs from creators are displayed here — kept separate from verified official info.
                </Text>
              </View>
            </View>
          )}

          {/* ══════════════ PLACES TAB ══════════════ */}
          {activeTab === "places" && (
            <View>
              {/* Minority-Owned */}
              <View style={[styles.section, { paddingTop: 0 }]}>
                <View style={styles.sectionHeader}>
                  <Text style={{ fontSize: 13 }}>✊🏾</Text>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Black-Owned Businesses</Text>
                </View>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  Verified and promoted. These businesses are part of the MWM network.
                </Text>
              </View>

              {blackOwnedBiz.length > 0 ? blackOwnedBiz.map((biz) => (
                <TouchableOpacity
                  key={biz.id}
                  style={[styles.bizCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/business/[id]", params: { id: biz.id } } as never)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.bizIcon, { backgroundColor: typeMeta.color + "15" }]}>
                    <Text style={{ fontSize: 20 }}>🏪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>{biz.name}</Text>
                    <Text style={[styles.bizCategory, { color: typeMeta.color }]}>{biz.category}</Text>
                    <Text style={[styles.bizLocation, { color: colors.mutedForeground }]}>
                      {biz.city}, {biz.state}
                    </Text>
                  </View>
                  {biz.verified && (
                    <View style={[styles.verifiedPill, { backgroundColor: "#16A34A15" }]}>
                      <Feather name="check-circle" size={10} color="#16A34A" />
                      <Text style={[styles.verifiedTxt, { color: "#16A34A" }]}>Verified</Text>
                    </View>
                  )}
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )) : (
                <View style={[styles.emptyState, { paddingTop: 0 }]}>
                  <Text style={{ fontSize: 32, marginBottom: 10 }}>🏪</Text>
                  <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                    No verified businesses yet for this hub.
                  </Text>
                </View>
              )}

              {/* Community Recommended */}
              <View style={[styles.section, { marginTop: 8 }]}>
                <View style={styles.sectionHeader}>
                  <Feather name="shield" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community-Recommended Places</Text>
                </View>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  Safe, community-endorsed spots — not necessarily minority-owned, but trusted by our members.
                </Text>
              </View>

              {communityRec.length > 0 ? communityRec.map((biz) => (
                <TouchableOpacity
                  key={biz.id}
                  style={[styles.bizCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/business/[id]", params: { id: biz.id } } as never)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.bizIcon, { backgroundColor: colors.secondary }]}>
                    <Text style={{ fontSize: 20 }}>📍</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>{biz.name}</Text>
                    <Text style={[styles.bizCategory, { color: colors.mutedForeground }]}>{biz.category}</Text>
                    <Text style={[styles.bizLocation, { color: colors.mutedForeground }]}>{biz.city}, {biz.state}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )) : (
                <TouchableOpacity
                  style={[styles.ctaOutline, { borderColor: colors.border }]}
                  onPress={() => router.push("/(tabs)/community" as never)}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.ctaOutlineTxt, { color: colors.mutedForeground }]}>Recommend a Place</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ══════════════ OPPORTUNITIES TAB ══════════════ */}
          {activeTab === "opportunities" && (
            <View>
              <View style={[styles.section, { paddingTop: 0 }]}>
                <View style={styles.sectionHeader}>
                  <Feather name="briefcase" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Opportunities</Text>
                </View>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  Jobs, internships, volunteer roles, and mentorship openings related to this hub.
                </Text>
              </View>

              {/* Placeholder — opportunities come from job listings + community posts */}
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>🚀</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Opportunities Coming Soon</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Post a job, internship, or volunteer role for this hub. Members can also share anonymous workplace insights and referrals.
                </Text>
              </View>

              <View style={{ paddingHorizontal: 14, gap: 10 }}>
                {[
                  { icon: "briefcase", label: "Post a Job or Internship" },
                  { icon: "heart", label: "Post a Volunteer Role" },
                  { icon: "user", label: "Offer an Employee Referral" },
                  { icon: "message-square", label: "Share Anonymous Workplace Insight" },
                ].map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.ctaOutline, { borderColor: colors.border }]}
                    onPress={() => router.push("/(tabs)/community" as never)}
                    activeOpacity={0.8}
                  >
                    <Feather name={item.icon as any} size={14} color={colors.mutedForeground} />
                    <Text style={[styles.ctaOutlineTxt, { color: colors.foreground }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ══════════════ MENTORS TAB ══════════════ */}
          {activeTab === "mentors" && (
            <View>
              <View style={[styles.section, { paddingTop: 0 }]}>
                <View style={styles.sectionHeader}>
                  <Feather name="star" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community Experts</Text>
                  {experts.length > 0 && <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>{experts.length} experts</Text>}
                </View>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  People who've lived it, done it, and volunteered to help others on this topic.
                </Text>
              </View>

              {/* Expert cards */}
              {experts.map((expert) => (
                <TouchableOpacity
                  key={expert.id}
                  style={[styles.expertCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/profile/[id]", params: { id: expert.userId } } as never)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.expertAvatar, { backgroundColor: typeMeta.color + "20" }]}>
                    {expert.avatarUrl
                      ? <Image source={{ uri: expert.avatarUrl }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                      : <Text style={[styles.expertAvatarTxt, { color: typeMeta.color }]}>{(expert.displayName?.[0] ?? "M").toUpperCase()}</Text>}
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={styles.expertNameRow}>
                      <Text style={[styles.expertName, { color: colors.foreground }]} numberOfLines={1}>{expert.displayName ?? "Community Expert"}</Text>
                      {expert.isVerified && <Feather name="check-circle" size={13} color={typeMeta.color} />}
                    </View>
                    <View style={[styles.expertBadge, { backgroundColor: typeMeta.color + "15" }]}>
                      <Text style={{ fontSize: 11 }}>{expert.badgeEmoji}</Text>
                      <Text style={[styles.expertBadgeTxt, { color: typeMeta.color }]}>{expert.badgeName}</Text>
                    </View>
                    {expert.experienceNote && (
                      <Text style={[styles.expertNote, { color: colors.mutedForeground }]} numberOfLines={2}>"{expert.experienceNote}"</Text>
                    )}
                    {expert.yearsOfExperience != null && (
                      <Text style={[styles.expertYears, { color: colors.mutedForeground }]}>{expert.yearsOfExperience} year{expert.yearsOfExperience !== 1 ? "s" : ""} of experience</Text>
                    )}
                    {expert.city && (
                      <View style={styles.expertCity}>
                        <Feather name="map-pin" size={10} color={colors.mutedForeground} />
                        <Text style={[styles.expertCityTxt, { color: colors.mutedForeground }]}>{expert.city}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                    {expert.helpfulVotes > 0 && (
                      <View style={styles.voteRow}>
                        <Feather name="thumbs-up" size={10} color={colors.mutedForeground} />
                        <Text style={[styles.voteTxt, { color: colors.mutedForeground }]}>{expert.helpfulVotes}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {experts.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={{ fontSize: 36, marginBottom: 12 }}>🌟</Text>
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Be the First Expert</Text>
                  <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                    If you have lived experience with {hub?.topic.topicName ?? "this topic"}, volunteer to help others in the community.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: typeMeta.color, marginHorizontal: 14 }]}
                onPress={() => setShowVolunteerModal(true)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14 }}>✦</Text>
                <Text style={styles.ctaBtnTxt}>Volunteer as an Expert</Text>
              </TouchableOpacity>

              <View style={[styles.infoNote, { backgroundColor: colors.secondary, borderColor: colors.border, marginTop: 16 }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[styles.infoNoteTxt, { color: colors.mutedForeground }]}>
                  Example: "I've lived in Tokyo for 14 years." · "I've restored 40 classic Mustangs." · "I manage Type 2 Diabetes and can help others." Expertise is voluntary and community-verified.
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: Platform.OS === "web" ? 80 : insets.bottom + 80 }} />
        </ScrollView>
      </View>

      {/* ── Intent Picker Modal ── */}
      <Modal visible={showIntentPicker} transparent animationType="slide" onRequestClose={() => setShowIntentPicker(false)}>
        <View style={styles.intentOverlay}>
          <View style={[styles.intentSheet, { backgroundColor: colors.card }]}>
            <View style={styles.intentHandle} />
            <Text style={[styles.intentTitle, { color: colors.foreground }]}>
              What's your connection to {hub?.topic.topicName}?
            </Text>
            <Text style={[styles.intentSub, { color: colors.mutedForeground }]}>
              This personalizes your hub — only you can see this.
            </Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              {INTENT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.intentOption, { backgroundColor: colors.background, borderColor: userIntent === opt.value ? typeMeta.color : colors.border }]}
                  onPress={() => setIntent(opt.value)}
                  disabled={settingIntent}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.intentOptionLabel, { color: colors.foreground }]}>{opt.label}</Text>
                    <Text style={[styles.intentOptionDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
                  </View>
                  {settingIntent && userIntent === opt.value
                    ? <ActivityIndicator size="small" color={typeMeta.color} />
                    : userIntent === opt.value
                      ? <Feather name="check-circle" size={18} color={typeMeta.color} />
                      : null}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.intentSkip} onPress={() => setShowIntentPicker(false)} activeOpacity={0.7}>
              <Text style={[styles.intentSkipTxt, { color: colors.mutedForeground }]}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Volunteer as Expert Modal */}
      <Modal visible={showVolunteerModal} transparent animationType="slide" onRequestClose={() => setShowVolunteerModal(false)}>
        <View style={styles.intentOverlay}>
          <View style={[styles.intentSheet, { backgroundColor: colors.card }]}>
            <View style={styles.intentHandle} />
            <Text style={[styles.intentTitle, { color: colors.foreground }]}>
              Volunteer as a {hubName} Expert
            </Text>
            <Text style={[styles.intentSub, { color: colors.mutedForeground }]}>
              Tell the community about your experience. This will be shown on your profile.
            </Text>
            <TextInput
              style={[styles.volunteerInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder={`e.g. "I've lived in ${hubName} for 8 years and can help with housing, healthcare, and daily life."`}
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              value={volunteerNote}
              onChangeText={setVolunteerNote}
            />
            <TextInput
              style={[styles.volunteerInputShort, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Years of experience (optional)"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={volunteerYears}
              onChangeText={setVolunteerYears}
            />
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: typeMeta.color, alignSelf: "stretch", justifyContent: "center" }]}
              onPress={volunteerAsExpert}
              disabled={volunteering}
              activeOpacity={0.8}
            >
              {volunteering ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.ctaBtnTxt}>Submit &amp; Become an Expert</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.intentSkip} onPress={() => setShowVolunteerModal(false)} activeOpacity={0.7}>
              <Text style={[styles.intentSkipTxt, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="Knowledge+"
        reason="Upgrade to Knowledge+ to join unlimited hubs and access deeper research."
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { borderBottomWidth: 1, paddingHorizontal: 14, paddingBottom: 10 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  backBtn: { paddingTop: 2, paddingRight: 4, marginTop: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeBadgeTxt: { fontSize: 11, fontFamily: "Inter_700Bold" },
  intentBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  intentBadgeTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  memberBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  memberBadgeTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  hubName: { fontSize: 17, fontFamily: "Inter_700Bold", lineHeight: 22 },
  hubDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  joinBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginTop: 4, minWidth: 88, alignItems: "center" },
  joinBtnTxt: { fontSize: 13, fontFamily: "Inter_700Bold" },
  intentCta: { marginTop: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  intentCtaTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabBarWrapper: { borderBottomWidth: 1 },
  tabBar: { paddingHorizontal: 6, paddingVertical: 0 },
  tab: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tabLabelActive: { fontFamily: "Inter_700Bold" },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16 },
  section: { paddingHorizontal: 14, marginBottom: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  sectionMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginBottom: 12 },
  briefSection: { marginHorizontal: 14, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  briefLoading: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  briefLoadingTxt: { fontSize: 13, fontFamily: "Inter_400Regular" },
  briefText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  liveTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  liveTagTxt: { fontSize: 10, fontFamily: "Inter_700Bold" },
  upgradeHint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  upgradeHintTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  sourcesRow: { paddingHorizontal: 14, gap: 10, paddingBottom: 4 },
  sourceCard: { width: 130, borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  sourceEmoji: { fontSize: 22 },
  sourceName: { fontSize: 12, fontFamily: "Inter_600SemiBold", lineHeight: 16 },
  sourceTypePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  sourceTypeTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  infoNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginHorizontal: 14, marginTop: 14, padding: 12, borderRadius: 12, borderWidth: 1 },
  infoNoteTxt: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, flex: 1 },
  postCard: { marginHorizontal: 14, marginBottom: 10, borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  postContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  postMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topicTagPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  topicTagTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  postStats: { flexDirection: "row", alignItems: "center", gap: 5 },
  postStatTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  postTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  creatorCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 14, marginBottom: 10, borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  creatorAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  creatorInitials: { fontSize: 16, fontFamily: "Inter_700Bold" },
  creatorName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  creatorLocation: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 4 },
  creatorLocationTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  creatorBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start" },
  creatorBadgeTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  bizCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 14, marginBottom: 8, borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
  bizIcon: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bizName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bizCategory: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  bizLocation: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  verifiedPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  verifiedTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 28 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, textAlign: "center" },
  ctaBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignSelf: "center", marginTop: 8 },
  ctaBtnTxt: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  ctaOutline: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginHorizontal: 14 },
  ctaOutlineTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  mentorTypesRow: { paddingHorizontal: 14, gap: 8, paddingBottom: 16 },
  mentorTypeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  mentorTypeLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  intentOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  intentSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  intentHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1", alignSelf: "center", marginBottom: 16 },
  intentTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 6 },
  intentSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 4 },
  intentOption: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  intentOptionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  intentOptionDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  intentSkip: { paddingVertical: 14, alignItems: "center" },
  intentSkipTxt: { fontSize: 13, fontFamily: "Inter_400Regular" },
  actionsRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  actionChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  actionChipTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  recsRow: { paddingHorizontal: 14, gap: 10, paddingBottom: 4 },
  recCard: { width: 150, borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 8 },
  recName: { fontSize: 13, fontFamily: "Inter_700Bold", lineHeight: 18 },
  recMembers: { fontSize: 11, fontFamily: "Inter_400Regular" },
  recNewBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  recJoinBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  recNewTxt: { fontSize: 10, fontFamily: "Inter_700Bold" },
  expertCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginHorizontal: 14, marginBottom: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  expertAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  expertAvatarTxt: { fontSize: 18, fontFamily: "Inter_700Bold" },
  expertNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  expertName: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  expertBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  expertBadgeTxt: { fontSize: 11, fontFamily: "Inter_700Bold" },
  expertNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, fontStyle: "italic" },
  expertYears: { fontSize: 11, fontFamily: "Inter_400Regular" },
  expertCity: { flexDirection: "row", alignItems: "center", gap: 3 },
  expertCityTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  voteRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  voteTxt: { fontSize: 10, fontFamily: "Inter_400Regular" },
  volunteerInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: 12, marginBottom: 8, minHeight: 80, textAlignVertical: "top" },
  volunteerInputShort: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14 },
});
