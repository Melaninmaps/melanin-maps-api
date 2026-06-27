import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useMembership } from "@/hooks/useMembership";
import { UpgradeModal } from "@/components/UpgradeModal";
import { PrivacyPinModal, isSensitiveCategory } from "@/components/PrivacyPinModal";

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
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const CATEGORY_META: Record<string, { emoji: string; color: string; label: string }> = {
  health:             { emoji: "🩺", color: "#DC2626", label: "Health" },
  travel:             { emoji: "✈️", color: "#2563EB", label: "Travel" },
  relocation:         { emoji: "🏡", color: "#16A34A", label: "Relocation" },
  careers:            { emoji: "💼", color: "#059669", label: "Careers" },
  money:              { emoji: "💰", color: "#D97706", label: "Money" },
  history:            { emoji: "🏛️", color: "#7C3AED", label: "History" },
  education:          { emoji: "🎓", color: "#0891B2", label: "Education" },
  food:               { emoji: "🍽️", color: "#EA580C", label: "Food" },
  culture:            { emoji: "🎉", color: "#DB2777", label: "Culture" },
  wellness:           { emoji: "🧠", color: "#6D28D9", label: "Wellness" },
  community_culture:  { emoji: "✊🏾", color: "#9333EA", label: "Community" },
  safety:             { emoji: "🛡️", color: "#DC2626", label: "Safety" },
  business:           { emoji: "📈", color: "#059669", label: "Business" },
  employment:         { emoji: "💼", color: "#0891B2", label: "Employment" },
  financial:          { emoji: "💵", color: "#D97706", label: "Finance" },
  family:             { emoji: "👨‍👩‍👧", color: "#16A34A", label: "Family" },
  entertainment:      { emoji: "🎬", color: "#EC4899", label: "Entertainment" },
  technology:         { emoji: "💻", color: "#3B82F6", label: "Technology" },
  environment:        { emoji: "🌱", color: "#22C55E", label: "Environment" },
  giving:             { emoji: "🤝", color: "#CA922B", label: "Giving Back" },
  government:         { emoji: "⚖️", color: "#6B7280", label: "Government" },
  platform:           { emoji: "✦", color: "#CA922B", label: "MWM Updates" },
  food_lifestyle:     { emoji: "🍽️", color: "#EA580C", label: "Food & Lifestyle" },
  health_wellness:    { emoji: "💪", color: "#DC2626", label: "Health & Wellness" },
  financial_wellness: { emoji: "💰", color: "#D97706", label: "Financial Wellness" },
};

interface Topic {
  id: string;
  topicName: string;
  category: string;
  description?: string | null;
  isFollowing?: boolean;
  isPinnedToProfile?: boolean;
  newCount?: number;
}

interface FeedArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  topicId?: string | null;
  tier: string;
  readTimeMinutes: number | null;
  authorName: string;
  authorBadge?: string | null;
  publishedAt: string;
  isRead?: boolean;
}

interface Expert {
  id: string;
  displayName: string;
  specialty: string;
  badge: string;
  bio?: string | null;
  followCount?: number | null;
  articleCount?: number | null;
}

interface Issue {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  isFollowing?: boolean;
  isPinnedToProfile?: boolean;
}

interface DeliveryPrefs {
  digestMode: string;
  scope: string;
  includeSavedCities: boolean;
  includeSavedBusinesses: boolean;
}

const SAMPLE_EXPERTS: Expert[] = [
  { id: "e1", displayName: "Dr. Aisha Matthews", specialty: "Internal Medicine", badge: "Verified Physician", bio: "Board-certified internist with 15 years of experience in preventive care.", followCount: 842, articleCount: 12 },
  { id: "e2", displayName: "James L. Carter, Esq.", specialty: "Civil Rights & Employment Law", badge: "Verified Attorney", bio: "Specializing in employment discrimination and civil rights litigation.", followCount: 614, articleCount: 8 },
  { id: "e3", displayName: "Tasha R. Williams, CFP", specialty: "Financial Planning", badge: "Verified Financial Advisor", bio: "Helping Black families build wealth and navigate financial planning.", followCount: 1103, articleCount: 15 },
];

const DIGEST_MODES = [
  { id: "daily", label: "Daily Digest", desc: "One summary every morning" },
  { id: "weekly", label: "Weekly Roundup", desc: "Best of the week, every Monday" },
  { id: "breaking", label: "Breaking Only", desc: "Only urgent alerts & alerts" },
  { id: "immediate", label: "All Updates", desc: "Notify me as they happen" },
];

const SCOPE_MODES = [
  { id: "local", label: "Local", emoji: "📍" },
  { id: "national", label: "National", emoji: "🇺🇸" },
  { id: "global", label: "Global", emoji: "🌍" },
  { id: "all", label: "All", emoji: "∞" },
];

