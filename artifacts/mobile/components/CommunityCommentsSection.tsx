import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

const MAX_PICKS = 3;
const MAX_CHARS = 200;
const URL_RE = /^https?:\/\/.+\..+/i;

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

type LoveNote = {
  id: string;
  note: string;
  contentLink: string | null;
  upvotes: number;
  createdAt: string;
};

type Props = { businessId: string; businessName: string };

export default function CommunityCommentsSection({ businessId, businessName }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [writeOpen, setWriteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [linkText, setLinkText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const scales = useRef<Record<string, Animated.Value>>({});
  const inputRef = useRef<TextInput>(null);

  const picksUsed = selected.size;
  const picksLeft = MAX_PICKS - picksUsed;
  const charsLeft = MAX_CHARS - noteText.length;

  const getScale = (id: string) => {
    if (!scales.current[id]) scales.current[id] = new Animated.Value(1);
    return scales.current[id];
  };

  const bounce = (id: string) => {
    const s = getScale(id);
    Animated.sequence([
      Animated.spring(s, { toValue: 1.4, useNativeDriver: true, speed: 50, bounciness: 14 }),
      Animated.spring(s, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 4 }),
    ]).start();
  };

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/businesses/${businessId}/community-says`);
      if (res.ok) {
        const data = await res.json() as { loveNotes?: LoveNote[] };
        setNotes(data.loveNotes ?? []);
      }
    } catch { }
    finally { setLoading(false); }
  }, [businessId]);

  useEffect(() => { void fetchNotes(); }, [fetchNotes]);

  const handleToggle = async (noteId: string) => {
    const isSelected = selected.has(noteId);
    if (!isSelected && picksLeft <= 0) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bounce(noteId);
    setSelected(prev => {
      const next = new Set(prev);
      isSelected ? next.delete(noteId) : next.add(noteId);
      return next;
    });
    setNotes(prev =>
      prev.map(n => n.id === noteId
        ? { ...n, upvotes: Math.max(0, n.upvotes + (isSelected ? -1 : 1)) }
        : n
      )
    );
    try {
      const token = await getToken();
      await fetch(`${getApiBase()}/api/love-notes/${noteId}/upvote`, {
        method: isSelected ? "DELETE" : "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch { }
  };

  const handleSubmit = async () => {
    if (noteText.trim().length < 5) { setSubmitError("Write at least a few characters."); return; }
    if (noteText.trim().length > MAX_CHARS) { setSubmitError(`Keep your comment under ${MAX_CHARS} characters.`); return; }
    if (linkText.trim() && !URL_RE.test(linkText.trim())) {
      setSubmitError("Content link must be a valid URL (https://...)"); return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${getApiBase()}/api/businesses/${businessId}/love-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ note: noteText.trim(), contentLink: linkText.trim() || null }),
      });
      const data = await res.json() as { loveNote?: LoveNote; error?: string };
      if (!res.ok || !data.loveNote) { setSubmitError(data.error ?? "Failed to post. Please try again."); return; }
      setNotes(prev => [data.loveNote!, ...prev]);
      setNoteText(""); setLinkText("");
      setWriteOpen(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { setSubmitError("Could not connect. Please try again."); }
    finally { setSubmitting(false); }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return `${Math.floor(d / 30)}mo ago`;
  };

  return (
    <View style={[s.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <Text style={[s.title, { color: colors.foreground }]}>💬 Community Comments</Text>
      <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
        Pick what resonates, write your own — or both.
      </Text>

      {/* Two action cards */}
      <View style={s.actionRow}>
        {/* Pick card */}
        <View style={[s.actionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[s.actionEmoji]}>❤️</Text>
          <Text style={[s.actionTitle, { color: colors.foreground }]}>Pick Favorites</Text>
          <Text style={[s.actionSub, { color: colors.mutedForeground }]}>
            Tap hearts below to endorse up to 3 comments
          </Text>
          {/* Dots */}
          <View style={s.dotsRow}>
            {Array.from({ length: MAX_PICKS }).map((_, i) => (
              <View key={i} style={[s.dot, { backgroundColor: i < picksUsed ? colors.primary : colors.border }]} />
            ))}
            <Text style={[s.dotsLabel, { color: picksUsed > 0 ? colors.primary : colors.mutedForeground }]}>
              {picksUsed}/{MAX_PICKS}
            </Text>
          </View>
        </View>

        {/* Write card */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[s.actionCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "30" }]}
          onPress={() => {
            setWriteOpen(true);
            setTimeout(() => inputRef.current?.focus(), 300);
          }}
        >
          <Text style={s.actionEmoji}>✍️</Text>
          <Text style={[s.actionTitle, { color: colors.foreground }]}>Write a Comment</Text>
          <Text style={[s.actionSub, { color: colors.mutedForeground }]}>
            Share your experience in up to 200 words
          </Text>
          <View style={[s.writeBtn, { backgroundColor: colors.primary }]}>
            <Feather name="edit-2" size={11} color="#FFF" />
            <Text style={s.writeBtnText}>Write</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Notes list */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : notes.length === 0 ? (
        <View style={s.empty}>
          <Feather name="message-circle" size={22} color={colors.muted} />
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
            Be the first to share your thoughts about {businessName}.
          </Text>
        </View>
      ) : (
        <>
          {picksLeft === 0 && (
            <View style={[s.limitBanner, { backgroundColor: colors.primary + "0A", borderColor: colors.primary + "25" }]}>
              <Text style={[s.limitText, { color: colors.primary }]}>
                3/3 picks used · Tap ❤️ to swap your selection
              </Text>
            </View>
          )}
          <View style={s.notesList}>
            {notes.map((n) => {
              const isSelected = selected.has(n.id);
              const isDisabled = !isSelected && picksLeft <= 0;
              const scale = getScale(n.id);
              return (
                <View
                  key={n.id}
                  style={[
                    s.noteCard,
                    { borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary + "06" },
                  ]}
                >
                  <Text style={[s.noteText, { color: colors.foreground, opacity: isDisabled ? 0.4 : 1 }]}>
                    {n.note}
                  </Text>
                  {n.contentLink && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[s.linkRow, { backgroundColor: colors.primary + "0C", borderColor: colors.primary + "25" }]}
                      onPress={() => Linking.openURL(n.contentLink!).catch(() => {})}
                    >
                      <Feather name="link" size={12} color={colors.primary} />
                      <Text style={[s.linkText, { color: colors.primary }]} numberOfLines={1}>
                        {n.contentLink.replace(/^https?:\/\//, "").slice(0, 50)}
                        {n.contentLink.length > 55 ? "…" : ""}
                      </Text>
                      <Feather name="external-link" size={10} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  <View style={s.noteMeta}>
                    <Text style={[s.noteTime, { color: colors.mutedForeground }]}>{timeAgo(n.createdAt)}</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[s.heartBtn, isDisabled && { opacity: 0.3 }]}
                      onPress={() => handleToggle(n.id)}
                      disabled={isDisabled}
                    >
                      <Animated.View style={{ transform: [{ scale }] }}>
                        <Text style={s.heartEmoji}>{isSelected ? "❤️" : "🤍"}</Text>
                      </Animated.View>
                      <Text style={[s.upvoteCount, { color: isSelected ? colors.primary : colors.mutedForeground }]}>
                        {n.upvotes}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Write modal */}
      <Modal
        visible={writeOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setWriteOpen(false)}
      >
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setWriteOpen(false)} />
        <View style={[s.sheet, { backgroundColor: colors.background, paddingBottom: (Platform.OS === "ios" ? insets.bottom : 16) + 16 }]}>
          <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[s.sheetTitle, { color: colors.foreground }]}>Write a Comment</Text>
          <Text style={[s.sheetSub, { color: colors.mutedForeground }]}>
            Share your experience, tips, or thoughts about {businessName}. Up to 200 characters — emojis welcome! 🤎
          </Text>

          {!authLoading && !isAuthenticated && (
            <View style={[s.authWarn, { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }]}>
              <Feather name="info" size={14} color="#92400E" />
              <Text style={s.authWarnText}>Sign in to post a comment.</Text>
            </View>
          )}

          <TextInput
            ref={inputRef}
            style={[s.textArea, { color: colors.foreground, backgroundColor: colors.card, borderColor: submitError ? "#DC2626" : colors.border }]}
            placeholder={`What do you want the community to know about ${businessName}?`}
            placeholderTextColor={colors.mutedForeground}
            value={noteText}
            onChangeText={t => { setNoteText(t.slice(0, MAX_CHARS)); setSubmitError(""); }}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={isAuthenticated}
          />
          <View style={s.wordRow}>
            <Text style={[s.wordCount, { color: charsLeft < 20 ? "#DC2626" : colors.mutedForeground }]}>
              {noteText.length} / {MAX_CHARS} characters
            </Text>
            {charsLeft < 20 && (
              <Text style={[s.wordCount, { color: charsLeft < 0 ? "#DC2626" : "#D97706" }]}>
                {charsLeft < 0 ? `${Math.abs(charsLeft)} over limit` : `${charsLeft} left`}
              </Text>
            )}
          </View>

          <Text style={[s.fieldLabel, { color: colors.foreground }]}>Content Link (optional)</Text>
          <TextInput
            style={[s.linkInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder="https://youtube.com/… or your TikTok, Instagram…"
            placeholderTextColor={colors.mutedForeground}
            value={linkText}
            onChangeText={t => { setLinkText(t); setSubmitError(""); }}
            autoCapitalize="none"
            keyboardType="url"
            editable={isAuthenticated}
          />

          {!!submitError && (
            <View style={s.errorRow}>
              <Feather name="alert-circle" size={13} color="#DC2626" />
              <Text style={s.errorText}>{submitError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: isAuthenticated && noteText.trim().length >= 5 ? colors.primary : colors.muted }]}
            onPress={handleSubmit}
            disabled={!isAuthenticated || submitting || noteText.trim().length < 5}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={s.submitBtnText}>Post Comment</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },

  title: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 2 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginBottom: 14 },

  actionRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  actionCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 4 },
  actionEmoji: { fontSize: 22, marginBottom: 2 },
  actionTitle: { fontFamily: "Inter_700Bold", fontSize: 13 },
  actionSub: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15 },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotsLabel: { fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 2 },
  writeBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start", marginTop: 6 },
  writeBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#FFF" },

  limitBanner: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, alignItems: "center" },
  limitText: { fontFamily: "Inter_500Medium", fontSize: 12 },

  empty: { alignItems: "center", gap: 8, paddingVertical: 20 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },

  notesList: { gap: 0 },
  noteCard: { paddingVertical: 12, borderBottomWidth: 1, paddingHorizontal: 4 },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, marginTop: 7 },
  linkText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  noteMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  noteTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  heartBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  heartEmoji: { fontSize: 15 },
  upvoteCount: { fontFamily: "Inter_600SemiBold", fontSize: 13 },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 4 },
  sheetSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 16 },
  authWarn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 12 },
  authWarnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#92400E", flex: 1 },
  textArea: { borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 130, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  wordRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, marginBottom: 14 },
  wordCount: { fontFamily: "Inter_400Regular", fontSize: 11 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 6 },
  linkInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 12 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  errorText: { color: "#DC2626", fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
});
