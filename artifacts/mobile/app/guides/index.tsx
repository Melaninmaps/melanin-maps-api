import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
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

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function getToken() { try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); } catch { return null; } }
async function authHeaders(): Promise<Record<string, string>> { const t = await getToken(); return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }; }

interface Guide {
  id: string;
  title: string;
  subjectName: string;
  storyType: string;
  subjectEmoji: string;
  experienceContext: string | null;
  city: string | null;
  followCount: number;
  viewCount: number;
  sectionCount: number;
  itemCount: number;
  authorFirstName: string | null;
  authorLastName: string | null;
  authorCity: string | null;
}

const STORY_TABS = [
  { key: "all", label: "All", emoji: "✨" },
  { key: "university", label: "University", emoji: "🎓" },
  { key: "health", label: "Health", emoji: "💊" },
  { key: "business", label: "Business", emoji: "💼" },
  { key: "neighborhood", label: "Neighborhood", emoji: "🏙️" },
  { key: "career", label: "Career", emoji: "🚀" },
  { key: "lifestyle", label: "Lifestyle", emoji: "🌱" },
  { key: "travel", label: "Travel", emoji: "✈️" },
];

const STORY_PROMPTS: Record<string, string[]> = {
  university: ["My Howard Starter Guide", "Surviving Spelman Freshman Year", "Everything I Learned at FAMU"],
  health: ["Living with Type 2 Diabetes — My 15 Year Journey", "My Sickle Cell Management Guide", "Beating Hypertension Naturally"],
  business: ["How I Launched My Business in Philly", "Black Entrepreneur Playbook — Atlanta", "Building a Brand from $0"],
  neighborhood: ["South Side Chicago Locals Guide", "Moving to D.C. — What to Know", "Harlem Hidden Gems"],
  career: ["Breaking into Tech as a Black Professional", "My HBCU-to-Corporate Journey", "How I Got Into the Room"],
  travel: ["Moving to Ghana — My First Year", "Lagos for Black Americans", "Brazil Solo Travel Guide"],
  lifestyle: ["My Natural Hair Routine & Faves", "Raising Black Kids with Intention", "Plant-Based on a Budget"],
};

function authorName(g: Guide) {
  const first = g.authorFirstName ?? "";
  const last = g.authorLastName ? ` ${g.authorLastName[0]}.` : "";
  return first ? `${first}${last}` : "Community Member";
}

