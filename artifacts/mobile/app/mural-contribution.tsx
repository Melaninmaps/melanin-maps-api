/**
 * /mural-contribution — Share a Memory screen for murals, monuments, museums,
 * and all tour heritage sites.
 *
 * Route params: siteId, siteName, siteAddress, siteType (optional)
 *
 * Flow:
 *   1. Member picks a photo from camera or gallery (ImagePicker)
 *   2. Photo is uploaded to the server → returns a public GCS URL
 *   3. Member optionally adds a text memory and a video link
 *   4. Contribution is POSTed (comment_text, image_url, video_url)
 */
import React, { useState, useCallback } from "react";
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
  Image,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const MAX_CHARS = 1000;

// Site-type display config
const SITE_CONFIG: Record<string, { accent: string; icon: React.ComponentProps<typeof Feather>["name"]; label: string; promptText: string }> = {
  mural:    { accent: "#0891B2", icon: "edit-2",   label: "Public Art & Mural",  promptText: "What did this mural mean to you? Share a memory, a story, or what you noticed." },
  monument: { accent: "#7C3AED", icon: "flag",     label: "Monument",            promptText: "Share a story, reflection, or what visiting this place meant to you." },
  museum:   { accent: "#D97706", icon: "book-open",label: "Museum",              promptText: "What did you see or learn here? Share what moved you or a moment you want to remember." },
  spiritual:{ accent: "#10B981", icon: "sun",      label: "Sacred Space",        promptText: "Share a reflection or what this place means to you and your community." },
  landmark: { accent: "#D97706", icon: "map-pin",  label: "Heritage Site",       promptText: "Share a memory, a family story, or what visiting this landmark meant to you." },
};

function getSiteConfig(siteType?: string) {
  return SITE_CONFIG[siteType ?? ""] ?? SITE_CONFIG.landmark;
}

