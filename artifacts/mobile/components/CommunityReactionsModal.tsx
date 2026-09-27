import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/lib/api";

type ReactionMember = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
};

type ReactionsResponse = {
  members?: ReactionMember[];
  totalLikes?: number;
  hasUnattributedLikes?: boolean;
};

function displayName(member: ReactionMember): string {
  return [member.firstName, member.lastName].filter(Boolean).join(" ") || member.username || "Community member";
}

function initials(member: ReactionMember): string {
  return `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase()
    || member.username?.slice(0, 2).toUpperCase()
    || "M";
}

export function CommunityReactionsModal({
  visible,
  postId,
  fallbackLikeCount,
  onClose,
}: {
  visible: boolean;
  postId: string | null;
  fallbackLikeCount: number;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<ReactionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(false);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const response = await fetch(`${getApiBase()}/api/community/posts/${postId}/reactions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("reaction list unavailable");
      setData(await response.json() as ReactionsResponse);
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (visible) void load();
    else {
      setData(null);
      setError(false);
    }
  }, [visible, load]);

  const totalLikes = data?.totalLikes ?? fallbackLikeCount;
  const members = data?.members ?? [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <View style={{ width: 40 }} />
          <View style={s.headerCopy}>
            <Text style={[s.title, { color: colors.foreground }]}>Liked by</Text>
            <Text style={[s.subtitle, { color: colors.mutedForeground }]}>{totalLikes} {totalLikes === 1 ? "like" : "likes"}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[s.closeButton, { backgroundColor: colors.secondary }]} accessibilityRole="button" accessibilityLabel="Close likes">
            <Feather name="x" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : error ? (
          <View style={s.center}>
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Could not load the member list.</Text>
            <TouchableOpacity onPress={() => void load()} style={[s.retry, { backgroundColor: colors.primary }]} accessibilityRole="button" accessibilityLabel="Retry loading likes">
              <Text style={s.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(member) => member.userId}
            contentContainerStyle={[s.list, members.length === 0 && s.emptyList]}
            ListEmptyComponent={<Text style={[s.emptyText, { color: colors.mutedForeground }]}>No visible member profiles are available for these likes yet.</Text>}
            ListFooterComponent={data?.hasUnattributedLikes ? <Text style={[s.note, { color: colors.mutedForeground }]}>The total includes earlier likes that were counted before individual member lists were available.</Text> : null}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.memberRow, { borderBottomColor: colors.border }]}
                onPress={() => { onClose(); router.push(`/user/${item.userId}` as never); }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Open ${displayName(item)}'s profile`}
              >
                {item.profileImageUrl ? <Image source={{ uri: item.profileImageUrl }} style={s.avatar} /> : <View style={[s.avatar, s.avatarFallback, { backgroundColor: colors.primary }]}><Text style={s.avatarInitials}>{initials(item)}</Text></View>}
                <View style={s.memberCopy}>
                  <Text style={[s.memberName, { color: colors.foreground }]} numberOfLines={1}>{displayName(item)}</Text>
                  {item.username ? <Text style={[s.memberHandle, { color: colors.mutedForeground }]} numberOfLines={1}>@{item.username}</Text> : null}
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1 },
  headerCopy: { flex: 1, alignItems: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 18 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 28 },
  emptyList: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitials: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  memberCopy: { flex: 1, minWidth: 0 },
  memberName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  memberHandle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, textAlign: "center" },
  note: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, paddingTop: 18, textAlign: "center" },
  retry: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11 },
  retryText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 },
});
