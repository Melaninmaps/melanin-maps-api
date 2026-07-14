import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface QuotaData {
  used: number;
  limit: number;
  resetDate: string;
  tierLabel: string;
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const TIER_TABLE: { tier: string; label: string; videoMonthly: number }[] = [
  { tier: "free",              label: "Community",       videoMonthly: 3   },
  { tier: "navigator",         label: "Explorer",        videoMonthly: 10  },
  { tier: "trailblazer",       label: "Advocate",        videoMonthly: 25  },
  { tier: "community_builder", label: "Creator",         videoMonthly: 75  },
  { tier: "legacy_member",     label: "Premium Creator", videoMonthly: 200 },
];

interface Props {
  onUpgradePress?: () => void;
  showTierTable?: boolean;
}

export function VideoQuotaMeter({ onUpgradePress, showTierTable = false }: Props) {
  const colors = useColors();
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const res = await fetch(`${getApiBase()}/api/community/video-quota`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setQuota(data);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <View style={[s.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!quota) return null;

  const pct = Math.min(quota.used / quota.limit, 1);
  const remaining = quota.limit - quota.used;
  const isNearLimit = pct >= 0.8;
  const isAtLimit = quota.used >= quota.limit;

  const resetDate = new Date(quota.resetDate);
  const resetLabel = resetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const barColor = isAtLimit ? "#DC2626" : isNearLimit ? "#D97706" : "#2D7A4F";

  return (
    <View style={[s.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={s.headerRow}>
        <View style={s.iconWrap}>
          <Feather name="video" size={15} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.foreground }]}>Videos This Month</Text>
          <Text style={[s.tierLabel, { color: colors.mutedForeground }]}>{quota.tierLabel} Plan</Text>
        </View>
        {(isNearLimit || isAtLimit) && onUpgradePress && (
          <TouchableOpacity
            style={[s.upgradeBtn, { backgroundColor: colors.primary }]}
            onPress={onUpgradePress}
            activeOpacity={0.8}
          >
            <Text style={s.upgradeBtnText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Count display */}
      <View style={s.countRow}>
        <Text style={[s.countText, { color: isAtLimit ? "#DC2626" : colors.foreground }]}>
          {quota.used} of {quota.limit} used
        </Text>
        <Text style={[s.resetText, { color: colors.mutedForeground }]}>
          Resets {resetLabel}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[s.barTrack, { backgroundColor: colors.border }]}>
        <View style={[s.barFill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
      </View>

      {/* Status message */}
      {isAtLimit ? (
        <View style={[s.alertRow, { backgroundColor: "#DC262610" }]}>
          <Feather name="alert-circle" size={13} color="#DC2626" />
          <Text style={[s.alertText, { color: "#DC2626" }]}>
            Quota reached · upgrade to keep posting videos
          </Text>
        </View>
      ) : isNearLimit ? (
        <View style={[s.alertRow, { backgroundColor: "#D9770610" }]}>
          <Feather name="alert-triangle" size={13} color="#D97706" />
          <Text style={[s.alertText, { color: "#D97706" }]}>
            {remaining} video{remaining !== 1 ? "s" : ""} remaining this month
          </Text>
        </View>
      ) : (
        <Text style={[s.okText, { color: colors.mutedForeground }]}>
          {remaining} video{remaining !== 1 ? "s" : ""} remaining · resets {resetLabel}
        </Text>
      )}

      {/* Upgrade incentive — show when near/at limit */}
      {(isNearLimit || isAtLimit) && onUpgradePress && (
        <TouchableOpacity
          style={[s.upgradeRow, { borderColor: colors.primary + "30", backgroundColor: colors.primary + "08" }]}
          onPress={onUpgradePress}
          activeOpacity={0.8}
        >
          <Feather name="arrow-up-circle" size={15} color={colors.primary} />
          <Text style={[s.upgradeRowText, { color: colors.primary }]}>
            Upgrade for more videos + analytics, captions & priority placement
          </Text>
          <Feather name="chevron-right" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Tier comparison table */}
      {showTierTable && (
        <View style={s.tableWrap}>
          <Text style={[s.tableTitle, { color: colors.mutedForeground }]}>Monthly Video Allowance</Text>
          {TIER_TABLE.map((row) => {
            const isCurrent = row.label === quota.tierLabel;
            return (
              <View key={row.tier} style={[s.tableRow, isCurrent && { backgroundColor: colors.primary + "10" }]}>
                <View style={s.tableRowLeft}>
                  {isCurrent && <View style={[s.tierDot, { backgroundColor: colors.primary }]} />}
                  <Text style={[s.tableTierName, { color: isCurrent ? colors.primary : colors.foreground, fontFamily: isCurrent ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                    {row.label}
                  </Text>
                </View>
                <Text style={[s.tableCount, { color: isCurrent ? colors.primary : colors.mutedForeground }]}>
                  {row.videoMonthly}/mo
                </Text>
              </View>
            );
          })}
          <Text style={[s.tableNote, { color: colors.mutedForeground }]}>
            Quality over quantity — thoughtful limits ensure every story gets discovered.
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#CA922B18",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  tierLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 1,
  },
  upgradeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  resetText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  alertText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    flex: 1,
  },
  okText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  upgradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  upgradeRowText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 17,
  },
  tableWrap: {
    marginTop: 4,
    gap: 2,
  },
  tableTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tableRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tableTierName: {
    fontSize: 13,
  },
  tableCount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  tableNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
    fontStyle: "italic",
  },
});
