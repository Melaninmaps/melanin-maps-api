import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface Connection {
  id: number;
  status: string;
  requesterId: string;
  recipientId: string;
  createdAt: string;
  respondedAt: string | null;
  otherId: string | null;
  otherFirstName: string | null;
  otherLastName: string | null;
  otherProfileImageUrl: string | null;
}

interface SearchUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  bio: string | null;
}

interface Suggestion {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  mutualCount: number;
}

export default function ConnectionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/connections`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { connections: Connection[] };
        setConnections(data.connections ?? []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/users/suggestions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
      }
    } catch { /* silent */ }
    finally { setLoadingSuggestions(false); }
  }, []);

  useEffect(() => {
    void loadConnections();
    void loadSuggestions();
  }, [loadConnections, loadSuggestions]);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { users: SearchUser[] };
        setSearchResults(data.users ?? []);
      }
    } catch { /* silent */ }
    finally { setSearching(false); }
  }, []);

  const sendRequest = async (recipientId: string) => {
    setActionLoading(recipientId);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/connections/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ recipientId }),
      });
      if (res.ok || res.status === 409) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRequestedIds((prev) => new Set([...prev, recipientId]));
        await loadConnections();
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const respondToRequest = async (connId: number, action: "accept" | "decline") => {
    setActionLoading(connId);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/connections/${connId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action }),
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadConnections();
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const removeConnection = async (connId: number) => {
    setActionLoading(connId);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/connections/${connId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await loadConnections();
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const myId = (user as any)?.id ?? "";
  const accepted = connections.filter((c) => c.status === "accepted");
  const pending = connections.filter((c) => c.status === "pending");
  const pendingReceived = pending.filter((c) => c.recipientId === myId);
  const pendingSent = pending.filter((c) => c.requesterId === myId);

  const displayedConnections = activeTab === "all" ? accepted : pendingReceived;

  const isConnectedTo = (userId: string) =>
    connections.some((c) =>
      c.status === "accepted" && (c.requesterId === userId || c.recipientId === userId),
    );
  const hasPendingWith = (userId: string) =>
    connections.some((c) =>
      c.status === "pending" && (c.requesterId === userId || c.recipientId === userId),
    );

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>My Connections</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Search bar */}
      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: colors.foreground }]}
          placeholder="Find people by name…"
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={(v) => void handleSearch(v)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searching && <ActivityIndicator size="small" color={colors.primary} />}
        {searchQuery.length > 0 && !searching && (
          <TouchableOpacity activeOpacity={0.85} onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search results overlay */}
      {searchResults.length > 0 && (
        <View style={[s.searchDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {searchResults.map((u) => {
            const connected = isConnectedTo(u.id);
            const pending = hasPendingWith(u.id) || requestedIds.has(u.id);
            const isMe = u.id === myId;
            return (
              <View key={u.id} style={[s.searchRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity activeOpacity={0.85}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
                  onPress={() => { setSearchQuery(""); setSearchResults([]); router.push(`/user-profile/${u.id}` as never); }}
                >
                  {u.profileImageUrl ? (
                    <Image source={{ uri: u.profileImageUrl }} style={s.avatar} />
                  ) : (
                    <View style={[s.avatar, { backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }]}>
                      <Feather name="user" size={14} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.searchName, { color: colors.foreground }]} numberOfLines={1}>
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || "Community member"}
                    </Text>
                    {u.username ? (
                      <Text style={[s.searchHandle, { color: colors.mutedForeground }]}>@{u.username}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
                {!isMe && !connected && !pending && (
                  <TouchableOpacity activeOpacity={0.85}
                    style={[s.addBtn, { backgroundColor: colors.primary }]}
                    onPress={() => void sendRequest(u.id)}
                    disabled={actionLoading === u.id}
                  >
                    {actionLoading === u.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Feather name="user-plus" size={14} color="#FFF" />
                    )}
                  </TouchableOpacity>
                )}
                {pending && (
                  <View style={[s.pendingBadge, { backgroundColor: colors.muted + "40" }]}>
                    <Text style={[s.pendingBadgeText, { color: colors.mutedForeground }]}>Pending</Text>
                  </View>
                )}
                {connected && (
                  <Feather name="check-circle" size={18} color="#2D7A4F" />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Tab bar */}
      <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85}
          style={[s.tab, activeTab === "all" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[s.tabText, { color: activeTab === "all" ? colors.primary : colors.mutedForeground }]}>
            Connected ({accepted.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85}
          style={[s.tab, activeTab === "pending" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[s.tabText, { color: activeTab === "pending" ? colors.primary : colors.mutedForeground }]}>
            Requests{pendingReceived.length > 0 ? ` (${pendingReceived.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
        keyboardDismissMode="on-drag"
          data={activeTab === "all" ? accepted : pendingReceived}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: bottomPad + 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            activeTab === "all" && searchQuery.length === 0 && suggestions.length > 0 ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={[s.sectionLabel, { color: colors.mutedForeground, marginBottom: 12 }]}>PEOPLE YOU MAY KNOW</Text>
                {loadingSuggestions ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  suggestions.map((u) => {
                    const connected = isConnectedTo(u.id);
                    const pending = hasPendingWith(u.id) || requestedIds.has(u.id);
                    return (
                      <View key={u.id} style={[s.connectionRow, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 8 }]}>
                        <TouchableOpacity
                          style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
                          onPress={() => router.push(`/user-profile/${u.id}` as never)}
                          activeOpacity={0.8}
                        >
                          {u.profileImageUrl ? (
                            <Image source={{ uri: u.profileImageUrl }} style={s.avatar} />
                          ) : (
                            <View style={[s.avatar, { backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }]}>
                              <Feather name="user" size={18} color={colors.primary} />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={[s.connectionName, { color: colors.foreground }]} numberOfLines={1}>
                              {[u.firstName, u.lastName].filter(Boolean).join(" ") || "Community member"}
                            </Text>
                            {u.username ? (
                              <Text style={[s.searchHandle, { color: colors.mutedForeground }]}>@{u.username}</Text>
                            ) : u.mutualCount > 0 ? (
                              <Text style={[s.connectionSub, { color: colors.mutedForeground }]}>
                                {u.mutualCount} mutual {u.mutualCount === 1 ? "connection" : "connections"}
                              </Text>
                            ) : (
                              <Text style={[s.connectionSub, { color: colors.mutedForeground }]}>Community member</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        {!connected && !pending ? (
                          <TouchableOpacity activeOpacity={0.85}
                            style={[s.addBtn, { backgroundColor: colors.primary }]}
                            onPress={() => void sendRequest(u.id)}
                            disabled={actionLoading === u.id}
                          >
                            {actionLoading === u.id ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <Feather name="user-plus" size={14} color="#FFF" />
                            )}
                          </TouchableOpacity>
                        ) : pending ? (
                          <View style={[s.pendingBadge, { backgroundColor: colors.muted + "40" }]}>
                            <Text style={[s.pendingBadgeText, { color: colors.mutedForeground }]}>Sent</Text>
                          </View>
                        ) : (
                          <Feather name="check-circle" size={18} color="#2D7A4F" />
                        )}
                      </View>
                    );
                  })
                )}
                {accepted.length > 0 && (
                  <Text style={[s.sectionLabel, { color: colors.mutedForeground, marginTop: 8, marginBottom: 4 }]}>YOUR CONNECTIONS</Text>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name={activeTab === "all" ? "users" : "inbox"} size={40} color={colors.border} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>
                {activeTab === "all" ? "No connections yet" : "No pending requests"}
              </Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                {activeTab === "all" ? "Search for people above to connect." : "When someone sends you a request it'll appear here."}
              </Text>
            </View>
          }
          ListFooterComponent={
            activeTab === "all" && pendingSent.length > 0 ? (
              <View style={{ marginTop: 20 }}>
                <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>SENT REQUESTS</Text>
                {pendingSent.map((c) => (
                  <View key={c.id} style={[s.connectionRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[s.avatar, { backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }]}>
                      <Feather name="user" size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.connectionName, { color: colors.foreground }]}>
                        {[c.otherFirstName, c.otherLastName].filter(Boolean).join(" ") || "Community member"}
                      </Text>
                      <Text style={[s.connectionSub, { color: colors.mutedForeground }]}>Waiting for response</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.85}
                      style={[s.removeBtn, { borderColor: colors.border }]}
                      onPress={() => void removeConnection(c.id)}
                    >
                      <Text style={[{ fontFamily: "Inter_400Regular", fontSize: 12 }, { color: colors.mutedForeground }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null
          }
          renderItem={({ item: conn }) => {
            const isPendingReceived = conn.status === "pending" && conn.recipientId === myId;
            return (
              <View style={[s.connectionRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
                  onPress={() => conn.otherId && router.push(`/user-profile/${conn.otherId}` as never)}
                  activeOpacity={0.8}
                >
                  {conn.otherProfileImageUrl ? (
                    <Image source={{ uri: conn.otherProfileImageUrl }} style={s.avatar} />
                  ) : (
                    <View style={[s.avatar, { backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }]}>
                      <Feather name="user" size={18} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.connectionName, { color: colors.foreground }]}>
                      {[conn.otherFirstName, conn.otherLastName].filter(Boolean).join(" ") || "Community member"}
                    </Text>
                    <Text style={[s.connectionSub, { color: colors.mutedForeground }]}>
                      {isPendingReceived ? "Wants to connect with you" : `Connected ${new Date(conn.createdAt).toLocaleDateString()}`}
                    </Text>
                  </View>
                </TouchableOpacity>
                {isPendingReceived ? (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity activeOpacity={0.85}
                      style={[s.acceptBtn, { backgroundColor: colors.primary }]}
                      onPress={() => void respondToRequest(conn.id, "accept")}
                      disabled={actionLoading === conn.id}
                    >
                      {actionLoading === conn.id ? <ActivityIndicator size="small" color="#FFF" /> : (
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFF" }}>Accept</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.85}
                      style={[s.declineBtn, { borderColor: colors.border }]}
                      onPress={() => void respondToRequest(conn.id, "decline")}
                      disabled={actionLoading === conn.id}
                    >
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground }}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity activeOpacity={0.85}
                    style={[s.removeBtn, { borderColor: colors.border }]}
                    onPress={() => void removeConnection(conn.id)}
                    disabled={actionLoading === conn.id}
                  >
                    {actionLoading === conn.id ? <ActivityIndicator size="small" color={colors.mutedForeground} /> : (
                      <Feather name="user-x" size={15} color={colors.mutedForeground} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 17 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, margin: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  searchDropdown: { position: "absolute", top: 130, left: 12, right: 12, borderRadius: 14, borderWidth: 1, zIndex: 100, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  searchName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  searchHandle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  addBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  pendingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pendingBadgeText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8, marginBottom: 8 },
  connectionRow: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 12, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  connectionName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  connectionSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  acceptBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  declineBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
