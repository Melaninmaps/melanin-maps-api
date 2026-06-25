import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

const CATEGORIES = [
  { id: "health",     label: "Health",     emoji: "🩺", color: "#DC2626" },
  { id: "travel",     label: "Travel",     emoji: "✈️", color: "#2563EB" },
  { id: "relocation", label: "Relocation", emoji: "🏡", color: "#16A34A" },
  { id: "careers",    label: "Careers",    emoji: "💼", color: "#059669" },
  { id: "money",      label: "Money",      emoji: "💰", color: "#D97706" },
  { id: "history",    label: "History",    emoji: "🏛️",  color: "#7C3AED" },
  { id: "education",  label: "Education",  emoji: "🎓", color: "#0891B2" },
  { id: "food",       label: "Food",       emoji: "👨🏾‍🍳", color: "#EA580C" },
  { id: "culture",    label: "Culture",    emoji: "🎉", color: "#DB2777" },
  { id: "wellness",   label: "Wellness",   emoji: "🧠", color: "#6D28D9" },
];

const SAMPLE_ARTICLES = [
  { id: "s1", title: "5 Signs You Should See a Primary Care Physician", summary: "Knowing when to make that appointment could save your life.", category: "health", tier: "free", readTimeMinutes: 3, authorName: "Editorial", authorBadge: null, imageUrl: null, publishedAt: new Date().toISOString() },
  { id: "s2", title: "Best Neighborhoods in Atlanta for Black Families", summary: "A community guide to Atlanta's most welcoming areas.", category: "relocation", tier: "free", readTimeMinutes: 5, authorName: "Editorial", authorBadge: null, imageUrl: null, publishedAt: new Date().toISOString() },
  { id: "s3", title: "Things to Do in Brazil — A Cultural Travel Guide", summary: "Discover Afro-Brazilian culture, food, and community.", category: "travel", tier: "free", readTimeMinutes: 6, authorName: "Community Writer", authorBadge: null, imageUrl: null, publishedAt: new Date().toISOString() },
  { id: "s4", title: "Women's Preventive Care Guide by Age", summary: "A comprehensive roadmap to proactive health at every stage of life.", category: "health", tier: "premium", readTimeMinutes: 8, authorName: "Dr. Aisha M.", authorBadge: "✅ Verified Physician", imageUrl: null, publishedAt: new Date().toISOString() },
  { id: "s5", title: "Complete Atlanta Relocation Guide", summary: "Cost comparisons, schools, community resources, safety trends, and moving checklist.", category: "relocation", tier: "premium", readTimeMinutes: 12, authorName: "Editorial", authorBadge: null, imageUrl: null, publishedAt: new Date().toISOString() },
  { id: "s6", title: "The Importance of Annual Physicals", summary: "What happens at a physical and why you shouldn't skip it.", category: "health", tier: "free", readTimeMinutes: 4, authorName: "Dr. Aisha M.", authorBadge: "✅ Verified Physician", imageUrl: null, publishedAt: new Date().toISOString() },
  { id: "s7", title: "Building Generational Wealth Through Real Estate", summary: "How to start investing in property with limited capital.", category: "money", tier: "free", readTimeMinutes: 7, authorName: "Editorial", authorBadge: null, imageUrl: null, publishedAt: new Date().toISOString() },
  { id: "s8", title: "Mental Health Resource Guide by State", summary: "A comprehensive directory of Black therapists and mental health resources.", category: "wellness", tier: "premium", readTimeMinutes: 10, authorName: "Editorial", authorBadge: null, imageUrl: null, publishedAt: new Date().toISOString() },
];

const SAMPLE_EXPERTS = [
  { id: "e1", displayName: "Dr. Aisha Matthews", specialty: "Internal Medicine", badge: "✅ Verified Physician", bio: "Board-certified internist with 15 years of experience in preventive care.", followCount: 842, articleCount: 12, avatarUrl: null },
  { id: "e2", displayName: "James L. Carter, Esq.", specialty: "Civil Rights & Employment Law", badge: "✅ Verified Attorney", bio: "Specializing in employment discrimination and civil rights litigation.", followCount: 614, articleCount: 8, avatarUrl: null },
  { id: "e3", displayName: "Tasha R. Williams, CFP", specialty: "Financial Planning", badge: "✅ Verified Financial Advisor", bio: "Helping Black families build wealth and navigate financial planning.", followCount: 1103, articleCount: 15, avatarUrl: null },
];

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
}

