import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

type SearchUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
};

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function getInitials(user: SearchUser): string {
  const f = user.firstName?.[0] ?? "";
  const l = user.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function getFullName(user: SearchUser): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unknown user";
}

export default function InviteMembersScreen() {
  const { id, groupName } = useLocalSearchParams<{ id: string; groupName?: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<SearchUser | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const search = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const apiBase = getApiBase();
        const token = await SecureStore.getItemAsync("auth_session_token");
        const res = await fetch(`${apiBase}/api/users/search?q=${encodeURIComponent(q.trim())}`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        if (res.ok) {
          const data = await res.json() as { users: SearchUser[] };
          setResults(data.users);
        }
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 350);
  }, []);

  const sendInvite = async () => {
    if (!selected || !id) return;
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const apiBase = getApiBase();
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${apiBase}/api/groups/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ invitedUserId: selected.id, message: message.trim() || undefined }),
      });
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSent((prev) => new Set([...prev, selected.id]));
        setSelected(null);
        setMessage("");
      } else {
        const err = await res.json() as { error?: string };
        Alert.alert("Couldn't send invite", err.error ?? "Please try again.");
      }
    } catch {
      Alert.alert("Error", "Could not connect. Try again.");
    }
    setSending(false);
  };

  const handleSelectUser = (user: SearchUser) => {
    Haptics.selectionAsync();
    setSelected(user);
    setQuery("");
    setResults([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Invite Members</Text>
          {groupName ? (
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>{groupName}</Text>
          ) : null}
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.label, { color: colors.mutedForeground }]}>SEARCH MEMBERS</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={search}
            autoCapitalize="words"
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {results.length > 0 && !selected && (
          <View style={[styles.resultsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {results.map((user, idx) => {
              const alreadySent = sent.has(user.id);
              return (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.resultRow, idx < results.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  onPress={() => !alreadySent && handleSelectUser(user)}
                  disabled={alreadySent}
                  activeOpacity={0.7}
                >
                  {user.profileImageUrl ? (
                    <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: "#C9922B22" }]}>
                      <Text style={[styles.avatarInitials, { color: "#C9922B" }]}>{getInitials(user)}</Text>
                    </View>
                  )}
                  <Text style={[styles.resultName, { color: alreadySent ? colors.mutedForeground : colors.foreground }]}>
                    {getFullName(user)}
                  </Text>
                  {alreadySent ? (
                    <View style={styles.sentBadge}>
                      <Feather name="check" size={12} color="#2D7A4F" />
                      <Text style={styles.sentBadgeText}>Invited</Text>
                    </View>
                  ) : (
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!results.length && query.length >= 2 && !searching && (
          <Text style={[styles.noResults, { color: colors.mutedForeground }]}>No users found for "{query}"</Text>
        )}

        {selected && (
          <View style={[styles.selectedCard, { backgroundColor: colors.card, borderColor: "#2D7A4F44" }]}>
            <View style={styles.selectedRow}>
              {selected.profileImageUrl ? (
                <Image source={{ uri: selected.profileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: "#C9922B22" }]}>
                  <Text style={[styles.avatarInitials, { color: "#C9922B" }]}>{getInitials(selected)}</Text>
                </View>
              )}
              <Text style={[styles.selectedName, { color: colors.foreground }]}>{getFullName(selected)}</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => setSelected(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 4 }]}>ADD A MESSAGE (OPTIONAL)</Text>
            <TextInput
              style={[styles.messageInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Hey, join us for our trip planning group!"
              placeholderTextColor={colors.mutedForeground}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={200}
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: "#2D7A4F" }]}
              onPress={() => void sendInvite()}
              disabled={sending}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="user-plus" size={16} color="#FFFFFF" />
                  <Text style={styles.sendBtnText}>Send Invitation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {sent.size > 0 && (
          <View style={[styles.sentSummary, { backgroundColor: "#2D7A4F18" }]}>
            <Feather name="check-circle" size={16} color="#2D7A4F" />
            <Text style={[styles.sentSummaryText, { color: "#2D7A4F" }]}>
              {sent.size} invitation{sent.size !== 1 ? "s" : ""} sent
            </Text>
          </View>
        )}

        <View style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={15} color={colors.mutedForeground} />
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
            Members can accept or decline in their Group Invitations. Groups hold up to 8 people for travel planning.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  scroll: { padding: 16, gap: 12 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8, marginBottom: -6 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, padding: 0 },
  resultsList: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontFamily: "Inter_700Bold", fontSize: 14 },
  resultName: { fontFamily: "Inter_500Medium", fontSize: 15, flex: 1 },
  sentBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#2D7A4F18", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  sentBadgeText: { fontFamily: "Inter_500Medium", fontSize: 11, color: "#2D7A4F" },
  noResults: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 12 },
  selectedCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 12 },
  selectedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  selectedName: { fontFamily: "Inter_700Bold", fontSize: 16, flex: 1 },
  messageInput: {
    borderRadius: 12, borderWidth: 1, padding: 12,
    fontFamily: "Inter_400Regular", fontSize: 14, minHeight: 80,
    textAlignVertical: "top",
  },
  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9,
    height: 50, borderRadius: 14,
  },
  sendBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" },
  sentSummary: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12 },
  sentSummaryText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  tipCard: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start", marginTop: 8 },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 19 },
});
