/**
 * /mural-contribution — Share a Memory screen for public art & murals
 *
 * Route params: siteId, siteName, siteAddress
 * Allows authenticated members to post a text memory, an image URL, and/or
 * a video URL to a mural or public art site. Contributions are moderated
 * (status: 'pending') before appearing publicly.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSession } from "../hooks/useSession";
import { useColorScheme } from "../hooks/useColorScheme";

const ACCENT = "#0891B2";
const MAX_CHARS = 1000;

export default function MuralContributionScreen() {
  const { siteId, siteName, siteAddress } = useLocalSearchParams<{
    siteId: string;
    siteName: string;
    siteAddress: string;
  }>();
  const router = useRouter();
  const { session } = useSession();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [commentText, setCommentText] = useState("");
  const [imageUrl, setImageUrl]     = useState("");
  const [videoUrl, setVideoUrl]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const colors = {
    background: isDark ? "#0F0F0F" : "#FFFFFF",
    card:       isDark ? "#1A1A1A" : "#F9FAFB",
    border:     isDark ? "#2A2A2A" : "#E5E7EB",
    foreground: isDark ? "#F9FAFB" : "#111827",
    muted:      isDark ? "#9CA3AF" : "#6B7280",
    input:      isDark ? "#1F1F1F" : "#FFFFFF",
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) {
      Alert.alert("Memory required", "Please share a few words about this mural before submitting.");
      return;
    }
    if (!session?.sessionToken && !session?.id) {
      Alert.alert("Sign in required", "You need to be signed in to share a memory.");
      return;
    }

    // Basic URL check
    const urlPat = /^https?:\/\/.+/i;
    if (imageUrl && !urlPat.test(imageUrl)) {
      Alert.alert("Invalid image URL", "Image link must start with http:// or https://");
      return;
    }
    if (videoUrl && !urlPat.test(videoUrl)) {
      Alert.alert("Invalid video URL", "Video link must start with http:// or https://");
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://www.mappingwithmelanin.com";
      const token  = (session as { sessionToken?: string; id?: string }).sessionToken
                  ?? (session as { sessionToken?: string; id?: string }).id
                  ?? "";

      const res = await fetch(`${apiUrl}/api/tour-cultural-sites/${siteId}/contributions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          comment_text: commentText.trim(),
          image_url: imageUrl.trim() || undefined,
          video_url: videoUrl.trim() || undefined,
        }),
      });

      if (res.status === 401) {
        Alert.alert("Sign in required", "Please sign in and try again.");
        return;
      }
      if (res.status === 429) {
        Alert.alert("Already submitted", "You already have a contribution pending review for this site.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        Alert.alert("Could not submit", body.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      Alert.alert("Network error", "Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <View style={[s.successCard, { backgroundColor: colors.card, borderColor: `${ACCENT}30` }]}>
          <View style={s.successIcon}>
            <Feather name="check-circle" size={40} color={ACCENT} />
          </View>
          <Text style={[s.successTitle, { color: colors.foreground }]}>Memory submitted!</Text>
          <Text style={[s.successBody, { color: colors.muted }]}>
            Your memory is under review and will appear on this mural once approved. Thank you for
            contributing to the community's story of{" "}
            <Text style={{ fontWeight: "700" }}>{siteName}</Text>.
          </Text>
          <TouchableOpacity
            style={[s.doneBtn, { backgroundColor: ACCENT }]}
            onPress={() => router.back()}
          >
            <Text style={s.doneBtnTxt}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.scroll, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={[s.muralBadge, { backgroundColor: `${ACCENT}18` }]}>
            <Feather name="edit-2" size={12} color={ACCENT} />
            <Text style={[s.muralBadgeTxt, { color: ACCENT }]}>Public Art</Text>
          </View>
        </View>

        <Text style={[s.title, { color: colors.foreground }]} numberOfLines={2}>
          {siteName}
        </Text>
        {siteAddress ? (
          <Text style={[s.subtitle, { color: colors.muted }]}>{siteAddress}</Text>
        ) : null}

        <Text style={[s.sectionLabel, { color: colors.muted }]}>Your memory *</Text>
        <Text style={[s.helpText, { color: colors.muted }]}>
          What did this mural mean to you? Share a story, a memory, or what you noticed.
        </Text>
        <TextInput
          style={[s.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
          multiline
          numberOfLines={5}
          maxLength={MAX_CHARS}
          placeholder="e.g. My grandmother grew up two blocks from here and always talked about this mural…"
          placeholderTextColor={colors.muted}
          value={commentText}
          onChangeText={setCommentText}
          textAlignVertical="top"
        />
        <Text style={[s.charCount, { color: commentText.length > MAX_CHARS * 0.9 ? "#EF4444" : colors.muted }]}>
          {commentText.length}/{MAX_CHARS}
        </Text>

        {/* Image URL */}
        <Text style={[s.sectionLabel, { color: colors.muted, marginTop: 20 }]}>
          Image link <Text style={[s.optional, { color: colors.muted }]}>(optional)</Text>
        </Text>
        <Text style={[s.helpText, { color: colors.muted }]}>
          Paste a public image URL — your own photo hosted on Google Photos, iCloud, Instagram,
          or anywhere else with a direct link.
        </Text>
        <TextInput
          style={[s.urlInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
          placeholder="https://example.com/my-photo.jpg"
          placeholderTextColor={colors.muted}
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
        />

        {/* Video URL */}
        <Text style={[s.sectionLabel, { color: colors.muted, marginTop: 20 }]}>
          Video link <Text style={[s.optional, { color: colors.muted }]}>(optional)</Text>
        </Text>
        <Text style={[s.helpText, { color: colors.muted }]}>
          YouTube, Instagram Reel, TikTok, or any public video URL.
        </Text>
        <TextInput
          style={[s.urlInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
          placeholder="https://youtube.com/watch?v=..."
          placeholderTextColor={colors.muted}
          value={videoUrl}
          onChangeText={setVideoUrl}
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
        />

        <Text style={[s.modNote, { color: colors.muted, borderColor: colors.border }]}>
          Memories are reviewed by the community before appearing publicly. URLs are verified to
          ensure they're safe and relevant.
        </Text>

        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: ACCENT, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="send" size={16} color="#fff" />
              <Text style={s.submitBtnTxt}>Share my memory</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll:       { padding: 20, paddingBottom: 48 },
  center:       { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn:      { padding: 4 },
  muralBadge:   { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  muralBadgeTxt:{ fontSize: 12, fontWeight: "600" },
  title:        { fontSize: 22, fontWeight: "700", lineHeight: 28, marginBottom: 4 },
  subtitle:     { fontSize: 13, marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  helpText:     { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  textArea:     { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, lineHeight: 22, minHeight: 120 },
  charCount:    { fontSize: 11, textAlign: "right", marginTop: 4 },
  urlInput:     { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, height: 46 },
  optional:     { fontWeight: "400", fontSize: 11 },
  modNote:      { fontSize: 11, lineHeight: 17, borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 24, marginBottom: 8 },
  submitBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 12, marginTop: 16 },
  submitBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
  // Success state
  successCard:  { borderWidth: 1, borderRadius: 16, padding: 28, alignItems: "center", width: "100%" },
  successIcon:  { marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  successBody:  { fontSize: 15, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  doneBtn:      { height: 48, borderRadius: 12, paddingHorizontal: 32, alignItems: "center", justifyContent: "center" },
  doneBtnTxt:   { color: "#fff", fontSize: 16, fontWeight: "700" },
});