interface Expert {
  id: string;
  displayName: string;
  specialty: string;
  badge: string;
  bio?: string | null;
  followCount?: number | null;
  articleCount?: number | null;
  avatarUrl?: string | null;
}

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subscription } = useMembership();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [articles, setArticles] = useState<Article[]>(SAMPLE_ARTICLES);
  const [experts, setExperts] = useState<Expert[]>(SAMPLE_EXPERTS);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const params = new URLSearchParams({ limit: "40" });
      if (selectedCategory) params.set("category", selectedCategory);
      if (search) params.set("search", search);
      const res = await fetch(`${getApiBase()}/api/knowledge/articles?${params}`, { headers: h });
      if (res.ok) {
        const data = await res.json() as { articles: Article[] };
        if (data.articles.length > 0) setArticles(data.articles);
      }
    } catch { /* keep sample data */ } finally { setLoading(false); }
  }, [selectedCategory, search]);

  const loadExperts = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/knowledge/experts`);
      if (res.ok) {
        const data = await res.json() as { experts: Expert[] };
        if (data.experts.length > 0) setExperts(data.experts);
      }
    } catch { /* keep sample data */ }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);
  useEffect(() => { loadExperts(); }, [loadExperts]);

  const filtered = useMemo(() => {
    let list = articles;
    if (selectedCategory) list = list.filter(a => a.category === selectedCategory);
    if (search) list = list.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.summary.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [articles, selectedCategory, search]);

  const featured = useMemo(() => filtered.slice(0, 4), [filtered]);
  const catInfo = (id: string) => CATEGORIES.find(c => c.id === id) ?? { emoji: "📚", color: "#6B7280", label: id };

  function openArticle(article: Article) {
    if (article.tier === "premium" && !subscription) {
      setShowUpgrade(true);
      return;
    }
    router.push({ pathname: "/library-article", params: { articleId: article.id } } as never);
  }

  function openExpert(expert: Expert) {
    router.push({ pathname: "/library-expert", params: { expertId: expert.id } } as never);
  }

  const isPremium = !!subscription;

  return (
    <>
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>📚 Library</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Knowledge for the community</Text>
          </View>
          {isPremium && (
            <View style={[styles.kPlusBadge, { backgroundColor: "#CA922B18" }]}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#CA922B" }}>K+</Text>
            </View>
          )}
        </View>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search articles…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Knowledge+ banner for free users */}
        {!isPremium && (
          <TouchableOpacity
            style={[styles.kPlusBanner, { backgroundColor: "#CA922B12", borderColor: "#CA922B30" }]}
            onPress={() => setShowUpgrade(true)}
            activeOpacity={0.8}
          >
            <View style={styles.kPlusBannerLeft}>
              <Text style={[styles.kPlusLabel, { color: "#CA922B" }]}>⭐ Knowledge+</Text>
              <Text style={[styles.kPlusSub, { color: colors.mutedForeground }]}>
                Exclusive guides, expert Q&As, AI-powered learning & personalized resources
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color="#CA922B" />
          </TouchableOpacity>
        )}

        {/* Categories grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Browse by Topic</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catCard,
                    { backgroundColor: active ? cat.color : colors.card, borderColor: active ? cat.color : colors.border },
                  ]}
                  onPress={() => setSelectedCategory(active ? null : cat.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, { color: active ? "#fff" : colors.foreground }]} numberOfLines={1}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Articles */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {selectedCategory ? `${catInfo(selectedCategory).emoji} ${catInfo(selectedCategory).label}` : "Featured Articles"}
            </Text>
            {loading && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 32 }}>📖</Text>
              <Text style={[{ color: colors.mutedForeground, marginTop: 8, fontSize: 14 }]}>No articles found</Text>
            </View>
          ) : (
            filtered.map(article => {
              const cat = catInfo(article.category);
              const isPremiumArticle = article.tier === "premium";
              return (
                <TouchableOpacity
                  key={article.id}
                  style={[styles.articleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => openArticle(article)}
                  activeOpacity={0.75}
                >
                  <View style={styles.articleCardTop}>
                    <View style={[styles.catPill, { backgroundColor: cat.color + "18" }]}>
                      <Text style={[styles.catPillTxt, { color: cat.color }]}>{cat.emoji} {cat.label}</Text>
                    </View>
                    {isPremiumArticle && (
                      <View style={[styles.premiumPill, { backgroundColor: "#CA922B18" }]}>
                        <Text style={[styles.premiumPillTxt, { color: "#CA922B" }]}>⭐ K+</Text>
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
                    {article.authorBadge ? (
                      <Text style={[styles.authorBadge, { color: "#16A34A" }]}>{article.authorBadge}</Text>
                    ) : (
                      <Text style={[styles.authorName, { color: colors.mutedForeground }]}>{article.authorName}</Text>
                    )}
                    <Text style={[styles.readTime, { color: colors.mutedForeground }]}>
                      {article.readTimeMinutes ?? 4} min read
                    </Text>
                  </View>
                  {isPremiumArticle && !isPremium && (
                    <View style={[styles.lockedBar, { backgroundColor: "#CA922B10", borderColor: "#CA922B30" }]}>
                      <Feather name="lock" size={12} color="#CA922B" />
                      <Text style={[styles.lockedTxt, { color: "#CA922B" }]}>Knowledge+ — Upgrade to read in full</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Community Experts */}
        {!selectedCategory && (
          <View style={[styles.section, { marginBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community Experts</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Verified professionals publishing trusted educational content
            </Text>
            {experts.map(expert => (
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
                  <View style={styles.expertNameRow}>
                    <Text style={[styles.expertName, { color: colors.foreground }]} numberOfLines={1}>
                      {expert.displayName}
                    </Text>
                  </View>
                  <Text style={[styles.expertBadge, { color: "#16A34A" }]}>{expert.badge}</Text>
                  <Text style={[styles.expertSpecialty, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {expert.specialty}
                  </Text>
                  <View style={styles.expertStats}>
                    <Text style={[styles.expertStat, { color: colors.mutedForeground }]}>
                      {expert.followCount ?? 0} followers · {expert.articleCount ?? 0} articles
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>

    <UpgradeModal
      visible={showUpgrade}
      onClose={() => setShowUpgrade(false)}
      feature="Knowledge+"
      reason="Knowledge+ unlocks exclusive expert guides, AI-powered learning, and comprehensive resource libraries."
    />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  headerSub: { fontSize: 12, marginTop: 1 },
  kPlusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  scroll: { flex: 1 },
  kPlusBanner: { margin: 14, borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  kPlusBannerLeft: { flex: 1, gap: 3 },
  kPlusLabel: { fontSize: 14, fontWeight: "800" },
  kPlusSub: { fontSize: 12, lineHeight: 17 },
  section: { paddingHorizontal: 14, paddingTop: 16, gap: 10 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  sectionSub: { fontSize: 12, lineHeight: 17, marginTop: -6 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catCard: { width: "30.5%", borderRadius: 12, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center", gap: 4 },
  catEmoji: { fontSize: 22 },
  catLabel: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  articleCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  articleCardTop: { flexDirection: "row", gap: 6 },
  catPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catPillTxt: { fontSize: 11, fontWeight: "700" },
  premiumPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  premiumPillTxt: { fontSize: 11, fontWeight: "800" },
  articleTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  articleSummary: { fontSize: 13, lineHeight: 18 },
  articleMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  authorBadge: { fontSize: 11, fontWeight: "700" },
  authorName: { fontSize: 11 },
  readTime: { fontSize: 11 },
  lockedBar: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  lockedTxt: { fontSize: 12, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 30 },
  expertCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  expertAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  expertNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  expertName: { fontSize: 14, fontWeight: "700", flex: 1 },
  expertBadge: { fontSize: 11, fontWeight: "700" },
  expertSpecialty: { fontSize: 12 },
  expertStats: { flexDirection: "row", gap: 8 },
  expertStat: { fontSize: 11 },
});