export default function GuidesIndexScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async (tab: string, q: string) => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const params = new URLSearchParams();
      if (tab !== "all") params.set("storyType", tab);
      if (q.trim()) params.set("search", q.trim());
      const res = await fetch(`${getApiBase()}/api/guides?${params}`, { headers: h });
      if (res.ok) {
        const d = await res.json() as { guides: Guide[] };
        setGuides(d.guides ?? []);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(activeTab, search); }, [load, activeTab]);

  const handleSearch = () => load(activeTab, search);

  const prompts = STORY_PROMPTS[activeTab] ?? [];

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Pay It Forward</Text>
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Guides from lived experience</Text>
          </View>
          <TouchableOpacity
            style={[s.createBtn, { backgroundColor: "#CA922B" }]}
            onPress={() => router.push("/guides/create" as never)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={15} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[s.searchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} style={{ marginLeft: 10 }} />
          <TextInput
            style={[s.searchInput, { color: colors.foreground }]}
            placeholder="Search guides..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(""); load(activeTab, ""); }}>
              <Feather name="x" size={14} color={colors.mutedForeground} style={{ marginRight: 10 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Story type tabs */}
        <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
          {STORY_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && { backgroundColor: "#CA922B" }]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={s.tabEmoji}>{tab.emoji}</Text>
              <Text style={[s.tabTxt, { color: activeTab === tab.key ? "#fff" : colors.mutedForeground }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#CA922B" /></View>
      ) : (
        <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 40 }}>

          {/* Empty state with prompts */}
          {guides.length === 0 && (
            <View>
              <View style={s.empty}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>🕊️</Text>
                <Text style={[s.emptyTitle, { color: colors.foreground }]}>No guides yet in this category</Text>
                <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                  Be the first to share your lived experience. Your knowledge could help thousands.
                </Text>
                <TouchableOpacity
                  style={[s.ctaBtn, { backgroundColor: "#CA922B", marginTop: 16 }]}
                  onPress={() => router.push("/guides/create" as never)}
                  activeOpacity={0.8}
                >
                  <Feather name="edit-2" size={14} color="#fff" />
                  <Text style={s.ctaTxt}>Create the First Guide</Text>
                </TouchableOpacity>
              </View>
              {prompts.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>GUIDES PEOPLE NEED</Text>
                  {prompts.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[s.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => router.push("/guides/create" as never)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.promptTxt, { color: colors.foreground }]}>"{p}"</Text>
                      <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Guide cards */}
          {guides.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/guides/[id]", params: { id: g.id } } as never)}
              activeOpacity={0.75}
            >
              <View style={s.cardTop}>
                <Text style={s.cardEmoji}>{g.subjectEmoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{g.title}</Text>
                  {g.experienceContext && (
                    <Text style={[s.cardContext, { color: "#CA922B" }]}>{g.experienceContext}</Text>
                  )}
                </View>
              </View>
              <View style={s.cardMeta}>
                <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>by {authorName(g)}</Text>
                {g.authorCity && <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>· {g.authorCity}</Text>}
                <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>· {g.sectionCount} sections</Text>
                <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>· {g.itemCount} tips</Text>
              </View>
              <View style={s.cardFooter}>
                <View style={[s.typeBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[s.typeTxt, { color: colors.mutedForeground }]}>
                    {STORY_TABS.find((t) => t.key === g.storyType)?.emoji ?? "✨"} {STORY_TABS.find((t) => t.key === g.storyType)?.label ?? g.storyType}
                  </Text>
                </View>
                <View style={s.statsRow}>
                  <Feather name="users" size={11} color={colors.mutedForeground} />
                  <Text style={[s.statTxt, { color: colors.mutedForeground }]}>{g.followCount}</Text>
                  <Feather name="eye" size={11} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
                  <Text style={[s.statTxt, { color: colors.mutedForeground }]}>{g.viewCount}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Bottom CTA */}
          {guides.length > 0 && (
            <TouchableOpacity
              style={[s.bottomCta, { borderColor: "#CA922B" }]}
              onPress={() => router.push("/guides/create" as never)}
              activeOpacity={0.8}
            >
              <Feather name="edit-2" size={15} color="#CA922B" />
              <Text style={[s.bottomCtaTxt, { color: "#CA922B" }]}>Share your experience →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 16, paddingBottom: 0, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 10 },
  backBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  createBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, marginBottom: 10, height: 40 },
  searchInput: { flex: 1, fontSize: 14, paddingHorizontal: 8 },
  tabScroll: { paddingBottom: 12, gap: 8, paddingRight: 8 },
  tab: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "transparent" },
  tabEmoji: { fontSize: 13 },
  tabTxt: { fontSize: 13, fontWeight: "600" },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, textTransform: "uppercase" },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 8 },
  cardEmoji: { fontSize: 34, marginTop: 2 },
  cardTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  cardContext: { fontSize: 12, fontWeight: "600", marginTop: 3 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 10 },
  cardMetaTxt: { fontSize: 11 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  typeTxt: { fontSize: 11, fontWeight: "600" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statTxt: { fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptySub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  ctaBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 24 },
  ctaTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  promptCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  promptTxt: { flex: 1, fontSize: 13, fontStyle: "italic" },
  bottomCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, marginTop: 8, borderStyle: "dashed" },
  bottomCtaTxt: { fontSize: 15, fontWeight: "700" },
});
