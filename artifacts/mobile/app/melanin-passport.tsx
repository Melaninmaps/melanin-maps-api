import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
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
async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); } catch { return null; }
}

interface PassportStats {
  businessesSaved: number;
  citiesExplored: number;
  safetyReports: number;
  communityPosts: number;
  eventsAttended: number;
  reviewsWritten: number;
}

interface PassportData {
  displayName: string;
  memberSince: number;
  level: string;
  stats: PassportStats;
  totalEngagements: number;
}

const LEVEL_COLORS: Record<string, string> = {
  Newcomer: "#6B7280",
  Trailblazer: "#CA922B",
  Explorer: "#0891B2",
  Pioneer: "#7C3AED",
  Ambassador: "#DC2626",
};

const LEVEL_DESC: Record<string, string> = {
  Newcomer: "Just getting started",
  Trailblazer: "Making your mark on the community",
  Explorer: "Discovering new places and people",
  Pioneer: "Blazing trails for others to follow",
  Ambassador: "A true pillar of the community",
};

const STAT_ICONS = {
  businessesSaved: "bookmark",
  citiesExplored: "map-pin",
  safetyReports: "shield",
  communityPosts: "message-circle",
  eventsAttended: "calendar",
  reviewsWritten: "star",
} as const;

const STAT_LABELS = {
  businessesSaved: "Businesses Saved",
  citiesExplored: "Cities Explored",
  safetyReports: "Safety Reports",
  communityPosts: "Community Posts",
  eventsAttended: "Events Attended",
  reviewsWritten: "Reviews Written",
};

