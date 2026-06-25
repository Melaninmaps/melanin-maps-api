import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
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

const SAMPLE_CONTENT: Record<string, { title: string; summary: string; content: string; category: string; tier: string; authorName: string; authorBadge: string | null; readTimeMinutes: number; disclaimer: string | null }> = {
  s1: {
    title: "5 Signs You Should See a Primary Care Physician",
    summary: "Knowing when to make that appointment could save your life.",
    category: "health",
    tier: "free",
    authorName: "Editorial",
    authorBadge: null,
    readTimeMinutes: 3,
    disclaimer: "This article is for educational purposes only and does not constitute medical advice. Please consult a licensed healthcare provider for personalized guidance.",
    content: `Many people delay seeing a doctor until something feels seriously wrong. But preventive care matters — and certain signs should never be ignored.\n\n**1. You haven't had a checkup in over a year**\nAnnual physicals help establish your baseline health metrics and catch problems early. This is especially important for adults over 30.\n\n**2. You're experiencing unexplained fatigue**\nPersistent tiredness that doesn't improve with rest can indicate thyroid issues, anemia, diabetes, or other conditions that are easily managed when caught early.\n\n**3. Your weight has changed significantly**\nUnexplained weight gain or loss can signal hormonal imbalances, metabolic changes, or other health concerns worth discussing with a physician.\n\n**4. You have a family history of chronic illness**\nIf heart disease, diabetes, cancer, or hypertension run in your family, earlier and more frequent screenings can dramatically improve outcomes.\n\n**5. You're managing ongoing stress or anxiety**\nChronic stress has measurable physical effects — elevated blood pressure, immune suppression, and sleep disruption. A primary care physician can connect you with the right resources.\n\nFinding a Black physician who understands your community's specific health experiences can make a meaningful difference. Use our Discover tab to find minority-owned medical practices near you.`,
  },
  s2: {
    title: "Best Neighborhoods in Atlanta for Black Families",
    summary: "A community guide to Atlanta's most welcoming areas.",
    category: "relocation",
    tier: "free",
    authorName: "Editorial",
    authorBadge: null,
    readTimeMinutes: 5,
    disclaimer: null,
    content: `Atlanta has long been a destination city for Black families seeking community, culture, and economic opportunity. Here's a look at some of the most welcoming neighborhoods.\n\n**Cascade Heights**\nHistorically one of Atlanta's most prominent Black middle-class neighborhoods, Cascade offers beautiful homes, strong schools, and a deeply rooted community. You'll find minority-owned businesses throughout the commercial corridor.\n\n**Southwest Atlanta (SWATS)**\nKnown for its cultural pride, southwest Atlanta has been a hub of Black entrepreneurship for generations. The area has seen significant reinvestment while maintaining its community identity.\n\n**Stonecrest**\nJust southeast of Atlanta, Stonecrest was incorporated as a majority-Black city in 2017. It features newer construction, good schools, and a growing commercial district.\n\n**Lithonia / DeKalb County**\nA broader area with strong Black homeownership rates, excellent access to interstates, and a range of price points from starter homes to larger properties.\n\n**What to look for when choosing a neighborhood**\nBeyond the neighborhood itself, consider: school quality, commute time, proximity to minority-owned healthcare, grocery access, and community organizations. Our Relocation Guides (Knowledge+) go deeper on each of these factors with real data.`,
  },
  s3: {
    title: "Things to Do in Brazil — A Cultural Travel Guide",
    summary: "Discover Afro-Brazilian culture, food, and community.",
    category: "travel",
    tier: "free",
    authorName: "Community Writer",
    authorBadge: null,
    readTimeMinutes: 6,
    disclaimer: null,
    content: `Brazil is home to the largest African diaspora population outside the African continent. Traveling with cultural intention opens a completely different experience.\n\n**Salvador, Bahia**\nSalvador is the heart of Afro-Brazilian culture. The Pelourinho (Historic Center) is a UNESCO World Heritage Site with stunning colonial architecture, local art, and the sounds of axé music. Visit the Museu Afro-Brasileiro for essential context.\n\n**Capoeira**\nOriginating as a form of resistance among enslaved Africans in Brazil, capoeira is a martial art, dance, and cultural practice. You can find performances and classes throughout Salvador and Rio.\n\n**Candomblé**\nAfro-Brazilian religious traditions are central to understanding the culture. Candomblé ceremonies are sometimes open to respectful visitors — always ask permission before photographing.\n\n**minority-owned restaurants and markets**\nSeek out acarajé (a West African-influenced street food), moqueca (fish stew), and vatapá. The Feira de São Joaquim market in Salvador is an extraordinary experience.\n\n**Rio de Janeiro**\nBeyond the tourist trail, the Madureira neighborhood is a hub of Afro-Brazilian culture with vibrant street life and the Mercadão de Madureira.\n\nFor a complete 7-day itinerary with budget planner, safety summary, and community video guide, explore Knowledge+.`,
  },
  s6: {
    title: "The Importance of Annual Physicals",
    summary: "What happens at a physical and why you shouldn't skip it.",
    category: "health",
    tier: "free",
    authorName: "Dr. Aisha M.",
    authorBadge: "✅ Verified Physician",
    readTimeMinutes: 4,
    disclaimer: "This article is educational content only. It is not a substitute for personalized medical advice from a licensed physician.",
    content: `As a physician, one of the most common things I hear from patients is: "I only come in when something is wrong." I understand the sentiment — life is busy, healthcare can be daunting, and if you feel fine, why fix what isn't broken?\n\nBut preventive medicine works precisely because it finds problems before they feel like problems.\n\n**What happens at an annual physical?**\n\nA comprehensive physical typically includes:\n- Blood pressure measurement\n- Height, weight, and BMI\n- Blood work: cholesterol, blood sugar, kidney function, thyroid (depending on age and history)\n- Cancer screenings appropriate to your age and risk\n- Vaccination review\n- A conversation about your mental health, lifestyle, and family history\n\n**Why this matters for our community**\n\nBlack Americans carry a disproportionate burden of hypertension, diabetes, and certain cancers — not because of genetics, but largely because of systemic healthcare inequities that result in delayed diagnosis.\n\nAn annual physical is one of the most powerful tools for closing that gap on your own terms.\n\n**Finding a physician you trust**\n\nResearch consistently shows that cultural concordance in healthcare — seeing a provider who shares your background — improves patient satisfaction, communication, and adherence to care plans. Use our Discover tab to find minority-owned medical practices in your area.`,
  },
  s7: {
    title: "Building Generational Wealth Through Real Estate",
    summary: "How to start investing in property with limited capital.",
    category: "money",
    tier: "free",
    authorName: "Editorial",
    authorBadge: null,
    readTimeMinutes: 7,
    disclaimer: null,
    content: `Real estate remains one of the most reliable vehicles for building generational wealth — and it's more accessible than many people think.\n\n**Start with what you have**\n\nYou don't need to buy an investment property first. Buying your primary residence and building equity over time is the foundation. Even a small condo in a growing area can appreciate significantly over a 10-year horizon.\n\n**House hacking**\n\nBuying a duplex or multi-family property and living in one unit while renting out the others is one of the most effective strategies for beginners. Your tenants help pay your mortgage while you build equity.\n\n**FHA loans and down payment assistance**\n\nFHA loans allow as little as 3.5% down. Many states also offer down payment assistance programs specifically designed to help first-generation homebuyers.\n\n**The Black homeownership gap**\n\nBlack homeownership rates remain significantly below white homeownership rates — a direct consequence of historical redlining and discriminatory lending. Building real estate wealth is both a personal and communal act.\n\n**Working with Black realtors and lenders**\n\nPartner with professionals who understand your goals and your community. Find minority-owned realty firms and mortgage lenders on our platform.`,
  },
};