type Tab = "library" | "browse" | "issues";

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subscription } = useMembership();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const isPremium = !!subscription;

  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [feed, setFeed] = useState<FeedArticle[]>([]);
  const [experts, setExperts] = useState<Expert[]>(SAMPLE_EXPERTS);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [digestText, setDigestText] = useState<string>("");
  const [deliveryPrefs, setDeliveryPrefs] = useState<DeliveryPrefs>({
    digestMode: "weekly",
    scope: "all",
    includeSavedCities: false,
    includeSavedBusinesses: false,
  });
  const [newCount, setNewCount] = useState(0);
  const [followCount, setFollowCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [issueSearch, setIssueSearch] = useState("");
  const [topicSearch, setTopicSearch] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [pinModal, setPinModal] = useState<{
    visible: boolean;
    itemName: string;
    category: string;
    isPinning: boolean;
    onConfirm: () => Promise<void>;
  }>({ visible: false, itemName: "", category: "", isPinning: true, onConfirm: async () => {} });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const hasAuth = Object.keys(h).length > 0;
      setIsAuthenticated(hasAuth);

      const [topicsRes, expertsRes, issuesRes] = await Promise.all([
        fetch(`${getApiBase()}/api/knowledge/topics`, { headers: h }),
        fetch(`${getApiBase()}/api/knowledge/experts`),
        fetch(`${getApiBase()}/api/knowledge/issues`, { headers: h }),
      ]);

      if (topicsRes.ok) {
        const data = await topicsRes.json() as { topics: Topic[]; followCount: number };
        setTopics(data.topics);
        setFollowCount(data.followCount ?? 0);
      }
      if (expertsRes.ok) {
        const data = await expertsRes.json() as { experts: Expert[] };
        if (data.experts.length > 0) setExperts(data.experts);
      }
      if (issuesRes.ok) {
        const data = await issuesRes.json() as { issues: Issue[] };
        setIssues(data.issues);
      }

      if (hasAuth) {
        const [prefRes] = await Promise.all([
          fetch(`${getApiBase()}/api/knowledge/delivery-preferences`, { headers: h }),
        ]);
        if (prefRes.ok) {
          const data = await prefRes.json() as { preferences: DeliveryPrefs };
          setDeliveryPrefs(data.preferences);
        }

        setFeedLoading(true);
        const feedRes = await fetch(`${getApiBase()}/api/knowledge/feed`, { headers: h });
        if (feedRes.ok) {
          const data = await feedRes.json() as { articles: FeedArticle[]; newCount: number };
          setFeed(data.articles);
          setNewCount(data.newCount);
        }
        setFeedLoading(false);

        const digestRes = await fetch(`${getApiBase()}/api/knowledge/digest`, { headers: h });
        if (digestRes.ok) {
          const data = await digestRes.json() as { digest: string | null };
          if (data.digest) setDigestText(data.digest);
        }
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const followedTopics = useMemo(() => topics.filter((t) => t.isFollowing), [topics]);
  const unfollowedTopics = useMemo(() => topics.filter((t) => !t.isFollowing), [topics]);

  const filteredTopics = useMemo(() => {
    const q = topicSearch.toLowerCase();
    return q
      ? topics.filter((t) => t.topicName.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
      : topics;
  }, [topics, topicSearch]);

  const filteredIssues = useMemo(() => {
    const q = issueSearch.toLowerCase();
    return q
      ? issues.filter((i) => i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q))
      : issues;
  }, [issues, issueSearch]);

  const followingIssues = useMemo(() => issues.filter((i) => i.isFollowing), [issues]);

  async function toggleFollow(topic: Topic) {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    const willFollow = !topic.isFollowing;
    if (willFollow && !isPremium && followCount >= 10) {
      setUpgradeReason("Upgrade to Knowledge+ to follow unlimited topics. Free accounts can follow up to 10.");
      setShowUpgrade(true);
      return;
    }

    setTopics((prev) => prev.map((t) => t.id === topic.id ? { ...t, isFollowing: willFollow } : t));
    setFollowCount((c) => c + (willFollow ? 1 : -1));

    try {
      const h = await authHeaders();
      const method = topic.isFollowing ? "DELETE" : "POST";
      const res = await fetch(`${getApiBase()}/api/knowledge/topics/${topic.id}/follow`, { method, headers: h });
      if (res.status === 403) {
        setTopics((prev) => prev.map((t) => t.id === topic.id ? { ...t, isFollowing: topic.isFollowing } : t));
        setFollowCount((c) => c - (willFollow ? 1 : -1));
        setUpgradeReason("Upgrade to Knowledge+ to follow unlimited topics.");
        setShowUpgrade(true);
      }
    } catch {
      setTopics((prev) => prev.map((t) => t.id === topic.id ? { ...t, isFollowing: topic.isFollowing } : t));
      setFollowCount((c) => c - (willFollow ? 1 : -1));
    }
  }

  async function toggleIssueFollow(issue: Issue) {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    const willFollow = !issue.isFollowing;
    setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, isFollowing: willFollow } : i));
    try {
      const h = await authHeaders();
      const method = issue.isFollowing ? "DELETE" : "POST";
      await fetch(`${getApiBase()}/api/knowledge/issues/${issue.id}/follow`, { method, headers: h });
    } catch {
      setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, isFollowing: issue.isFollowing } : i));
    }
  }

  function openPinModal(itemName: string, category: string, isPinning: boolean, onConfirm: () => Promise<void>) {
    setPinModal({ visible: true, itemName, category, isPinning, onConfirm });
  }

  async function pinTopic(topic: Topic, pin: boolean) {
    setTopics((prev) => prev.map((t) => t.id === topic.id ? { ...t, isPinnedToProfile: pin } : t));
    try {
      const h = await authHeaders();
      await fetch(`${getApiBase()}/api/knowledge/topics/${topic.id}/follow/pin`, {
        method: "PATCH",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: pin }),
      });
    } catch {
      setTopics((prev) => prev.map((t) => t.id === topic.id ? { ...t, isPinnedToProfile: !pin } : t));
    }
  }

  async function pinIssue(issue: Issue, pin: boolean) {
    setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, isPinnedToProfile: pin } : i));
    try {
      const h = await authHeaders();
      await fetch(`${getApiBase()}/api/knowledge/issues/${issue.id}/follow/pin`, {
        method: "PATCH",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: pin }),
      });
    } catch {
      setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, isPinnedToProfile: !pin } : i));
    }
  }

  async function saveDeliveryPrefs(updated: Partial<DeliveryPrefs>) {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    const next = { ...deliveryPrefs, ...updated };
    setDeliveryPrefs(next);
    setSavingPrefs(true);
    try {
      const h = await authHeaders();
      await fetch(`${getApiBase()}/api/knowledge/delivery-preferences`, {
        method: "PUT",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    } catch { /* silent */ } finally { setSavingPrefs(false); }
  }

  async function openArticle(article: FeedArticle) {
    if (article.tier === "premium" && !isPremium) {
      setUpgradeReason("Knowledge+ unlocks exclusive expert guides and premium articles.");
      setShowUpgrade(true);
      return;
    }
    const h = await authHeaders();
    if (Object.keys(h).length > 0) {
      fetch(`${getApiBase()}/api/knowledge/articles/${article.id}/read`, { method: "POST", headers: h }).catch(() => {});
    }
    setFeed((prev) => prev.map((a) => a.id === article.id ? { ...a, isRead: true } : a));
    setNewCount((c) => Math.max(0, c - (article.isRead ? 0 : 1)));
    router.push({ pathname: "/library-article", params: { articleId: article.id } } as never);
  }

  function openTopic(topic: Topic) {
    router.push({ pathname: "/library-topic", params: { topicId: topic.id } } as never);
  }

  function openExpert(expert: Expert) {
    router.push({ pathname: "/library-expert", params: { expertId: expert.id } } as never);
  }

  const hasFollows = followedTopics.length > 0;
  const unreadFeed = feed.filter((a) => !a.isRead);
  const readFeed = feed.filter((a) => a.isRead);

  return (
    <>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Knowledge</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                {hasFollows && isAuthenticated
                  ? `${followedTopics.length} topic${followedTopics.length !== 1 ? "s" : ""}${followingIssues.length > 0 ? ` · ${followingIssues.length} issue${followingIssues.length !== 1 ? "s" : ""}` : ""}${!isPremium ? ` · ${10 - followCount} free slots left` : ""}`
                  : "Your personalized learning library"}
              </Text>
            </View>
            {isPremium && (
              <View style={[styles.kPlusBadge, { backgroundColor: "#CA922B18" }]}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#CA922B" }}>K+</Text>
              </View>
            )}
          </View>

          {/* Tab switcher */}
          <View style={[styles.tabRow, { backgroundColor: colors.background }]}>
            {(["library", "browse", "issues"] as Tab[]).map((tab) => {
              const labels: Record<Tab, string> = {
                library: `My Library${newCount > 0 ? ` (${newCount})` : ""}`,
                browse: "Browse Topics",
                issues: `Issues${followingIssues.length > 0 ? ` · ${followingIssues.length}` : ""}`,
              };
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabTxt, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
                    {labels[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : activeTab === "library" ? (

          /* ── MY LIBRARY TAB ── */
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {!isAuthenticated ? (
              <View style={styles.signInPrompt}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>📚</Text>
                <Text style={[styles.promptTitle, { color: colors.foreground }]}>Sign in to build your library</Text>
                <Text style={[styles.promptSub, { color: colors.mutedForeground }]}>
                  Follow topics and get a personalized weekly reading list — no spam, just new articles waiting when you're ready.
                </Text>
                <TouchableOpacity
                  style={[styles.signInBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/login" as never)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signInTxt}>Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : !hasFollows ? (
              <View style={styles.signInPrompt}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>✦</Text>
                <Text style={[styles.promptTitle, { color: colors.foreground }]}>Start building your library</Text>
                <Text style={[styles.promptSub, { color: colors.mutedForeground }]}>
                  Follow topics you care about. Every week, new articles appear — waiting whenever you're ready to read.
                </Text>
                <TouchableOpacity
                  style={[styles.signInBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setActiveTab("browse")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signInTxt}>Browse Topics</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* KinfolkAI Digest Banner */}
                {digestText.length > 0 && (
                  <View style={[styles.digestCard, { backgroundColor: "#CA922B08", borderColor: "#CA922B30" }]}>
                    <View style={styles.digestRow}>
                      <Text style={{ fontSize: 18 }}>✦</Text>
                      <Text style={[styles.digestLabel, { color: "#CA922B" }]}>KinfolkAI Digest</Text>
                      <View style={[styles.digestBadge, { backgroundColor: "#CA922B18" }]}>
                        <Text style={{ fontSize: 10, fontWeight: "800", color: "#CA922B" }}>PERSONALIZED</Text>
                      </View>
                    </View>
                    <Text style={[styles.digestTxt, { color: colors.foreground }]}>{digestText}</Text>
                  </View>
                )}

                {/* Following pills */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Following</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll} contentContainerStyle={styles.pillRow}>
                    {followedTopics.map((topic) => {
                      const meta = CATEGORY_META[topic.category] ?? { emoji: "📖", color: "#6B7280", label: topic.category };
                      return (
                        <TouchableOpacity
                          key={topic.id}
                          style={[styles.followingPill, { backgroundColor: meta.color + "15", borderColor: meta.color + "40" }]}
                          onPress={() => openTopic(topic)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.pillName, { color: meta.color }]} numberOfLines={1}>
                            {meta.emoji} {topic.topicName.split("—")[0].trim()}
                          </Text>
                          {(topic.newCount ?? 0) > 0 && (
                            <View style={[styles.newBadge, { backgroundColor: meta.color }]}>
                              <Text style={styles.newBadgeTxt}>{topic.newCount}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                    {followingIssues.length > 0 && followingIssues.map((issue) => (
                      <TouchableOpacity
                        key={`issue-${issue.id}`}
                        style={[styles.followingPill, { backgroundColor: "#3B82F615", borderColor: "#3B82F640" }]}
                        onPress={() => setActiveTab("issues")}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.pillName, { color: "#3B82F6" }]} numberOfLines={1}>
                          📌 {issue.name.split(" ").slice(0, 3).join(" ")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.followingPill, { backgroundColor: colors.card, borderColor: colors.border, borderStyle: "dashed" }]}
                      onPress={() => setActiveTab("browse")}
                      activeOpacity={0.75}
                    >
                      <Feather name="plus" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.pillName, { color: colors.mutedForeground }]}>Add topic</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {/* Smart Delivery Preferences */}
                <View style={[styles.section]}>
                  <View style={styles.sectionRow}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Smart Delivery</Text>
                    {savingPrefs && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />}
                  </View>
                  <Text style={[styles.deliverySub, { color: colors.mutedForeground }]}>
                    Instead of multiple notifications, KinfolkAI batches your topics into one smart summary.
                  </Text>

                  {/* Digest mode */}
                  <Text style={[styles.prefLabel, { color: colors.foreground }]}>Notification Frequency</Text>
                  <View style={styles.prefRow}>
                    {DIGEST_MODES.map((mode) => {
                      const active = deliveryPrefs.digestMode === mode.id;
                      return (
                        <TouchableOpacity
                          key={mode.id}
                          style={[
                            styles.prefChip,
                            { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "15" : colors.card },
                          ]}
                          onPress={() => saveDeliveryPrefs({ digestMode: mode.id })}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.prefChipTitle, { color: active ? colors.primary : colors.foreground }]}>{mode.label}</Text>
                          <Text style={[styles.prefChipDesc, { color: colors.mutedForeground }]}>{mode.desc}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Scope */}
                  <Text style={[styles.prefLabel, { color: colors.foreground }]}>Content Scope</Text>
                  <View style={styles.scopeRow}>
                    {SCOPE_MODES.map((s) => {
                      const active = deliveryPrefs.scope === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.scopeChip,
                            { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "15" : colors.card },
                          ]}
                          onPress={() => saveDeliveryPrefs({ scope: s.id })}
                          activeOpacity={0.8}
                        >
                          <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
                          <Text style={[styles.scopeLabel, { color: active ? colors.primary : colors.foreground }]}>{s.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Toggles */}
                  <View style={[styles.prefToggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prefToggleTitle, { color: colors.foreground }]}>Notify from saved cities</Text>
                      <Text style={[styles.prefToggleDesc, { color: colors.mutedForeground }]}>Include news from cities you've saved</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.toggle,
                        { backgroundColor: deliveryPrefs.includeSavedCities ? colors.primary : colors.border },
                      ]}
                      onPress={() => saveDeliveryPrefs({ includeSavedCities: !deliveryPrefs.includeSavedCities })}
                    >
                      <View style={[styles.toggleKnob, { left: deliveryPrefs.includeSavedCities ? 18 : 2 }]} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.prefToggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prefToggleTitle, { color: colors.foreground }]}>Notify from saved businesses</Text>
                      <Text style={[styles.prefToggleDesc, { color: colors.mutedForeground }]}>Updates from Black-owned businesses you've saved</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.toggle,
                        { backgroundColor: deliveryPrefs.includeSavedBusinesses ? colors.primary : colors.border },
                      ]}
                      onPress={() => saveDeliveryPrefs({ includeSavedBusinesses: !deliveryPrefs.includeSavedBusinesses })}
                    >
                      <View style={[styles.toggleKnob, { left: deliveryPrefs.includeSavedBusinesses ? 18 : 2 }]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New This Week */}
                {feedLoading ? (
                  <View style={styles.sectionLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : unreadFeed.length > 0 ? (
                  <View style={styles.section}>
                    <View style={styles.sectionRow}>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>New This Week</Text>
                      <View style={[styles.countBadge, { backgroundColor: "#CA922B18" }]}>
                        <Text style={[styles.countBadgeTxt, { color: "#CA922B" }]}>{unreadFeed.length}</Text>
                      </View>
                    </View>
                    {unreadFeed.map((article) => {
                      const meta = CATEGORY_META[article.category] ?? { emoji: "📖", color: "#6B7280", label: article.category };
                      return (
                        <TouchableOpacity
                          key={article.id}
                          style={[styles.feedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                          onPress={() => openArticle(article)}
                          activeOpacity={0.75}
                        >
                          <View style={styles.feedCardTop}>
                            <View style={[styles.catDot, { backgroundColor: meta.color }]} />
                            <Text style={[styles.catLabel, { color: meta.color }]}>{meta.label}</Text>
                            {article.tier === "premium" && (
                              <View style={[styles.kPillSmall, { backgroundColor: "#CA922B18" }]}>
                                <Text style={[styles.kPillTxt, { color: "#CA922B" }]}>K+</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.feedTitle, { color: colors.foreground }]} numberOfLines={2}>
                            {article.title}
                          </Text>
                          <Text style={[styles.feedSummary, { color: colors.mutedForeground }]} numberOfLines={2}>
                            {article.summary}
                          </Text>
                          <View style={styles.feedMeta}>
                            <Text style={[styles.feedMetaTxt, { color: colors.mutedForeground }]}>{article.authorName}</Text>
                            <Text style={[styles.feedMetaTxt, { color: colors.mutedForeground }]}>{article.readTimeMinutes ?? 4} min read</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>New This Week</Text>
                    <View style={[styles.emptyFeed, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.emptyFeedTxt, { color: colors.mutedForeground }]}>
                        No new articles this week yet. Check back Monday — your library updates weekly.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Already read */}
                {readFeed.length > 0 && (
                  <View style={[styles.section, { opacity: 0.7 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Already Read</Text>
                    {readFeed.map((article) => {
                      const meta = CATEGORY_META[article.category] ?? { emoji: "📖", color: "#6B7280", label: article.category };
                      return (
                        <TouchableOpacity
                          key={article.id}
                          style={[styles.feedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                          onPress={() => openArticle(article)}
                          activeOpacity={0.75}
                        >
                          <View style={styles.feedCardTop}>
                            <View style={[styles.catDot, { backgroundColor: meta.color }]} />
                            <Text style={[styles.catLabel, { color: meta.color }]}>{meta.label}</Text>
                          </View>
                          <Text style={[styles.feedTitle, { color: colors.foreground }]} numberOfLines={1}>
                            {article.title}
                          </Text>
                          <Text style={[styles.feedMetaTxt, { color: colors.mutedForeground }]}>
                            {article.readTimeMinutes ?? 4} min read
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Experts */}
                <View style={[styles.section, { marginBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }]}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community Experts</Text>
                  {experts.map((expert) => (
                    <TouchableOpacity
                      key={expert.id}
                      style={[styles.expertCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => openExpert(expert)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.expertAvatar, { backgroundColor: "#CA922B18" }]}>
                        <Text style={{ fontSize: 20 }}>👤</Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.expertName, { color: colors.foreground }]} numberOfLines={1}>
                          {expert.displayName}
                        </Text>
                        <Text style={[styles.expertBadge, { color: "#16A34A" }]}>{expert.badge}</Text>
                        <Text style={[styles.expertSpecialty, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {expert.specialty}
                        </Text>
                        <Text style={[styles.expertStats, { color: colors.mutedForeground }]}>
                          {expert.followCount ?? 0} followers · {expert.articleCount ?? 0} articles
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

        ) : activeTab === "issues" ? (

          /* ── ISSUES TAB ── */
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <View style={[styles.issueHeader, { backgroundColor: "#3B82F608", borderColor: "#3B82F620" }]}>
              <Text style={{ fontSize: 24 }}>📌</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.issueHeaderTitle, { color: colors.foreground }]}>Follow an Issue</Text>
                <Text style={[styles.issueHeaderDesc, { color: colors.mutedForeground }]}>
                  Track ongoing policy debates and social issues. Get notified only when meaningful developments happen — not every headline.
                </Text>
              </View>
            </View>

            {!isAuthenticated && (
              <View style={styles.signInPrompt}>
                <Text style={[styles.promptTitle, { color: colors.foreground }]}>Sign in to follow issues</Text>
                <TouchableOpacity style={[styles.signInBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/login" as never)}>
                  <Text style={styles.signInTxt}>Sign In</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Search */}
            <View style={[styles.browseSearch, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={15} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search issues…"
                placeholderTextColor={colors.mutedForeground}
                value={issueSearch}
                onChangeText={setIssueSearch}
              />
              {issueSearch.length > 0 && (
                <TouchableOpacity onPress={() => setIssueSearch("")}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {followingIssues.length > 0 && !issueSearch && (
              <View style={styles.section}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Following</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#3B82F610", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "#3B82F630" }}>
                    <Feather name="lock" size={10} color="#3B82F6" />
                    <Text style={{ fontSize: 10, color: "#3B82F6", fontWeight: "600" }}>Private by default</Text>
                  </View>
                </View>
                {followingIssues.map((issue) => (
                  <View key={issue.id} style={[styles.issueRow, { backgroundColor: colors.card, borderColor: issue.isPinnedToProfile ? "#3B82F650" : "#3B82F620" }]}>
                    <View style={styles.issueRowLeft}>
                      <View style={[styles.issueIcon, { backgroundColor: "#3B82F615" }]}>
                        <Text style={{ fontSize: 18 }}>{issue.isPinnedToProfile ? "📌" : "🔒"}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.topicName, { color: colors.foreground }]} numberOfLines={2}>{issue.name}</Text>
                        <Text style={[styles.topicCategory, { color: issue.isPinnedToProfile ? "#3B82F6" : colors.mutedForeground }]}>
                          {issue.isPinnedToProfile ? "Pinned to profile" : "Private · tap 📌 to pin"}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity
                        style={[styles.followToggle, { backgroundColor: "transparent", borderColor: issue.isPinnedToProfile ? "#3B82F6" : colors.border, paddingHorizontal: 8 }]}
                        onPress={() => {
                          const pin = !issue.isPinnedToProfile;
                          openPinModal(
                            issue.name,
                            issue.category ?? "government",
                            pin,
                            async () => pinIssue(issue, pin),
                          );
                        }}
                        activeOpacity={0.75}
                      >
                        <Feather name={issue.isPinnedToProfile ? "map-pin" : "lock"} size={13} color={issue.isPinnedToProfile ? "#3B82F6" : colors.mutedForeground} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.followToggle, { backgroundColor: "#3B82F6", borderColor: "#3B82F6" }]}
                        onPress={() => toggleIssueFollow(issue)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.followToggleTxt}>Following</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.section, { marginBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {issueSearch ? "Search Results" : followingIssues.length > 0 ? "More Issues" : "All Issues"}
              </Text>
              {filteredIssues.filter((i) => !i.isFollowing || !!issueSearch).length === 0 ? (
                <View style={[styles.emptyFeed, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.emptyFeedTxt, { color: colors.mutedForeground }]}>
                    {issues.length === 0 ? "Issues are being loaded. Check back soon." : "No matching issues found."}
                  </Text>
                </View>
              ) : (
                filteredIssues.filter((i) => !i.isFollowing || !!issueSearch).map((issue) => (
                  <View key={issue.id} style={[styles.issueRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.issueRowLeft}>
                      <View style={[styles.issueIcon, { backgroundColor: colors.background }]}>
                        <Text style={{ fontSize: 18 }}>📰</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.topicName, { color: colors.foreground }]} numberOfLines={2}>{issue.name}</Text>
                        {issue.description && (
                          <Text style={[styles.topicCategory, { color: colors.mutedForeground }]} numberOfLines={2}>{issue.description}</Text>
                        )}
                      </View>
                    </View>
                    {isAuthenticated && (
                      <TouchableOpacity
                        style={[styles.followToggle, { backgroundColor: "transparent", borderColor: "#3B82F6" }]}
                        onPress={() => toggleIssueFollow(issue)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.followToggleTxt, { color: "#3B82F6" }]}>Follow</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          </ScrollView>

        ) : (

          /* ── BROWSE TOPICS TAB ── */
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Search */}
            <View style={[styles.browseSearch, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={15} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search topics…"
                placeholderTextColor={colors.mutedForeground}
                value={topicSearch}
                onChangeText={setTopicSearch}
              />
              {topicSearch.length > 0 && (
                <TouchableOpacity onPress={() => setTopicSearch("")}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {/* Free limit notice */}
            {!isPremium && isAuthenticated && (
              <TouchableOpacity
                style={[styles.limitBanner, { backgroundColor: "#CA922B08", borderColor: "#CA922B25" }]}
                onPress={() => { setUpgradeReason("Upgrade to Knowledge+ to follow unlimited topics."); setShowUpgrade(true); }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.limitTitle, { color: "#CA922B" }]}>
                    {followCount}/10 topics followed
                  </Text>
                  <Text style={[styles.limitSub, { color: colors.mutedForeground }]}>
                    Upgrade to Knowledge+ for unlimited topic follows
                  </Text>
                </View>
                <Feather name="chevron-right" size={15} color="#CA922B" />
              </TouchableOpacity>
            )}

            {/* Following section */}
            {followedTopics.length > 0 && (
              <View style={styles.section}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Following</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.card, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.border }}>
                    <Feather name="lock" size={10} color={colors.mutedForeground} />
                    <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600" }}>Private by default</Text>
                  </View>
                </View>
                {followedTopics.map((topic) => {
                  const meta = CATEGORY_META[topic.category] ?? { emoji: "📖", color: "#6B7280", label: topic.category };
                  const sensitive = isSensitiveCategory(topic.category);
                  return (
                    <View key={topic.id} style={[styles.topicRow, { backgroundColor: colors.card, borderColor: topic.isPinnedToProfile ? meta.color + "50" : colors.border }]}>
                      <TouchableOpacity style={styles.topicRowLeft} onPress={() => openTopic(topic)} activeOpacity={0.75}>
                        <View style={[styles.topicEmoji, { backgroundColor: meta.color + "18" }]}>
                          <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.topicName, { color: colors.foreground }]} numberOfLines={2}>
                            {topic.topicName}
                          </Text>
                          <Text style={[styles.topicCategory, { color: topic.isPinnedToProfile ? meta.color : colors.mutedForeground }]}>
                            {topic.isPinnedToProfile ? "Pinned to profile" : sensitive ? "🔒 Private · health info" : "🔒 Private · tap to pin"}
                          </Text>
                        </View>
                        {(topic.newCount ?? 0) > 0 && (
                          <View style={[styles.newBadge, { backgroundColor: meta.color }]}>
                            <Text style={styles.newBadgeTxt}>{topic.newCount} new</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <TouchableOpacity
                          style={[styles.followToggle, { backgroundColor: "transparent", borderColor: topic.isPinnedToProfile ? meta.color : colors.border, paddingHorizontal: 8 }]}
                          onPress={() => {
                            const pin = !topic.isPinnedToProfile;
                            openPinModal(
                              topic.topicName,
                              topic.category,
                              pin,
                              async () => pinTopic(topic, pin),
                            );
                          }}
                          activeOpacity={0.75}
                        >
                          <Feather name={topic.isPinnedToProfile ? "map-pin" : "lock"} size={13} color={topic.isPinnedToProfile ? meta.color : colors.mutedForeground} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.followToggle, { backgroundColor: meta.color, borderColor: meta.color }]}
                          onPress={() => toggleFollow(topic)}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.followToggleTxt}>Following</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* All / undiscovered topics */}
            <View style={[styles.section, { marginBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {followedTopics.length > 0 ? "Discover More" : "All Topics"}
              </Text>
              {(topicSearch ? filteredTopics : unfollowedTopics).map((topic) => {
                const meta = CATEGORY_META[topic.category] ?? { emoji: "📖", color: "#6B7280", label: topic.category };
                return (
                  <View key={topic.id} style={[styles.topicRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity style={styles.topicRowLeft} onPress={() => openTopic(topic)} activeOpacity={0.75}>
                      <View style={[styles.topicEmoji, { backgroundColor: meta.color + "18" }]}>
                        <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.topicName, { color: colors.foreground }]} numberOfLines={2}>
                          {topic.topicName}
                        </Text>
                        <Text style={[styles.topicCategory, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.followToggle, { backgroundColor: "transparent", borderColor: meta.color }]}
                      onPress={() => toggleFollow(topic)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.followToggleTxt, { color: meta.color }]}>Follow</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="Knowledge+"
        reason={upgradeReason || "Knowledge+ unlocks unlimited topic follows, exclusive expert guides, and AI-powered learning."}
      />

      <PrivacyPinModal
        visible={pinModal.visible}
        onClose={() => setPinModal((m) => ({ ...m, visible: false }))}
        onConfirm={async () => {
          setPinModal((m) => ({ ...m, visible: false }));
          await pinModal.onConfirm();
        }}
        itemName={pinModal.itemName}
        category={pinModal.category}
        isPinning={pinModal.isPinning}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 0, gap: 10 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  headerSub: { fontSize: 12, marginTop: 1 },
  kPlusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tabRow: { flexDirection: "row", borderTopWidth: 0 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabTxt: { fontSize: 12, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 14, paddingTop: 18, gap: 10 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  sectionLoading: { paddingVertical: 24, alignItems: "center" },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countBadgeTxt: { fontSize: 12, fontWeight: "800" },
  pillScroll: { marginTop: 4 },
  pillRow: { flexDirection: "row", gap: 8, paddingRight: 16 },
  followingPill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, maxWidth: 180 },
  pillName: { fontSize: 13, fontWeight: "700" },
  newBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  newBadgeTxt: { fontSize: 11, fontWeight: "800", color: "#fff" },
  signInPrompt: { margin: 24, padding: 24, alignItems: "center", gap: 8 },
  promptTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  promptSub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  signInBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  signInTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  feedCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  feedCardTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  catDot: { width: 7, height: 7, borderRadius: 4 },
  catLabel: { fontSize: 11, fontWeight: "700" },
  kPillSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  kPillTxt: { fontSize: 10, fontWeight: "800" },
  feedTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  feedSummary: { fontSize: 13, lineHeight: 18 },
  feedMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  feedMetaTxt: { fontSize: 11 },
  emptyFeed: { borderRadius: 12, borderWidth: 1, padding: 18 },
  emptyFeedTxt: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  browseSearch: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, margin: 14 },
  searchInput: { flex: 1, fontSize: 14 },
  limitBanner: { marginHorizontal: 14, marginBottom: 4, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  limitTitle: { fontSize: 13, fontWeight: "700" },
  limitSub: { fontSize: 11, lineHeight: 16, marginTop: 1 },
  topicRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  topicRowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  topicEmoji: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  topicName: { fontSize: 13, fontWeight: "700", lineHeight: 18 },
  topicCategory: { fontSize: 11, fontWeight: "600", marginTop: 1 },
  followToggle: { borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 5 },
  followToggleTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
  expertCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  expertAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  expertName: { fontSize: 14, fontWeight: "700" },
  expertBadge: { fontSize: 11, fontWeight: "700" },
  expertSpecialty: { fontSize: 12 },
  expertStats: { fontSize: 11, marginTop: 1 },
  digestCard: { margin: 14, borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  digestRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  digestLabel: { fontSize: 13, fontWeight: "800", flex: 1 },
  digestBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  digestTxt: { fontSize: 14, lineHeight: 21 },
  deliverySub: { fontSize: 12, lineHeight: 18 },
  prefLabel: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  prefRow: { gap: 8 },
  prefChip: { borderWidth: 1.5, borderRadius: 12, padding: 10, gap: 2 },
  prefChipTitle: { fontSize: 13, fontWeight: "700" },
  prefChipDesc: { fontSize: 11 },
  scopeRow: { flexDirection: "row", gap: 8 },
  scopeChip: { flex: 1, borderWidth: 1.5, borderRadius: 10, padding: 8, alignItems: "center", gap: 3 },
  scopeLabel: { fontSize: 11, fontWeight: "700" },
  prefToggleRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  prefToggleTitle: { fontSize: 13, fontWeight: "700" },
  prefToggleDesc: { fontSize: 11, marginTop: 1 },
  toggle: { width: 40, height: 24, borderRadius: 12, justifyContent: "center" },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", position: "absolute" },
  issueHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, margin: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  issueHeaderTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  issueHeaderDesc: { fontSize: 12, lineHeight: 18 },
  issueRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  issueRowLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  issueIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
