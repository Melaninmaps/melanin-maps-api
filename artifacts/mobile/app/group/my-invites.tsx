import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const CATEGORY_COLORS: Record<string, string> = {
  professional: "#1D4ED8",
  social: "#7B2D8B",
  culture: "#C9922B",
  activism: "#DC2626",
  travel: "#2D7A4F",
  health: "#0891B2",
  general: "#3B1F0E",
};

const CATEGORY_ICONS: Record<string, string> = {
  professional: "briefcase",
  social: "users",
  culture: "heart",
  activism: "shield",
  travel: "map",
  health: "activity",
  general: "grid",
};

type Invite = {
  id: number;
  groupId: number;
  invitedBy: string;
  status: string;
  message: string | null;
  createdAt: string;
  groupName: string;
  groupCategory: string;
  groupCity: string | null;
  groupState: string | null;
  groupMemberCount: number;
};

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MyInvitesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responding, setResponding] = useState<number | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${apiBase}/api/groups/my-invites`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (res.ok) {
        const data = await res.json() as { invites: Invite[] };
        setInvites(data.invites);
      }
    } catch { /* show empty */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const respond = async (inviteId: number, action: "accept" | "decline") => {
    setResponding(inviteId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const apiBase = getApiBase();
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${apiBase}/api/groups/invites/${inviteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId));
        if (action === "accept") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Joined!", "You've joined the group. Check it out in the Groups tab.");
        }
      } else {
        const err = await res.json() as { error?: string };
        Alert.alert("Error", err.error ?? "Could not respond to invite.");
      }
    } catch {
      Alert.alert("Error", "Could not connect. Try again.");
    }
    setResponding(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Group Invitations</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : invites.length === 0 ? (
          <View style={styles.center}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
              <Feather name="mail" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No pending invitations</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              When someone invites you to a group, it'll show up here.
            </Text>
          </View>
        ) : (
          invites.map((invite) => {
            const catColor = CATEGORY_COLORS[invite.groupCategory] ?? "#3B1F0E";
            const catIcon = (CATEGORY_ICONS[invite.groupCategory] ?? "grid") as any;
            const isResponding = responding === invite.id;
            return (
              <View key={invite.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.catIcon, { backgroundColor: catColor + "18" }]}>
                    <Feather name={catIcon} size={20} color={catColor} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.groupName, { color: colors.foreground }]} numberOfLines={1}>
                      {invite.groupName}
                    </Text>
                    {(invite.groupCity || invite.groupState) && (
                      <View style={styles.locationRow}>
                        <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                        <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
                          {[invite.groupCity, invite.groupState].filter(Boolean).join(", ")}
                        </Text>
                      </View>
                    )}
                    <View style={styles.metaRow}>
                      <View style={[styles.catBadge, { backgroundColor: catColor + "18" }]}>
                        <Text style={[styles.catBadgeText, { color: catColor }]}>{invite.groupCategory}</Text>
                      </View>
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {invite.groupMemberCount} member{invite.groupMemberCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                </View>

                {invite.message ? (
                  <View style={[styles.messageBubble, { backgroundColor: colors.background }]}>
                    <Feather name="message-circle" size={13} color={colors.mutedForeground} style={{ marginTop: 1 }} />
                    <Text style={[styles.messageText, { color: colors.foreground }]}>"{invite.message}"</Text>
                  </View>
                ) : null}

                <Text style={[styles.invitedDate, { color: colors.mutedForeground }]}>
                  Invited {formatDate(invite.createdAt)}
                </Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.declineBtn, { borderColor: colors.border }]}
                    onPress={() => void respond(invite.id, "decline")}
                    disabled={isResponding}
                    activeOpacity={0.75}
                  >
                    {isResponding ? (
                      <ActivityIndicator size="small" color={colors.mutedForeground} />
                    ) : (
                      <Text style={[styles.declineBtnText, { color: colors.mutedForeground }]}>Decline</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: catColor }]}
                    onPress={() => void respond(invite.id, "accept")}
                    disabled={isResponding}
                    activeOpacity={0.85}
                  >
                    {isResponding ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="check" size={16} color="#FFFFFF" />
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  scroll: { padding: 16, gap: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 14 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", maxWidth: 260, lineHeight: 21 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTop: { flexDirection: "row", gap: 12 },
  catIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", shrink: 0 } as any,
  cardInfo: { flex: 1, gap: 5 },
  groupName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  catBadgeText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  messageBubble: { flexDirection: "row", gap: 7, padding: 10, borderRadius: 10, alignItems: "flex-start" },
  messageText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 19, fontStyle: "italic" },
  invitedDate: { fontFamily: "Inter_400Regular", fontSize: 12 },
  actions: { flexDirection: "row", gap: 10 },
  declineBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  declineBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  acceptBtn: { flex: 2, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  acceptBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
});
