import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGroups, type Group } from "@/hooks/useGroups";
import { useAuth } from "@/lib/auth";
import * as SecureStore from "expo-secure-store";

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

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { join, leave } = useGroups();
  const { isAuthenticated } = useAuth();

  const [group, setGroup] = useState<(Group & { isMember: boolean }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const loadGroup = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      if (!apiBase) return;
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${apiBase}/api/groups/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { group: Group & { isMember: boolean } };
        setGroup(data.group);
      }
    } catch { /* show not found */ }
    finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { void loadGroup(); }, [loadGroup]);

  const handleJoinLeave = async () => {
    if (!group) return;
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to join groups.");
      return;
    }
    setJoining(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (group.isMember) {
      const ok = await leave(group.id);
      if (ok) setGroup((g) => g ? { ...g, isMember: false, memberCount: Math.max(g.memberCount - 1, 0) } : g);
    } else {
      const ok = await join(group.id);
      if (ok) setGroup((g) => g ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g);
    }
    setJoining(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Group not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[group.category] ?? COLORS.primary;
  const catIcon = (CATEGORY_ICONS[group.category] ?? "grid") as any;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header hero */}
      <View style={[styles.hero, { backgroundColor: catColor, paddingTop: topPad + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.heroBody}>
          <View style={[styles.heroIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name={catIcon} size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>{group.name}</Text>
          {(group.city || group.state) && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>
                {[group.city, group.state].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Feather name="users" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroBadgeText}>{group.memberCount.toLocaleString()} members</Text>
            </View>
            <View style={styles.heroBadge}>
              <Feather name="tag" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroBadgeText}>{group.category}</Text>
            </View>
            {group.isPrivate && (
              <View style={styles.heroBadge}>
                <Feather name="lock" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroBadgeText}>Private</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 120 }]}
      >
        {group.description ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
            <Text style={[styles.description, { color: colors.foreground }]}>{group.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What to Expect</Text>
          {[
            { icon: "message-circle" as const, text: "Discuss topics with community members" },
            { icon: "calendar" as const, text: "Get notified about group events" },
            { icon: "share-2" as const, text: "Share recommendations and resources" },
            { icon: "users" as const, text: "Connect with like-minded people" },
          ].map((item) => (
            <View key={item.text} style={[styles.featureRow, { borderColor: colors.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: catColor + "15" }]}>
                <Feather name={item.icon} size={16} color={catColor} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: catColor }]}>{group.memberCount.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Members</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: catColor }]}>{group.isPrivate ? "Private" : "Public"}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Access</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: catColor }]}>{group.category}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Category</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          style={[
            styles.joinBtn,
            { backgroundColor: group.isMember ? colors.card : catColor, borderColor: group.isMember ? colors.border : catColor },
          ]}
          onPress={() => void handleJoinLeave()}
          disabled={joining}
          activeOpacity={0.85}
        >
          {joining ? (
            <ActivityIndicator size="small" color={group.isMember ? colors.foreground : "#FFFFFF"} />
          ) : (
            <>
              <Feather
                name={group.isMember ? "check" : "user-plus"}
                size={18}
                color={group.isMember ? colors.foreground : "#FFFFFF"}
              />
              <Text style={[styles.joinBtnText, { color: group.isMember ? colors.foreground : "#FFFFFF" }]}>
                {group.isMember ? "Joined" : "Join Group"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const COLORS = { primary: "#3B1F0E" };

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  backLink: { fontFamily: "Inter_500Medium", fontSize: 14 },
  hero: { paddingHorizontal: 20, paddingBottom: 28 },
  backBtn: { marginBottom: 16 },
  heroBody: { alignItems: "center", gap: 10 },
  heroIcon: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#FFFFFF", textAlign: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.85)" },
  heroBadges: { flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  heroBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.9)" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  description: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  featureRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  featureText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 },
  statsCard: {
    flexDirection: "row", borderRadius: 16, borderWidth: 1, overflow: "hidden",
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  statDivider: { width: 1 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 16 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  footer: {
    padding: 16, borderTopWidth: 1,
  },
  joinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 52, borderRadius: 14, borderWidth: 1.5,
  },
  joinBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
});
