import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  tier: string;
  readTimeMinutes: number | null;
  authorName: string;
  authorBadge?: string | null;
  imageUrl?: string | null;
  publishedAt: string;
  isRead?: boolean;
}

interface Post {
  id: string;
  content: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  locationTag?: string | null;
  topicTag?: string | null;
  businessName?: string | null;
  upvotes: number;
  commentsCount: number;
  createdAt: string;
}

interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  address: string;
}

interface Topic {
  id: string;
  topicName: string;
  category: string;
  topicType?: string | null;
  description?: string | null;
}

const TYPE_META: Record<string, { emoji: string; label: string; color: string; sourceLine: string }> = {
  location:  { emoji: "📍", label: "Location",  color: "#2563EB", sourceLine: "Community posts, businesses & safety reports" },
  medical:   { emoji: "🩺", label: "Health",     color: "#DC2626", sourceLine: "Community discussions & health resources" },
  wellness:  { emoji: "💪", label: "Wellness",   color: "#6D28D9", sourceLine: "Community posts & wellness tips" },
  education: { emoji: "🎓", label: "Education",  color: "#0891B2", sourceLine: "Learning resources & community discussions" },
  business:  { emoji: "📈", label: "Business",   color: "#059669", sourceLine: "Business resources & community posts" },
  community: { emoji: "✊🏾", label: "Community", color: "#9333EA", sourceLine: "Community posts, events & groups" },
  hobby:     { emoji: "🎯", label: "Interest",   color: "#EA580C", sourceLine: "Community posts & discussions" },
  general:   { emoji: "✦",  label: "Topic",      color: "#CA922B", sourceLine: "Community posts & discussions" },
};