export default function MelaninPassportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [shimmer] = useState(() => new Animated.Value(0));

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const load = async () => {
    try {
      const token = await getToken();
      const base = getApiBase();
      if (!token || !base) { setLoading(false); return; }
      const res = await fetch(`${base}/api/users/passport`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { passport: PassportData };
        setPassport(data.passport);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  const handleShare = async () => {
    if (!passport) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shareText = [
      `My Mapping With Melanin™ Passport`,
      ``,
      `${passport.displayName} · ${passport.level}`,
      `Member since ${passport.memberSince}`,
      ``,
      `${passport.stats.businessesSaved} minority-owned businesses saved`,
      `${passport.stats.citiesExplored} cities explored`,
      `${passport.stats.safetyReports} community safety reports`,
      `${passport.stats.communityPosts} community posts`,
      `${passport.stats.eventsAttended} events attended`,
      `${passport.stats.reviewsWritten} reviews written`,
      ``,
      `${passport.totalEngagements} total community engagements`,
      ``,
      `Join me on Mapping With Melanin™ — mappingwithmelanin.com`,
    ].join("\n");

    try {
      if (Platform.OS !== "web" && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync("data:text/plain;base64," + btoa(shareText), {
          dialogTitle: "Share your Melanin Passport",
        });
      }
    } catch {}
  };

  const levelColor = passport ? (LEVEL_COLORS[passport.level] ?? colors.primary) : colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Melanin Passport</Text>
        {passport && (
          <TouchableOpacity activeOpacity={0.85} onPress={() => void handleShare()}>
            <Feather name="share-2" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
        {!passport && <View style={{ width: 24 }} />}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !passport ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Passport unavailable</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>Sign in to see your community impact.</Text>
        </View>
      ) : (
        <ScrollView
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        >
          {/* Passport card */}
          <View style={[styles.passportCard, { borderColor: levelColor + "40", shadowColor: levelColor }]}>
            <View style={[styles.passportHeader, { backgroundColor: levelColor }]}>
              <View>
                <Text style={styles.passportBrand}>MAPPING WITH MELANIN™</Text>
                <Text style={styles.passportTitle}>Community Passport</Text>
              </View>
              <View style={[styles.passportStamp, { borderColor: "rgba(255,255,255,0.4)" }]}>
                <Text style={styles.passportStampTxt}>✦</Text>
              </View>
            </View>

            <View style={[styles.passportBody, { backgroundColor: colors.card }]}>
              <View style={styles.passportNameRow}>
                <View style={[styles.passportAvatar, { backgroundColor: levelColor }]}>
                  <Text style={styles.passportAvatarTxt}>{passport.displayName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.passportName, { color: colors.foreground }]}>{passport.displayName}</Text>
                  <View style={[styles.levelBadge, { backgroundColor: levelColor + "18", borderColor: levelColor + "40" }]}>
                    <Text style={[styles.levelBadgeTxt, { color: levelColor }]}>{passport.level}</Text>
                  </View>
                </View>
                <View style={styles.passportMeta}>
                  <Text style={[styles.passportMetaLabel, { color: colors.mutedForeground }]}>Member since</Text>
                  <Text style={[styles.passportMetaVal, { color: colors.foreground }]}>{passport.memberSince}</Text>
                </View>
              </View>

              <Text style={[styles.levelDesc, { color: colors.mutedForeground }]}>{LEVEL_DESC[passport.level] ?? ""}</Text>

              <View style={[styles.totalRow, { backgroundColor: levelColor + "12", borderColor: levelColor + "30" }]}>
                <Text style={[styles.totalNum, { color: levelColor }]}>{passport.totalEngagements.toLocaleString()}</Text>
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total Community Engagements</Text>
              </View>
            </View>
          </View>

          {/* Stats grid */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>YOUR IMPACT</Text>
          <View style={styles.statsGrid}>
            {(Object.keys(STAT_LABELS) as (keyof PassportStats)[]).map((key) => (
              <View key={key} style={[styles.statCell, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIcon, { backgroundColor: levelColor + "18" }]}>
                  <Feather name={STAT_ICONS[key]} size={18} color={levelColor} />
                </View>
                <Text style={[styles.statNum, { color: colors.foreground }]}>{passport.stats[key].toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{STAT_LABELS[key]}</Text>
              </View>
            ))}
          </View>

          {/* Level progression */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>COMMUNITY LEVELS</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(["Newcomer", "Trailblazer", "Explorer", "Pioneer", "Ambassador"] as const).map((level, i, arr) => {
              const thresholds = [0, 20, 50, 100, 200];
              const isCurrentLevel = level === passport.level;
              const lColor = LEVEL_COLORS[level] ?? colors.primary;
              return (
                <React.Fragment key={level}>
                  <View style={[styles.levelRow, isCurrentLevel && { backgroundColor: lColor + "08" }]}>
                    <View style={[styles.levelDot, { backgroundColor: isCurrentLevel ? lColor : colors.border }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.levelName, { color: isCurrentLevel ? lColor : colors.foreground }]}>{level}</Text>
                      <Text style={[styles.levelThreshold, { color: colors.mutedForeground }]}>{thresholds[i]}+ engagements</Text>
                    </View>
                    {isCurrentLevel && (
                      <View style={[styles.currentBadge, { backgroundColor: lColor }]}>
                        <Text style={styles.currentBadgeTxt}>Current</Text>
                      </View>
                    )}
                  </View>
                  {i < arr.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 44 }]} />}
                </React.Fragment>
              );
            })}
          </View>

          {/* Share CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.shareBtn, { borderColor: levelColor, borderWidth: 1.5 }]}
            onPress={() => void handleShare()}
          >
            <Feather name="share-2" size={18} color={levelColor} />
            <Text style={[styles.shareBtnTxt, { color: levelColor }]}>Share My Passport</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20 },
  passportCard: { borderRadius: 20, borderWidth: 1.5, overflow: "hidden", marginBottom: 28, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
  passportHeader: { padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  passportBrand: { fontSize: 9, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.7)", letterSpacing: 1.5 },
  passportTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 2 },
  passportStamp: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  passportStampTxt: { fontSize: 20, color: "rgba(255,255,255,0.8)" },
  passportBody: { padding: 20 },
  passportNameRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  passportAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  passportAvatarTxt: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  passportName: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 5 },
  levelBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  levelBadgeTxt: { fontSize: 11, fontFamily: "Inter_700Bold" },
  passportMeta: { alignItems: "flex-end" },
  passportMetaLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  passportMetaVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  levelDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14 },
  totalRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  totalNum: { fontSize: 28, fontFamily: "Inter_700Bold" },
  totalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCell: { width: "30%", flexGrow: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 14 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 24 },
  sep: { height: 1 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  levelDot: { width: 12, height: 12, borderRadius: 6 },
  levelName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  levelThreshold: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  currentBadgeTxt: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 14 },
  shareBtnTxt: { fontSize: 15, fontFamily: "Inter_700Bold" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 8 },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
