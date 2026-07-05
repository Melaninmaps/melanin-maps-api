import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { useConversations, type ApiConversation, type UserSearchResult } from "@/hooks/useConversations";
import { useAuth } from "@/lib/auth";

const GOLD = "#CA922B";
const AVATAR_COLORS = ["#CA922B", "#2D7A4F", "#C9922B", "#7B4F2E", "#1D4ED8", "#7B2D8B", "#D4873A"];

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
function colorForId(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
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

// ─── New DM Modal ─────────────────────────────────────────────────────────────
function NewDMModal({
  visible,
  onClose,
  onSelect,
  searchUsers,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (user: UserSearchResult) => void;
  searchUsers: (q: string) => Promise<UserSearchResult[]>;
  colors: ReturnType<typeof useColors>;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const found = await searchUsers(query);
    setResults(found);
    setLoading(false);
  }, [searchUsers]);

  const handleClose = () => { setQ(""); setResults([]); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[dmStyles.root, { backgroundColor: colors.background }]}>
        <View style={[dmStyles.header, { borderBottomColor: colors.border }]}>
          <Text style={[dmStyles.title, { color: colors.foreground }]}>New Message</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={[dmStyles.searchBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[dmStyles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name or @username..."
            placeholderTextColor={colors.mutedForeground}
            value={q}
            autoFocus
            onChangeText={(t) => { setQ(t); void runSearch(t); }}
          />
          {q.length > 0 && (
            <TouchableOpacity activeOpacity={0.85} onPress={() => { setQ(""); setResults([]); }}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={dmStyles.center}><ActivityIndicator size="large" color={GOLD} /></View>
        ) : results.length === 0 && q.length >= 2 ? (
          <View style={dmStyles.center}>
            <Feather name="users" size={38} color={colors.muted} />
            <Text style={[dmStyles.emptyText, { color: colors.mutedForeground }]}>No community members found</Text>
          </View>
        ) : q.length < 2 ? (
          <View style={dmStyles.center}>
            <Feather name="search" size={38} color={colors.muted} />
            <Text style={[dmStyles.emptyText, { color: colors.mutedForeground }]}>Type a name or @username to search</Text>
          </View>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled">
            {results.map((u) => {
              const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Community Member";
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[dmStyles.userRow, { borderBottomColor: colors.border }]}
                  onPress={() => { handleClose(); onSelect(u); }}
                  activeOpacity={0.75}
                >
                  <View style={[dmStyles.avatar, { backgroundColor: GOLD + "33" }]}>
                    <Text style={[dmStyles.avatarText, { color: GOLD }]}>{getInitials(name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[dmStyles.userName, { color: colors.foreground }]}>{name}</Text>
                    {u.username && (
                      <Text style={[dmStyles.userHandle, { color: colors.mutedForeground }]}>@{u.username}</Text>
                    )}
                  </View>
                  {u.isPrivate && (
                    <View style={[dmStyles.privateBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                      <Feather name="lock" size={11} color={colors.mutedForeground} />
                      <Text style={[dmStyles.privateBadgeText, { color: colors.mutedForeground }]}>Private</Text>
                    </View>
                  )}
                  <Feather name="send" size={16} color={GOLD} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Pending Request Banner ───────────────────────────────────────────────────
function PendingRequestRow({
  conv,
  currentUserId,
  onAccept,
  onDecline,
  colors,
}: {
  conv: ApiConversation;
  currentUserId: string;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const isIncoming = conv.requestedBy !== currentUserId;
  return (
    <View style={[prStyles.row, { backgroundColor: colors.card, borderColor: GOLD + "44" }]}>
      <View style={[prStyles.avatar, { backgroundColor: GOLD + "22" }]}>
        <Feather name="mail" size={20} color={GOLD} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[prStyles.title, { color: colors.foreground }]}>{conv.title}</Text>
        <Text style={[prStyles.sub, { color: colors.mutedForeground }]}>
          {isIncoming ? "Wants to message you" : "Message request pending"}
        </Text>
      </View>
      {isIncoming ? (
        <View style={prStyles.actions}>
          <TouchableOpacity activeOpacity={0.85}
            style={[prStyles.acceptBtn, { backgroundColor: GOLD }]}
            onPress={() => onAccept(conv.id)}
          >
            <Text style={prStyles.acceptText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85}
            style={[prStyles.declineBtn, { borderColor: colors.border }]}
            onPress={() => onDecline(conv.id)}
          >
            <Text style={[prStyles.declineText, { color: colors.mutedForeground }]}>Decline</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[prStyles.pendingTag, { backgroundColor: GOLD + "22" }]}>
          <Text style={[prStyles.pendingText, { color: GOLD }]}>Pending</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id ?? null;
  const { conversations, isLoading, refetch, createDM, acceptRequest, declineRequest, searchUsers } = useConversations();
  const [search, setSearch] = useState("");
  const [showNewDM, setShowNewDM] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const pendingIncoming = conversations.filter(
    (c) => c.type === "dm" && c.requestStatus === "pending" && c.requestedBy !== userId
  );
  const pendingOutgoing = conversations.filter(
    (c) => c.type === "dm" && c.requestStatus === "pending" && c.requestedBy === userId
  );
  const active = conversations.filter((c) => c.requestStatus === "accepted" || c.requestStatus === null);

  const allVisible = [...pendingIncoming, ...pendingOutgoing, ...active].filter(
    (c) => search.length === 0 || c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectUser = async (user: UserSearchResult) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Community Member";
    const conv = await createDM(user.id, name);
    if (conv) {
      router.push({ pathname: "/chat/[id]", params: { id: String(conv.id) } });
    } else {
      Alert.alert("Error", "Could not start conversation. Please try again.");
    }
  };

  const handleAccept = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await acceptRequest(id);
    router.push({ pathname: "/chat/[id]", params: { id: String(id) } });
  };

  const handleDecline = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Decline Request", "Are you sure you want to decline this message request?", [
      { text: "Cancel", style: "cancel" },
      { text: "Decline", style: "destructive", onPress: async () => { await declineRequest(id); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Messages</Text>
          {pendingIncoming.length > 0 && (
            <View style={[styles.badge, { backgroundColor: GOLD }]}>
              <Text style={styles.badgeText}>{pendingIncoming.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity activeOpacity={0.85}
          style={[styles.composeBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!isAuthenticated) {
              Alert.alert("Sign In Required", "Please sign in to send direct messages.");
              return;
            }
            setShowNewDM(true);
          }}
        >
          <Feather name="edit-2" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
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
            <TouchableOpacity activeOpacity={0.85} onPress={() => setSearch("")}>
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
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        >
          {isLoading && conversations.length === 0 ? (
            <View style={styles.loadingWrap}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : allVisible.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="message-circle" size={40} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No messages yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Tap the compose button to start a direct message with a community member.
              </Text>
              <TouchableOpacity
                style={[styles.startDMBtn, { backgroundColor: GOLD }]}
                onPress={() => setShowNewDM(true)}
                activeOpacity={0.85}
              >
                <Feather name="edit-2" size={14} color="#fff" />
                <Text style={styles.startDMText}>Start a Conversation</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Pending requests section */}
              {(pendingIncoming.length > 0 || pendingOutgoing.filter((c) =>
                search.length === 0 || c.title.toLowerCase().includes(search.toLowerCase())
              ).length > 0) && (
                <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MESSAGE REQUESTS</Text>
                </View>
              )}
              {pendingIncoming
                .filter((c) => search.length === 0 || c.title.toLowerCase().includes(search.toLowerCase()))
                .map((conv) => (
                  <View key={conv.id} style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                    <PendingRequestRow
                      conv={conv}
                      currentUserId={userId ?? ""}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      colors={colors}
                    />
                  </View>
                ))}
              {pendingOutgoing
                .filter((c) => search.length === 0 || c.title.toLowerCase().includes(search.toLowerCase()))
                .map((conv) => (
                  <View key={conv.id} style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                    <PendingRequestRow
                      conv={conv}
                      currentUserId={userId ?? ""}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      colors={colors}
                    />
                  </View>
                ))}

              {/* Active conversations */}
              {active.filter((c) =>
                search.length === 0 || c.title.toLowerCase().includes(search.toLowerCase())
              ).length > 0 && (
                <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONVERSATIONS</Text>
                </View>
              )}
              {active
                .filter((c) => search.length === 0 || c.title.toLowerCase().includes(search.toLowerCase()))
                .map((conv, idx) => {
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
                        ) : conv.type === "dm" ? (
                          <View style={[styles.avatar, { backgroundColor: GOLD + "33" }]}>
                            <Text style={[styles.avatarInitials, { color: GOLD }]}>{initials}</Text>
                          </View>
                        ) : (
                          <View style={[styles.avatar, { backgroundColor: color }]}>
                            <Text style={styles.avatarInitials}>{initials}</Text>
                          </View>
                        )}
                        {conv.type === "dm" && (
                          <View style={[styles.dmDot, { backgroundColor: GOLD }]} />
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
                        <Text style={[styles.convPreview, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {conv.lastMessagePreview ?? "No messages yet"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </>
          )}
        </ScrollView>
      )}

      <NewDMModal
        visible={showNewDM}
        onClose={() => setShowNewDM(false)}
        onSelect={handleSelectUser}
        searchUsers={searchUsers}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  badge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: "center" },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#fff" },
  composeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, borderBottomWidth: 1 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8 },
  convRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1 },
  avatarWrap: { position: "relative" },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#FFFFFF" },
  dmDot: { position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#fff" },
  convContent: { flex: 1, gap: 3 },
  convTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  convName: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  convTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  convPreview: { fontFamily: "Inter_400Regular", fontSize: 13 },
  empty: { alignItems: "center", paddingVertical: 80, gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  startDMBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, marginTop: 8 },
  startDMText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
});

const dmStyles = StyleSheet.create({
  root: { flex: 1, paddingTop: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, margin: 16, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 40 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 17 },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  userHandle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  privateBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, marginRight: 8 },
  privateBadgeText: { fontFamily: "Inter_400Regular", fontSize: 11 },
});

const prStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  acceptBtn: { borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  acceptText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  declineBtn: { borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1 },
  declineText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  pendingTag: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  pendingText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});
