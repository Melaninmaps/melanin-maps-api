import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
import { useSearchHistory } from "@/hooks/useSearchHistory";

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

interface HappeningNowStory {
  id: string;
  title: string;
  summary: string;
  category: string;
  sourceUrl?: string | null;
  submittedBy?: string | null;
  submitterName?: string | null;
  status: string;
  confirmCount: number;
  isAdminPost: boolean;
  hasConfirmed?: boolean;
  isOwnStory?: boolean;
  createdAt: string;
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

type Tab = "library" | "browse" | "happeningNow";

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
  const [stories, setStories] = useState<HappeningNowStory[]>([]);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitSummary, setSubmitSummary] = useState("");
  const [submitCategory, setSubmitCategory] = useState("other");
  const [submitSourceUrl, setSubmitSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
  const [storySearch, setStorySearch] = useState("");
  const [topicSearch, setTopicSearch] = useState("");
  const [addingTopic, setAddingTopic] = useState(false);
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

      const [topicsRes, expertsRes, storiesRes] = await Promise.all([
        fetch(`${getApiBase()}/api/knowledge/topics`, { headers: h }),
        fetch(`${getApiBase()}/api/knowledge/experts`),
        fetch(`${getApiBase()}/api/knowledge/happening-now`, { headers: h }),
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
      if (storiesRes.ok) {
        const data = await storiesRes.json() as { stories: HappeningNowStory[] };
        setStories(data.stories);
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

  const { history: topicSearchHistory, add: addTopicHistory } = useSearchHistory("topic");

  const followedTopics = useMemo(() => topics.filter((t) => t.isFollowing), [topics]);
  const unfollowedTopics = useMemo(() => topics.filter((t) => !t.isFollowing), [topics]);

  const recentTopicCategories = useMemo(
    () => [...new Set(topicSearchHistory.flatMap((h) => h.categories))].slice(0, 5),
    [topicSearchHistory],
  );

  const filteredTopics = useMemo(() => {
    const q = topicSearch.toLowerCase();
    const base = q
      ? topics.filter((t) => t.topicName.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
      : topics;
    if (!q && recentTopicCategories.length > 0) {
      return [...base].sort((a, b) => {
        const aRecent = recentTopicCategories.includes(a.category) ? 0 : 1;
        const bRecent = recentTopicCategories.includes(b.category) ? 0 : 1;
        return aRecent - bRecent;
      });
    }
    return base;
  }, [topics, topicSearch, recentTopicCategories]);

  const filteredStories = useMemo(() => {
    const q = storySearch.toLowerCase();
    return q
      ? stories.filter((s) => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q))
      : stories;
  }, [stories, storySearch]);

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

  async function confirmStory(story: HappeningNowStory) {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    if (story.isOwnStory) return;
    const wasConfirmed = story.hasConfirmed ?? false;
    const delta = wasConfirmed ? -1 : 1;
    setStories((prev) => prev.map((s) => s.id === story.id
      ? { ...s, hasConfirmed: !wasConfirmed, confirmCount: s.confirmCount + delta }
      : s));
    try {
      const h = await authHeaders();
      await fetch(`${getApiBase()}/api/knowledge/happening-now/${story.id}/confirm`, { method: "POST", headers: h });
    } catch {
      setStories((prev) => prev.map((s) => s.id === story.id
        ? { ...s, hasConfirmed: wasConfirmed, confirmCount: s.confirmCount - delta }
        : s));
    }
  }

  async function submitStory() {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    if (!submitTitle.trim() || !submitSummary.trim()) return;
    setSubmitting(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/knowledge/happening-now`, {
        method: "POST",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ title: submitTitle.trim(), summary: submitSummary.trim(), category: submitCategory, sourceUrl: submitSourceUrl.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json() as { story: HappeningNowStory };
        setStories((prev) => [{ ...data.story, isOwnStory: true, hasConfirmed: false }, ...prev]);
        setSubmitModalVisible(false);
        setSubmitTitle(""); setSubmitSummary(""); setSubmitCategory("other"); setSubmitSourceUrl("");
      }
    } catch { /* silent */ } finally { setSubmitting(false); }
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
    void addTopicHistory(topic.topicName, [topic.category]);
    router.push({ pathname: "/library-topic", params: { topicId: topic.id } } as never);
  }

  function openExpert(expert: Expert) {
    router.push({ pathname: "/library-expert", params: { expertId: expert.id } } as never);
  }

  async function handleAddTopic(name: string) {
    if (!name.trim()) return;
    if (!isAuthenticated) { router.push("/login" as never); return; }
    setAddingTopic(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/knowledge/topics/search-or-create`, {
        method: "POST",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.status === 403) {
        setUpgradeReason("Upgrade to Knowledge+ to save unlimited topics.");
        setShowUpgrade(true);
        return;
      }
      if (res.ok) {
        const data = await res.json() as { topic: Topic; created: boolean };
        setTopics((prev) => {
          if (prev.find((t) => t.id === data.topic.id)) {
            return prev.map((t) => t.id === data.topic.id ? { ...t, isFollowing: true } : t);
          }
          return [...prev, { ...data.topic, isFollowing: true, newCount: 0 }];
        });
        setFollowCount((c) => c + 1);
        setTopicSearch("");
        router.push({ pathname: "/library-topic", params: { topicId: data.topic.id } } as never);
      }
    } catch { /* silent */ } finally { setAddingTopic(false); }
  }

  const hasExactTopicMatch = useMemo(() => {
    if (!topicSearch.trim()) return true;
    return topics.some((t) => t.topicName.toLowerCase() === topicSearch.trim().toLowerCase());
  }, [topics, topicSearch]);

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
                  ? `${followedTopics.length} topic${followedTopics.length !== 1 ? "s" : ""}${!isPremium ? ` · ${10 - followCount} free slots left` : ""}`
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
            {(["library", "browse", "happeningNow"] as Tab[]).map((tab) => {
              const pendingCount = stories.filter((s) => s.status === "pending").length;
              const labels: Record<Tab, string> = {
                library: `My Library${newCount > 0 ? ` (${newCount})` : ""}`,
                browse: "Browse Topics",
                happeningNow: `Happening Now${pendingCount > 0 ? ` · ${pendingCount}` : ""}`,
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
                    {stories.filter((s) => s.status === "approved").length > 0 && (
                      <TouchableOpacity
                        style={[styles.followingPill, { backgroundColor: "#DC262615", borderColor: "#DC262640" }]}
                        onPress={() => setActiveTab("happeningNow")}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.pillName, { color: "#DC2626" }]} numberOfLines={1}>
                          🚨 {stories.filter((s) => s.status === "approved").length} Happening Now
                        </Text>
                      </TouchableOpacity>
                    )}
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
                    <TouchableOpacity activeOpacity={0.85}
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
                      <Text style={[styles.prefToggleDesc, { color: colors.mutedForeground }]}>Updates from minority-owned businesses you've saved</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.85}
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

                {/* Explore Community Resources */}
                <View style={[styles.section, { paddingHorizontal: 20 }]}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Explore Community Resources</Text>
                  <Text style={[styles.deliverySub, { color: colors.mutedForeground, marginBottom: 12 }]}>
                    Tools built for every part of your life — work, travel, home, and safety.
                  </Text>
                  {[
                    { emoji: "🛡️", title: "Safety Hub", desc: "Neighborhood safety intel & community reports", route: "/safety-hub", color: "#DC2626" },
                    { emoji: "❤️", title: "Health Hub", desc: "Curated health resources for the community", route: "/health-hub", color: "#DB2777" },
                    { emoji: "🏠", title: "Relocation Concierge", desc: "AI-guided move with minority-owned vendors", route: "/relocation-planner", color: "#2D7A4F" },
                    { emoji: "✈️", title: "KinfolkAI Travel", desc: "Plan culturally-informed trips with AI", route: "/travel", color: "#CA922B" },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.route}
                      style={[styles.resourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => router.push(item.route as never)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.resourceIcon, { backgroundColor: item.color + "15" }]}>
                        <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.resourceTitle, { color: colors.foreground }]}>{item.title}</Text>
                        <Text style={[styles.resourceDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                      </View>
                      <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                </View>

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

        ) : activeTab === "happeningNow" ? (

          /* ── HAPPENING NOW TAB ── */
          <>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
              {/* Header */}
              <View style={[styles.issueHeader, { backgroundColor: "#DC262608", borderColor: "#DC262620" }]}>
                <Text style={{ fontSize: 24 }}>🚨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.issueHeaderTitle, { color: colors.foreground }]}>Happening Now</Text>
                  <Text style={[styles.issueHeaderDesc, { color: colors.mutedForeground }]}>
                    Major incidents & stories impacting our communities — ICE raids, police encounters, violence against minorities, legislation, and more.
                  </Text>
                </View>
              </View>

              {/* Report a Story CTA */}
              <TouchableOpacity
                style={[styles.reportBtn, { borderColor: "#DC262440", backgroundColor: "#DC262408" }]}
                onPress={() => { if (!isAuthenticated) { router.push("/login" as never); return; } setSubmitModalVisible(true); }}
                activeOpacity={0.8}
              >
                <Feather name="plus-circle" size={16} color="#DC2626" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reportBtnTxt, { color: "#DC2626" }]}>Report a Story</Text>
                  <Text style={[styles.reportBtnSub, { color: colors.mutedForeground }]}>Reviewed by our team before going live</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#DC2626" />
              </TouchableOpacity>

              {/* Search */}
              <View style={[styles.browseSearch, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="search" size={15} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Search stories…"
                  placeholderTextColor={colors.mutedForeground}
                  value={storySearch}
                  onChangeText={setStorySearch}
                />
                {storySearch.length > 0 && (
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setStorySearch("")}>
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Stories */}
              <View style={[styles.section, { marginBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }]}>
                {filteredStories.length === 0 ? (
                  <View style={[styles.emptyFeed, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={{ fontSize: 28, marginBottom: 8, textAlign: "center" }}>📡</Text>
                    <Text style={[styles.emptyFeedTxt, { color: colors.mutedForeground }]}>
                      {stories.length === 0
                        ? "No stories yet. Tap \"Report a Story\" to share something happening in your community."
                        : "No matching stories found."}
                    </Text>
                  </View>
                ) : (
                  filteredStories.map((story) => {
                    const CAT_META: Record<string, { emoji: string; color: string; label: string }> = {
                      immigration: { emoji: "🛂", color: "#DC2626", label: "Immigration / ICE" },
                      police:      { emoji: "🚔", color: "#1D4ED8", label: "Police" },
                      violence:    { emoji: "⚠️",  color: "#D97706", label: "Violence" },
                      legislation: { emoji: "⚖️",  color: "#7C3AED", label: "Legislation" },
                      community:   { emoji: "✊🏾", color: "#059669", label: "Community" },
                      other:       { emoji: "📰", color: "#6B7280", label: "Other" },
                    };
                    const cat = CAT_META[story.category] ?? CAT_META.other;
                    const diffMs = Date.now() - new Date(story.createdAt).getTime();
                    const diffH = Math.floor(diffMs / 3600000);
                    const timeLabel = diffH < 1 ? "Just now" : diffH < 24 ? `${diffH}h ago` : `${Math.floor(diffH / 24)}d ago`;
                    return (
                      <View
                        key={story.id}
                        style={[styles.storyCard, {
                          backgroundColor: colors.card,
                          borderColor: story.status === "pending" ? "#D9770640" : colors.border,
                        }]}
                      >
                        {/* Badge row */}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                          <View style={[styles.catBadge, { backgroundColor: cat.color + "15", borderColor: cat.color + "40" }]}>
                            <Text style={{ fontSize: 11, color: cat.color, fontWeight: "700" }}>{cat.emoji} {cat.label}</Text>
                          </View>
                          {story.isAdminPost && (
                            <View style={[styles.catBadge, { backgroundColor: "#CA922B15", borderColor: "#CA922B40" }]}>
                              <Text style={{ fontSize: 11, color: "#CA922B", fontWeight: "700" }}>✦ MWM Verified</Text>
                            </View>
                          )}
                          {story.status === "pending" && (
                            <View style={[styles.catBadge, { backgroundColor: "#D9770615", borderColor: "#D9770640" }]}>
                              <Text style={{ fontSize: 11, color: "#D97706", fontWeight: "700" }}>⏳ Under Review</Text>
                            </View>
                          )}
                        </View>

                        {/* Title */}
                        <Text style={[styles.storyTitle, { color: colors.foreground }]}>{story.title}</Text>

                        {/* Summary */}
                        <Text style={[styles.storySummary, { color: colors.mutedForeground }]} numberOfLines={4}>{story.summary}</Text>

                        {/* Source link */}
                        {!!story.sourceUrl && (
                          <TouchableOpacity onPress={() => Linking.openURL(story.sourceUrl!)} activeOpacity={0.7} style={{ marginTop: 6 }}>
                            <Text style={{ fontSize: 12, color: colors.primary, textDecorationLine: "underline" }} numberOfLines={1}>
                              🔗 View source
                            </Text>
                          </TouchableOpacity>
                        )}

                        {/* Footer */}
                        <View style={styles.storyFooter}>
                          <Text style={[styles.storyMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {story.isAdminPost ? "MWM Community" : (story.submitterName ?? "Community Member")} · {timeLabel}
                          </Text>
                          {story.isOwnStory ? (
                            <View style={[styles.confirmBtn, { borderColor: colors.border }]}>
                              <Feather name="user" size={12} color={colors.mutedForeground} />
                              <Text style={[styles.confirmBtnTxt, { color: colors.mutedForeground }]}>Your story</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={[styles.confirmBtn, {
                                backgroundColor: story.hasConfirmed ? "#05966918" : "transparent",
                                borderColor: story.hasConfirmed ? "#059669" : colors.border,
                              }]}
                              onPress={() => confirmStory(story)}
                              activeOpacity={0.8}
                            >
                              <Feather name="check-circle" size={13} color={story.hasConfirmed ? "#059669" : colors.mutedForeground} />
                              <Text style={[styles.confirmBtnTxt, { color: story.hasConfirmed ? "#059669" : colors.mutedForeground }]}>
                                {story.confirmCount > 0 ? `${story.confirmCount} ` : ""}{story.hasConfirmed ? "Confirmed" : "Confirm"}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>

            {/* Submit Story Sheet */}
            {submitModalVisible && (
              <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
                <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.foreground }]}>🚨 Report a Story</Text>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => setSubmitModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Feather name="x" size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                    Your submission will be reviewed by our team before appearing publicly.
                  </Text>

                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Headline *</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                    placeholder="What is happening?"
                    placeholderTextColor={colors.mutedForeground}
                    value={submitTitle}
                    onChangeText={setSubmitTitle}
                    maxLength={200}
                  />

                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Details *</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, height: 90, textAlignVertical: "top" }]}
                    placeholder="Describe what is happening, who it impacts, and where…"
                    placeholderTextColor={colors.mutedForeground}
                    value={submitSummary}
                    onChangeText={setSubmitSummary}
                    multiline
                    numberOfLines={4}
                  />

                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Category</Text>
                  <View style={styles.catPicker}>
                    {(["immigration", "police", "violence", "legislation", "community", "other"] as const).map((c) => {
                      const chipLabels: Record<string, string> = {
                        immigration: "🛂 Immigration", police: "🚔 Police",
                        violence: "⚠️ Violence", legislation: "⚖️ Legislation",
                        community: "✊🏾 Community", other: "📰 Other",
                      };
                      const active = submitCategory === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          style={[styles.catPickerChip, {
                            borderColor: active ? "#DC2626" : colors.border,
                            backgroundColor: active ? "#DC262615" : colors.background,
                          }]}
                          onPress={() => setSubmitCategory(c)}
                          activeOpacity={0.8}
                        >
                          <Text style={{ fontSize: 12, color: active ? "#DC2626" : colors.mutedForeground, fontWeight: active ? "700" : "400" }}>
                            {chipLabels[c]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Source URL (optional)</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                    placeholder="https://…"
                    placeholderTextColor={colors.mutedForeground}
                    value={submitSourceUrl}
                    onChangeText={setSubmitSourceUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                    <TouchableOpacity
                      style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                      onPress={() => setSubmitModalVisible(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: colors.mutedForeground, fontWeight: "600", fontSize: 14 }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalSubmitBtn, {
                        backgroundColor: submitTitle.trim() && submitSummary.trim() && !submitting ? "#DC2626" : colors.mutedForeground + "50",
                        flex: 1,
                      }]}
                      onPress={submitStory}
                      disabled={!submitTitle.trim() || !submitSummary.trim() || submitting}
                      activeOpacity={0.8}
                    >
                      {submitting
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Submit for Review</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </>

        ) : (

          /* ── BROWSE TOPICS TAB ── */
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Hero prompt */}
            <View style={[styles.browseHero, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 22, marginBottom: 4 }}>🔍</Text>
              <Text style={[styles.browseHeroTitle, { color: colors.foreground }]}>Save Any Interest</Text>
              <Text style={[styles.browseHeroSub, { color: colors.mutedForeground }]}>
                Search a city, country, medical topic, hobby, cultural interest — anything. We'll find community posts, businesses, and resources that match.
              </Text>
            </View>

            {/* Search / Add bar */}
            <View style={styles.browseSearchWrap}>
              <View style={[styles.browseSearch, { backgroundColor: colors.card, borderColor: topicSearch.trim() ? colors.primary : colors.border }]}>
                <Feather name="search" size={15} color={topicSearch.trim() ? colors.primary : colors.mutedForeground} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Try: Atlanta, diabetes, vintage cars, Nigeria…"
                  placeholderTextColor={colors.mutedForeground}
                  value={topicSearch}
                  onChangeText={setTopicSearch}
                  returnKeyType="done"
                  onSubmitEditing={() => { if (topicSearch.trim()) handleAddTopic(topicSearch); }}
                />
                {topicSearch.length > 0 && (
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setTopicSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Add topic button — appears when search term has no exact match */}
              {topicSearch.trim().length >= 2 && !hasExactTopicMatch && (
                <TouchableOpacity
                  style={[styles.addTopicBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleAddTopic(topicSearch)}
                  disabled={addingTopic}
                  activeOpacity={0.85}
                >
                  {addingTopic
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Feather name="plus" size={15} color="#fff" />
                        <Text style={styles.addTopicTxt}>Save "{topicSearch.trim()}"</Text>
                      </>
                  }
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
  browseHero: { margin: 14, marginBottom: 0, borderRadius: 14, borderWidth: 1, padding: 16, alignItems: "center" },
  browseHeroTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 6 },
  browseHeroSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, textAlign: "center" },
  browseSearchWrap: { paddingHorizontal: 14, marginTop: 12, gap: 10 },
  browseSearch: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  addTopicBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 13 },
  addTopicTxt: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
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
  resourceCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  resourceIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  resourceTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  resourceDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
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
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 14, marginBottom: 10, padding: 13, borderRadius: 13, borderWidth: 1 },
  reportBtnTxt: { fontSize: 14, fontWeight: "700" },
  reportBtnSub: { fontSize: 11, marginTop: 1 },
  storyCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  storyTitle: { fontSize: 15, fontWeight: "800", marginBottom: 6, lineHeight: 21 },
  storySummary: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  storyFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  storyMeta: { fontSize: 11, flex: 1 },
  confirmBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  confirmBtnTxt: { fontSize: 12, fontWeight: "600" },
  catBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0, padding: 20, paddingBottom: 34, maxHeight: "92%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  modalTitle: { fontSize: 17, fontWeight: "800" },
  modalSub: { fontSize: 12, lineHeight: 17, marginBottom: 14 },
  modalLabel: { fontSize: 13, fontWeight: "700", marginBottom: 6, marginTop: 10 },
  modalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  catPicker: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  catPickerChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  modalCancelBtn: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalSubmitBtn: { paddingVertical: 13, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
