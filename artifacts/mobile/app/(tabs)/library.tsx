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
  health:     { emoji: "🩺", color: "#DC2626", label: "Health" },
  travel:     { emoji: "✈️", color: "#2563EB", label: "Travel" },
  relocation: { emoji: "🏡", color: "#16A34A", label: "Relocation" },
  careers:    { emoji: "💼", color: "#059669", label: "Careers" },
  money:      { emoji: "💰", color: "#D97706", label: "Money" },
  history:    { emoji: "🏛️", color: "#7C3AED", label: "History" },
  education:  { emoji: "🎓", color: "#0891B2", label: "Education" },
  food:       { emoji: "🍽️", color: "#EA580C", label: "Food" },
  culture:    { emoji: "🎉", color: "#DB2777", label: "Culture" },
  wellness:   { emoji: "🧠", color: "#6D28D9", label: "Wellness" },
};

interface Topic {
  id: string;
  topicName: string;
  category: string;
  description?: string | null;
  isFollowing?: boolean;
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

const SAMPLE_EXPERTS: Expert[] = [
  { id: "e1", displayName: "Dr. Aisha Matthews", specialty: "Internal Medicine", badge: "Verified Physician", bio: "Board-certified internist with 15 years of experience in preventive care.", followCount: 842, articleCount: 12 },
  { id: "e2", displayName: "James L. Carter, Esq.", specialty: "Civil Rights & Employment Law", badge: "Verified Attorney", bio: "Specializing in employment discrimination and civil rights litigation.", followCount: 614, articleCount: 8 },
  { id: "e3", displayName: "Tasha R. Williams, CFP", specialty: "Financial Planning", badge: "Verified Financial Advisor", bio: "Helping Black families build wealth and navigate financial planning.", followCount: 1103, articleCount: 15 },
];

type Tab = "library" | "browse";

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
  const [newCount, setNewCount] = useState(0);
  const [followCount, setFollowCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const hasAuth = Object.keys(h).length > 0;
      setIsAuthenticated(hasAuth);

      const [topicsRes, expertsRes] = await Promise.all([
        fetch(`${getApiBase()}/api/knowledge/topics`, { headers: h }),
        fetch(`${getApiBase()}/api/knowledge/experts`),
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

      if (hasAuth) {
        setFeedLoading(true);
        const feedRes = await fetch(`${getApiBase()}/api/knowledge/feed`, { headers: h });
        if (feedRes.ok) {
          const data = await feedRes.json() as { articles: FeedArticle[]; newCount: number };
          setFeed(data.articles);
          setNewCount(data.newCount);
        }
        setFeedLoading(false);
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
                  ? `${followedTopics.length} topic${followedTopics.length !== 1 ? "s" : ""} followed${!isPremium ? ` · ${10 - followCount} free slots left` : ""}`
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
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "library" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab("library")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabTxt, { color: activeTab === "library" ? colors.primary : colors.mutedForeground }]}>
                My Library
                {newCount > 0 && (
                  <Text style={{ color: "#CA922B", fontWeight: "800" }}>  {newCount} new</Text>
                )}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "browse" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab("browse")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabTxt, { color: activeTab === "browse" ? colors.primary : colors.mutedForeground }]}>
                Browse Topics
              </Text>
            </TouchableOpacity>
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
              /* No follows yet */
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

                {/* Already read this week */}
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
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Following</Text>
                {followedTopics.map((topic) => {
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
                        {(topic.newCount ?? 0) > 0 && (
                          <View style={[styles.newBadge, { backgroundColor: meta.color }]}>
                            <Text style={styles.newBadgeTxt}>{topic.newCount} new</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.followToggle, { backgroundColor: meta.color, borderColor: meta.color }]}
                        onPress={() => toggleFollow(topic)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.followToggleTxt}>Following</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* All / unfollow topics */}
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
  tabTxt: { fontSize: 13, fontWeight: "700" },
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
});
