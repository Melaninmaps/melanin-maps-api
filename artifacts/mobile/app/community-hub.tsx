import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function getToken() { try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); } catch { return null; } }
async function authHeaders(): Promise<Record<string, string>> { const t = await getToken(); return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }; }

interface Guide { id: string; title: string; subjectName: string; storyType: string; subjectEmoji: string; followCount: number; viewCount: number; }
interface Collection { id: string; title: string; coverEmoji: string; itemCount: number; followCount: number; description: string | null; }
interface Roadmap { id: string; title: string; coverEmoji: string; completedSteps: number; totalSteps: number; topicName: string | null; }
interface Journey { id: string; title: string; currentPhase: string | null; phasesCount: number; connectionsCount: number; }

const STORY_TYPE_EMOJI: Record<string, string> = {
  university: "🎓", health: "💊", business: "💼", neighborhood: "🏙️",
  career: "🚀", lifestyle: "🌱", travel: "✈️",
};

export default function CommunityHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [userId, setUserId] = useState<string | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const h = await authHeaders();
      const base = getApiBase();

      const profileRes = await fetch(`${base}/api/profile`, { headers: h });
      if (!profileRes.ok) { setLoading(false); setRefreshing(false); return; }
      const profile = await profileRes.json() as { id?: string; user?: { id: string; firstName?: string | null } };
      const uid = profile.id ?? profile.user?.id;
      const fname = profile.user?.firstName ?? null;
      if (!uid) { setLoading(false); setRefreshing(false); return; }
      setUserId(uid);
      setFirstName(fname);

      const [guidesRes, colRes, roadmapRes, journeyRes] = await Promise.allSettled([
        fetch(`${base}/api/users/${uid}/guides`, { headers: h }),
        fetch(`${base}/api/collections?userId=${uid}`, { headers: h }),
        fetch(`${base}/api/roadmaps`, { headers: h }),
        fetch(`${base}/api/journeys`, { headers: h }),
      ]);

      if (guidesRes.status === "fulfilled" && guidesRes.value.ok) {
        const d = await guidesRes.value.json() as { guides?: Guide[] };
        setGuides((d.guides ?? []).slice(0, 5));
      }
      if (colRes.status === "fulfilled" && colRes.value.ok) {
        const d = await colRes.value.json() as { collections?: Collection[] };
        setCollections((d.collections ?? []).slice(0, 5));
      }
      if (roadmapRes.status === "fulfilled" && roadmapRes.value.ok) {
        const d = await roadmapRes.value.json() as { roadmaps?: Roadmap[] };
        setRoadmaps((d.roadmaps ?? []).filter((r) => r.completedSteps < r.totalSteps).slice(0, 4));
      }
      if (journeyRes.status === "fulfilled" && journeyRes.value.ok) {
        const d = await journeyRes.value.json() as { journeys?: Journey[] };
        if (d.journeys && d.journeys.length > 0) setJourney(d.journeys[0]);
      }
    } catch { /* silent */ } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totalItems = guides.length + collections.length + roadmaps.length + (journey ? 1 : 0);

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>My Hub</Text>
        </View>
        <View style={s.center}><ActivityIndicator size="large" color="#CA922B" /></View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>My Hub</Text>
          {firstName && <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Everything you've built, {firstName}</Text>}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} tintColor="#CA922B" />}
      >
        {totalItems === 0 && (
          <View style={s.emptyHero}>
            <Text style={{ fontSize: 48, marginBottom: 14 }}>🌱</Text>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>Your hub is ready</Text>
            <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Start by creating a Pay It Forward guide, a collection, or an AI roadmap. Everything you build lives here.</Text>
            <View style={s.emptyActions}>
              <TouchableOpacity style={[s.emptyBtn, { backgroundColor: "#CA922B" }]} onPress={() => router.push("/guides/create" as never)} activeOpacity={0.8}>
                <Feather name="gift" size={15} color="#fff" />
                <Text style={s.emptyBtnTxt}>Create a Guide</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]} onPress={() => router.push("/collections/create" as never)} activeOpacity={0.8}>
                <Feather name="bookmark" size={15} color={colors.foreground} />
                <Text style={[s.emptyBtnTxt, { color: colors.foreground }]}>New Collection</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Pay It Forward Guides ─── */}
        <HubSection
          emoji="🕊️"
          title="Pay It Forward"
          subtitle={`${guides.length} guide${guides.length !== 1 ? "s" : ""}`}
          onSeeAll={() => router.push("/guides" as never)}
          onAdd={() => router.push("/guides/create" as never)}
          colors={colors}
          empty={guides.length === 0}
          emptyText="Share your lived experience — university life, health journeys, neighborhood moves."
        >
          {guides.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[s.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/guides/[id]", params: { id: g.id } } as never)}
              activeOpacity={0.75}
            >
              <Text style={s.itemEmoji}>{g.subjectEmoji || STORY_TYPE_EMOJI[g.storyType] || "📖"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.itemTitle, { color: colors.foreground }]} numberOfLines={1}>{g.title}</Text>
                <Text style={[s.itemMeta, { color: colors.mutedForeground }]}>{g.subjectName} · {g.followCount} followers</Text>
              </View>
              <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </HubSection>

        {/* ─── Collections ─── */}
        <HubSection
          emoji="📌"
          title="My Collections"
          subtitle={`${collections.length} collection${collections.length !== 1 ? "s" : ""}`}
          onSeeAll={() => router.push("/collections" as never)}
          onAdd={() => router.push("/collections/create" as never)}
          colors={colors}
          empty={collections.length === 0}
          emptyText="Create curated lists — Moving to Atlanta, Best of Philly, Diabetes Resources."
        >
          {collections.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[s.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/collections/[id]", params: { id: c.id } } as never)}
              activeOpacity={0.75}
            >
              <Text style={s.itemEmoji}>{c.coverEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.itemTitle, { color: colors.foreground }]} numberOfLines={1}>{c.title}</Text>
                <Text style={[s.itemMeta, { color: colors.mutedForeground }]}>{c.itemCount} items · {c.followCount} followers</Text>
              </View>
              <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </HubSection>

        {/* ─── Active Roadmaps ─── */}
        <HubSection
          emoji="🗺️"
          title="Active Roadmaps"
          subtitle={`${roadmaps.length} in progress`}
          onSeeAll={null}
          onAdd={null}
          colors={colors}
          empty={roadmaps.length === 0}
          emptyText="AI roadmaps guide you step-by-step through big life goals. Start one from the Library."
        >
          {roadmaps.map((r) => {
            const pct = r.totalSteps > 0 ? Math.round((r.completedSteps / r.totalSteps) * 100) : 0;
            return (
              <TouchableOpacity
                key={r.id}
                style={[s.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/roadmap/[id]", params: { id: r.id } } as never)}
                activeOpacity={0.75}
              >
                <Text style={s.itemEmoji}>{r.coverEmoji}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[s.itemTitle, { color: colors.foreground }]} numberOfLines={1}>{r.title}</Text>
                  <View style={[s.progressBar, { backgroundColor: colors.secondary }]}>
                    <View style={[s.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={[s.itemMeta, { color: colors.mutedForeground }]}>{r.completedSteps}/{r.totalSteps} steps · {pct}%</Text>
                </View>
                <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          })}
        </HubSection>

        {/* ─── Life Journey ─── */}
        {journey && (
          <HubSection
            emoji="🌍"
            title="Life Journey"
            subtitle={`${journey.phasesCount} phase${journey.phasesCount !== 1 ? "s" : ""} · ${journey.connectionsCount} connections`}
            onSeeAll={() => router.push("/life-journey" as never)}
            onAdd={null}
            colors={colors}
            empty={false}
            emptyText=""
          >
            <TouchableOpacity
              style={[s.journeyCard, { backgroundColor: "#1A3B2B", borderColor: "#2D7A4F55" }]}
              onPress={() => router.push("/life-journey" as never)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.itemTitle, { color: "#FFFFFF" }]}>{journey.title}</Text>
                {journey.currentPhase && (
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 3 }}>
                    Current phase: {journey.currentPhase}
                  </Text>
                )}
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 5 }}>
                  {journey.phasesCount} phases · {journey.connectionsCount} people &amp; places connected
                </Text>
              </View>
              <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </HubSection>
        )}

        {/* ─── Quick Actions ─── */}
        <View style={s.sectionWrap}>
          <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Quick Actions</Text>
          <View style={s.quickGrid}>
            {[
              { emoji: "🗺️", label: "AI Roadmap", route: "/(tabs)/library" },
              { emoji: "🌍", label: "Travel Plan", route: "/travel-planner" },
              { emoji: "🎓", label: "Knowledge", route: "/(tabs)/library" },
              { emoji: "🤝", label: "Circles", route: "/circles/create" },
            ].map((q) => (
              <TouchableOpacity
                key={q.label}
                style={[s.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(q.route as never)}
                activeOpacity={0.75}
              >
                <Text style={s.quickEmoji}>{q.emoji}</Text>
                <Text style={[s.quickLabel, { color: colors.foreground }]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function HubSection({
  emoji, title, subtitle, onSeeAll, onAdd, children, colors, empty, emptyText,
}: {
  emoji: string; title: string; subtitle: string;
  onSeeAll: (() => void) | null; onAdd: (() => void) | null;
  children: React.ReactNode; colors: ReturnType<typeof useColors>;
  empty: boolean; emptyText: string;
}) {
  return (
    <View style={s.sectionWrap}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionEmoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {onAdd && (
            <TouchableOpacity onPress={onAdd} style={[s.sectionAdd, { borderColor: colors.border }]} activeOpacity={0.7}>
              <Feather name="plus" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          {onSeeAll && (
            <TouchableOpacity onPress={onSeeAll} style={[s.seeAllBtn, { borderColor: "#CA922B" }]} activeOpacity={0.7}>
              <Text style={s.seeAllTxt}>See All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {empty ? (
        <View style={[s.sectionEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionEmptyTxt, { color: colors.mutedForeground }]}>{emptyText}</Text>
          {onAdd && (
            <TouchableOpacity onPress={onAdd} style={[s.sectionEmptyAdd, { backgroundColor: "#CA922B" }]} activeOpacity={0.8}>
              <Feather name="plus" size={13} color="#fff" />
              <Text style={s.sectionEmptyAddTxt}>Create one</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : children}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  emptyHero: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 36 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  emptySub: { fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 24 },
  emptyActions: { flexDirection: "row", gap: 12 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 22 },
  emptyBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sectionWrap: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionSub: { fontSize: 11, marginTop: 1 },
  sectionAdd: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  seeAllBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  seeAllTxt: { fontSize: 11, fontWeight: "700", color: "#CA922B" },
  sectionEmpty: { padding: 16, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 10 },
  sectionEmptyTxt: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  sectionEmptyAdd: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  sectionEmptyAddTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  sectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  itemCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  itemEmoji: { fontSize: 22 },
  itemTitle: { fontSize: 14, fontWeight: "600" },
  itemMeta: { fontSize: 11, marginTop: 2 },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: "#CA922B" },
  journeyCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: { width: "47%", alignItems: "center", paddingVertical: 18, borderRadius: 14, borderWidth: 1, gap: 8 },
  quickEmoji: { fontSize: 26 },
  quickLabel: { fontSize: 13, fontWeight: "600" },
});
