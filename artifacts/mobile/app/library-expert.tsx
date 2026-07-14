import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

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

const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  health: { emoji: "🩺", color: "#DC2626" },
  travel: { emoji: "✈️", color: "#2563EB" },
  relocation: { emoji: "🏡", color: "#16A34A" },
  careers: { emoji: "💼", color: "#059669" },
  money: { emoji: "💰", color: "#D97706" },
  history: { emoji: "🏛️", color: "#7C3AED" },
  education: { emoji: "🎓", color: "#0891B2" },
  food: { emoji: "👨🏾‍🍳", color: "#EA580C" },
  culture: { emoji: "🎉", color: "#DB2777" },
  wellness: { emoji: "🧠", color: "#6D28D9" },
};

const SAMPLE_EXPERTS: Record<string, {
  displayName: string; specialty: string; badge: string;
  bio: string; credentials: string; followCount: number; articleCount: number;
  kinfolkPrompts: string[];
  articles: Array<{ id: string; title: string; summary: string; category: string; tier: string; readTimeMinutes: number }>;
}> = {
  e1: {
    displayName: "Dr. Aisha Matthews",
    specialty: "Internal Medicine",
    badge: "✅ Verified Physician",
    bio: "Board-certified internist with 15 years of experience in preventive care. Passionate about closing health disparities in the Black community through education and access.",
    credentials: "MD, Johns Hopkins School of Medicine · Board Certified, Internal Medicine · Fellow, American College of Physicians",
    followCount: 842,
    articleCount: 12,
    kinfolkPrompts: [
      "Based on my age and lifestyle, what health screenings should I discuss with my doctor?",
      "What preventive care is most important for Black women in their 30s and 40s?",
      "How do I find a Black physician who accepts my insurance?",
    ],
    articles: [
      { id: "s6", title: "The Importance of Annual Physicals", summary: "What happens at a physical and why you shouldn't skip it.", category: "health", tier: "free", readTimeMinutes: 4 },
      { id: "s1", title: "5 Signs You Should See a Primary Care Physician", summary: "Knowing when to make that appointment could save your life.", category: "health", tier: "free", readTimeMinutes: 3 },
    ],
  },
  e2: {
    displayName: "James L. Carter, Esq.",
    specialty: "Civil Rights & Employment Law",
    badge: "✅ Verified Attorney",
    bio: "20 years of experience in employment discrimination, civil rights, and workplace law. Committed to making legal knowledge accessible to the community.",
    credentials: "JD, Howard University School of Law · Licensed in GA, NY, DC · Member, National Bar Association",
    followCount: 614,
    articleCount: 8,
    kinfolkPrompts: [
      "What should I know about my rights if I face workplace discrimination?",
      "How do I document a hostile work environment?",
      "What does the EEOC process look like?",
    ],
    articles: [],
  },
  e3: {
    displayName: "Tasha R. Williams, CFP",
    specialty: "Financial Planning",
    badge: "✅ Verified Financial Advisor",
    bio: "Certified Financial Planner helping Black families build generational wealth through strategic investing, real estate, and retirement planning.",
    credentials: "CFP®, Certified Financial Planner · MBA, Spelman College · Member, Financial Planning Association",
    followCount: 1103,
    articleCount: 15,
    kinfolkPrompts: [
      "How should I start building generational wealth on a moderate income?",
      "What's the difference between a Roth IRA and a traditional IRA?",
      "How do I evaluate whether I'm ready to buy a home?",
    ],
    articles: [
      { id: "s7", title: "Building Generational Wealth Through Real Estate", summary: "How to start investing in property with limited capital.", category: "money", tier: "free", readTimeMinutes: 7 },
    ],
  },
};

interface ExpertData {
  id: string;
  displayName: string;
  specialty: string;
  badge: string;
  bio?: string | null;
  credentials?: string | null;
  followCount?: number | null;
  articleCount?: number | null;
  avatarUrl?: string | null;
}

interface ArticleSummary {
  id: string;
  title: string;
  summary: string;
  category: string;
  tier: string;
  readTimeMinutes?: number | null;
}

