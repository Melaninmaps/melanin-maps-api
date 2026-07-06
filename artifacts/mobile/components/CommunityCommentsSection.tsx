import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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

type LoveNote = {
  id: string;
  note: string;
  contentLink: string | null;
  upvotes: number;
  createdAt: string;
};

type Props = {
  businessId: string;
  businessName: string;
};

const MAX_CHARS = 200;
const URL_RE = /^https?:\/\/.+\..+/i;

export default function CommunityCommentsSection({ businessId, businessName }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [linkText, setLinkText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const inputRef = useRef<TextInput>(null);

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

  const handleSubmit = async () => {
    const trimmed = noteText.trim();
    if (trimmed.length < 5) { setSubmitError("Write at least 5 characters."); return; }
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
        body: JSON.stringify({ note: trimmed, contentLink: linkText.trim() || null }),
      });
      const data = await res.json() as { loveNote?: LoveNote; error?: string };
      if (!res.ok || !data.loveNote) { setSubmitError(data.error ?? "Failed to post. Please try again."); return; }
      setNotes(prev => [data.loveNote!, ...prev]);
      setNoteText("");
      setLinkText("");
      setModalOpen(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { setSubmitError("Could not connect. Please try again."); }
    finally { setSubmitting(false); }
  };

  const handleUpvote = async (noteId: string) => {
    if (upvoted.has(noteId)) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUpvoted(prev => new Set([...prev, noteId]));
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, upvotes: n.upvotes + 1 } : n));
    try {
      const token = await getToken();
      await fetch(`${getApiBase()}/api/love-notes/${noteId}/upvote`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch { }
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

  const charsLeft = MAX_CHARS - noteText.length;

  return (
    <View style={[s.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.foreground }]}>💬 Community Comments</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[s.addBtn, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "35" }]}
          onPress={() => {
            if (!isAuthenticated) { setModalOpen(true); return; }
            setModalOpen(true);
            setTimeout(() => inputRef.current?.focus(), 300);
          }}
        >
          <Feather name="edit-2" size={12} color={colors.primary} />
          <Text style={[s.addBtnText, { color: colors.primary }]}>Add Comment</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : notes.length === 0 ? (
        <View style={s.empty}>
          <Feather name="message-circle" size={22} color={colors.muted} />
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
            Be the first to leave a comment about {businessName}.
          </Text>
        </View>
      ) : (
        <View style={s.notesList}>
          {notes.map((n) => (
            <View key={n.id} style={[s.noteCard, { borderColor: colors.border }]}>
              <Text style={[s.noteText, { color: colors.foreground }]}>{n.note}</Text>
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
                  activeOpacity={0.8}
                  style={[s.upvoteBtn, upvoted.has(n.id) && { opacity: 0.5 }]}
                  onPress={() => handleUpvote(n.id)}
                  disabled={upvoted.has(n.id)}
                >
                  <Feather name="thumbs-up" size={12} color={upvoted.has(n.id) ? colors.primary : colors.mutedForeground} />
                  <Text style={[s.upvoteCount, { color: upvoted.has(n.id) ? colors.primary : colors.mutedForeground }]}>
                    {n.upvotes}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setModalOpen(false)} />
        <View style={[s.sheet, { backgroundColor: colors.background, paddingBottom: (Platform.OS === "ios" ? insets.bottom : 16) + 16 }]}>
          <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[s.sheetTitle, { color: colors.foreground }]}>Leave a Community Comment</Text>
          <Text style={[s.sheetSub, { color: colors.mutedForeground }]}>
            Share your experience, tips, or thoughts about {businessName}.
          </Text>

          {!isAuthenticated && (
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
            numberOfLines={4}
            textAlignVertical="top"
            editable={isAuthenticated}
          />
          <View style={s.charRow}>
            <Text style={[s.charCount, { color: charsLeft < 20 ? "#DC2626" : colors.mutedForeground }]}>
              {charsLeft} characters left
            </Text>
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
            style={[s.submitBtn, { backgroundColor: isAuthenticated ? colors.primary : colors.muted }]}
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 15 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  addBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 20 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  notesList: { gap: 10 },
  noteCard: { borderBottomWidth: 1, paddingBottom: 10 },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, marginTop: 7 },
  linkText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  noteMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 7 },
  noteTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  upvoteBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  upvoteCount: { fontFamily: "Inter_500Medium", fontSize: 12 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 4 },
  sheetSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 16 },
  authWarn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 12 },
  authWarnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#92400E", flex: 1 },
  textArea: { borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 100, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  charRow: { alignItems: "flex-end", marginTop: 4, marginBottom: 12 },
  charCount: { fontFamily: "Inter_400Regular", fontSize: 11 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 6 },
  linkInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 12 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  errorText: { color: "#DC2626", fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
});
