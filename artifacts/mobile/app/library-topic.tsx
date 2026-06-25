import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
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

interface Topic {
  id: string;
  topicName: string;
  category: string;
  description?: string | null;
}

interface WeekGroup {
  label: string;
  weekStart: Date;
  articles: Article[];
}

const CATEGORY_COLORS: Record<string, string> = {
  health: "#DC2626", travel: "#2563EB", relocation: "#16A34A",
  careers: "#059669", money: "#D97706", history: "#7C3AED",
  education: "#0891B2", food: "#EA580C", culture: "#DB2777", wellness: "#6D28D9",
};

function getWeekLabel(date: Date): string {
  const now = new Date();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const diff = now.getTime() - date.getTime();
  if (diff < weekMs) return "This Week";
  if (diff < 2 * weekMs) return "Last Week";
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  return `Week of ${month} ${day}`;
}

function groupByWeek(articles: Article[]): WeekGroup[] {
  const groups: Map<string, WeekGroup> = new Map();
  for (const a of articles) {
    const d = new Date(a.publishedAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString();
    if (!groups.has(key)) {
      groups.set(key, { label: getWeekLabel(d), weekStart, articles: [] });
    }
    groups.get(key)!.articles.push(a);
  }
  return Array.from(groups.values()).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
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
      const hasAuth = Object.keys(h).length > 0;
      setIsAuthenticated(hasAuth);
      const res = await fetch(`${getApiBase()}/api/knowledge/topics/${topicId}/articles`, { headers: h });
      if (res.ok) {
        const data = await res.json() as { topic: Topic; articles: Article[]; isFollowing: boolean };
        setTopic(data.topic);
        setArticles(data.articles);
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

  const weekGroups = groupByWeek(articles);
  const catColor = topic ? (CATEGORY_COLORS[topic.category] ?? "#6B7280") : "#6B7280";

  return (
    <>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 6, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              {topic ? (
                <>
                  <Text style={[styles.topicName, { color: colors.foreground }]} numberOfLines={1}>
                    {topic.topicName}
                  </Text>
                  {topic.description ? (
                    <Text style={[styles.topicDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {topic.description}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={[styles.topicName, { color: colors.foreground }]}>Loading…</Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.followBtn,
                { backgroundColor: isFollowing ? catColor : "transparent", borderColor: catColor },
              ]}
              onPress={toggleFollow}
              disabled={followLoading}
              activeOpacity={0.75}
            >
              <Text style={[styles.followTxt, { color: isFollowing ? "#fff" : catColor }]}>
                {followLoading ? "…" : isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : articles.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📖</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No articles yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              New articles are added every week. Follow this topic to be notified.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {weekGroups.map((group) => (
              <View key={group.weekStart.toISOString()} style={styles.weekGroup}>
                <View style={styles.weekHeader}>
                  <Text style={[styles.weekLabel, { color: colors.mutedForeground }]}>{group.label}</Text>
                  <View style={[styles.weekLine, { backgroundColor: colors.border }]} />
                </View>
                {group.articles.map((article) => {
                  const isPremium = article.tier === "premium";
                  return (
                    <TouchableOpacity
                      key={article.id}
                      style={[
                        styles.articleCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        article.isRead && { opacity: 0.65 },
                      ]}
                      onPress={() => openArticle(article)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.articleTop}>
                        {!article.isRead && (
                          <View style={[styles.unreadDot, { backgroundColor: catColor }]} />
                        )}
                        {isPremium && (
                          <View style={[styles.premiumPill, { backgroundColor: "#CA922B18" }]}>
                            <Text style={[styles.premiumTxt, { color: "#CA922B" }]}>K+</Text>
                          </View>
                        )}
                        {article.isRead && (
                          <View style={[styles.readPill, { backgroundColor: colors.border }]}>
                            <Text style={[styles.readTxt, { color: colors.mutedForeground }]}>Read</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.articleTitle, { color: colors.foreground }]} numberOfLines={2}>
                        {article.title}
                      </Text>
                      <Text style={[styles.articleSummary, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {article.summary}
                      </Text>
                      <View style={styles.articleMeta}>
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                          {article.authorName}
                        </Text>
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                          {article.readTimeMinutes ?? 4} min read
                        </Text>
                      </View>
                      {isPremium && !subscription && (
                        <View style={[styles.lockedBar, { backgroundColor: "#CA922B10", borderColor: "#CA922B30" }]}>
                          <Feather name="lock" size={11} color="#CA922B" />
                          <Text style={[styles.lockedTxt, { color: "#CA922B" }]}>Knowledge+ — Upgrade to read in full</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <View style={{ height: Platform.OS === "web" ? 100 : insets.bottom + 100 }} />
          </ScrollView>
        )}
      </View>

      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="Knowledge+"
        reason={isFollowing === false && !showUpgrade ? "Follow up to 10 topics free. Upgrade for unlimited topic follows." : "Knowledge+ unlocks exclusive expert guides, AI-powered learning, and premium articles."}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { borderBottomWidth: 1, paddingHorizontal: 14, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  backBtn: { paddingTop: 2, paddingRight: 4 },
  topicName: { fontSize: 16, fontWeight: "800", lineHeight: 22 },
  topicDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  followBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 2 },
  followTxt: { fontSize: 13, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptySub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  scroll: { flex: 1 },
  weekGroup: { paddingHorizontal: 14, paddingTop: 18 },
  weekHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  weekLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  weekLine: { flex: 1, height: 1 },
  articleCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6, marginBottom: 10 },
  articleTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  premiumPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  premiumTxt: { fontSize: 10, fontWeight: "800" },
  readPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  readTxt: { fontSize: 10, fontWeight: "600" },
  articleTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  articleSummary: { fontSize: 13, lineHeight: 18 },
  articleMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  metaText: { fontSize: 11 },
  lockedBar: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  lockedTxt: { fontSize: 11, fontWeight: "600" },
});