function timeAgo(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function LibraryTopicScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { subscription } = useMembership();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const load = useCallback(async () => {
    if (!topicId) return;
    setLoading(true);
    try {
      const h = await authHeaders();
      setIsAuthenticated(Object.keys(h).length > 0);
      const res = await fetch(`${getApiBase()}/api/knowledge/topics/${topicId}/articles`, { headers: h });
      if (res.ok) {
        const data = await res.json() as {
          topic: Topic;
          articles: Article[];
          posts: Post[];
          businesses: Business[];
          isFollowing: boolean;
        };
        setTopic(data.topic);
        setArticles(data.articles ?? []);
        setPosts(data.posts ?? []);
        setBusinesses(data.businesses ?? []);
        setIsFollowing(data.isFollowing);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [topicId]);

  useEffect(() => { load(); }, [load]);

  async function toggleFollow() {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    setFollowLoading(true);
    try {
      const h = await authHeaders();
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`${getApiBase()}/api/knowledge/topics/${topicId}/follow`, { method, headers: h });
      if (res.status === 403) { setShowUpgrade(true); setFollowLoading(false); return; }
      if (res.ok) setIsFollowing(!isFollowing);
    } catch { /* silent */ } finally { setFollowLoading(false); }
  }

  async function openArticle(article: Article) {
    if (article.tier === "premium" && !subscription) { setShowUpgrade(true); return; }
    const h = await authHeaders();
    if (Object.keys(h).length > 0) {
      fetch(`${getApiBase()}/api/knowledge/articles/${article.id}/read`, { method: "POST", headers: h }).catch(() => {});
    }
    router.push({ pathname: "/library-article", params: { articleId: article.id } } as never);
  }

  const typeMeta = TYPE_META[topic?.topicType ?? "general"] ?? TYPE_META.general;
  const hasContent = articles.length > 0 || posts.length > 0 || businesses.length > 0;

  return (
    <>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 6, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              {topic ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <View style={[styles.typeBadge, { backgroundColor: typeMeta.color + "15" }]}>
                      <Text style={{ fontSize: 11 }}>{typeMeta.emoji}</Text>
                      <Text style={[styles.typeBadgeTxt, { color: typeMeta.color }]}>{typeMeta.label}</Text>
                    </View>
                  </View>
                  <Text style={[styles.topicName, { color: colors.foreground }]} numberOfLines={2}>
                    {topic.topicName}
                  </Text>
                  <Text style={[styles.sourceLine, { color: colors.mutedForeground }]}>
                    {typeMeta.sourceLine}
                  </Text>
                </>
              ) : (
                <Text style={[styles.topicName, { color: colors.foreground }]}>Loading…</Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.followBtn, { backgroundColor: isFollowing ? typeMeta.color : "transparent", borderColor: typeMeta.color }]}
              onPress={toggleFollow}
              disabled={followLoading}
              activeOpacity={0.75}
            >
              <Text style={[styles.followTxt, { color: isFollowing ? "#fff" : typeMeta.color }]}>
                {followLoading ? "…" : isFollowing ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !hasContent ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.emptyContainer}>
            <Text style={{ fontSize: 42, marginBottom: 16 }}>{typeMeta.emoji}</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No community content yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Be the first to post about <Text style={{ fontWeight: "700" }}>{topic?.topicName}</Text>. Every post you and others make mentioning this topic will appear here.
            </Text>
            <TouchableOpacity
              style={[styles.postBtn, { backgroundColor: typeMeta.color }]}
              onPress={() => router.push("/(tabs)/community" as never)}
              activeOpacity={0.8}
            >
              <Feather name="edit-2" size={14} color="#fff" />
              <Text style={styles.postBtnTxt}>Write a Post</Text>
            </TouchableOpacity>
            {!isFollowing && (
              <TouchableOpacity
                style={[styles.followOutlineBtn, { borderColor: typeMeta.color }]}
                onPress={toggleFollow}
                activeOpacity={0.8}
              >
                <Text style={[styles.followOutlineTxt, { color: typeMeta.color }]}>Save this Topic</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

            {/* Community Posts */}
            {posts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="users" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community Discussions</Text>
                  <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{posts.length}</Text>
                </View>
                {posts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push("/(tabs)/community" as never)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.postTop}>
                      <View style={[styles.avatar, { backgroundColor: post.authorColor + "25" }]}>
                        <Text style={[styles.avatarTxt, { color: post.authorColor }]}>{post.authorInitials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.postAuthor, { color: colors.foreground }]}>{post.authorName}</Text>
                        {post.locationTag && (
                          <Text style={[styles.postLocation, { color: colors.mutedForeground }]}>
                            <Feather name="map-pin" size={10} color={colors.mutedForeground} /> {post.locationTag}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.postTime, { color: colors.mutedForeground }]}>{timeAgo(post.createdAt)}</Text>
                    </View>
                    <Text style={[styles.postContent, { color: colors.foreground }]} numberOfLines={3}>
                      {post.content}
                    </Text>
                    {post.businessName && (
                      <View style={[styles.postBusinessTag, { backgroundColor: colors.secondary }]}>
                        <Feather name="briefcase" size={10} color={colors.mutedForeground} />
                        <Text style={[styles.postBusinessTxt, { color: colors.mutedForeground }]}>{post.businessName}</Text>
                      </View>
                    )}
                    <View style={styles.postMeta}>
                      <View style={styles.postMetaItem}>
                        <Feather name="arrow-up" size={11} color={colors.mutedForeground} />
                        <Text style={[styles.postMetaTxt, { color: colors.mutedForeground }]}>{post.upvotes}</Text>
                      </View>
                      <View style={styles.postMetaItem}>
                        <Feather name="message-circle" size={11} color={colors.mutedForeground} />
                        <Text style={[styles.postMetaTxt, { color: colors.mutedForeground }]}>{post.commentsCount}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Businesses */}
            {businesses.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="briefcase" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Black-Owned Businesses</Text>
                  <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{businesses.length}</Text>
                </View>
                {businesses.map((biz) => (
                  <TouchableOpacity
                    key={biz.id}
                    style={[styles.bizCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push({ pathname: "/business/[id]", params: { id: biz.id } } as never)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.bizIcon, { backgroundColor: typeMeta.color + "15" }]}>
                      <Text style={{ fontSize: 18 }}>🏪</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>{biz.name}</Text>
                      <Text style={[styles.bizCategory, { color: typeMeta.color }]}>{biz.category}</Text>
                      <Text style={[styles.bizLocation, { color: colors.mutedForeground }]}>
                        <Feather name="map-pin" size={10} color={colors.mutedForeground} /> {biz.city}, {biz.state}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Articles */}
            {articles.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="book-open" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Articles & Guides</Text>
                  <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{articles.length}</Text>
                </View>
                {articles.map((article) => (
                  <TouchableOpacity
                    key={article.id}
                    style={[styles.articleCard, { backgroundColor: colors.card, borderColor: colors.border }, article.isRead && { opacity: 0.65 }]}
                    onPress={() => openArticle(article)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.articleTop}>
                      {!article.isRead && <View style={[styles.unreadDot, { backgroundColor: typeMeta.color }]} />}
                      {article.tier === "premium" && (
                        <View style={[styles.premiumPill, { backgroundColor: "#CA922B18" }]}>
                          <Text style={[styles.premiumTxt, { color: "#CA922B" }]}>K+</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.articleTitle, { color: colors.foreground }]} numberOfLines={2}>{article.title}</Text>
                    <Text style={[styles.articleSummary, { color: colors.mutedForeground }]} numberOfLines={2}>{article.summary}</Text>
                    <View style={styles.articleMeta}>
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{article.authorName}</Text>
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{article.readTimeMinutes ?? 4} min read</Text>
                    </View>
                    {article.tier === "premium" && !subscription && (
                      <View style={[styles.lockedBar, { backgroundColor: "#CA922B10", borderColor: "#CA922B30" }]}>
                        <Feather name="lock" size={11} color="#CA922B" />
                        <Text style={[styles.lockedTxt, { color: "#CA922B" }]}>Knowledge+ — Upgrade to read</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Post CTA */}
            <View style={[styles.ctaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.ctaTitle, { color: colors.foreground }]}>Know something about this topic?</Text>
              <Text style={[styles.ctaSub, { color: colors.mutedForeground }]}>
                Your posts mentioning <Text style={{ fontWeight: "700" }}>{topic?.topicName}</Text> will appear here for the community.
              </Text>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: typeMeta.color }]}
                onPress={() => router.push("/(tabs)/community" as never)}
                activeOpacity={0.8}
              >
                <Feather name="edit-2" size={13} color="#fff" />
                <Text style={styles.ctaBtnTxt}>Write a Post</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: Platform.OS === "web" ? 100 : insets.bottom + 100 }} />
          </ScrollView>
        )}
      </View>

      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="Knowledge+"
        reason="Upgrade to Knowledge+ to follow unlimited topics and read premium articles."
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { borderBottomWidth: 1, paddingHorizontal: 14, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  backBtn: { paddingTop: 2, paddingRight: 4 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeBadgeTxt: { fontSize: 11, fontFamily: "Inter_700Bold" },
  topicName: { fontSize: 16, fontFamily: "Inter_700Bold", lineHeight: 22 },
  sourceLine: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  followBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  followTxt: { fontSize: 13, fontFamily: "Inter_700Bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyContainer: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 10, textAlign: "center" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, textAlign: "center", marginBottom: 24 },
  postBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginBottom: 12 },
  postBtnTxt: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  followOutlineBtn: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  followOutlineTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 14, paddingTop: 18 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  sectionCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  postCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, gap: 8 },
  postTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 12, fontFamily: "Inter_700Bold" },
  postAuthor: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  postLocation: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  postTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  postContent: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  postBusinessTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  postBusinessTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  postMeta: { flexDirection: "row", gap: 12 },
  postMetaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  postMetaTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  bizCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10 },
  bizIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bizName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bizCategory: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  bizLocation: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  articleCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6, marginBottom: 10 },
  articleTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  premiumPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  premiumTxt: { fontSize: 10, fontFamily: "Inter_700Bold" },
  articleTitle: { fontSize: 15, fontFamily: "Inter_700Bold", lineHeight: 20 },
  articleSummary: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  articleMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  metaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  lockedBar: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  lockedTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  ctaCard: { margin: 14, marginTop: 20, borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  ctaTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  ctaSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  ctaBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: "flex-start", marginTop: 4 },
  ctaBtnTxt: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
