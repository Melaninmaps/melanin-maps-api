import { Feather } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const AUTH_KEY = "auth_session_token";

interface MatchedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  memberType: string | null;
  bio: string | null;
}

const MEMBER_BADGE: Record<string, { label: string; color: string }> = {
  trailblazer: { label: "Trailblazer", color: "#CA922B" },
  navigator: { label: "Navigator", color: "#2D7A4F" },
  founding: { label: "Founding", color: "#7B2D8B" },
  business: { label: "Business", color: "#0369A1" },
};

function initials(u: MatchedUser): string {
  const f = u.firstName?.[0] ?? "";
  const l = u.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || (u.username?.[0] ?? "?").toUpperCase();
}

function displayName(u: MatchedUser): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return full || u.username || "Community Member";
}

const AVATAR_COLORS = ["#CA922B", "#2D7A4F", "#C4622D", "#7B2D8B", "#0369A1", "#D4873A"];

export default function FindFriendsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [scanState, setScanState] = useState<"idle" | "scanning" | "done" | "denied">("idle");
  const [matches, setMatches] = useState<MatchedUser[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralUrl = referralCode
    ? `https://mappingwithmelanin.com/r/${referralCode}`
    : "https://mappingwithmelanin.com";

  const scanContacts = async () => {
    if (Platform.OS === "web") {
      setScanState("done");
      return;
    }
    setScanState("scanning");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setScanState("denied");
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Emails],
      });
      const emails: string[] = [];
      for (const c of data) {
        for (const e of c.emails ?? []) {
          if (e.email) emails.push(e.email);
        }
      }
      const token = await SecureStore.getItemAsync(AUTH_KEY);
      const res = await fetch(`${getApiBase()}/api/users/match-contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ emails }),
      });
      if (res.ok) {
        const data = (await res.json()) as { matches: MatchedUser[] };
        setMatches(data.matches);
      }
    } catch {
      // silently fall through to done state
    } finally {
      setScanState("done");
    }
  };

  const loadReferralCode = async () => {
    if (referralCode || referralLoading) return;
    setReferralLoading(true);
    try {
      const token = await SecureStore.getItemAsync(AUTH_KEY);
      const res = await fetch(`${getApiBase()}/api/referrals/my-code`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = (await res.json()) as { referralCode?: string };
        if (data.referralCode) setReferralCode(data.referralCode);
      }
    } catch {
      // ignore
    } finally {
      setReferralLoading(false);
    }
  };

  const toggleFollow = async (userId: string) => {
    if (followLoading.has(userId)) return;
    setFollowLoading((s) => new Set(s).add(userId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isFollowing = following.has(userId);
    try {
      const token = await SecureStore.getItemAsync(AUTH_KEY);
      const method = isFollowing ? "DELETE" : "POST";
      await fetch(`${getApiBase()}/api/users/${userId}/follow`, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setFollowing((s) => {
        const next = new Set(s);
        isFollowing ? next.delete(userId) : next.add(userId);
        return next;
      });
    } catch {
      // ignore
    } finally {
      setFollowLoading((s) => { const next = new Set(s); next.delete(userId); return next; });
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Join me on Mapping With Melanin — the community discovery app celebrating Black culture. Use my link to get started: ${referralUrl}`,
        url: referralUrl,
      });
    } catch {
      // ignore cancel
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralUrl);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const goToApp = () => {
    router.replace("/(tabs)");
  };

  const topPad = Platform.OS === "web" ? 60 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={s.headerInner}>
          <View>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Find Your Tribe 🤎</Text>
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>
              See who from your life is already here
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={goToApp} hitSlop={10}>
            <Text style={[s.skipBtn, { color: colors.mutedForeground }]}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact scan section */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.cardIconRow}>
            <View style={[s.iconCircle, { backgroundColor: "#CA922B18" }]}>
              <Feather name="users" size={22} color="#CA922B" />
            </View>
            <View style={s.cardTitleCol}>
              <Text style={[s.cardTitle, { color: colors.foreground }]}>People You Already Know</Text>
              <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
                We'll check your contacts to find members — nothing is stored
              </Text>
            </View>
          </View>

          {scanState === "idle" && (
            <TouchableOpacity
              style={[s.scanBtn, { backgroundColor: "#CA922B" }]}
              onPress={scanContacts}
              activeOpacity={0.85}
            >
              <Feather name="search" size={16} color="#fff" />
              <Text style={s.scanBtnText}>Scan My Contacts</Text>
            </TouchableOpacity>
          )}

          {scanState === "scanning" && (
            <View style={s.scanningRow}>
              <ActivityIndicator size="small" color="#CA922B" />
              <Text style={[s.scanningText, { color: colors.mutedForeground }]}>Scanning contacts…</Text>
            </View>
          )}

          {scanState === "denied" && (
            <View style={[s.emptyBox, { backgroundColor: colors.background }]}>
              <Feather name="lock" size={20} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                Contacts access was denied. You can change this in Settings.
              </Text>
            </View>
          )}

          {scanState === "done" && matches.length === 0 && (
            <View style={[s.emptyBox, { backgroundColor: colors.background }]}>
              <Feather name="smile" size={20} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                None of your contacts are on Mapping With Melanin yet — be the first to invite them!
              </Text>
            </View>
          )}

          {scanState === "done" && matches.length > 0 && (
            <View style={s.matchList}>
              <Text style={[s.matchCount, { color: colors.mutedForeground }]}>
                {matches.length} member{matches.length !== 1 ? "s" : ""} found
              </Text>
              {matches.map((u, i) => {
                const isFollowing = following.has(u.id);
                const isLoading = followLoading.has(u.id);
                const badge = u.memberType ? MEMBER_BADGE[u.memberType] : null;
                const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <View key={u.id} style={[s.matchRow, { borderBottomColor: colors.border }]}>
                    <View style={[s.avatar, { backgroundColor: avatarColor + "28", borderColor: avatarColor + "40" }]}>
                      <Text style={[s.avatarText, { color: avatarColor }]}>{initials(u)}</Text>
                    </View>
                    <View style={s.matchInfo}>
                      <View style={s.matchNameRow}>
                        <Text style={[s.matchName, { color: colors.foreground }]} numberOfLines={1}>
                          {displayName(u)}
                        </Text>
                        {badge && (
                          <View style={[s.badge, { backgroundColor: badge.color + "20" }]}>
                            <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
                          </View>
                        )}
                      </View>
                      {u.username && (
                        <Text style={[s.matchUsername, { color: colors.mutedForeground }]}>@{u.username}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[
                        s.followBtn,
                        isFollowing
                          ? { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 }
                          : { backgroundColor: "#CA922B" },
                      ]}
                      onPress={() => toggleFollow(u.id)}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading
                        ? <ActivityIndicator size="small" color={isFollowing ? colors.foreground : "#fff"} />
                        : <Text style={[s.followBtnText, { color: isFollowing ? colors.foreground : "#fff" }]}>
                            {isFollowing ? "Following" : "Follow"}
                          </Text>
                      }
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Refer a friend section */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.cardIconRow}>
            <View style={[s.iconCircle, { backgroundColor: "#2D7A4F18" }]}>
              <Feather name="send" size={22} color="#2D7A4F" />
            </View>
            <View style={s.cardTitleCol}>
              <Text style={[s.cardTitle, { color: colors.foreground }]}>Invite Friends Not on the List</Text>
              <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
                Share your personal link — they join, you both get rewarded
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.loadReferralBtn, { borderColor: "#2D7A4F50", backgroundColor: "#2D7A4F08" }]}
            onPress={() => { loadReferralCode(); handleShare(); }}
            activeOpacity={0.85}
            disabled={referralLoading}
          >
            {referralLoading
              ? <ActivityIndicator size="small" color="#2D7A4F" />
              : <>
                  <Feather name="share-2" size={16} color="#2D7A4F" />
                  <Text style={[s.loadReferralText, { color: "#2D7A4F" }]}>Share My Invite Link</Text>
                </>
            }
          </TouchableOpacity>

          {referralCode && (
            <TouchableOpacity
              style={[s.copyRow, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleCopy}
              activeOpacity={0.7}
            >
              <Text style={[s.copyCode, { color: colors.foreground }]} numberOfLines={1}>
                {referralUrl}
              </Text>
              <Feather name={copied ? "check" : "copy"} size={15} color={copied ? "#2D7A4F" : colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Follow count nudge if scanned */}
        {scanState === "done" && following.size > 0 && (
          <View style={[s.nudgeRow, { backgroundColor: "#CA922B12", borderColor: "#CA922B30" }]}>
            <Feather name="heart" size={16} color="#CA922B" />
            <Text style={[s.nudgeText, { color: colors.foreground }]}>
              You're following <Text style={{ color: "#CA922B", fontFamily: "Inter_700Bold" }}>{following.size}</Text> member{following.size !== 1 ? "s" : ""}. Their posts will show up in your feed!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky footer CTA */}
      <View style={[s.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <TouchableOpacity style={[s.continueBtn, { backgroundColor: "#CA922B" }]} onPress={goToApp} activeOpacity={0.88}>
          <Text style={s.continueBtnText}>Take Me to the App</Text>
          <Feather name="arrow-right" size={18} color="#1C0E06" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { borderBottomWidth: 1, paddingBottom: 16, paddingHorizontal: 20 },
  headerInner: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 3, lineHeight: 18 },
  skipBtn: { fontFamily: "Inter_500Medium", fontSize: 14, paddingTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  card: {
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardIconRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cardTitleCol: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  cardSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  scanBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  scanBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  scanningRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", paddingVertical: 10 },
  scanningText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  emptyBox: { borderRadius: 10, padding: 16, alignItems: "center", gap: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 },
  matchList: { gap: 0 },
  matchCount: { fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: 6 },
  matchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  matchInfo: { flex: 1, gap: 2 },
  matchNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  matchName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  matchUsername: { fontFamily: "Inter_400Regular", fontSize: 12 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  followBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    minWidth: 80, alignItems: "center",
  },
  followBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  loadReferralBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
  },
  loadReferralText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  copyRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
  },
  copyCode: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  nudgeRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  nudgeText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  footer: {
    borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12,
  },
  continueBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 16,
  },
  continueBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#1C0E06" },
});
