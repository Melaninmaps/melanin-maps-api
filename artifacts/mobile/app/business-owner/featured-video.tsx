import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { VIDEO_PURPOSES, detectPlatform, type VideoPurpose } from "@/components/FeaturedVideoCard";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}
async function getToken(): Promise<string | null> {
  try {
    if ((Platform.OS as string) === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

function isHostedUrl(url: string): boolean {
  return url.includes("storage.googleapis.com");
}

// ── Question bank (from Mapping With Melanin™ conversation starters) ──────────
const QUESTION_BANK = [
  // Meet the Owner
  "Why did you start this business? What happened in your life that made you decide this needed to exist?",
  "What does this business mean to you? Not what you do — but what it represents.",
  "What do you hope people feel when they walk through your door?",
  "What's something people usually don't know about your business?",
  "What are you most proud of? A moment, accomplishment, customer, or lesson.",
  // Your Story
  "Tell us about yourself outside of work. Who are you when you're not running your business?",
  "What inspires you? A person, experience, culture, family member, or dream.",
  "What keeps you motivated on difficult days?",
  "What challenge almost made you quit — and what kept you going?",
  "What's one lesson entrepreneurship has taught you?",
  // Community
  "Why is this community important to you?",
  "How do you give back?",
  "What does supporting local businesses mean to you?",
  "What do you hope your neighborhood looks like five years from now?",
  "If someone is visiting your city for the first time, what's one place they absolutely shouldn't miss?",
  // Your Customers
  "Who do you love serving?",
  "What type of customer makes your whole day?",
  "What's your favorite customer story?",
  "What's the biggest misconception about your industry?",
  "What's something you wish customers knew before they came in?",
  // Your Culture
  "What's one value you'll never compromise?",
  "What does hospitality mean to you?",
  "How do you make people feel welcome?",
  "What can customers always expect from you?",
  "What makes your business different? Not your products — your people.",
  // Fun Questions
  "Coffee or tea?",
  "What's your favorite local restaurant?",
  "Favorite weekend activity?",
  "What music do you love to play while working?",
  "What are you currently obsessed with?",
  "What's your comfort food?",
  "If your business had a theme song, what would it be?",
  "What's something that always makes you laugh?",
  // Looking Ahead
  "Where do you hope this business will be in five years?",
  "What's the next dream you're chasing?",
  "If resources weren't an obstacle, what would you build next?",
  "How do you want your customers to remember you?",
  // Community Connection
  "What does 'home' mean to you?",
  "What makes someone feel like they belong?",
  "What's one piece of advice you'd give someone who's new to this city?",
  "If you could welcome every newcomer personally, what would you tell them?",
  "What kind of community are you helping build?",
  "Why do you believe businesses matter beyond making money?",
];

// The signature closing prompt — always included as the final question
const CLOSING_QUESTION =
  "If someone remembers only one thing about you after watching this video — what do you hope it is?";

function pickNewPrompts(): string[] {
  const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
  return [...shuffled.slice(0, 4), CLOSING_QUESTION];
}

function storageKey(bizId: string) {
  return `@melanin_video_prompts_${bizId}`;
}

// ── Phase state ───────────────────────────────────────────────────────────────
type Phase = "loading" | "kinfolk_intro" | "return_choice" | "ready";

const URL_RE = /^https?:\/\/.+\..+/i;
const SUPPORTED = ["YouTube", "TikTok", "Instagram", "Facebook", "Vimeo"];

export default function FeaturedVideoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = (Platform.OS as string) === "web" ? 67 : insets.top;

  const [phase, setPhase] = useState<Phase>("loading");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [activePrompts, setActivePrompts] = useState<string[]>([]);
  const [showPromptsReminder, setShowPromptsReminder] = useState(false);

  const [videoMode, setVideoMode] = useState<"upload" | "link">("upload");
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoPurpose, setVideoPurpose] = useState<VideoPurpose | "">("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (phase !== "loading") {
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    }
  }, [phase, fadeAnim]);

  const platform = videoUrl.trim() ? detectPlatform(videoUrl.trim()) : null;
  const platformLabel = platform && platform !== "unknown"
    ? platform.charAt(0).toUpperCase() + platform.slice(1) : null;
  const urlValid = !videoUrl.trim() || (URL_RE.test(videoUrl.trim()) && platform !== "unknown");

  // ── Load ─────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${getApiBase()}/api/businesses/mine`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as {
          business?: {
            id: string;
            featuredVideoUrl?: string | null;
            featuredVideoTitle?: string | null;
            featuredVideoPurpose?: string | null;
          }
        };
        const biz = data.business;
        if (biz) {
          setBusinessId(biz.id);
          const url = biz.featuredVideoUrl ?? "";
          if (url && isHostedUrl(url)) {
            setHostedUrl(url);
            setVideoMode("upload");
          } else {
            setVideoUrl(url);
            setVideoMode(url ? "link" : "upload");
          }
          setVideoTitle(biz.featuredVideoTitle ?? "");
          setVideoPurpose((biz.featuredVideoPurpose as VideoPurpose) ?? "");

          // If they already have a video, skip straight to ready
          if (url) {
            setPhase("ready");
            return;
          }

          // Check for stored prompts
          const stored = await AsyncStorage.getItem(storageKey(biz.id));
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as string[];
              if (Array.isArray(parsed) && parsed.length > 0) {
                setActivePrompts(parsed);
                setPhase("return_choice");
                return;
              }
            } catch { /* bad JSON, fall through */ }
          }

          // First visit — generate fresh prompts
          const prompts = pickNewPrompts();
          setActivePrompts(prompts);
          setPhase("kinfolk_intro");
        }
      }
    } catch { }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Prompt actions ────────────────────────────────────────────────────────────
  const savePromptsAndExit = async () => {
    if (businessId && activePrompts.length) {
      await AsyncStorage.setItem(storageKey(businessId), JSON.stringify(activePrompts));
    }
    router.canGoBack() ? router.back() : router.replace("/business-owner" as never);
  };

  const usePreviousPrompts = () => {
    setPhase("ready");
    setShowPromptsReminder(true);
  };

  const getNewPrompts = async () => {
    const prompts = pickNewPrompts();
    setActivePrompts(prompts);
    if (businessId) await AsyncStorage.setItem(storageKey(businessId), JSON.stringify(prompts));
    setPhase("kinfolk_intro");
  };

  const readyToFilm = async () => {
    if (businessId && activePrompts.length) {
      await AsyncStorage.setItem(storageKey(businessId), JSON.stringify(activePrompts));
    }
    setPhase("ready");
    setShowPromptsReminder(true);
  };

  // ── Upload ────────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if ((Platform.OS as string) === "web") {
      Alert.alert("Not supported", "Video upload is available on the mobile app.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your media library to upload a video.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
      videoMaxDuration: 300,
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("video", { uri: asset.uri, type: asset.mimeType ?? "video/mp4", name: "featured.mp4" } as unknown as Blob);
      const res = await fetch(`${getApiBase()}/api/businesses/mine/featured-video/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const e = await res.json() as { error?: string };
        throw new Error(e.error ?? "Upload failed");
      }
      const data = await res.json() as { featuredVideoUrl: string };
      setHostedUrl(data.featuredVideoUrl);
      // Clear stored prompts — they've filmed their video
      if (businessId) await AsyncStorage.removeItem(storageKey(businessId));
      if ((Platform.OS as string) !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("You're live!", "Your community introduction video is now on your listing.");
    } catch (err) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally { setUploading(false); }
  };

  const handleDeleteHosted = () => {
    Alert.alert("Remove video?", "This will remove your community introduction video.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          try {
            const token = await getToken();
            await fetch(`${getApiBase()}/api/businesses/mine/featured-video/hosted`, {
              method: "DELETE",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setHostedUrl(null);
          } catch { Alert.alert("Error", "Failed to remove video."); }
        }
      },
    ]);
  };

  // ── Save external link ────────────────────────────────────────────────────────
  const handleSaveLink = async () => {
    if (!businessId) return;
    const url = videoUrl.trim();
    if (url && !urlValid) {
      setError("Please enter a valid YouTube, TikTok, Instagram, Facebook, or Vimeo link.");
      return;
    }
    setError("");
    setSaving(true);
    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      const res = await fetch(`${getApiBase()}/api/businesses/${businessId}/featured-video`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          videoUrl: url || null,
          videoTitle: videoTitle.trim() || null,
          videoPurpose: videoPurpose || null,
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) { setError(data.error ?? "Failed to save."); return; }
      if (businessId) await AsyncStorage.removeItem(storageKey(businessId));
      if ((Platform.OS as string) !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Could not connect. Please try again."); }
    finally { setSaving(false); }
  };

  const handleClearLink = async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      const token = await getToken();
      await fetch(`${getApiBase()}/api/businesses/${businessId}/featured-video`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ videoUrl: null }),
      });
      setVideoUrl(""); setVideoTitle(""); setVideoPurpose("");
      if ((Platform.OS as string) !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }
    finally { setSaving(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={s.backBtn}
          onPress={() => phase === "kinfolk_intro" ? savePromptsAndExit() : (router.canGoBack() ? router.back() : router.replace("/business-owner" as never))}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Featured Video</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Loading ── */}
      {phase === "loading" && (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      )}

      {/* ── KinfolkAI Intro (first visit or new prompts) ── */}
      {phase === "kinfolk_intro" && (
        <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* KinfolkAI coaching card */}
          <View style={[s.kinfolkCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <View style={s.kinfolkAvatarRow}>
              <View style={[s.kinfolkAvatar, { backgroundColor: colors.primary }]}>
                <Text style={s.kinfolkAvatarText}>K</Text>
              </View>
              <Text style={[s.kinfolkName, { color: colors.primary }]}>KinfolkAI</Text>
            </View>
            <Text style={[s.kinfolkHeadline, { color: colors.foreground }]}>Need some inspiration?</Text>
            <Text style={[s.kinfolkBody, { color: colors.mutedForeground }]}>
              People connect with stories more than sales. Talk as if you're welcoming a new neighbor into your business for the first time.
            </Text>
            <Text style={[s.kinfolkBody, { color: colors.mutedForeground, marginTop: 6 }]}>
              You don't have to be perfect. Just be yourself.
            </Text>
          </View>

          {/* Prompts */}
          <View style={[s.promptsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.promptsLabel, { color: colors.foreground }]}>Your conversation starters</Text>
            <Text style={[s.promptsSub, { color: colors.mutedForeground }]}>
              Pick any 2–5 to answer. Pause between each one — you can edit later.
            </Text>
            {activePrompts.map((q, i) => (
              <View key={i} style={[s.promptRow, i < activePrompts.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <View style={[s.promptNum, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[s.promptNumText, { color: colors.primary }]}>{i + 1}</Text>
                </View>
                <Text style={[s.promptText, { color: colors.foreground }]}>{q}</Text>
              </View>
            ))}
          </View>

          <Text style={[s.settingHint, { color: colors.mutedForeground }]}>
            No rush — come back when you're in the setting, lighting, and attire that represents your brand.
          </Text>

          {/* Actions */}
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={readyToFilm}
          >
            <Feather name="video" size={17} color="#FFF" />
            <Text style={s.primaryBtnText}>I'm ready — let's film</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.ghostBtn} activeOpacity={0.75} onPress={savePromptsAndExit}>
            <Feather name="bookmark" size={14} color={colors.mutedForeground} />
            <Text style={[s.ghostBtnText, { color: colors.mutedForeground }]}>Save my prompts & come back later</Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      )}

      {/* ── Return Choice ── */}
      {phase === "return_choice" && (
        <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={[s.kinfolkCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <View style={s.kinfolkAvatarRow}>
              <View style={[s.kinfolkAvatar, { backgroundColor: colors.primary }]}>
                <Text style={s.kinfolkAvatarText}>K</Text>
              </View>
              <Text style={[s.kinfolkName, { color: colors.primary }]}>KinfolkAI</Text>
            </View>
            <Text style={[s.kinfolkHeadline, { color: colors.foreground }]}>Welcome back</Text>
            <Text style={[s.kinfolkBody, { color: colors.mutedForeground }]}>
              No rush — film when the setting, lighting, and energy are right for you. Your community will appreciate the real you.
            </Text>
          </View>

          <Text style={[s.sectionLabel, { color: colors.foreground }]}>Ready to pick up where you left off?</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[s.choiceBtn, { backgroundColor: colors.card, borderColor: colors.primary + "50" }]}
            onPress={usePreviousPrompts}
          >
            <View style={[s.choiceIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="bookmark" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.choiceTitle, { color: colors.foreground }]}>Use my previous prompts</Text>
              <Text style={[s.choiceSub, { color: colors.mutedForeground }]}>The same {activePrompts.length} questions from last time</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[s.choiceBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={getNewPrompts}
          >
            <View style={[s.choiceIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.choiceTitle, { color: colors.foreground }]}>Show me new prompts</Text>
              <Text style={[s.choiceSub, { color: colors.mutedForeground }]}>A fresh set of conversation starters</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </Animated.ScrollView>
      )}

      {/* ── Ready: Upload / Link UI ── */}
      {phase === "ready" && (
        <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Collapsible prompt reminder */}
          {showPromptsReminder && activePrompts.length > 0 && (
            <View style={[s.reminderCard, { backgroundColor: colors.primary + "0A", borderColor: colors.primary + "20" }]}>
              <TouchableOpacity activeOpacity={0.8} style={s.reminderHeader} onPress={() => setShowPromptsReminder(false)}>
                <Feather name="list" size={14} color={colors.primary} />
                <Text style={[s.reminderTitle, { color: colors.primary }]}>Your prompts</Text>
                <Text style={[s.reminderDismiss, { color: colors.mutedForeground }]}>Hide</Text>
              </TouchableOpacity>
              {activePrompts.map((q, i) => (
                <Text key={i} style={[s.reminderQ, { color: colors.mutedForeground }]}>
                  {i + 1}. {q}
                </Text>
              ))}
            </View>
          )}
          {!showPromptsReminder && activePrompts.length > 0 && (
            <TouchableOpacity activeOpacity={0.8} style={[s.reminderCollapsed, { backgroundColor: colors.primary + "0A", borderColor: colors.primary + "20" }]} onPress={() => setShowPromptsReminder(true)}>
              <Feather name="list" size={13} color={colors.primary} />
              <Text style={[s.reminderCollapsedText, { color: colors.primary }]}>Show my prompts</Text>
            </TouchableOpacity>
          )}

          {/* Mode tabs */}
          <View style={[s.tabRow, { backgroundColor: colors.secondary }]}>
            {(["upload", "link"] as const).map(m => (
              <TouchableOpacity
                key={m}
                activeOpacity={0.8}
                style={[s.tab, videoMode === m && { backgroundColor: colors.primary }]}
                onPress={() => { setVideoMode(m); setError(""); setSaved(false); }}
              >
                <Feather name={m === "upload" ? "upload" : "link"} size={13} color={videoMode === m ? "#FFF" : colors.mutedForeground} />
                <Text style={[s.tabText, { color: videoMode === m ? "#FFF" : colors.mutedForeground }]}>
                  {m === "upload" ? "Upload to Platform" : "Link to Social"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {videoMode === "upload" ? (
            <>
              <View style={[s.explainer, { backgroundColor: colors.primary + "0C", borderColor: colors.primary + "25" }]}>
                <Text style={[s.explainerTitle, { color: colors.foreground }]}>Community Introduction</Text>
                <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
                  Great for personal intros that help connect you to your community. Hosted privately — only visible inside Mapping With Melanin.
                </Text>
              </View>

              <View style={[s.bulletCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {[
                  "No YouTube required — your story stays in your community's space",
                  "Up to 5 minutes, any common video format",
                  "Plays inline on your business listing",
                ].map(b => (
                  <View key={b} style={s.bulletRow}>
                    <Feather name="check" size={13} color={colors.primary} />
                    <Text style={[s.bulletText, { color: colors.mutedForeground }]}>{b}</Text>
                  </View>
                ))}
              </View>

              {hostedUrl ? (
                <View style={[s.hostedCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
                  <View style={s.hostedRow}>
                    <View style={[s.playIcon, { backgroundColor: colors.primary + "18" }]}>
                      <Feather name="play-circle" size={26} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.hostedLabel, { color: colors.foreground }]}>Video uploaded</Text>
                      <Text style={[s.hostedSub, { color: colors.mutedForeground }]}>Hosted on Mapping With Melanin</Text>
                    </View>
                    <View style={[s.liveBadge, { backgroundColor: "#D1FAE5", borderColor: "#6EE7B7" }]}>
                      <Text style={{ color: "#065F46", fontSize: 10, fontFamily: "Inter_700Bold" }}>Live</Text>
                    </View>
                  </View>
                  <TouchableOpacity activeOpacity={0.8} style={s.removeBtn} onPress={handleDeleteHosted}>
                    <Text style={s.removeBtnText}>Remove video</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[s.primaryBtn, { backgroundColor: colors.primary }]}
                  onPress={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <><ActivityIndicator size="small" color="#FFF" /><Text style={s.primaryBtnText}>Uploading…</Text></>
                  ) : (
                    <><Feather name="upload" size={17} color="#FFF" /><Text style={s.primaryBtnText}>Choose Video from Library</Text></>
                  )}
                </TouchableOpacity>
              )}

              <Text style={[s.label, { color: colors.foreground }]}>Video Caption (optional)</Text>
              <TextInput
                style={[s.titleInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder='e.g. "Meet the Owner" or "Why We Do This"'
                placeholderTextColor={colors.mutedForeground}
                value={videoTitle}
                onChangeText={t => { setVideoTitle(t.slice(0, 150)); setSaved(false); }}
                maxLength={150}
              />
              <Text style={[s.charHint, { color: colors.mutedForeground }]}>{150 - videoTitle.length} characters left</Text>

              <Text style={[s.label, { color: colors.foreground }]}>What does this video showcase?</Text>
              <View style={s.purposeGrid}>
                {VIDEO_PURPOSES.map(p => {
                  const active = videoPurpose === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id} activeOpacity={0.8}
                      style={[s.purposeChip, { backgroundColor: active ? colors.primary + "15" : colors.card, borderColor: active ? colors.primary : colors.border }]}
                      onPress={() => { setVideoPurpose(active ? "" : p.id); setSaved(false); }}
                    >
                      <Text style={{ fontSize: 14 }}>{p.emoji}</Text>
                      <Text style={[s.purposeLabel, { color: active ? colors.primary : colors.foreground }]}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {hostedUrl && (
                <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleSaveLink} disabled={saving} activeOpacity={0.85}>
                  {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={s.primaryBtnText}>Save Caption & Purpose</Text>}
                </TouchableOpacity>
              )}
              {saved && <View style={[s.successRow, { backgroundColor: "#D1FAE5", borderColor: "#6EE7B7" }]}><Feather name="check-circle" size={14} color="#065F46" /><Text style={[s.successText, { color: "#065F46" }]}>Saved!</Text></View>}
            </>
          ) : (
            <>
              <View style={[s.explainer, { backgroundColor: colors.primary + "0C", borderColor: colors.primary + "25" }]}>
                <Text style={[s.explainerTitle, { color: colors.foreground }]}>Link to Social</Text>
                <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
                  Pin one video from YouTube, TikTok, Instagram, Facebook, or Vimeo. Every tap sends viewers to your channel.
                </Text>
              </View>

              <View style={s.platformRow}>
                {SUPPORTED.map(p => (
                  <View key={p} style={[s.platformChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.platformChipText, { color: colors.mutedForeground }]}>{p}</Text>
                  </View>
                ))}
              </View>

              <Text style={[s.label, { color: colors.foreground }]}>Video URL</Text>
              <View style={[s.urlRow, { backgroundColor: colors.card, borderColor: !urlValid && videoUrl ? "#DC2626" : colors.border }]}>
                <Feather name="link" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  style={[s.urlInput, { color: colors.foreground }]}
                  placeholder="https://youtube.com/watch?v=…"
                  placeholderTextColor={colors.mutedForeground}
                  value={videoUrl}
                  onChangeText={t => { setVideoUrl(t); setError(""); setSaved(false); }}
                  autoCapitalize="none"
                  keyboardType="url"
                  autoCorrect={false}
                />
                {platformLabel && (
                  <View style={[s.detectedBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[s.detectedText, { color: colors.primary }]}>{platformLabel}</Text>
                  </View>
                )}
              </View>
              {!urlValid && videoUrl ? <Text style={s.urlError}>Only YouTube, TikTok, Instagram, Facebook, and Vimeo links are supported.</Text> : null}

              <Text style={[s.label, { color: colors.foreground }]}>What does this video showcase?</Text>
              <View style={s.purposeGrid}>
                {VIDEO_PURPOSES.map(p => {
                  const active = videoPurpose === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id} activeOpacity={0.8}
                      style={[s.purposeChip, { backgroundColor: active ? colors.primary + "15" : colors.card, borderColor: active ? colors.primary : colors.border }]}
                      onPress={() => { setVideoPurpose(active ? "" : p.id); setSaved(false); }}
                    >
                      <Text style={{ fontSize: 14 }}>{p.emoji}</Text>
                      <Text style={[s.purposeLabel, { color: active ? colors.primary : colors.foreground }]}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[s.label, { color: colors.foreground }]}>Video Caption (optional)</Text>
              <TextInput
                style={[s.titleInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder='e.g. "Meet Chef Jasmine" or "First-Time Client Transformation"'
                placeholderTextColor={colors.mutedForeground}
                value={videoTitle}
                onChangeText={t => { setVideoTitle(t.slice(0, 150)); setSaved(false); }}
                maxLength={150}
              />
              <Text style={[s.charHint, { color: colors.mutedForeground }]}>{150 - videoTitle.length} characters left</Text>

              {!!error && <View style={s.errorRow}><Feather name="alert-circle" size={13} color="#DC2626" /><Text style={s.errorText}>{error}</Text></View>}
              {saved && <View style={[s.successRow, { backgroundColor: "#D1FAE5", borderColor: "#6EE7B7" }]}><Feather name="check-circle" size={14} color="#065F46" /><Text style={[s.successText, { color: "#065F46" }]}>Featured video saved!</Text></View>}

              <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleSaveLink} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={s.primaryBtnText}>Save Featured Video</Text>}
              </TouchableOpacity>

              {videoUrl ? (
                <TouchableOpacity activeOpacity={0.8} style={s.clearBtn} onPress={handleClearLink} disabled={saving}>
                  <Text style={[s.clearBtnText, { color: colors.mutedForeground }]}>Remove featured video</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </Animated.ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 17 },
  scroll: { padding: 20, gap: 14, paddingBottom: 60 },

  // KinfolkAI card
  kinfolkCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 10 },
  kinfolkAvatarRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  kinfolkAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  kinfolkAvatarText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  kinfolkName: { fontFamily: "Inter_700Bold", fontSize: 13 },
  kinfolkHeadline: { fontFamily: "Inter_700Bold", fontSize: 18 },
  kinfolkBody: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },

  // Prompts
  promptsCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 0 },
  promptsLabel: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 4 },
  promptsSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginBottom: 14 },
  promptRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingVertical: 12 },
  promptNum: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  promptNumText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  promptText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, flex: 1 },

  settingHint: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, textAlign: "center", paddingHorizontal: 8 },

  // Return choice
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: -4 },
  choiceBtn: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, borderWidth: 1, padding: 14 },
  choiceIcon: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  choiceTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  choiceSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },

  // Prompt reminder (collapsed/expanded)
  reminderCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  reminderHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  reminderTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  reminderDismiss: { fontFamily: "Inter_400Regular", fontSize: 12 },
  reminderQ: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, paddingLeft: 20 },
  reminderCollapsed: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, padding: 10 },
  reminderCollapsedText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },

  // Mode tabs
  tabRow: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 9 },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },

  // Upload
  explainer: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 8 },
  explainerTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  explainerSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  bulletCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  bulletRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bulletText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 19 },
  hostedCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 10 },
  hostedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  playIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  hostedLabel: { fontFamily: "Inter_700Bold", fontSize: 14 },
  hostedSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  liveBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  removeBtn: { alignItems: "center", paddingVertical: 6 },
  removeBtnText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#DC2626", textDecorationLine: "underline" },

  // Link
  platformRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  platformChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  platformChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  urlRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  urlInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  detectedBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  detectedText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  urlError: { color: "#DC2626", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: -10 },

  // Shared fields
  label: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: -6 },
  purposeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  purposeChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 7 },
  purposeLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  titleInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14 },
  charHint: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "right", marginTop: -10 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { color: "#DC2626", fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  successRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  successText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },

  // Buttons
  primaryBtn: { borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
  ghostBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  ghostBtnText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  clearBtn: { alignItems: "center", paddingVertical: 10 },
  clearBtnText: { fontFamily: "Inter_400Regular", fontSize: 13, textDecorationLine: "underline" },
});
