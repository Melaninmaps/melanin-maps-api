import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
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

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function getToken() { try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); } catch { return null; } }
async function authHeaders(): Promise<Record<string, string>> { const t = await getToken(); return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }; }

type OppTab = "jobs" | "scholarships" | "mentorship" | "volunteer" | "grants";
const OPP_TABS: { id: OppTab; emoji: string; label: string }[] = [
  { id: "jobs",         emoji: "💼", label: "Jobs" },
  { id: "scholarships", emoji: "🎓", label: "Scholarships" },
  { id: "grants",       emoji: "💰", label: "Grants" },
  { id: "mentorship",   emoji: "🤝", label: "Mentorship" },
  { id: "volunteer",    emoji: "❤️", label: "Volunteer" },
];

interface JobListing {
  id: string; title: string; company: string; location: string | null;
  type: string | null; description: string | null; url: string | null;
  isRemote: boolean | null; createdAt: string;
}
interface MentorProfile {
  id: string; displayName: string | null; headline: string | null;
  specialties: string[] | null; city: string | null; isAvailable: boolean;
}

const FEATURED_RESOURCES: Record<OppTab, { emoji: string; title: string; subtitle: string; url: string }[]> = {
  jobs: [
    { emoji: "✊🏾", title: "Jopwell", subtitle: "Diversity career platform", url: "https://jopwell.com" },
    { emoji: "🌍", title: "UNCF CareerLink", subtitle: "HBCU career network", url: "https://careers.uncf.org" },
    { emoji: "🏛️", title: "USAJOBS", subtitle: "Federal government jobs", url: "https://usajobs.gov" },
  ],
  scholarships: [
    { emoji: "🎓", title: "UNCF Scholarships", subtitle: "Largest HBCU scholarship org", url: "https://uncf.org/scholarships" },
    { emoji: "📚", title: "Thurgood Marshall Fund", subtitle: "HBCU student scholarships", url: "https://tmcf.org" },
    { emoji: "💡", title: "Ron Brown Scholar", subtitle: "Community leader scholarships", url: "https://ronbrown.org" },
  ],
  grants: [
    { emoji: "📈", title: "SBA Minority Programs", subtitle: "Small business grants & loans", url: "https://sba.gov" },
    { emoji: "🏆", title: "NAACP Economic Programs", subtitle: "Business & community grants", url: "https://naacp.org" },
    { emoji: "🌿", title: "BlackEnterprise Grants", subtitle: "Entrepreneur resources", url: "https://blackenterprise.com" },
  ],
  mentorship: [
    { emoji: "✦", title: "MWM Mentors", subtitle: "Community mentors near you", url: "" },
    { emoji: "🎯", title: "My Brother's Keeper", subtitle: "Obama Foundation mentorship", url: "https://obama.org/mbka" },
    { emoji: "👩🏾‍💼", title: "SCORE Mentors", subtitle: "Free business mentorship", url: "https://score.org" },
  ],
  volunteer: [
    { emoji: "🏘️", title: "Habitat for Humanity", subtitle: "Build affordable housing", url: "https://habitat.org" },
    { emoji: "📖", title: "Book clubs & literacy", subtitle: "Community reading programs", url: "" },
    { emoji: "🌱", title: "Urban Gardens", subtitle: "Community food initiatives", url: "" },
  ],
};

