import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { useAuth } from "@/lib/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}
async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}
async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function truncate(text: string, n = 180) {
  return text.length > n ? text.slice(0, n).trimEnd() + "…" : text;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Topic = { id: string; label: string; emoji: string; description: string };
type Physician = { id: string; displayName: string; credentials: string; specialty: string; institution?: string; bio?: string };
type HealthPost = {
  id: string; title: string; summary: string; url: string; source: string;
  topicIds: string[]; likeCount: number; liked: boolean; createdAt: string;
  physician: Physician;
};
type Designation = { id: string; label: string; emoji: string; keywords: string[] };
type InsightJournal = { id: string; label: string; abbrev: string; color: string };
type JournalInsight = {
  id: string; pmid: string; title: string; abstract?: string; authors: string[];
  journalId: string; journalLabel?: string; journalAbbrev?: string; pubDate?: string;
  doi?: string; url: string; designationIds: string[]; healthTopicIds: string[];
  bookmarkCount: number; bookmarked: boolean; pinned: boolean; isCurated: boolean; syncedAt: string;
};

// ─── Static meta (mirrors server configs) ─────────────────────────────────────
const DESIGNATIONS: Designation[] = [
  { id: "black",      label: "Black / African American",    emoji: "✊🏾", keywords: [] },
  { id: "latino",     label: "Latino / Hispanic",           emoji: "🌎", keywords: [] },
  { id: "indigenous", label: "Indigenous / Native American", emoji: "🦅", keywords: [] },
  { id: "mena",       label: "Middle Eastern / Arab",       emoji: "🌙", keywords: [] },
  { id: "multiracial",label: "Multiracial / Biracial",      emoji: "🌈", keywords: [] },
];

const INSIGHT_JOURNALS: InsightJournal[] = [
  { id: "nejm",     label: "NEJM",              abbrev: "N Engl J Med",    color: "#DC2626" },
  { id: "jama",     label: "JAMA",              abbrev: "JAMA",             color: "#7C3AED" },
  { id: "lancet",   label: "The Lancet",        abbrev: "Lancet",           color: "#0891B2" },
  { id: "bmj",      label: "The BMJ",           abbrev: "BMJ",              color: "#059669" },
  { id: "aim",      label: "Ann. Int. Med.",    abbrev: "Ann Intern Med",   color: "#D97706" },
  { id: "natmed",   label: "Nature Med.",       abbrev: "Nat Med",          color: "#2563EB" },
  { id: "plosmed",  label: "PLOS Med.",         abbrev: "PLoS Med",         color: "#16A34A" },
  { id: "jamaopen", label: "JAMA Network Open", abbrev: "JAMA Netw Open",   color: "#9333EA" },
  { id: "cmaj",     label: "CMAJ",              abbrev: "CMAJ",             color: "#B91C1C" },
  { id: "ajph",     label: "Am J Public Health",abbrev: "Am J Public Health",color: "#0D9488" },
];

const CREDENTIAL_OPTIONS = ["MD", "DO", "NP", "PA", "RN", "PharmD", "PhD", "MPH", "DDS", "DPT", "Other"];

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HealthHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = !!(user as any)?.role && (user as any).role === "admin";
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── Hub-level tab ──────────────────────────────────────────────────────────
  const [hubTab, setHubTab] = useState<"posts" | "insights">("posts");

  // ── Posts tab state ────────────────────────────────────────────────────────
  const [topics, setTopics] = useState<Topic[]>([]);
  const [myTopicIds, setMyTopicIds] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [posts, setPosts] = useState<HealthPost[]>([]);
  const [physician, setPhysician] = useState<any>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  // Post form
  const [postTitle, setPostTitle] = useState("");
  const [postSummary, setPostSummary] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [postSource, setPostSource] = useState("");
  const [postTopics, setPostTopics] = useState<string[]>([]);
  // Apply form
  const [applyName, setApplyName] = useState("");
  const [applyCreds, setApplyCreds] = useState("MD");
  const [applySpecialty, setApplySpecialty] = useState("");
  const [applyInstitution, setApplyInstitution] = useState("");
  const [applyLicenseState, setApplyLicenseState] = useState("");
  const [applyLicenseNum, setApplyLicenseNum] = useState("");
  const [applyBio, setApplyBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Insights tab state ─────────────────────────────────────────────────────
  const [insights, setInsights] = useState<JournalInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<string | null>(null);
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  // ── Load posts-tab data ────────────────────────────────────────────────────
  const loadTopics = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/health-hub/topics`);
      if (res.ok) setTopics((await res.json() as { topics: Topic[] }).topics);
    } catch { /**/ }
  }, []);

  const loadMyTopics = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/health-hub/topics/mine`, { headers: h });
      if (res.ok) setMyTopicIds((await res.json() as { topicIds: string[] }).topicIds);
    } catch { /**/ }
  }, [isAuthenticated]);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const h = await authHeaders();
      const url = selectedTopic
        ? `${getApiBase()}/api/health-hub/posts?topic=${selectedTopic}`
        : `${getApiBase()}/api/health-hub/posts`;
      const res = await fetch(url, { headers: h });
      if (res.ok) setPosts((await res.json() as { posts: HealthPost[] }).posts);
    } catch { /**/ } finally { setLoadingPosts(false); }
  }, [selectedTopic]);

  const loadPhysician = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/health-hub/physician`, { headers: h });
      if (res.ok) setPhysician((await res.json() as { physician: any }).physician);
    } catch { /**/ }
  }, [isAuthenticated]);

  useEffect(() => {
    loadTopics(); loadPosts();
    if (isAuthenticated) { loadMyTopics(); loadPhysician(); }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // ── Load insights-tab data ─────────────────────────────────────────────────
  const loadInsights = useCallback(async () => {
    setLoadingInsights(true);
    try {
      const h = await authHeaders();
      const params = new URLSearchParams({ limit: "30" });
      if (selectedDesignations.length === 1) params.set("designation", selectedDesignations[0]);
      if (selectedJournal) params.set("journal", selectedJournal);
      const res = await fetch(`${getApiBase()}/api/journal-insights?${params}`, { headers: h });
      if (res.ok) {
        let data = (await res.json() as { insights: JournalInsight[] }).insights;
        // Multi-designation client-side filter
        if (selectedDesignations.length > 1) {
          data = data.filter(ins =>
            selectedDesignations.some(d => (ins.designationIds as string[]).includes(d))
          );
        }
        // Pinned articles always float to the top
        data.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
        setInsights(data);
        setInsightsLoaded(true);
      }
    } catch { /**/ } finally { setLoadingInsights(false); }
  }, [selectedDesignations, selectedJournal]);

  useEffect(() => {
    if (hubTab === "insights" && !insightsLoaded) loadInsights();
  }, [hubTab]);

  useEffect(() => {
    if (hubTab === "insights") loadInsights();
  }, [selectedDesignations, selectedJournal]);

  // ── Posts interactions ─────────────────────────────────────────────────────
  const saveMyTopics = async (ids: string[]) => {
    if (!isAuthenticated) return;
    setMyTopicIds(ids);
    try {
      const h = { ...(await authHeaders()), "Content-Type": "application/json" };
      await fetch(`${getApiBase()}/api/health-hub/topics/mine`, { method: "PATCH", headers: h, body: JSON.stringify({ topicIds: ids }) });
    } catch { /**/ }
  };

  const toggleFollow = (id: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    saveMyTopics(myTopicIds.includes(id) ? myTopicIds.filter(x => x !== id) : [...myTopicIds, id]);
  };

  const handleLike = async (post: HealthPost) => {
    if (!isAuthenticated) { Alert.alert("Sign in", "Sign in to like posts."); return; }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, liked: !p.liked, likeCount: p.likeCount + (p.liked ? -1 : 1) } : p));
    try {
      const h = await authHeaders();
      await fetch(`${getApiBase()}/api/health-hub/posts/${post.id}/like`, { method: "POST", headers: h });
    } catch { loadPosts(); }
  };

  const handleSubmitPost = async () => {
    if (!postTitle.trim()) { Alert.alert("Title required"); return; }
    if (!postSummary.trim()) { Alert.alert("Summary required"); return; }
    if (!postUrl.trim()) { Alert.alert("URL required"); return; }
    if (!postSource.trim()) { Alert.alert("Source required"); return; }
    if (!postTopics.length) { Alert.alert("Select at least one topic"); return; }
    setSubmitting(true);
    try {
      const h = { ...(await authHeaders()), "Content-Type": "application/json" };
      const res = await fetch(`${getApiBase()}/api/health-hub/posts`, {
        method: "POST", headers: h,
        body: JSON.stringify({ title: postTitle, summary: postSummary, url: postUrl, source: postSource, topicIds: postTopics }),
      });
      const data = await res.json() as any;
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Posted!", "Your article has been shared with the community.");
        setShowPostModal(false);
        setPostTitle(""); setPostSummary(""); setPostUrl(""); setPostSource(""); setPostTopics([]);
        loadPosts();
      } else Alert.alert("Error", data.error ?? "Could not post article.");
    } catch { Alert.alert("Error", "Something went wrong."); } finally { setSubmitting(false); }
  };

  const handleApply = async () => {
    if (!applyName.trim()) { Alert.alert("Name required"); return; }
    if (!applySpecialty.trim()) { Alert.alert("Specialty required"); return; }
    setSubmitting(true);
    try {
      const h = { ...(await authHeaders()), "Content-Type": "application/json" };
      const res = await fetch(`${getApiBase()}/api/health-hub/physician/apply`, {
        method: "POST", headers: h,
        body: JSON.stringify({ displayName: applyName, credentials: applyCreds, specialty: applySpecialty, institution: applyInstitution, licenseState: applyLicenseState, licenseNumber: applyLicenseNum, bio: applyBio }),
      });
      const data = await res.json() as any;
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Application submitted!", "We'll review your credentials within 2–5 business days.");
        setShowApplyModal(false);
        loadPhysician();
      } else Alert.alert("Error", data.error ?? "Could not submit application.");
    } catch { Alert.alert("Error", "Something went wrong."); } finally { setSubmitting(false); }
  };

  // ── Insights interactions ──────────────────────────────────────────────────
  const toggleDesignation = (id: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelectedDesignations(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBookmark = async (insight: JournalInsight) => {
    if (!isAuthenticated) { Alert.alert("Sign in", "Sign in to bookmark articles."); return; }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInsights(prev => prev.map(ins => ins.id === insight.id ? { ...ins, bookmarked: !ins.bookmarked, bookmarkCount: ins.bookmarkCount + (ins.bookmarked ? -1 : 1) } : ins));
    try {
      const h = await authHeaders();
      await fetch(`${getApiBase()}/api/journal-insights/${insight.id}/bookmark`, { method: "POST", headers: h });
    } catch { loadInsights(); }
  };

  const handlePin = async (insight: JournalInsight) => {
    if (!isAuthenticated) { Alert.alert("Sign in", "Sign in to pin articles."); return; }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nowPinned = !insight.pinned;
    setInsights(prev => {
      const updated = prev.map(ins => ins.id === insight.id
        ? { ...ins, pinned: nowPinned, bookmarked: true }
        : ins
      );
      return [...updated].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    });
    try {
      const h = await authHeaders();
      await fetch(`${getApiBase()}/api/journal-insights/${insight.id}/pin`, { method: "POST", headers: h });
    } catch { loadInsights(); }
  };

  const handleDelete = async (insight: JournalInsight) => {
    Alert.alert(
      "Remove article?",
      "This removes the article from the community feed permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            setInsights(prev => prev.filter(ins => ins.id !== insight.id));
            try {
              const h = await authHeaders();
              await fetch(`${getApiBase()}/api/journal-insights/${insight.id}`, { method: "DELETE", headers: h });
            } catch { loadInsights(); }
          },
        },
      ]
    );
  };

  const isApprovedPhysician = physician?.status === "approved";
  const isPendingPhysician = physician?.status === "pending";
  const displayedPosts = selectedTopic
    ? posts.filter(p => p.topicIds.includes(selectedTopic))
    : myTopicIds.length ? posts.filter(p => p.topicIds.some(t => myTopicIds.includes(t))) : posts;
  const activeTopic = topics.find(t => t.id === selectedTopic);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Health Hub</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Evidence-based community health</Text>
        </View>
        {hubTab === "posts" && isApprovedPhysician && (
          <TouchableOpacity activeOpacity={0.85} style={[styles.postBtn, { backgroundColor: colors.primary }]} onPress={() => setShowPostModal(true)}>
            <Feather name="plus" size={16} color="#FFF" />
            <Text style={styles.postBtnTxt}>Post</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {([
          { id: "posts" as const, icon: "shield" as const, label: "Physician Posts" },
          { id: "insights" as const, icon: "book-open" as const, label: "Journal Insights" },
        ]).map(tab => (
          <TouchableOpacity activeOpacity={0.85}
            key={tab.id}
            style={[styles.tabItem, hubTab === tab.id && [styles.tabItemActive, { borderBottomColor: colors.primary }]]}
            onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setHubTab(tab.id); }}
          >
            <Feather name={tab.icon} size={14} color={hubTab === tab.id ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: hubTab === tab.id ? colors.primary : colors.mutedForeground }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── POSTS TAB ─────────────────────────────────────────────────────── */}
      {hubTab === "posts" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 40 }}>
          {/* Topic pills */}
          <View style={styles.topicSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicScroll}>
              <TouchableOpacity activeOpacity={0.85}
                style={[styles.pill, { borderColor: !selectedTopic ? colors.primary : colors.border, backgroundColor: !selectedTopic ? colors.primary : colors.card }]}
                onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setSelectedTopic(null); }}
              >
                <Text style={[styles.pillTxt, { color: !selectedTopic ? "#FFF" : colors.foreground }]}>
                  {myTopicIds.length ? "My Topics" : "All"}
                </Text>
              </TouchableOpacity>
              {topics.map(t => {
                const active = selectedTopic === t.id;
                const following = myTopicIds.includes(t.id);
                return (
                  <TouchableOpacity activeOpacity={0.85} key={t.id}
                    style={[styles.pill, { borderColor: active ? colors.primary : following ? colors.primary + "60" : colors.border, backgroundColor: active ? colors.primary : following ? colors.primary + "10" : colors.card }]}
                    onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setSelectedTopic(prev => prev === t.id ? null : t.id); }}
                  >
                    <Text style={styles.pillEmoji}>{t.emoji}</Text>
                    <Text style={[styles.pillTxt, { color: active ? "#FFF" : colors.foreground }]}>{t.label}</Text>
                    {following && !active && <Feather name="check" size={11} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity activeOpacity={0.85} style={[styles.manageTopics, { borderColor: colors.border }]} onPress={() => setShowTopicPicker(true)}>
              <Feather name="bell" size={14} color={colors.primary} />
              <Text style={[styles.manageTopicsTxt, { color: colors.primary }]}>
                {myTopicIds.length ? `Following ${myTopicIds.length} topic${myTopicIds.length !== 1 ? "s" : ""}` : "Follow topics to personalize this feed"}
              </Text>
              <Feather name="chevron-right" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {activeTopic && (
            <View style={[styles.topicBanner, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Text style={{ fontSize: 24 }}>{activeTopic.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.topicBannerTitle, { color: colors.foreground }]}>{activeTopic.label}</Text>
                <Text style={[styles.topicBannerSub, { color: colors.mutedForeground }]}>{activeTopic.description}</Text>
              </View>
            </View>
          )}

          {/* Posts */}
          <View style={styles.posts}>
            {loadingPosts ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : displayedPosts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={{ fontSize: 40 }}>🩺</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No articles yet</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  {selectedTopic ? "No articles for this topic yet." : "Verified physicians haven't posted yet."}
                </Text>
                {!isApprovedPhysician && !isPendingPhysician && (
                  <TouchableOpacity activeOpacity={0.85} style={[styles.applyBtn, { borderColor: colors.primary }]} onPress={() => setShowApplyModal(true)}>
                    <Text style={[styles.applyBtnTxt, { color: colors.primary }]}>Are you a physician? Apply to contribute →</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              displayedPosts.map(post => (
                <View key={post.id} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.physicianRow}>
                    <View style={[styles.physicianAvatar, { backgroundColor: colors.primary + "20" }]}>
                      <Feather name="user" size={14} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.physicianNameRow}>
                        <Text style={[styles.physicianName, { color: colors.foreground }]}>{post.physician.displayName}, {post.physician.credentials}</Text>
                        <View style={[styles.verifiedBadge, { backgroundColor: "#0891B2" + "20" }]}>
                          <Feather name="shield" size={10} color="#0891B2" />
                          <Text style={[styles.verifiedTxt, { color: "#0891B2" }]}>Verified</Text>
                        </View>
                      </View>
                      <Text style={[styles.physicianSpec, { color: colors.mutedForeground }]}>{post.physician.specialty}{post.physician.institution ? ` · ${post.physician.institution}` : ""}</Text>
                    </View>
                  </View>
                  <View style={styles.topicTags}>
                    {post.topicIds.slice(0, 3).map(tid => {
                      const t = topics.find(x => x.id === tid);
                      if (!t) return null;
                      return (
                        <TouchableOpacity activeOpacity={0.85} key={tid} style={[styles.topicTag, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]} onPress={() => setSelectedTopic(tid)}>
                          <Text style={styles.topicTagEmoji}>{t.emoji}</Text>
                          <Text style={[styles.topicTagTxt, { color: colors.primary }]}>{t.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={[styles.postTitle, { color: colors.foreground }]}>{post.title}</Text>
                  <Text style={[styles.postSummary, { color: colors.mutedForeground }]} numberOfLines={3}>{post.summary}</Text>
                  <View style={styles.postMeta}>
                    <Feather name="book-open" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.postSource, { color: colors.mutedForeground }]}>{post.source}</Text>
                    <Text style={[styles.postDot, { color: colors.mutedForeground }]}>·</Text>
                    <Text style={[styles.postDate, { color: colors.mutedForeground }]}>{formatDate(post.createdAt)}</Text>
                  </View>
                  <View style={[styles.postActions, { borderTopColor: colors.border }]}>
                    <TouchableOpacity activeOpacity={0.85} style={styles.actionBtn} onPress={() => Linking.openURL(post.url.startsWith("http") ? post.url : `https://${post.url}`)}>
                      <Feather name="external-link" size={15} color={colors.primary} />
                      <Text style={[styles.actionTxt, { color: colors.primary }]}>Read Article</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.85} style={styles.actionBtn} onPress={() => handleLike(post)}>
                      <Feather name="heart" size={15} color={post.liked ? "#DC2626" : colors.mutedForeground} />
                      <Text style={[styles.actionTxt, { color: post.liked ? "#DC2626" : colors.mutedForeground }]}>
                        {post.likeCount > 0 ? String(post.likeCount) : "Like"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Physician CTA */}
          {!isApprovedPhysician && (
            <View style={[styles.physicianCta, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="shield" size={22} color="#0891B2" />
              <View style={{ flex: 1 }}>
                {isPendingPhysician ? (
                  <>
                    <Text style={[styles.physicianCtaTitle, { color: colors.foreground }]}>Application Under Review</Text>
                    <Text style={[styles.physicianCtaSub, { color: colors.mutedForeground }]}>We're reviewing your credentials. Typical review: 2–5 business days.</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.physicianCtaTitle, { color: colors.foreground }]}>Are you a healthcare provider?</Text>
                    <Text style={[styles.physicianCtaSub, { color: colors.mutedForeground }]}>Apply to share evidence-based health articles with the community.</Text>
                  </>
                )}
              </View>
              {!isPendingPhysician && (
                <TouchableOpacity activeOpacity={0.85} style={[styles.physicianCtaBtn, { backgroundColor: "#0891B2" }]} onPress={() => setShowApplyModal(true)}>
                  <Text style={styles.physicianCtaBtnTxt}>Apply</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* ─── INSIGHTS TAB ──────────────────────────────────────────────────── */}
      {hubTab === "insights" && (
        <>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 40 }}>
          {/* Designation filter */}
          <View style={styles.insightFilterSection}>
            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>FILTER BY COMMUNITY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity activeOpacity={0.85}
                style={[styles.pill, { borderColor: !selectedDesignations.length ? colors.primary : colors.border, backgroundColor: !selectedDesignations.length ? colors.primary : colors.card }]}
                onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setSelectedDesignations([]); }}
              >
                <Text style={[styles.pillTxt, { color: !selectedDesignations.length ? "#FFF" : colors.foreground }]}>All Communities</Text>
              </TouchableOpacity>
              {DESIGNATIONS.map(d => {
                const active = selectedDesignations.includes(d.id);
                return (
                  <TouchableOpacity activeOpacity={0.85} key={d.id}
                    style={[styles.pill, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.card }]}
                    onPress={() => toggleDesignation(d.id)}
                  >
                    <Text style={styles.pillEmoji}>{d.emoji}</Text>
                    <Text style={[styles.pillTxt, { color: active ? "#FFF" : colors.foreground }]}>{d.label}</Text>
                    {active && <Feather name="check" size={11} color="#FFF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Journal filter */}
            <Text style={[styles.filterLabel, { color: colors.mutedForeground, marginTop: 10 }]}>FILTER BY JOURNAL</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity activeOpacity={0.85}
                style={[styles.journalPill, { borderColor: !selectedJournal ? colors.primary : colors.border, backgroundColor: !selectedJournal ? colors.primary : colors.card }]}
                onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setSelectedJournal(null); }}
              >
                <Text style={[styles.journalPillTxt, { color: !selectedJournal ? "#FFF" : colors.foreground }]}>All Journals</Text>
              </TouchableOpacity>
              {INSIGHT_JOURNALS.map(j => {
                const active = selectedJournal === j.id;
                return (
                  <TouchableOpacity activeOpacity={0.85} key={j.id}
                    style={[styles.journalPill, { borderColor: active ? j.color : colors.border, backgroundColor: active ? j.color : colors.card }]}
                    onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setSelectedJournal(prev => prev === j.id ? null : j.id); }}
                  >
                    <Text style={[styles.journalPillTxt, { color: active ? "#FFF" : colors.foreground }]}>{j.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Insights list */}
          <View style={styles.posts}>
            {loadingInsights ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : insights.length === 0 ? (
              <View style={styles.empty}>
                <Text style={{ fontSize: 40 }}>🔬</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {insightsLoaded ? "No articles found" : "Loading insights…"}
                </Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  {insightsLoaded
                    ? "Try removing some filters, or check back after the next journal sync."
                    : "Scanning NEJM, JAMA, Lancet and more…"}
                </Text>
                {insightsLoaded && (selectedDesignations.length > 0 || selectedJournal) && (
                  <TouchableOpacity activeOpacity={0.85} style={[styles.applyBtn, { borderColor: colors.primary }]} onPress={() => { setSelectedDesignations([]); setSelectedJournal(null); }}>
                    <Text style={[styles.applyBtnTxt, { color: colors.primary }]}>Clear filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              insights.map(ins => {
                const journal = INSIGHT_JOURNALS.find(j => j.id === ins.journalId);
                const jColor = journal?.color ?? "#6B7280";
                const authors = ins.authors.slice(0, 3);
                const authorStr = authors.length < ins.authors.length ? `${authors.join(", ")} et al.` : authors.join(", ");
                return (
                  <View key={ins.id} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {/* Journal + curated badge */}
                    <View style={styles.insightHeaderRow}>
                      <View style={[styles.journalBadge, { backgroundColor: jColor + "20", borderColor: jColor + "40" }]}>
                        <Text style={[styles.journalBadgeTxt, { color: jColor }]}>{ins.journalAbbrev ?? ins.journalLabel ?? ins.journalId}</Text>
                      </View>
                      {ins.isCurated && (
                        <View style={[styles.curatedBadge, { backgroundColor: colors.primary + "15" }]}>
                          <Feather name="star" size={10} color={colors.primary} />
                          <Text style={[styles.curatedTxt, { color: colors.primary }]}>MwM Pick</Text>
                        </View>
                      )}
                      <Text style={[styles.insightDate, { color: colors.mutedForeground }]}>{ins.pubDate ?? ""}</Text>
                    </View>

                    {/* Designation tags */}
                    {ins.designationIds.length > 0 && (
                      <View style={styles.topicTags}>
                        {ins.designationIds.slice(0, 4).map(did => {
                          const d = DESIGNATIONS.find(x => x.id === did);
                          if (!d) return null;
                          return (
                            <View key={did} style={[styles.desBadge, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
                              <Text style={styles.topicTagEmoji}>{d.emoji}</Text>
                              <Text style={[styles.topicTagTxt, { color: colors.primary }]}>{d.label}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Title */}
                    <Text style={[styles.postTitle, { color: colors.foreground }]}>{ins.title}</Text>

                    {/* Authors */}
                    {authorStr ? (
                      <Text style={[styles.insightAuthors, { color: colors.mutedForeground }]}>{authorStr}</Text>
                    ) : null}

                    {/* Abstract excerpt */}
                    {ins.abstract ? (
                      <Text style={[styles.postSummary, { color: colors.mutedForeground }]} numberOfLines={4}>
                        {truncate(ins.abstract, 220)}
                      </Text>
                    ) : (
                      <Text style={[styles.postSummary, { color: colors.mutedForeground, fontStyle: "italic" }]}>
                        Abstract available on PubMed →
                      </Text>
                    )}

                    {/* Actions */}
                    <View style={[styles.postActions, { borderTopColor: colors.border }]}>
                      <TouchableOpacity activeOpacity={0.85} style={styles.actionBtn} onPress={() => Linking.openURL(ins.url)}>
                        <Feather name="external-link" size={15} color={colors.primary} />
                        <Text style={[styles.actionTxt, { color: colors.primary }]}>PubMed</Text>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={0.85} style={styles.actionBtn} onPress={() => handlePin(ins)}>
                        <Feather name="map-pin" size={15} color={ins.pinned ? "#F59E0B" : colors.mutedForeground} />
                        <Text style={[styles.actionTxt, { color: ins.pinned ? "#F59E0B" : colors.mutedForeground }]}>
                          {ins.pinned ? "Pinned" : "Pin"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={0.85} style={styles.actionBtn} onPress={() => handleBookmark(ins)}>
                        <Feather name="bookmark" size={15} color={ins.bookmarked ? colors.primary : colors.mutedForeground} />
                        <Text style={[styles.actionTxt, { color: ins.bookmarked ? colors.primary : colors.mutedForeground }]}>
                          {ins.bookmarked ? "Saved" : "Save"}
                        </Text>
                      </TouchableOpacity>
                      {isAdmin && (
                        <TouchableOpacity activeOpacity={0.85} style={styles.actionBtn} onPress={() => handleDelete(ins)}>
                          <Feather name="trash-2" size={15} color="#DC2626" />
                          <Text style={[styles.actionTxt, { color: "#DC2626" }]}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Scan attribution */}
          {insightsLoaded && insights.length > 0 && (
            <View style={styles.attributionRow}>
              <Feather name="database" size={12} color={colors.mutedForeground} />
              <Text style={[styles.attributionTxt, { color: colors.mutedForeground }]}>
                Sourced from PubMed / NCBI · NIH National Library of Medicine
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ─── Wellness & Crisis Resources footer (both tabs) ──────────────── */}
        <View style={{ paddingHorizontal: 16, paddingBottom: bottomPad + 16, paddingTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.mutedForeground, marginBottom: 2 }}>
            Mental Health & Recovery Resources
          </Text>
          <TouchableOpacity
            style={[styles.wellnessLink, { backgroundColor: colors.card, borderColor: "#DC262630" }]}
            onPress={() => router.push("/mental-health" as Parameters<typeof router.push>[0])}
            activeOpacity={0.85}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#DC262618", alignItems: "center", justifyContent: "center" }}>
              <Feather name="heart" size={18} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.foreground }}>
                Mental Health Crisis Resources
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>
                988 Lifeline · NAMI · Trevor Project · Black therapist referrals
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.wellnessLink, { backgroundColor: colors.card, borderColor: "#05996030" }]}
            onPress={() => router.push("/na-aa-meetings" as Parameters<typeof router.push>[0])}
            activeOpacity={0.85}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#05996018", alignItems: "center", justifyContent: "center" }}>
              <Feather name="map-pin" size={18} color="#059960" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.foreground }}>
                NA / AA Meetings Near You
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>
                Narcotics Anonymous · Alcoholics Anonymous · Al-Anon · SMART Recovery
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        </>
      )}

      {/* ─── Topic Picker Modal ─── */}
      <Modal visible={showTopicPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTopicPicker(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Follow Health Topics</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setShowTopicPicker(false)}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity>
          </View>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Choose the topics you care about. Your feed will prioritize articles on these topics.</Text>
          <ScrollView contentContainerStyle={styles.topicPickerList}>
            {topics.map(t => {
              const following = myTopicIds.includes(t.id);
              return (
                <TouchableOpacity activeOpacity={0.85} key={t.id}
                  style={[styles.topicPickerRow, { borderColor: following ? colors.primary : colors.border, backgroundColor: following ? colors.primary + "10" : colors.card }]}
                  onPress={() => toggleFollow(t.id)}
                >
                  <Text style={styles.topicPickerEmoji}>{t.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.topicPickerLabel, { color: colors.foreground }]}>{t.label}</Text>
                    <Text style={[styles.topicPickerDesc, { color: colors.mutedForeground }]}>{t.description}</Text>
                  </View>
                  <View style={[styles.checkbox, { borderColor: following ? colors.primary : colors.border, backgroundColor: following ? colors.primary : "transparent" }]}>
                    {following && <Feather name="check" size={13} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity activeOpacity={0.85} style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={() => setShowTopicPicker(false)}>
            <Text style={styles.doneBtnTxt}>Done — Following {myTopicIds.length} topic{myTopicIds.length !== 1 ? "s" : ""}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ─── Post Article Modal ─── */}
      <Modal visible={showPostModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPostModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Share an Article</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setShowPostModal(false)}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Article Title</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={postTitle} onChangeText={setPostTitle} placeholder="Title of the article" placeholderTextColor={colors.mutedForeground} maxLength={300} />
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Your Summary</Text>
            <TextInput style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={postSummary} onChangeText={setPostSummary} placeholder="Brief description of what this article covers and why it matters to the community…" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} textAlignVertical="top" maxLength={1000} />
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Article URL</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={postUrl} onChangeText={setPostUrl} placeholder="https://nejm.org/..." placeholderTextColor={colors.mutedForeground} autoCapitalize="none" keyboardType="url" />
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Publication / Source</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={postSource} onChangeText={setPostSource} placeholder="e.g. New England Journal of Medicine, CDC" placeholderTextColor={colors.mutedForeground} />
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Topics</Text>
            <View style={styles.topicCheckGrid}>
              {topics.map(t => {
                const sel = postTopics.includes(t.id);
                return (
                  <TouchableOpacity activeOpacity={0.85} key={t.id}
                    style={[styles.topicCheck, { borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primary + "12" : colors.card }]}
                    onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setPostTopics(prev => sel ? prev.filter(x => x !== t.id) : [...prev, t.id]); }}
                  >
                    <Text style={styles.topicCheckEmoji}>{t.emoji}</Text>
                    <Text style={[styles.topicCheckTxt, { color: sel ? colors.primary : colors.foreground }]} numberOfLines={1}>{t.label}</Text>
                    {sel && <Feather name="check" size={11} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          <TouchableOpacity activeOpacity={0.85} style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]} onPress={handleSubmitPost} disabled={submitting}>
            <Feather name="send" size={16} color="#FFF" />
            <Text style={styles.submitBtnTxt}>{submitting ? "Posting…" : "Share with Community"}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ─── Apply as Physician Modal ─── */}
      <Modal visible={showApplyModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowApplyModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Apply as Healthcare Provider</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setShowApplyModal(false)}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.applyNote, { color: colors.mutedForeground, borderColor: colors.border }]}>
              🩺 We verify all healthcare providers before approving. Your license info is stored securely and never displayed publicly.
            </Text>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Full Name & Title</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applyName} onChangeText={setApplyName} placeholder="Dr. Amara Johnson" placeholderTextColor={colors.mutedForeground} />
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Credentials</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
              {CREDENTIAL_OPTIONS.map(c => (
                <TouchableOpacity activeOpacity={0.85} key={c} style={[styles.credChip, { borderColor: applyCreds === c ? colors.primary : colors.border, backgroundColor: applyCreds === c ? colors.primary : colors.card }]} onPress={() => setApplyCreds(c)}>
                  <Text style={{ color: applyCreds === c ? "#FFF" : colors.foreground, fontWeight: "600", fontSize: 13 }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Specialty</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applySpecialty} onChangeText={setApplySpecialty} placeholder="e.g. Pediatrics, Internal Medicine" placeholderTextColor={colors.mutedForeground} />
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Institution / Practice (optional)</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applyInstitution} onChangeText={setApplyInstitution} placeholder="e.g. Howard University Hospital" placeholderTextColor={colors.mutedForeground} />
            <Text style={[styles.formLabel, { color: colors.foreground }]}>License State</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applyLicenseState} onChangeText={setApplyLicenseState} placeholder="e.g. MD, CA" placeholderTextColor={colors.mutedForeground} autoCapitalize="characters" maxLength={2} />
            <Text style={[styles.formLabel, { color: colors.foreground }]}>License Number (confidential)</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applyLicenseNum} onChangeText={setApplyLicenseNum} placeholder="For verification only — never shown publicly" placeholderTextColor={colors.mutedForeground} />
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Brief Bio (optional)</Text>
            <TextInput style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applyBio} onChangeText={setApplyBio} placeholder="Tell the community about your background and why health equity matters to you…" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3} textAlignVertical="top" maxLength={500} />
          </ScrollView>
          <TouchableOpacity activeOpacity={0.85} style={[styles.submitBtn, { backgroundColor: "#0891B2", opacity: submitting ? 0.6 : 1 }]} onPress={handleApply} disabled={submitting}>
            <Feather name="shield" size={16} color="#FFF" />
            <Text style={styles.submitBtnTxt}>{submitting ? "Submitting…" : "Submit Application"}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  headerSub: { fontSize: 12, marginTop: 1 },
  postBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  postBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 13 },

  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabItemActive: { borderBottomWidth: 2 },
  tabLabel: { fontSize: 13, fontWeight: "700" },

  topicSection: { paddingTop: 14, gap: 8 },
  topicScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  pillEmoji: { fontSize: 14 },
  pillTxt: { fontSize: 13, fontWeight: "600" },
  manageTopics: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 16, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  manageTopicsTxt: { flex: 1, fontSize: 13, fontWeight: "600" },

  topicBanner: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  topicBannerTitle: { fontSize: 15, fontWeight: "700" },
  topicBannerSub: { fontSize: 12, marginTop: 2 },

  insightFilterSection: { paddingTop: 14, gap: 4, paddingBottom: 4 },
  filterLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, paddingHorizontal: 16, marginBottom: 6, marginTop: 4 },
  filterScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  journalPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  journalPillTxt: { fontSize: 12, fontWeight: "700" },

  posts: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center" },
  applyBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  applyBtnTxt: { fontSize: 13, fontWeight: "600" },

  postCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  physicianRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  physicianAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  physicianNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  physicianName: { fontSize: 13, fontWeight: "700" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedTxt: { fontSize: 10, fontWeight: "700" },
  physicianSpec: { fontSize: 11, marginTop: 1 },

  topicTags: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  topicTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  topicTagEmoji: { fontSize: 11 },
  topicTagTxt: { fontSize: 11, fontWeight: "600" },

  postTitle: { fontSize: 15, fontWeight: "700", lineHeight: 21 },
  postSummary: { fontSize: 13, lineHeight: 19 },
  postMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  postSource: { fontSize: 11, fontWeight: "600" },
  postDot: { fontSize: 11 },
  postDate: { fontSize: 11 },
  postActions: { flexDirection: "row", gap: 20, borderTopWidth: 1, paddingTop: 10, marginTop: 2 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionTxt: { fontSize: 13, fontWeight: "600" },

  insightHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  journalBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  journalBadgeTxt: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  curatedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  curatedTxt: { fontSize: 10, fontWeight: "700" },
  insightDate: { fontSize: 11, marginLeft: "auto" as any },
  insightAuthors: { fontSize: 11, fontStyle: "italic", lineHeight: 16 },
  desBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },

  physicianCta: { flexDirection: "row", alignItems: "center", gap: 12, margin: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  physicianCtaTitle: { fontSize: 14, fontWeight: "700" },
  physicianCtaSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  physicianCtaBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  physicianCtaBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 13 },

  attributionRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 8, marginBottom: 4 },
  attributionTxt: { fontSize: 11 },

  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSub: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, fontSize: 13, lineHeight: 19 },
  topicPickerList: { paddingHorizontal: 16, paddingTop: 8, gap: 6, paddingBottom: 20 },
  topicPickerRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  topicPickerEmoji: { fontSize: 22 },
  topicPickerLabel: { fontSize: 14, fontWeight: "700" },
  topicPickerDesc: { fontSize: 12, marginTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  doneBtn: { margin: 16, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  doneBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  formScroll: { padding: 16, gap: 4, paddingBottom: 30 },
  formLabel: { fontSize: 13, fontWeight: "700", marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textArea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 14, minHeight: 100 },
  topicCheckGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicCheck: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, maxWidth: "48%" },
  topicCheckEmoji: { fontSize: 14 },
  topicCheckTxt: { flex: 1, fontSize: 12, fontWeight: "600" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 16, paddingVertical: 15, borderRadius: 14 },
  submitBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  applyNote: { fontSize: 13, lineHeight: 19, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  credChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  wellnessLink: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
});
