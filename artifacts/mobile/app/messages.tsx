import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

export interface Conversation {
  id: string;
  name: string;
  initials: string;
  color: string;
  lastMessage: string;
  timeAgo: string;
  unread: number;
  type: "business" | "user";
  online?: boolean;
}

export const CONVERSATIONS: Conversation[] = [
  { id: "c1", name: "Essence Beauty Lounge", initials: "EB", color: "#3B1F0E", lastMessage: "Thank you for your review! We hope to see you again soon 💛", timeAgo: "2m", unread: 1, type: "business", online: true },
  { id: "c2", name: "Zara M.", initials: "ZM", color: "#2D7A4F", lastMessage: "Did you check out that new bookstore I mentioned?", timeAgo: "14m", unread: 2, type: "user" },
  { id: "c3", name: "Sweet Auburn BBQ", initials: "SA", color: "#C9922B", lastMessage: "We're running a special this weekend — 20% off for community members!", timeAgo: "1h", unread: 0, type: "business" },
  { id: "c4", name: "Kwame A.", initials: "KA", color: "#7B3F00", lastMessage: "The Juneteenth event was amazing! Are you going next year?", timeAgo: "3h", unread: 0, type: "user" },
  { id: "c5", name: "Harambee Tech Hub", initials: "HT", color: "#1D4ED8", lastMessage: "Our next coding bootcamp starts July 15th. Spots are limited!", timeAgo: "1d", unread: 0, type: "business" },
  { id: "c6", name: "Imani T.", initials: "IT", color: "#7B2D8B", lastMessage: "Just booked my appointment at Ujima Wellness 🙌🏾", timeAgo: "2d", unread: 0, type: "user" },
  { id: "c7", name: "Melanin Money Financial", initials: "MM", color: "#2D7A4F", lastMessage: "Your free consultation is confirmed for Friday at 2pm", timeAgo: "3d", unread: 0, type: "business" },
];

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "business" | "user">("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const totalUnread = CONVERSATIONS.reduce((n, c) => n + c.unread, 0);

  const filtered = CONVERSATIONS.filter((c) => {
    const matchSearch = search.length === 0 || c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Messages</Text>
          {totalUnread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.composeBtn, { backgroundColor: colors.primary }]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
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
        <View style={styles.filterRow}>
          {(["all", "business", "user"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                { backgroundColor: filter === f ? colors.primary : colors.secondary, borderColor: filter === f ? colors.primary : colors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(f);
              }}
            >
              <Text style={[styles.filterChipText, { color: filter === f ? "#FFFFFF" : colors.foreground }]}>
                {f === "all" ? "All" : f === "business" ? "Businesses" : "People"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 40 }}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="message-circle" size={40} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No messages yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Start a conversation with a business or community member.</Text>
          </View>
        ) : (
          filtered.map((conv, idx) => (
            <TouchableOpacity
              key={conv.id}
              style={[
                styles.convRow,
                { borderBottomColor: colors.border },
                idx === 0 && { borderTopColor: colors.border, borderTopWidth: 1 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/chat/[id]", params: { id: conv.id } });
              }}
              activeOpacity={0.75}
            >
              <View style={styles.avatarWrap}>
                <View style={[styles.avatar, { backgroundColor: conv.color }]}>
                  <Text style={styles.avatarInitials}>{conv.initials}</Text>
                </View>
                {conv.online && <View style={[styles.onlineDot, { borderColor: colors.background }]} />}
              </View>

              <View style={styles.convContent}>
                <View style={styles.convTop}>
                  <View style={styles.convNameRow}>
                    <Text style={[styles.convName, { color: colors.foreground, fontFamily: conv.unread > 0 ? "Inter_700Bold" : "Inter_600SemiBold" }]}>
                      {conv.name}
                    </Text>
                    {conv.type === "business" && (
                      <View style={[styles.bizTag, { backgroundColor: colors.primary + "15" }]}>
                        <Feather name="briefcase" size={9} color={colors.primary} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.convTime, { color: colors.mutedForeground, fontFamily: conv.unread > 0 ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                    {conv.timeAgo}
                  </Text>
                </View>
                <View style={styles.convBottom}>
                  <Text style={[styles.convPreview, { color: conv.unread > 0 ? colors.foreground : colors.mutedForeground, fontFamily: conv.unread > 0 ? "Inter_500Medium" : "Inter_400Regular" }]} numberOfLines={1}>
                    {conv.lastMessage}
                  </Text>
                  {conv.unread > 0 && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.primary }]}>
                      <Text style={styles.unreadDotText}>{conv.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  unreadBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: "center" },
  unreadBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#FFFFFF" },
  composeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 10, borderBottomWidth: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  convRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1 },
  avatarWrap: { position: "relative" },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#FFFFFF" },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: "#2D7A4F", borderWidth: 2 },
  convContent: { flex: 1, gap: 3 },
  convTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  convNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  convName: { fontSize: 14 },
  bizTag: { width: 16, height: 16, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  convTime: { fontSize: 11 },
  convBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  convPreview: { flex: 1, fontSize: 13 },
  unreadDot: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" },
  unreadDotText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#FFFFFF" },
  empty: { alignItems: "center", paddingVertical: 80, gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
});
