import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface ImpactStats {
  reviewCount: number;
  businessesReviewedCount: number;
  eventsAttended: number;
  communityPosts: number;
  savedBusinesses: number;
  referralsMade: number;
  score: number;
}

interface SupportedBusiness {
  businessId: string;
  businessName: string;
  rating: number;
  createdAt: string;
}

interface OwnedBusiness {
  businessId: string;
  businessName: string;
  businessCategory: string;
  businessCity: string;
  businessState: string;
  businessRating: string;
  businessImageUrl: string | null;
  businessVerified: boolean;
  role: string;
  status: string;
}

interface Props {
  userId: string;
  displayName: string;
  showOwnedBusinesses?: boolean;
}

function ImpactRow({ icon, label, value, colors }: { icon: string; label: string; value: number; colors: ReturnType<typeof useColors> }) {
  if (value === 0) return null;
  return (
    <View style={styles.impactRow}>
      <View style={[styles.impactIconBox, { backgroundColor: colors.primary + "15" }]}>
        <Feather name={icon as any} size={14} color={colors.primary} />
      </View>
      <Text style={[styles.impactLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.impactValue, { color: colors.primary }]}>{value}</Text>
    </View>
  );
}

export function CommunityImpactCard({ userId, displayName, showOwnedBusinesses = true }: Props) {
  const colors = useColors();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [supported, setSupported] = useState<SupportedBusiness[]>([]);
  const [owned, setOwned] = useState<OwnedBusiness[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${getApiBase()}/api/community-impact/${userId}`, { headers });
        if (res.ok) {
          const data = await res.json() as { stats: ImpactStats; supportedBusinesses: SupportedBusiness[]; ownedBusinesses: OwnedBusiness[] };
          setStats(data.stats);
          setSupported(data.supportedBusinesses ?? []);
          setOwned(data.ownedBusinesses ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} size="small" style={{ margin: 20 }} />
      </View>
    );
  }

  if (!stats) return null;

  const hasActivity = stats.reviewCount > 0 || stats.eventsAttended > 0 || stats.communityPosts > 0 || stats.referralsMade > 0;
  const hasOwnedBiz = owned.length > 0;
  if (!hasActivity && !hasOwnedBiz) return null;

  const scoreLabel = stats.score >= 80 ? "Community Champion" : stats.score >= 50 ? "Community Builder" : stats.score >= 25 ? "Community Supporter" : "Getting Started";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="heart" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community Impact</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {displayName.split(" ")[0]} actively supports the community
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.scoreBadge, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[styles.scoreText, { color: colors.primary }]}>{stats.score}</Text>
          </View>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} style={{ marginLeft: 6 }} />
        </View>
      </TouchableOpacity>

      {/* Score label */}
      <View style={[styles.scoreLabelRow, { borderTopColor: colors.border }]}>
        <Feather name="award" size={13} color="#CA922B" />
        <Text style={[styles.scoreLabelText, { color: "#CA922B" }]}>{scoreLabel}</Text>
      </View>

      {expanded && (
        <>
          {/* Activity stats */}
          <View style={[styles.statsSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>What {displayName.split(" ")[0]} Does for the Community</Text>
            <ImpactRow icon="star" label="Reviews shared" value={stats.reviewCount} colors={colors} />
            <ImpactRow icon="map-pin" label="Businesses supported" value={stats.businessesReviewedCount} colors={colors} />
            <ImpactRow icon="calendar" label="Events attended" value={stats.eventsAttended} colors={colors} />
            <ImpactRow icon="message-circle" label="Community posts" value={stats.communityPosts} colors={colors} />
            <ImpactRow icon="share-2" label="Referrals made" value={stats.referralsMade} colors={colors} />
          </View>

          {/* Supports Others section */}
          {supported.length > 0 && (
            <View style={[styles.supportsSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Supports Others</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
                Businesses {displayName.split(" ")[0]} has reviewed and championed
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 10 }}>
                {supported.map((biz) => (
                  <TouchableOpacity
                    key={biz.businessId}
                    style={[styles.bizChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => router.push({ pathname: "/business/[id]", params: { id: biz.businessId } })}
                  >
                    <Feather name="briefcase" size={12} color={colors.primary} style={{ marginRight: 5 }} />
                    <Text style={[styles.bizChipText, { color: colors.foreground }]} numberOfLines={1}>
                      {biz.businessName}
                    </Text>
                    {biz.rating > 0 && (
                      <View style={styles.ratingPill}>
                        <Feather name="star" size={10} color="#CA922B" />
                        <Text style={styles.ratingText}>{biz.rating}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Owned Businesses */}
          {showOwnedBusinesses && hasOwnedBiz && (
            <View style={[styles.ownedSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                {owned.length === 1 ? "Business Owner" : "Business Owner"} on Mapping With Melanin
              </Text>
              {owned.map((biz) => (
                <TouchableOpacity
                  key={biz.businessId}
                  style={[styles.ownedRow, { borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/business/[id]", params: { id: biz.businessId } })}
                >
                  <View style={[styles.ownedIcon, { backgroundColor: "#CA922B18" }]}>
                    <Feather name="briefcase" size={16} color="#CA922B" />
                  </View>
                  <View style={styles.ownedInfo}>
                    <Text style={[styles.ownedName, { color: colors.foreground }]} numberOfLines={1}>{biz.businessName}</Text>
                    <Text style={[styles.ownedMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {biz.businessCategory} · {biz.businessCity}, {biz.businessState}
                    </Text>
                  </View>
                  {biz.businessVerified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: "#2D7A4F18" }]}>
                      <Feather name="check-circle" size={12} color="#2D7A4F" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, overflow: "hidden", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  headerIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  headerText: { flex: 1 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  scoreLabelRow: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  scoreLabelText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  statsSection: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  sectionSubtitle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: -6, marginBottom: 4 },
  impactRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  impactIconBox: { width: 28, height: 28, borderRadius: 7, justifyContent: "center", alignItems: "center" },
  impactLabel: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  impactValue: { fontFamily: "Inter_700Bold", fontSize: 15 },
  supportsSection: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14 },
  bizChip: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, maxWidth: 180 },
  bizChipText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 2, marginLeft: 6 },
  ratingText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#CA922B" },
  ownedSection: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14 },
  ownedRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 8 },
  ownedIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  ownedInfo: { flex: 1 },
  ownedName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  ownedMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  verifiedText: { fontFamily: "Inter_500Medium", fontSize: 11, color: "#2D7A4F" },
});