export default function OpportunitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [activeTab, setActiveTab] = useState<OppTab>("jobs");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/jobs?limit=20`, { headers: h });
      if (res.ok) {
        const data = await res.json() as { jobs?: JobListing[]; listings?: JobListing[] };
        setJobs(data.jobs ?? data.listings ?? []);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const loadMentors = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/mentorship?limit=20`, { headers: h });
      if (res.ok) {
        const data = await res.json() as { mentors?: MentorProfile[]; profiles?: MentorProfile[] };
        setMentors(data.mentors ?? data.profiles ?? []);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "jobs") loadJobs();
    else if (activeTab === "mentorship") loadMentors();
    else setLoading(false);
  }, [activeTab, loadJobs, loadMentors]);

  const resources = FEATURED_RESOURCES[activeTab] ?? [];

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Opportunity Center</Text>
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Jobs · Scholarships · Grants · Mentorship</Text>
          </View>
          <TouchableOpacity style={[s.postBtn, { backgroundColor: "#CA922B" }]} onPress={() => router.push("/(tabs)/community" as never)} activeOpacity={0.8}>
            <Feather name="plus" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
      <View style={[s.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBarInner}>
          {OPP_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[s.tab, active && { borderBottomColor: "#CA922B" }]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
                <Text style={[s.tabLabel, { color: active ? "#CA922B" : colors.mutedForeground }, active && { fontWeight: "700" }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 60, paddingTop: 8 }}>

        {/* Featured resources */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Featured Resources</Text>
          {resources.map((r, i) => (
            <TouchableOpacity
              key={i}
              style={[s.resourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => r.url ? Linking.openURL(r.url) : undefined}
              activeOpacity={0.75}
            >
              <Text style={s.resourceEmoji}>{r.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.resourceTitle, { color: colors.foreground }]}>{r.title}</Text>
                <Text style={[s.resourceSub, { color: colors.mutedForeground }]}>{r.subtitle}</Text>
              </View>
              {!!r.url && <Feather name="external-link" size={14} color={colors.mutedForeground} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Jobs tab */}
        {activeTab === "jobs" && (
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Recent Listings</Text>
            {loading ? <ActivityIndicator color="#CA922B" style={{ marginTop: 24 }} /> : jobs.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>💼</Text>
                <Text style={[s.emptyTitle, { color: colors.foreground }]}>No listings yet</Text>
                <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Be the first to post a job in the community.</Text>
              </View>
            ) : jobs.map((job) => (
              <TouchableOpacity key={job.id} style={[s.listCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push({ pathname: "/jobs/[id]", params: { id: job.id } } as never)} activeOpacity={0.75}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.listTitle, { color: colors.foreground }]} numberOfLines={2}>{job.title}</Text>
                  <Text style={[s.listSub, { color: colors.mutedForeground }]}>{job.company}{job.location ? ` · ${job.location}` : ""}{job.isRemote ? " · Remote" : ""}</Text>
                  {job.type && <View style={[s.tag, { backgroundColor: "#CA922B15" }]}><Text style={[s.tagTxt, { color: "#CA922B" }]}>{job.type}</Text></View>}
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mentorship tab */}
        {activeTab === "mentorship" && (
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Available Mentors</Text>
            {loading ? <ActivityIndicator color="#CA922B" style={{ marginTop: 24 }} /> : mentors.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>🌟</Text>
                <Text style={[s.emptyTitle, { color: colors.foreground }]}>No mentors yet</Text>
                <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Volunteer to mentor others in the community.</Text>
                <TouchableOpacity style={[s.ctaBtn, { backgroundColor: "#CA922B", marginTop: 16 }]} onPress={() => router.push("/mentorship" as never)} activeOpacity={0.8}>
                  <Text style={s.ctaTxt}>Become a Mentor</Text>
                </TouchableOpacity>
              </View>
            ) : mentors.map((m) => (
              <TouchableOpacity key={m.id} style={[s.listCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push({ pathname: "/user/[id]", params: { id: m.id } } as never)} activeOpacity={0.75}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.listTitle, { color: colors.foreground }]} numberOfLines={1}>{m.displayName ?? "Community Mentor"}</Text>
                  {m.headline && <Text style={[s.listSub, { color: colors.mutedForeground }]} numberOfLines={2}>{m.headline}</Text>}
                  {m.city && <Text style={[s.listSub, { color: colors.mutedForeground }]}>📍 {m.city}</Text>}
                  {(m.specialties ?? []).slice(0, 3).map((spec, i) => (
                    <View key={i} style={[s.tag, { backgroundColor: "#CA922B15" }]}><Text style={[s.tagTxt, { color: "#CA922B" }]}>{spec}</Text></View>
                  ))}
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Generic empty for other tabs */}
        {(activeTab === "scholarships" || activeTab === "grants" || activeTab === "volunteer") && (
          <View style={s.section}>
            <View style={s.empty}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>{OPP_TABS.find((t) => t.id === activeTab)?.emoji}</Text>
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>Coming Soon</Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                Community members can post {activeTab} listings. Be the first to contribute.
              </Text>
              <TouchableOpacity style={[s.ctaBtn, { backgroundColor: "#CA922B", marginTop: 16 }]} onPress={() => router.push("/(tabs)/community" as never)} activeOpacity={0.8}>
                <Text style={s.ctaTxt}>Post an Opportunity</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 2 },
  postBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tabBar: { borderBottomWidth: 1 },
  tabBarInner: { paddingHorizontal: 8 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: "transparent" },
  tabLabel: { fontSize: 13 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  resourceCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  resourceEmoji: { fontSize: 24 },
  resourceTitle: { fontSize: 14, fontWeight: "700" },
  resourceSub: { fontSize: 12, marginTop: 2 },
  listCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  listTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  listSub: { fontSize: 12, marginBottom: 2 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  tagTxt: { fontSize: 11, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  emptySub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  ctaBtn: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 22 },
  ctaTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
