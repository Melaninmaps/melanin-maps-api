import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/lib/auth";

function getApiBase(): string {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

type NotifType = "all" | "safety" | "events" | "business" | "community" | "weather" | "travel";

interface Notif {
  id: string;
  type: Exclude<NotifType, "all">;
  icon: "shield" | "calendar" | "shopping-bag" | "message-circle" | "star" | "gift" | "bell" | "users" | "cloud-rain" | "navigation";
  color: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  group: "Today" | "This Week" | "Earlier";
}

const NOTIFS: Notif[] = [
  {
    id: "n1", type: "safety", icon: "shield", color: "#CA922B",
    title: "Safety Alert — Atlanta, GA",
    body: "Community report: increased incidents near Ponce City Market. Stay aware this evening.",
    time: "10 min ago", read: false, group: "Today",
  },
  {
    id: "n2", type: "events", icon: "calendar", color: "#2D7A4F",
    title: "Event Tomorrow: Black Business Expo",
    body: "Don't forget — Black Business Expo starts at 10am at the Georgia World Congress Center.",
    time: "1h ago", read: false, group: "Today",
  },
  {
    id: "n3", type: "business", icon: "shopping-bag", color: "#C9922B",
    title: "Sweet Auburn BBQ replied to your review",
    body: "\"Thank you for the kind words! Come back and try our new weekend specials 🙌🏾\"",
    time: "3h ago", read: false, group: "Today",
  },
  {
    id: "n4", type: "community", icon: "message-circle", color: "#7B4F2E",
    title: "Your post is trending",
    body: "\"Best spots for brunch in ATL\" got 47 upvotes and 12 comments in the community feed.",
    time: "5h ago", read: true, group: "Today",
  },
  {
    id: "n5", type: "community", icon: "star", color: "#C9922B",
    title: "New review on a business you follow",
    body: "Trap Kitchen received a 5-star review: \"Best food truck in the city, hands down.\"",
    time: "Yesterday", read: true, group: "This Week",
  },
  {
    id: "n6", type: "events", icon: "calendar", color: "#2D7A4F",
    title: "New event near you: Juneteenth Block Party",
    body: "Houston, TX · June 19 · Free admission · Black-owned food vendors + live music",
    time: "2 days ago", read: true, group: "This Week",
  },
  {
    id: "n7", type: "business", icon: "shopping-bag", color: "#C9922B",
    title: "Business hours update: Busboys & Poets",
    body: "Updated hours for the summer — now open until 11pm on Fridays and Saturdays.",
    time: "3 days ago", read: true, group: "This Week",
  },
  {
    id: "n8", type: "community", icon: "gift", color: "#CA922B",
    title: "Referral milestone reached 🎉",
    body: "You've referred 2 friends! You're halfway to earning your $10 credit. Keep it up!",
    time: "5 days ago", read: true, group: "This Week",
  },
  {
    id: "n9", type: "safety", icon: "shield", color: "#CA922B",
    title: "Monthly Safety Digest",
    body: "See the community safety report for cities you follow: Atlanta, Houston, Chicago.",
    time: "1 week ago", read: true, group: "Earlier",
  },
  {
    id: "n10", type: "community", icon: "users", color: "#7B4F2E",
    title: "New community member joined via your link",
    body: "Someone you referred just signed up and set up their profile. Welcome them!",
    time: "2 weeks ago", read: true, group: "Earlier",
  },
  {
    id: "n11", type: "weather", icon: "cloud-rain", color: "#1D4ED8",
    title: "Severe Thunderstorm Warning — Houston, TX",
    body: "NWS has issued a severe thunderstorm warning until 9pm. Outdoor events may be affected.",
    time: "2h ago", read: false, group: "Today",
  },
  {
    id: "n12", type: "travel", icon: "navigation", color: "#7C3AED",
    title: "DC Metro Red Line Delays",
    body: "Single tracking between Shady Grove and Grosvenor. Add 15–20 minutes to your commute.",
    time: "4h ago", read: false, group: "Today",
  },
  {
    id: "n13", type: "weather", icon: "cloud-rain", color: "#1D4ED8",
    title: "FEMA Disaster Declaration — Flood",
    body: "FEMA has issued a federal disaster declaration for flooding in South Carolina.",
    time: "3 days ago", read: true, group: "This Week",
  },
  {
    id: "n14", type: "travel", icon: "navigation", color: "#7C3AED",
    title: "SEPTA Route 34 Detour",
    body: "Trolley detoured at Broad & Washington through Sunday due to track maintenance.",
    time: "4 days ago", read: true, group: "This Week",
  },
];

const TABS: { id: NotifType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "safety", label: "Safety" },
  { id: "weather", label: "Weather" },
  { id: "travel", label: "Travel" },
  { id: "events", label: "Events" },
  { id: "business", label: "Business" },
  { id: "community", label: "Community" },
];