export default function MuralContributionScreen() {
  const { siteId, siteName, siteAddress, siteType } = useLocalSearchParams<{
    siteId: string;
    siteName: string;
    siteAddress: string;
    siteType?: string;
  }>();
  const router = useRouter();
  const colors = useColors();

  const cfg = getSiteConfig(siteType ?? "landmark");
  const ACCENT = cfg.accent;

  const [commentText, setCommentText]     = useState("");
  const [videoUrl, setVideoUrl]           = useState("");
  const [photoUri, setPhotoUri]           = useState<string | null>(null);
  const [uploading, setUploading]         = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://www.mappingwithmelanin.com";
  const getToken = async (): Promise<string> => {
    if (Platform.OS === "web") return "";
    return (await SecureStore.getItemAsync("auth_session_token")) ?? "";
  };

  // ── Photo picker ─────────────────────────────────────────────────────────────
  const pickPhoto = useCallback(async (source: "camera" | "library") => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Camera access needed",
            "Allow camera access in Settings to take a photo at this site.",
            [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "Cancel", style: "cancel" }],
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.85,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Photo library access needed",
            "Allow photo library access in Settings to upload a photo.",
            [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "Cancel", style: "cancel" }],
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.85,
        });
      }
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Couldn't open picker", "Try again or paste a photo link instead.");
    }
  }, []);

  const showPhotoPicker = useCallback(() => {
    Alert.alert(
      "Add a photo",
      "Take a new photo or pick one from your library.",
      [
        { text: "Take photo", onPress: () => pickPhoto("camera") },
        { text: "Choose from library", onPress: () => pickPhoto("library") },
        { text: "Cancel", style: "cancel" },
      ],
    );
  }, [pickPhoto]);

  // ── Upload photo → GCS → return public URL ───────────────────────────────────
  const uploadPhoto = useCallback(async (localUri: string): Promise<string> => {
    const filename = localUri.split("/").pop() ?? "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase().replace("jpg", "jpeg")}` : "image/jpeg";

    const form = new FormData();
    form.append("file", { uri: localUri, name: filename, type } as unknown as Blob);

    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/tour-cultural-sites/${siteId}/upload-photo`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? `Upload failed (${res.status})`);
    }
    const { url } = await res.json() as { url: string };
    return url;
  }, [siteId, apiUrl]);

  // ── Submit contribution ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!commentText.trim() && !photoUri) {
      Alert.alert("Add something", "Share a memory, a photo, or both — anything helps the community.");
      return;
    }
    const token = await getToken();
    if (!token) {
      Alert.alert("Sign in required", "You need to be signed in to share a memory.");
      return;
    }
    const urlPat = /^https?:\/\/.+/i;
    if (videoUrl && !urlPat.test(videoUrl)) {
      Alert.alert("Invalid video link", "Video link must start with http:// or https://");
      return;
    }

    try {
      setSubmitting(true);

      // Upload photo first if one was picked
      let imageUrl: string | undefined;
      if (photoUri) {
        setUploading(true);
        try {
          imageUrl = await uploadPhoto(photoUri);
        } catch (err) {
          Alert.alert(
            "Photo upload failed",
            err instanceof Error ? err.message : "Could not upload your photo. You can still share a written memory.",
            [
              { text: "Submit without photo", onPress: () => { setPhotoUri(null); setUploading(false); void doPost(undefined); } },
              { text: "Try again", style: "cancel", onPress: () => { setUploading(false); setSubmitting(false); } },
            ],
          );
          return;
        } finally {
          setUploading(false);
        }
      }
      await doPost(imageUrl);
    } finally {
      setSubmitting(false);
    }
  };

  const doPost = async (imageUrl?: string) => {
    const token = await getToken();
    const body: Record<string, string | undefined> = {
      comment_text: commentText.trim() || `Visited ${siteName ?? "this site"}.`,
      image_url: imageUrl,
      video_url: videoUrl.trim() || undefined,
    };

    const res = await fetch(`${apiUrl}/api/tour-cultural-sites/${siteId}/contributions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (res.status === 401) { Alert.alert("Sign in required", "Please sign in and try again."); return; }
    if (res.status === 429) { Alert.alert("Already submitted", "You already have a contribution pending review for this site."); return; }
    if (!res.ok) {
      const b = await res.json().catch(() => ({})) as { error?: string };
      Alert.alert("Could not submit", b.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  };

  // ── Success state ─────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <View style={[s.successCard, { backgroundColor: colors.card, borderColor: `${ACCENT}30` }]}>
          <View style={s.successIcon}><Feather name="check-circle" size={40} color={ACCENT} /></View>
          <Text style={[s.successTitle, { color: colors.foreground }]}>Memory submitted!</Text>
          <Text style={[s.successBody, { color: colors.mutedForeground }]}>
            Your memory is under review and will appear on{" "}
            <Text style={{ fontWeight: "700" }}>{siteName}</Text>{" "}
            once approved. Thank you for contributing to the community&apos;s story.
          </Text>
          <TouchableOpacity style={[s.doneBtn, { backgroundColor: ACCENT }]} onPress={() => router.back()}>
            <Text style={s.doneBtnTxt}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isBusy = submitting || uploading;

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
          <View style={[s.siteBadge, { backgroundColor: `${ACCENT}18` }]}>
            <Feather name={cfg.icon} size={12} color={ACCENT} />
            <Text style={[s.siteBadgeTxt, { color: ACCENT }]}>{cfg.label}</Text>
          </View>
        </View>

        <Text style={[s.title, { color: colors.foreground }]} numberOfLines={2}>{siteName}</Text>
        {siteAddress ? (
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>{siteAddress}</Text>
        ) : null}

        {/* ── Photo section ── */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Photo</Text>
        {photoUri ? (
          <View style={s.photoPreviewWrap}>
            <Image source={{ uri: photoUri }} style={s.photoPreview} resizeMode="cover" />
            <TouchableOpacity
              style={[s.changePhotoBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={showPhotoPicker}
              disabled={isBusy}
            >
              <Feather name="refresh-cw" size={13} color={colors.mutedForeground} />
              <Text style={[s.changePhotoBtnTxt, { color: colors.mutedForeground }]}>Change photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.photoPickerBtn, { borderColor: `${ACCENT}40`, backgroundColor: `${ACCENT}08` }]}
            onPress={showPhotoPicker}
            disabled={isBusy}
            activeOpacity={0.8}
          >
            <Feather name="camera" size={22} color={ACCENT} />
            <Text style={[s.photoPickerTxt, { color: ACCENT }]}>Take or choose a photo</Text>
            <Text style={[s.photoPickerSub, { color: colors.mutedForeground }]}>Optional — add a photo from your visit</Text>
          </TouchableOpacity>
        )}

        {/* ── Memory text ── */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
          Your memory <Text style={[s.optional, { color: colors.mutedForeground }]}>(optional)</Text>
        </Text>
        <Text style={[s.helpText, { color: colors.mutedForeground }]}>{cfg.promptText}</Text>
        <TextInput
          style={[s.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
          multiline
          numberOfLines={5}
          maxLength={MAX_CHARS}
          placeholder="Share your story…"
          placeholderTextColor={colors.mutedForeground}
          value={commentText}
          onChangeText={setCommentText}
          textAlignVertical="top"
          editable={!isBusy}
        />
        <Text style={[s.charCount, { color: commentText.length > MAX_CHARS * 0.9 ? "#EF4444" : colors.mutedForeground }]}>
          {commentText.length}/{MAX_CHARS}
        </Text>

        {/* ── Video link ── */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
          Video link <Text style={[s.optional, { color: colors.mutedForeground }]}>(optional)</Text>
        </Text>
        <Text style={[s.helpText, { color: colors.mutedForeground }]}>
          YouTube, Instagram Reel, TikTok, or any public video URL.
        </Text>
        <TextInput
          style={[s.urlInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
          placeholder="https://youtube.com/watch?v=..."
          placeholderTextColor={colors.mutedForeground}
          value={videoUrl}
          onChangeText={setVideoUrl}
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
          editable={!isBusy}
        />

        <Text style={[s.modNote, { color: colors.mutedForeground, borderColor: colors.border }]}>
          Memories are reviewed by the community before appearing publicly.
        </Text>

        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: ACCENT, opacity: isBusy ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isBusy}
          activeOpacity={0.85}
        >
          {isBusy ? (
            <View style={s.busyRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={s.submitBtnTxt}>{uploading ? "Uploading photo…" : "Submitting…"}</Text>
            </View>
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
  scroll:           { padding: 20, paddingBottom: 48 },
  center:           { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn:          { padding: 4 },
  siteBadge:        { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  siteBadgeTxt:     { fontSize: 12, fontWeight: "600" },
  title:            { fontSize: 22, fontWeight: "700", lineHeight: 28, marginBottom: 4 },
  subtitle:         { fontSize: 13, marginBottom: 24 },
  sectionLabel:     { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  helpText:         { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  optional:         { fontWeight: "400", fontSize: 11 },
  // Photo picker
  photoPickerBtn:   { borderWidth: 1.5, borderRadius: 12, borderStyle: "dashed", alignItems: "center", justifyContent: "center", padding: 24, gap: 8, marginBottom: 4 },
  photoPickerTxt:   { fontSize: 15, fontWeight: "600" },
  photoPickerSub:   { fontSize: 12 },
  photoPreviewWrap: { marginBottom: 8 },
  photoPreview:     { width: "100%", height: 200, borderRadius: 12, marginBottom: 8 },
  changePhotoBtn:   { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  changePhotoBtnTxt:{ fontSize: 12 },
  // Text input
  textArea:         { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, lineHeight: 22, minHeight: 120 },
  charCount:        { fontSize: 11, textAlign: "right", marginTop: 4 },
  urlInput:         { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, height: 46 },
  modNote:          { fontSize: 11, lineHeight: 17, borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 24, marginBottom: 8 },
  // Submit
  submitBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 12, marginTop: 16 },
  submitBtnTxt:     { color: "#fff", fontSize: 16, fontWeight: "700" },
  busyRow:          { flexDirection: "row", alignItems: "center", gap: 10 },
  // Success
  successCard:      { borderWidth: 1, borderRadius: 16, padding: 28, alignItems: "center", width: "100%" },
  successIcon:      { marginBottom: 16 },
  successTitle:     { fontSize: 22, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  successBody:      { fontSize: 15, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  doneBtn:          { height: 48, borderRadius: 12, paddingHorizontal: 32, alignItems: "center", justifyContent: "center" },
  doneBtnTxt:       { color: "#fff", fontSize: 16, fontWeight: "700" },
});