export default function LibraryExpertScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { expertId } = useLocalSearchParams<{ expertId: string }>();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [expert, setExpert] = useState<ExpertData | null>(null);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [kinfolkPrompts, setKinfolkPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (!expertId) { setLoading(false); return; }

      if (expertId.startsWith("e") && SAMPLE_EXPERTS[expertId]) {
        const sample = SAMPLE_EXPERTS[expertId];
        setExpert({ id: expertId, ...sample });
        setArticles(sample.articles);
        setKinfolkPrompts(sample.kinfolkPrompts);
        setLoading(false);
        return;
      }

      try {
        const h = await authHeaders();
        const res = await fetch(`${getApiBase()}/api/knowledge/experts/${expertId}`, { headers: h });
        if (res.ok) {
          const data = await res.json() as { expert: ExpertData; articles: ArticleSummary[]; isFollowing: boolean };
          setExpert(data.expert);
          setArticles(data.articles);
          setFollowing(data.isFollowing);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [expertId]);

  async function toggleFollow() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const token = await getToken();
    if (!token) { Alert.alert("Sign in required", "Sign in to follow experts."); return; }
    setFollowLoading(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/knowledge/experts/${expertId}/follow`, {
        method: "POST", headers: { ...h, "Content-Type": "application/json" },
      });
      if (res.ok) {
        const d = await res.json() as { following: boolean };
        setFollowing(d.following);
        if (expert) {
          setExpert({ ...expert, followCount: (expert.followCount ?? 0) + (d.following ? 1 : -1) });
        }
      }
    } catch { /* */ } finally { setFollowLoading(false); }
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!expert) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 36 }}>👤</Text>
        <Text style={[{ color: colors.foreground, fontSize: 17, fontWeight: "700", marginTop: 10 }]}>Expert not found</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={[styles.backBtnLarge, { borderColor: colors.border }]}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/library" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>Expert Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}>
        {/* Expert hero */}
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: "#CA922B18" }]}>
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
          <Text style={[styles.expertName, { color: colors.foreground }]}>{expert.displayName}</Text>
          <Text style={[styles.expertBadge, { color: "#16A34A" }]}>{expert.badge}</Text>
          <Text style={[styles.expertSpecialty, { color: colors.mutedForeground }]}>{expert.specialty}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>{expert.followCount ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>{expert.articleCount ?? articles.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Articles</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.followBtn, { backgroundColor: following ? colors.card : "#CA922B", borderColor: following ? colors.border : "#CA922B" }]}
            onPress={toggleFollow}
            disabled={followLoading}
            activeOpacity={0.85}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={following ? colors.foreground : "#fff"} />
            ) : (
              <>
                <Feather name={following ? "user-check" : "user-plus"} size={14} color={following ? colors.foreground : "#fff"} />
                <Text style={[styles.followBtnTxt, { color: following ? colors.foreground : "#fff" }]}>
                  {following ? "Following" : "Follow"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Bio & credentials */}
        {expert.bio && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
            <Text style={[styles.bio, { color: colors.foreground }]}>{expert.bio}</Text>
            {expert.credentials && (
              <View style={[styles.credBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="award" size={13} color="#16A34A" />
                <Text style={[styles.credTxt, { color: colors.mutedForeground }]}>{expert.credentials}</Text>
              </View>
            )}
          </View>
        )}

        {/* KinfolkAI Q&A */}
        {kinfolkPrompts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ask KinfolkAI</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Get AI-assisted educational guidance on topics {expert.displayName} covers
            </Text>
            {kinfolkPrompts.map((prompt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/(tabs)/travel", params: { kinfolkPrompt: prompt } } as never)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 18, color: "#D1D5DB" }}>"</Text>
                <Text style={[styles.promptTxt, { color: colors.foreground }]}>{prompt}</Text>
                <Feather name="arrow-right" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Articles */}
        {articles.length > 0 && (
          <View style={[styles.section, { marginBottom: Platform.OS === "web" ? 20 : 0 }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Articles</Text>
            {articles.map(article => {
              const cat = CATEGORY_META[article.category] ?? { emoji: "📚", color: "#6B7280" };
              return (
                <TouchableOpacity
                  key={article.id}
                  style={[styles.articleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/library-article", params: { articleId: article.id } } as never)}
                  activeOpacity={0.75}
                >
                  <View style={styles.articleTop}>
                    <View style={[styles.catPill, { backgroundColor: cat.color + "18" }]}>
                      <Text style={[styles.catPillTxt, { color: cat.color }]}>{cat.emoji} {article.category}</Text>
                    </View>
                    {article.tier === "premium" && (
                      <View style={[styles.kPill, { backgroundColor: "#CA922B18" }]}>
                        <Text style={[styles.kPillTxt, { color: "#CA922B" }]}>⭐ K+</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.articleTitle, { color: colors.foreground }]} numberOfLines={2}>{article.title}</Text>
                  <Text style={[styles.articleSummary, { color: colors.mutedForeground }]} numberOfLines={2}>{article.summary}</Text>
                  <Text style={[styles.readTime, { color: colors.mutedForeground }]}>{article.readTimeMinutes ?? 4} min read</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", gap: 10 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1, gap: 10 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "700", textAlign: "center" },
  backBtnLarge: { marginTop: 14, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  hero: { margin: 14, borderRadius: 18, borderWidth: 1, padding: 20, alignItems: "center", gap: 6 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  expertName: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  expertBadge: { fontSize: 13, fontWeight: "700" },
  expertSpecialty: { fontSize: 13, textAlign: "center" },
  statsRow: { flexDirection: "row", alignItems: "center", marginVertical: 10, gap: 20 },
  statBox: { alignItems: "center", gap: 2 },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 32 },
  followBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 28, paddingVertical: 11, borderRadius: 50, borderWidth: 1, marginTop: 4 },
  followBtnTxt: { fontSize: 14, fontWeight: "700" },
  section: { paddingHorizontal: 14, paddingTop: 14, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  sectionSub: { fontSize: 12, lineHeight: 17, marginTop: -6 },
  bio: { fontSize: 14, lineHeight: 21 },
  credBox: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: "flex-start" },
  credTxt: { fontSize: 12, lineHeight: 18, flex: 1 },
  promptCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  promptTxt: { flex: 1, fontSize: 13, lineHeight: 18, fontStyle: "italic" },
  articleCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  articleTop: { flexDirection: "row", gap: 6 },
  catPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catPillTxt: { fontSize: 11, fontWeight: "700" },
  kPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  kPillTxt: { fontSize: 11, fontWeight: "800" },
  articleTitle: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  articleSummary: { fontSize: 12, lineHeight: 17 },
  readTime: { fontSize: 11 },
});