const ICON_MAP: Record<string, Notif["icon"]> = {
  safety: "shield", events: "calendar", business: "shopping-bag",
  community: "message-circle", weather: "cloud-rain", travel: "navigation",
};
const COLOR_MAP: Record<string, string> = {
  safety: "#CA922B", events: "#2D7A4F", business: "#C9922B",
  community: "#7B4F2E", weather: "#1D4ED8", travel: "#7C3AED",
};

function getTimeGroup(createdAt: string): Notif["group"] {
  const diff = Date.now() - new Date(createdAt).getTime();
  if (diff < 86_400_000) return "Today";
  if (diff < 604_800_000) return "This Week";
  return "Earlier";
}

function getRelativeTime(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(createdAt).toLocaleDateString();
}

function mapApiRow(row: Record<string, unknown>): Notif {
  const type = (row.type as string) in ICON_MAP ? (row.type as Notif["type"]) : "community";
  return {
    id: String(row.id),
    type,
    icon: ICON_MAP[type] ?? "bell",
    color: COLOR_MAP[type] ?? "#7B4F2E",
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    time: getRelativeTime(String(row.createdAt ?? row.created_at ?? "")),
    read: Boolean(row.read),
    group: getTimeGroup(String(row.createdAt ?? row.created_at ?? new Date().toISOString())),
  };
}

export default function NotificationCenterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<NotifType>("all");
  const [notifs, setNotifs] = useState<Notif[]>(NOTIFS);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const token = Platform.OS !== "web"
          ? await SecureStore.getItemAsync("auth_session_token")
          : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${getApiBase()}/api/notifications`, {
          headers,
          credentials: Platform.OS === "web" ? "include" : "omit",
        });
        if (!res.ok) return;
        const data = await res.json();
        const rows: Record<string, unknown>[] = data?.notifications ?? [];
        if (rows.length > 0) setNotifs(rows.map(mapApiRow));
      } catch {
        // keep demo data on error
      }
    }
    load();
  }, [isAuthenticated]);

  const filtered = activeTab === "all" ? notifs : notifs.filter((n) => n.type === activeTab);
  const unreadCount = notifs.filter((n) => !n.read).length;

  const groups = ["Today", "This Week", "Earlier"] as const;

  const markAllRead = async () => {
    setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
    try {
      const token = Platform.OS !== "web"
        ? await SecureStore.getItemAsync("auth_session_token")
        : null;
      if (!token) return;
      fetch(`${getApiBase()}/api/notifications/mark-all-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } catch { /* ignore */ }
  };

  const markRead = async (id: string) => {
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      const token = Platform.OS !== "web"
        ? await SecureStore.getItemAsync("auth_session_token")
        : null;
      if (!token) return;
      fetch(`${getApiBase()}/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } catch { /* ignore */ }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85}
          style={styles.back}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity activeOpacity={0.85} onPress={markAllRead}>
            <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity activeOpacity={0.85}
          style={[styles.settingsBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.push("/notifications-settings")}
        >
          <Feather name="settings" size={17} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView
        keyboardDismissMode="on-drag"
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsScroll, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((t) => {
          const count = t.id === "all" ? unreadCount : notifs.filter((n) => n.type === t.id && !n.read).length;
          const active = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(t.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabTxt, { color: active ? colors.primary : colors.mutedForeground }]}>
                {t.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.tabBadgeTxt}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Notification list */}
      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bell-off" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTxt, { color: colors.mutedForeground }]}>No notifications here yet</Text>
          </View>
        ) : (
          groups.map((group) => {
            const items = filtered.filter((n) => n.group === group);
            if (items.length === 0) return null;
            return (
              <View key={group}>
                <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>{group}</Text>
                <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {items.map((notif, i) => (
                    <TouchableOpacity
                      key={notif.id}
                      style={[
                        styles.notifRow,
                        !notif.read && { backgroundColor: colors.primary + "08" },
                        i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                      ]}
                      onPress={() => markRead(notif.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconBox, { backgroundColor: notif.color + "18" }]}>
                        <Feather name={notif.icon} size={18} color={notif.color} />
                      </View>
                      <View style={styles.notifBody}>
                        <View style={styles.notifTopRow}>
                          <Text style={[styles.notifTitle, { color: colors.foreground }]} numberOfLines={1}>
                            {notif.title}
                          </Text>
                          {!notif.read && (
                            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                          )}
                        </View>
                        <Text style={[styles.notifText, { color: colors.mutedForeground }]} numberOfLines={2}>
                          {notif.body}
                        </Text>
                        <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>{notif.time}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
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
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  back: { width: 36, height: 36, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  markAll: { fontSize: 13, fontFamily: "Inter_500Medium", marginRight: 4 },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tabsScroll: { borderBottomWidth: 1, flexGrow: 0 },
  tabsContent: { paddingHorizontal: 20, gap: 4 },
  tab: { paddingHorizontal: 4, paddingVertical: 12, marginHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  tabTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  tabBadgeTxt: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#FFF" },
  scroll: { padding: 16, gap: 8 },
  groupLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 },
  group: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  notifRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifBody: { flex: 1, gap: 3 },
  notifTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notifTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  notifText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", gap: 12, paddingTop: 60 },
  emptyTxt: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