interface ArticleData {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  subcategory?: string | null;
  tier: string;
  authorName: string;
  authorBadge?: string | null;
  authorId?: string | null;
  imageUrl?: string | null;
  readTimeMinutes?: number | null;
  disclaimer?: string | null;
  locked?: boolean;
  viewCount?: number | null;
  publishedAt?: string | null;
}

export default function LibraryArticleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  const { subscription } = useMembership();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (!articleId) { setLoading(false); return; }

      if (articleId.startsWith("s") && SAMPLE_CONTENT[articleId]) {
        setArticle({ id: articleId, ...SAMPLE_CONTENT[articleId] });
        setLoading(false);
        return;
      }

      try {
        const h = await authHeaders();
        const res = await fetch(`${getApiBase()}/api/knowledge/articles/${articleId}`, { headers: h });
        if (res.ok) {
          const data = await res.json() as { article: ArticleData };
          setArticle(data.article);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [articleId]);

  useEffect(() => {
    if (!articleId || !articleId.startsWith("s")) {
      (async () => {
        try {
          const h = await authHeaders();
          const res = await fetch(`${getApiBase()}/api/knowledge/articles/${articleId}/bookmark-status`, { headers: h });
          if (res.ok) { const d = await res.json() as { bookmarked: boolean }; setBookmarked(d.bookmarked); }
        } catch { /* */ }
      })();
    }
  }, [articleId]);

  async function toggleBookmark() {
    if (!articleId) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarkLoading(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/knowledge/articles/${articleId}/bookmark`, {
        method: "POST", headers: { ...h, "Content-Type": "application/json" },
      });
      if (res.ok) { const d = await res.json() as { bookmarked: boolean }; setBookmarked(d.bookmarked); }
    } catch { /* */ } finally { setBookmarkLoading(false); }
  }

  const catMeta = CATEGORY_META[article?.category ?? ""] ?? { emoji: "📚", color: "#6B7280" };

  if (loading) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 36 }}>📖</Text>
        <Text style={[{ color: colors.foreground, fontSize: 17, fontWeight: "700", marginTop: 10 }]}>Article not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnLarge, { borderColor: colors.border }]}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLocked = article.tier === "premium" && !subscription;

  return (
    <>
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/library" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={toggleBookmark} disabled={bookmarkLoading} style={styles.bookmarkBtn}>
          <Feather name={bookmarked ? "bookmark" : "bookmark"} size={20} color={bookmarked ? "#CA922B" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}>
        {/* Article meta */}
        <View style={styles.articleMeta}>
          <View style={styles.metaRow}>
            <View style={[styles.catPill, { backgroundColor: catMeta.color + "18" }]}>
              <Text style={[styles.catPillTxt, { color: catMeta.color }]}>{catMeta.emoji} {article.category}</Text>
            </View>
            {article.tier === "premium" && (
              <View style={[styles.kPlusPill, { backgroundColor: "#CA922B18" }]}>
                <Text style={[styles.kPlusPillTxt, { color: "#CA922B" }]}>⭐ Knowledge+</Text>
              </View>
            )}
            <Text style={[styles.readTime, { color: colors.mutedForeground }]}>
              {article.readTimeMinutes ?? 4} min read
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{article.title}</Text>
          <Text style={[styles.summary, { color: colors.mutedForeground }]}>{article.summary}</Text>

          {/* Author */}
          <View style={[styles.authorBar, { borderColor: colors.border }]}>
            <View style={[styles.authorAvatar, { backgroundColor: catMeta.color + "18" }]}>
              <Text style={{ fontSize: 18 }}>👤</Text>
            </View>
            <View style={{ gap: 1 }}>
              <Text style={[styles.authorName, { color: colors.foreground }]}>{article.authorName}</Text>
              {article.authorBadge && (
                <Text style={[styles.authorBadge, { color: "#16A34A" }]}>{article.authorBadge}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        {article.disclaimer && (
          <View style={[styles.disclaimer, { backgroundColor: "#F59E0B10", borderColor: "#F59E0B30" }]}>
            <Feather name="alert-circle" size={13} color="#F59E0B" />
            <Text style={[styles.disclaimerTxt, { color: colors.mutedForeground }]}>{article.disclaimer}</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.contentWrap}>
          {article.content.split("\n\n").map((para, i) => {
            const isBold = para.startsWith("**") && para.includes("**");
            if (isBold) {
              const cleaned = para.replace(/\*\*/g, "");
              return (
                <Text key={i} style={[styles.paraHeading, { color: colors.foreground }]}>{cleaned}</Text>
              );
            }
            return (
              <Text key={i} style={[styles.para, { color: colors.foreground }]}>{para}</Text>
            );
          })}
        </View>

        {/* Paywall for locked content */}
        {isLocked && (
          <View style={[styles.paywall, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 28, textAlign: "center" }}>⭐</Text>
            <Text style={[styles.paywallTitle, { color: colors.foreground }]}>Continue Reading with Knowledge+</Text>
            <Text style={[styles.paywallSub, { color: colors.mutedForeground }]}>
              This is a Knowledge+ article. Upgrade to unlock expert guides, comprehensive resources, and AI-powered learning.
            </Text>
            <TouchableOpacity
              style={[styles.paywallBtn, { backgroundColor: "#CA922B" }]}
              onPress={() => setShowUpgrade(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.paywallBtnTxt}>Unlock Knowledge+</Text>
              <Feather name="arrow-right" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* KinfolkAI CTA */}
        {!isLocked && (
          <TouchableOpacity
            style={[styles.kinfolkCta, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/(tabs)/travel", params: { kinfolkPrompt: `Tell me more about: ${article.title}` } } as never)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 20 }}>🤖</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[{ color: colors.foreground, fontSize: 13, fontWeight: "700" }]}>Explore with KinfolkAI</Text>
              <Text style={[{ color: colors.mutedForeground, fontSize: 12 }]}>Ask personalized follow-up questions</Text>
            </View>
            <Feather name="arrow-right" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
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
  centered: { alignItems: "center", justifyContent: "center", gap: 10 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1, gap: 10 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  bookmarkBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backBtnLarge: { marginTop: 14, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  articleMeta: { padding: 16, gap: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  catPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catPillTxt: { fontSize: 11, fontWeight: "700" },
  kPlusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  kPlusPillTxt: { fontSize: 11, fontWeight: "800" },
  readTime: { fontSize: 11 },
  title: { fontSize: 22, fontWeight: "800", lineHeight: 28 },
  summary: { fontSize: 15, lineHeight: 22 },
  authorBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 10, borderTopWidth: 1 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  authorName: { fontSize: 13, fontWeight: "700" },
  authorBadge: { fontSize: 11, fontWeight: "700" },
  disclaimer: { marginHorizontal: 16, marginBottom: 4, flexDirection: "row", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: "flex-start" },
  disclaimerTxt: { fontSize: 12, lineHeight: 17, flex: 1 },
  contentWrap: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  para: { fontSize: 15, lineHeight: 24 },
  paraHeading: { fontSize: 16, fontWeight: "800", lineHeight: 22, marginTop: 4 },
  paywall: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 10 },
  paywallTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  paywallSub: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  paywallBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 50, marginTop: 6 },
  paywallBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  kinfolkCta: { margin: 16, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
});
