import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/lib/auth";

const COLORS = ["#3B1F0E", "#2D7A4F", "#C9922B", "#7B4F2E", "#1D4ED8", "#7B2D8B", "#D4873A"];

function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function colorForId(id: number): string {
  return COLORS[id % COLORS.length] ?? COLORS[0];
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { conversations, isLoading, refetch } = useConversations();
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = conversations.filter(
    (c) => search.length === 0 || c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Messages</Text>
        </View>
        <TouchableOpacity
          style={[styles.composeBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert("Coming Soon", "Direct messaging will be available in a future update. Stay tuned!");
          }}
        >
          <Feather name="edit-2" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search conversations..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isAuthenticated ? (
        <View style={styles.empty}>
          <Feather name="lock" size={40} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>Sign in to view messages</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Your conversations with businesses and community members will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad + 40 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {isLoading && conversations.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="message-circle" size={40} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No messages yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Start a conversation with a business or community member.
              </Text>
            </View>
          ) : (
            filtered.map((conv, idx) => {
              const initials = getInitials(conv.title);
              const color = colorForId(conv.id);
              return (
                <TouchableOpacity
                  key={conv.id}
                  style={[
                    styles.convRow,
                    { borderBottomColor: colors.border },
                    idx === 0 && { borderTopColor: colors.border, borderTopWidth: 1 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/chat/[id]", params: { id: String(conv.id) } });
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.avatarWrap}>
                    {conv.title.startsWith("🔒 Private Feedback") ? (
                      <View style={[styles.avatar, { backgroundColor: "#7B4F2E" }]}>
                        <Feather name="lock" size={20} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: color }]}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.convContent}>
                    <View style={styles.convTop}>
                      <Text style={[styles.convName, { color: colors.foreground }]} numberOfLines={1}>
                        {conv.title}
                      </Text>
                      <Text style={[styles.convTime, { color: colors.mutedForeground }]}>
                        {formatTime(conv.lastMessageAt)}
                      </Text>
                    </View>
                    <Text
                      style={[styles.convPreview, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {conv.lastMessagePreview ?? "No messages yet"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  composeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  convRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1 },
  avatarWrap: { position: "relative" },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#FFFFFF" },
  convContent: { flex: 1, gap: 3 },
  convTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  convName: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  convTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  convPreview: { fontFamily: "Inter_400Regular", fontSize: 13 },
  empty: { alignItems: "center", paddingVertical: 80, gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
});
