import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
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
import type { CommunityPost } from "@/constants/types";

interface Comment {
  id: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  createdAt: string;
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  visible: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onLike?: () => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  recommendation: { label: "Recommendation", color: "#2D7A4F" },
  question: { label: "Question", color: "#D4873A" },
  alert: { label: "Alert", color: "#DC2626" },
  discussion: { label: "Discussion", color: "#C4622D" },
};

const POST_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  business: { label: "Business Post", color: "#7B2D8B", icon: "briefcase" },
  question: { label: "Question", color: "#D4873A", icon: "help-circle" },
  saved_place: { label: "Saved Place", color: "#1D4ED8", icon: "map-pin" },
  community: { label: "Community", color: "#C4622D", icon: "users" },
};

export function PostDetailModal({ visible, post, onClose, onLike }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localLiked, setLocalLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const loadComments = useCallback(async () => {
    if (!post?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/community/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json() as { comments: Comment[] };
        setComments(data.comments ?? []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [post?.id]);

  useEffect(() => {
    if (visible && post) {
      void loadComments();
      setLocalLiked(post.liked);
      setLocalLikes(post.likes);
    } else {
      setComments([]);
      setCommentText("");
    }
  }, [visible, post, loadComments]);

  const handleLike = async () => {
    if (!post) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalLiked((l) => !l);
    setLocalLikes((n) => localLiked ? n - 1 : n + 1);
    await fetch(`${getApiBase()}/api/community/posts/${post.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction: localLiked ? "down" : "up" }),
    }).catch(() => {});
    onLike?.();
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return;
    setSubmitting(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/community/posts/${post.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json() as { comment: Comment };
        setComments((prev) => [data.comment, ...prev]);
        setCommentText("");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  if (!post) return null;

  const typeConfig = POST_TYPE_CONFIG[post.postType ?? "community"];
  const catConfig = CATEGORY_CONFIG[post.category ?? "discussion"];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[m.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Handle bar */}
        <View style={[m.topBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[m.topBarTitle, { color: colors.foreground }]}>Post</Text>
          <View style={{ width: 22 }} />
        </View>

        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: bottomPad + 80, paddingHorizontal: 16, paddingTop: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Original post */}
              <View style={[m.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={m.postHeader}>
                  <View style={[m.avatar, { backgroundColor: post.authorColor }]}>
                    <Text style={m.initials}>{post.authorInitials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[m.author, { color: colors.foreground }]}>{post.author}</Text>
                    <Text style={[m.time, { color: colors.mutedForeground }]}>{post.timeAgo}</Text>
                  </View>
                  <View style={[m.typeTag, { backgroundColor: typeConfig.color + "15" }]}>
                    <Feather name={typeConfig.icon as any} size={11} color={typeConfig.color} />
                    <Text style={[m.typeTagText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                  </View>
                </View>

                {post.businessName && (
                  <View style={[m.businessBanner, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
                    <Feather name="briefcase" size={13} color={colors.primary} />
                    <Text style={[m.businessBannerText, { color: colors.primary }]}>{post.businessName}</Text>
                    {post.businessLink && (
                      <TouchableOpacity onPress={() => { if (post.businessLink) { void require("react-native").Linking.openURL(post.businessLink); } }}>
                        <Feather name="external-link" size={12} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <Text style={[m.content, { color: colors.foreground }]}>{post.content}</Text>

                {/* Post actions */}
                <View style={[m.postActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity onPress={handleLike} style={m.actionBtn}>
                    <Feather name="heart" size={18} color={localLiked ? "#C4622D" : colors.mutedForeground} />
                    <Text style={[m.actionCount, { color: localLiked ? "#C4622D" : colors.mutedForeground }]}>{localLikes}</Text>
                  </TouchableOpacity>
                  <View style={m.actionBtn}>
                    <Feather name="message-circle" size={18} color={colors.mutedForeground} />
                    <Text style={[m.actionCount, { color: colors.mutedForeground }]}>{comments.length}</Text>
                  </View>
                </View>
              </View>

              <Text style={[m.commentsLabel, { color: colors.mutedForeground }]}>
                {comments.length > 0 ? `${comments.length} comment${comments.length !== 1 ? "s" : ""}` : "No comments yet — be the first"}
              </Text>

              {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />}
            </>
          }
          renderItem={({ item: c }) => (
            <View style={[m.commentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[m.commentAvatar, { backgroundColor: c.authorColor }]}>
                <Text style={m.commentInitials}>{c.authorInitials}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={m.commentHeaderRow}>
                  <Text style={[m.commentAuthor, { color: colors.foreground }]}>{c.authorName}</Text>
                  <Text style={[m.commentTime, { color: colors.mutedForeground }]}>{formatTimeAgo(c.createdAt)}</Text>
                </View>
                <Text style={[m.commentContent, { color: colors.foreground }]}>{c.content}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            loading ? null : (
              <View style={m.emptyComments}>
                <Text style={{ fontSize: 32, textAlign: "center" }}>💬</Text>
                <Text style={[m.emptyText, { color: colors.mutedForeground }]}>
                  Start the conversation. Every voice matters here.
                </Text>
              </View>
            )
          }
        />

        {/* Comment input */}
        <View style={[m.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
          {isAuthenticated ? (
            <>
              <TextInput
                ref={inputRef}
                style={[m.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSubmitComment}
              />
              <TouchableOpacity
                style={[m.sendBtn, { backgroundColor: commentText.trim() ? colors.primary : colors.muted, opacity: commentText.trim() ? 1 : 0.4 }]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || submitting}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Feather name="send" size={16} color="#FFF" />
                }
              </TouchableOpacity>
            </>
          ) : (
            <Text style={[m.loginPrompt, { color: colors.mutedForeground }]}>Sign in to join the conversation</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const m = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  topBarTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  postCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  postHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFF" },
  author: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  time: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  typeTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  typeTagText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  businessBanner: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  businessBannerText: { fontFamily: "Inter_600SemiBold", fontSize: 12, flex: 1 },
  content: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 23 },
  postActions: { flexDirection: "row", gap: 20, borderTopWidth: 1, paddingTop: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontFamily: "Inter_400Regular", fontSize: 14 },
  commentsLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginVertical: 4 },
  commentCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 12 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  commentInitials: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#FFF" },
  commentHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  commentTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  commentContent: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  emptyComments: { alignItems: "center", gap: 10, paddingVertical: 28 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 21, maxWidth: 260 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  loginPrompt: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1, textAlign: "center", paddingVertical: 14 },
});
