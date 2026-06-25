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

type Topic = { id: string; label: string; emoji: string; description: string };
type Physician = { id: string; displayName: string; credentials: string; specialty: string; institution?: string; bio?: string };
type HealthPost = {
  id: string; title: string; summary: string; url: string; source: string;
  topicIds: string[]; likeCount: number; liked: boolean; createdAt: string;
  physician: Physician;
};

const CREDENTIAL_OPTIONS = ["MD", "DO", "NP", "PA", "RN", "PharmD", "PhD", "MPH", "DDS", "DPT", "Other"];

export default function HealthHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [topics, setTopics] = useState<Topic[]>([]);
  const [myTopicIds, setMyTopicIds] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [posts, setPosts] = useState<HealthPost[]>([]);
  const [physician, setPhysician] = useState<any>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Modals
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Post form
  const [postTitle, setPostTitle] = useState("");
  const [postSummary, setPostSummary] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [postSource, setPostSource] = useState("");
  const [postTopics, setPostTopics] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Apply form
  const [applyName, setApplyName] = useState("");
  const [applyCreds, setApplyCreds] = useState("MD");
  const [applySpecialty, setApplySpecialty] = useState("");
  const [applyInstitution, setApplyInstitution] = useState("");
  const [applyLicenseState, setApplyLicenseState] = useState("");
  const [applyLicenseNum, setApplyLicenseNum] = useState("");
  const [applyBio, setApplyBio] = useState("");

  const loadTopics = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/health-hub/topics`);
      if (res.ok) {
        const data = await res.json() as { topics: Topic[] };
        setTopics(data.topics);
      }
    } catch { /* silent */ } finally { setLoadingTopics(false); }
  }, []);

  const loadMyTopics = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/health-hub/topics/mine`, { headers });
      if (res.ok) {
        const data = await res.json() as { topicIds: string[] };
        setMyTopicIds(data.topicIds);
      }
    } catch { /* silent */ }
  }, [isAuthenticated]);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const headers = await authHeaders();
      const url = selectedTopic
        ? `${getApiBase()}/api/health-hub/posts?topic=${selectedTopic}`
        : `${getApiBase()}/api/health-hub/posts`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json() as { posts: HealthPost[] };
        setPosts(data.posts);
      }
    } catch { /* silent */ } finally { setLoadingPosts(false); }
  }, [selectedTopic]);

  const loadPhysician = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/health-hub/physician`, { headers });
      if (res.ok) {
        const data = await res.json() as { physician: any };
        setPhysician(data.physician);
      }
    } catch { /* silent */ }
  }, [isAuthenticated]);

  useEffect(() => {
    loadTopics();
    loadPosts();
    if (isAuthenticated) { loadMyTopics(); loadPhysician(); }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const saveMyTopics = async (ids: string[]) => {
    if (!isAuthenticated) return;
    setMyTopicIds(ids);
    try {
      const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
      await fetch(`${getApiBase()}/api/health-hub/topics/mine`, {
        method: "PATCH", headers, body: JSON.stringify({ topicIds: ids }),
      });
    } catch { /* silent */ }
  };

  const toggleFollow = (id: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const next = myTopicIds.includes(id) ? myTopicIds.filter(x => x !== id) : [...myTopicIds, id];
    saveMyTopics(next);
  };

  const handleLike = async (post: HealthPost) => {
    if (!isAuthenticated) { Alert.alert("Sign in", "Sign in to like posts."); return; }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, liked: !p.liked, likeCount: p.likeCount + (p.liked ? -1 : 1) } : p));
    try {
      const headers = await authHeaders();
      await fetch(`${getApiBase()}/api/health-hub/posts/${post.id}/like`, { method: "POST", headers });
    } catch { /* revert on error */ loadPosts(); }
  };

  const handleSubmitPost = async () => {
    if (!postTitle.trim()) { Alert.alert("Title required"); return; }
    if (!postSummary.trim()) { Alert.alert("Summary required"); return; }
    if (!postUrl.trim()) { Alert.alert("URL required"); return; }
    if (!postSource.trim()) { Alert.alert("Source required"); return; }
    if (!postTopics.length) { Alert.alert("Select at least one topic"); return; }
    setSubmitting(true);
    try {
      const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
      const res = await fetch(`${getApiBase()}/api/health-hub/posts`, {
        method: "POST", headers,
        body: JSON.stringify({ title: postTitle, summary: postSummary, url: postUrl, source: postSource, topicIds: postTopics }),
      });
      const data = await res.json() as any;
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Posted!", "Your article has been shared with the community.");
        setShowPostModal(false);
        setPostTitle(""); setPostSummary(""); setPostUrl(""); setPostSource(""); setPostTopics([]);
        loadPosts();
      } else {
        Alert.alert("Error", data.error ?? "Could not post article.");
      }
    } catch { Alert.alert("Error", "Something went wrong."); } finally { setSubmitting(false); }
  };

  const handleApply = async () => {
    if (!applyName.trim()) { Alert.alert("Name required"); return; }
    if (!applySpecialty.trim()) { Alert.alert("Specialty required"); return; }
    setSubmitting(true);
    try {
      const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
      const res = await fetch(`${getApiBase()}/api/health-hub/physician/apply`, {
        method: "POST", headers,
        body: JSON.stringify({ displayName: applyName, credentials: applyCreds, specialty: applySpecialty, institution: applyInstitution, licenseState: applyLicenseState, licenseNumber: applyLicenseNum, bio: applyBio }),
      });
      const data = await res.json() as any;
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Application submitted!", "We'll review your credentials and verify your account within 2–5 business days.");
        setShowApplyModal(false);
        loadPhysician();
      } else {
        Alert.alert("Error", data.error ?? "Could not submit application.");
      }
    } catch { Alert.alert("Error", "Something went wrong."); } finally { setSubmitting(false); }
  };

  const isApprovedPhysician = physician?.status === "approved";
  const isPendingPhysician = physician?.status === "pending";

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const displayedPosts = selectedTopic
    ? posts.filter(p => p.topicIds.includes(selectedTopic))
    : myTopicIds.length
      ? posts.filter(p => p.topicIds.some(t => myTopicIds.includes(t)))
      : posts;

  const activeTopic = topics.find(t => t.id === selectedTopic);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Health Hub</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Curated by verified physicians</Text>
        </View>
        {isApprovedPhysician && (
          <TouchableOpacity style={[styles.postBtn, { backgroundColor: colors.primary }]} onPress={() => setShowPostModal(true)}>
            <Feather name="plus" size={16} color="#FFF" />
            <Text style={styles.postBtnTxt}>Post Article</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 40 }}>

        {/* Topic pills */}
        <View style={styles.topicSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicScroll}>
            <TouchableOpacity
              style={[styles.pill, { borderColor: !selectedTopic ? colors.primary : colors.border, backgroundColor: !selectedTopic ? colors.primary : colors.card }]}
              onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setSelectedTopic(null); }}
            >
              <Text style={[styles.pillTxt, { color: !selectedTopic ? "#FFF" : colors.foreground }]}>
                {myTopicIds.length ? "My Topics" : "All Topics"}
              </Text>
            </TouchableOpacity>
            {topics.map(t => {
              const active = selectedTopic === t.id;
              const following = myTopicIds.includes(t.id);
              return (
                <TouchableOpacity
                  key={t.id}
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

          {/* Follow/manage topics CTA */}
          <TouchableOpacity
            style={[styles.manageTopics, { borderColor: colors.border }]}
            onPress={() => setShowTopicPicker(true)}
          >
            <Feather name="bell" size={14} color={colors.primary} />
            <Text style={[styles.manageTopicsTxt, { color: colors.primary }]}>
              {myTopicIds.length ? `Following ${myTopicIds.length} topic${myTopicIds.length !== 1 ? "s" : ""}` : "Follow topics to personalize this feed"}
            </Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Active topic description */}
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
                {selectedTopic ? "No articles for this topic yet." : "Verified physicians haven't posted any articles yet."}
              </Text>
              {!isApprovedPhysician && !isPendingPhysician && (
                <TouchableOpacity style={[styles.applyBtn, { borderColor: colors.primary }]} onPress={() => setShowApplyModal(true)}>
                  <Text style={[styles.applyBtnTxt, { color: colors.primary }]}>Are you a physician? Apply to contribute →</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            displayedPosts.map(post => (
              <View key={post.id} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Physician */}
                <View style={styles.physicianRow}>
                  <View style={[styles.physicianAvatar, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name="user" size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.physicianNameRow}>
                      <Text style={[styles.physicianName, { color: colors.foreground }]}>
                        {post.physician.displayName}, {post.physician.credentials}
                      </Text>
                      <View style={[styles.verifiedBadge, { backgroundColor: "#0891B2" + "20" }]}>
                        <Feather name="shield" size={10} color="#0891B2" />
                        <Text style={[styles.verifiedTxt, { color: "#0891B2" }]}>Verified</Text>
                      </View>
                    </View>
                    <Text style={[styles.physicianSpec, { color: colors.mutedForeground }]}>
                      {post.physician.specialty}{post.physician.institution ? ` · ${post.physician.institution}` : ""}
                    </Text>
                  </View>
                </View>

                {/* Topics */}
                <View style={styles.topicTags}>
                  {post.topicIds.slice(0, 3).map(tid => {
                    const t = topics.find(x => x.id === tid);
                    if (!t) return null;
                    return (
                      <TouchableOpacity key={tid} style={[styles.topicTag, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]} onPress={() => setSelectedTopic(tid)}>
                        <Text style={styles.topicTagEmoji}>{t.emoji}</Text>
                        <Text style={[styles.topicTagTxt, { color: colors.primary }]}>{t.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Content */}
                <Text style={[styles.postTitle, { color: colors.foreground }]}>{post.title}</Text>
                <Text style={[styles.postSummary, { color: colors.mutedForeground }]} numberOfLines={3}>{post.summary}</Text>

                {/* Source + date */}
                <View style={styles.postMeta}>
                  <Feather name="book-open" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.postSource, { color: colors.mutedForeground }]}>{post.source}</Text>
                  <Text style={[styles.postDot, { color: colors.mutedForeground }]}>·</Text>
                  <Text style={[styles.postDate, { color: colors.mutedForeground }]}>{formatDate(post.createdAt)}</Text>
                </View>

                {/* Actions */}
                <View style={[styles.postActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      const url = post.url.startsWith("http") ? post.url : `https://${post.url}`;
                      Linking.openURL(url);
                    }}
                  >
                    <Feather name="external-link" size={15} color={colors.primary} />
                    <Text style={[styles.actionTxt, { color: colors.primary }]}>Read Article</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(post)}>
                    <Feather name="heart" size={15} color={post.liked ? "#DC2626" : colors.mutedForeground} />
                    <Text style={[styles.actionTxt, { color: post.liked ? "#DC2626" : colors.mutedForeground }]}>
                      {post.likeCount > 0 ? `${post.likeCount}` : "Like"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Physician CTA strip */}
        {!isApprovedPhysician && (
          <View style={[styles.physicianCta, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shield" size={22} color="#0891B2" />
            <View style={{ flex: 1 }}>
              {isPendingPhysician ? (
                <>
                  <Text style={[styles.physicianCtaTitle, { color: colors.foreground }]}>Application Under Review</Text>
                  <Text style={[styles.physicianCtaSub, { color: colors.mutedForeground }]}>We're reviewing your credentials. Typical review takes 2–5 business days.</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.physicianCtaTitle, { color: colors.foreground }]}>Are you a healthcare provider?</Text>
                  <Text style={[styles.physicianCtaSub, { color: colors.mutedForeground }]}>Apply to share evidence-based health articles with the Mapping With Melanin community.</Text>
                </>
              )}
            </View>
            {!isPendingPhysician && (
              <TouchableOpacity style={[styles.physicianCtaBtn, { backgroundColor: "#0891B2" }]} onPress={() => setShowApplyModal(true)}>
                <Text style={styles.physicianCtaBtnTxt}>Apply</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* ─── Topic Picker Modal ─── */}
      <Modal visible={showTopicPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTopicPicker(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Follow Health Topics</Text>
            <TouchableOpacity onPress={() => setShowTopicPicker(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
            Choose the topics you care about. Your feed will prioritize articles on these topics.
          </Text>
          <ScrollView contentContainerStyle={styles.topicPickerList}>
            {topics.map(t => {
              const following = myTopicIds.includes(t.id);
              return (
                <TouchableOpacity
                  key={t.id}
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
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={() => setShowTopicPicker(false)}>
            <Text style={styles.doneBtnTxt}>Done — Following {myTopicIds.length} topic{myTopicIds.length !== 1 ? "s" : ""}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ─── Post Article Modal ─── */}
      <Modal visible={showPostModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPostModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Share an Article</Text>
            <TouchableOpacity onPress={() => setShowPostModal(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Article Title</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={postTitle} onChangeText={setPostTitle} placeholder="Title of the article" placeholderTextColor={colors.mutedForeground} maxLength={300} />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Your Summary</Text>
            <TextInput style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={postSummary} onChangeText={setPostSummary} placeholder="Brief description of what this article covers and why it matters to the community…" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} textAlignVertical="top" maxLength={1000} />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Article URL</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={postUrl} onChangeText={setPostUrl} placeholder="https://nejm.org/..." placeholderTextColor={colors.mutedForeground} autoCapitalize="none" keyboardType="url" />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Publication / Source</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={postSource} onChangeText={setPostSource} placeholder="e.g. New England Journal of Medicine, CDC, Johns Hopkins" placeholderTextColor={colors.mutedForeground} />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Topics (select all that apply)</Text>
            <View style={styles.topicCheckGrid}>
              {topics.map(t => {
                const sel = postTopics.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
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
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]}
            onPress={handleSubmitPost} disabled={submitting}
          >
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
            <TouchableOpacity onPress={() => setShowApplyModal(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.applyNote, { color: colors.mutedForeground, borderColor: colors.border }]}>
              🩺 We verify all healthcare providers before approving access to post articles. Your license information is stored securely and never displayed publicly.
            </Text>

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Full Name & Title (as displayed to community)</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applyName} onChangeText={setApplyName} placeholder="Dr. Amara Johnson" placeholderTextColor={colors.mutedForeground} />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Credentials</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
              {CREDENTIAL_OPTIONS.map(c => (
                <TouchableOpacity key={c} style={[styles.credChip, { borderColor: applyCreds === c ? colors.primary : colors.border, backgroundColor: applyCreds === c ? colors.primary : colors.card }]} onPress={() => setApplyCreds(c)}>
                  <Text style={{ color: applyCreds === c ? "#FFF" : colors.foreground, fontWeight: "600", fontSize: 13 }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Specialty</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applySpecialty} onChangeText={setApplySpecialty} placeholder="e.g. Pediatrics, Internal Medicine, OB/GYN" placeholderTextColor={colors.mutedForeground} />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Institution / Practice (optional)</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applyInstitution} onChangeText={setApplyInstitution} placeholder="e.g. Howard University Hospital" placeholderTextColor={colors.mutedForeground} />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>License State</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applyLicenseState} onChangeText={setApplyLicenseState} placeholder="e.g. MD, CA, NY" placeholderTextColor={colors.mutedForeground} autoCapitalize="characters" maxLength={2} />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>License Number (confidential)</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applyLicenseNum} onChangeText={setApplyLicenseNum} placeholder="For verification only — never shown publicly" placeholderTextColor={colors.mutedForeground} />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Brief Bio (optional)</Text>
            <TextInput style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={applyBio} onChangeText={setApplyBio} placeholder="Tell the community about your background and why health equity matters to you…" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3} textAlignVertical="top" maxLength={500} />
          </ScrollView>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: "#0891B2", opacity: submitting ? 0.6 : 1 }]}
            onPress={handleApply} disabled={submitting}
          >
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

  posts: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center", color: "#666" },
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

  physicianCta: { flexDirection: "row", alignItems: "center", gap: 12, margin: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  physicianCtaTitle: { fontSize: 14, fontWeight: "700" },
  physicianCtaSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  physicianCtaBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  physicianCtaBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 13 },

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
});
