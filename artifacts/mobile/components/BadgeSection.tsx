import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface MobileBadge {
  id: string;
  icon: FeatherName;
  label: string;
  description: string;
  requirement: string;
  earned: boolean;
  color: string;
}

function buildMobileBadges(savedCount: number, isEarlyTester: boolean): MobileBadge[] {
  return [
    { id: "founding_member", icon: "star", label: "Founding Member", description: "Joined before public launch", requirement: "Beta / waitlist member", earned: isEarlyTester, color: "#CA922B" },
    { id: "beta_tester", icon: "activity", label: "Beta Tester", description: "Helped test the platform", requirement: "Invited + 3 activities", earned: isEarlyTester, color: "#7C3AED" },
    { id: "early_explorer", icon: "compass", label: "Early Explorer", description: "First 90-day user", requirement: "Join in first 90 days + 10 activities", earned: isEarlyTester, color: "#0891B2" },
    { id: "trailblazer", icon: "map", label: "Trailblazer", description: "Discovers new places", requirement: "Submit 10 listings (5 approved)", earned: false, color: "#EA580C" },
    { id: "community_scout", icon: "search", label: "Community Scout", description: "Uncovers resources", requirement: "25 approved submissions, 80% approval", earned: false, color: "#0D9488" },
    { id: "culture_navigator", icon: "navigation", label: "Culture Navigator", description: "Trusted recommender", requirement: "20 reviews, above-avg helpfulness", earned: false, color: "#4F46E5" },
    { id: "pathfinder", icon: "flag", label: "Pathfinder", description: "Leads discovery regionally", requirement: "5+ cities, 50 contributions", earned: false, color: "#059669" },
    { id: "verified_member", icon: "check-circle", label: "Verified Member", description: "Identity verified", requirement: "Complete verification", earned: false, color: "#2563EB" },
    { id: "safety_advocate", icon: "shield", label: "Safety Advocate", description: "Promotes safer communities", requirement: "10 safety surveys, 5 insights", earned: false, color: "#0284C7" },
    { id: "trusted_contributor", icon: "check-circle", label: "Trusted Contributor", description: "Accurate, helpful content", requirement: "25 approved, <5% removals, 90 days", earned: false, color: "#16A34A" },
    { id: "community_compass", icon: "award", label: "Community Compass", description: "Most trusted contributor", requirement: "100 approved, 50 votes, trust >95%", earned: false, color: "#D97706" },
    { id: "community_supporter", icon: "heart", label: "Community Supporter", description: "Supports local businesses", requirement: "Review 20, save 10, check-in 5", earned: savedCount >= 10, color: "#E11D48" },
    { id: "business_advocate", icon: "briefcase", label: "Business Advocate", description: "Helps businesses join", requirement: "Refer 5 businesses, 2 claim", earned: false, color: "#9333EA" },
    { id: "local_champion", icon: "award", label: "Local Champion", description: "Community commerce champion", requirement: "50 reviews, 10 referrals, 10 events", earned: false, color: "#CA922B" },
    { id: "frequent_explorer", icon: "map-pin", label: "Frequent Explorer", description: "Explores new cities", requirement: "Check-in or review in 3 cities", earned: false, color: "#0EA5E9" },
    { id: "global_navigator", icon: "globe", label: "Global Navigator", description: "Multi-region contributor", requirement: "10 cities, 3+ states", earned: false, color: "#1D4ED8" },
    { id: "city_guide", icon: "map-pin", label: "City Guide", description: "Local city expert", requirement: "25 city contributions, 10 votes", earned: false, color: "#DC2626" },
    { id: "neighborhood_insider", icon: "home", label: "Neighborhood Insider", description: "Relocation insights", requirement: "20 neighborhood surveys, 10 votes", earned: false, color: "#65A30D" },
    { id: "community_voice", icon: "message-circle", label: "Community Voice", description: "Respected contributor", requirement: "25 posts, 25 reactions", earned: false, color: "#7C3AED" },
    { id: "connector", icon: "link", label: "Connector", description: "Brings people together", requirement: "Refer 10 members, 5 join", earned: false, color: "#DB2777" },
    { id: "networker", icon: "users", label: "Networker", description: "Group & discussion leader", requirement: "5 groups, 25 discussions", earned: false, color: "#0D9488" },
    { id: "community_builder", icon: "tool", label: "Community Builder", description: "Drives engagement", requirement: "3 events created, 10 attended", earned: false, color: "#EA580C" },
    { id: "event_enthusiast", icon: "calendar", label: "Event Enthusiast", description: "Active event participant", requirement: "RSVP 10, attend 5 events", earned: false, color: "#9333EA" },
    { id: "community_host", icon: "mic", label: "Community Host", description: "Creates experiences", requirement: "Host 5 approved events", earned: false, color: "#D97706" },
    { id: "vip_member", icon: "zap", label: "VIP Member", description: "Premium member", requirement: "Active paid membership", earned: false, color: "#CA922B" },
    { id: "ambassador", icon: "flag", label: "Ambassador", description: "Platform representative", requirement: "Invitation only", earned: false, color: "#059669" },
    { id: "founders_circle", icon: "box", label: "Founder's Circle", description: "Early mission supporter", requirement: "Waitlist + beta + year 1", earned: isEarlyTester, color: "#7C3AED" },
    { id: "legacy_builder", icon: "award", label: "Legacy Builder", description: "Highest platform honor", requirement: "250 contributions, 25 referrals, 1 year", earned: false, color: "#CA922B" },
    { id: "d9_member", icon: "users", label: "Divine Nine", description: "Member of a historically Black Greek-letter org", requirement: "Verify D9 affiliation in profile settings", earned: false, color: "#7B1E1E" },
  ];
}

export function BadgeSection({ savedCount, isEarlyTester }: { savedCount: number; isEarlyTester: boolean }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const badges = buildMobileBadges(savedCount, isEarlyTester);
  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);
  const pct = Math.round((earned.length / badges.length) * 100);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(v => !v)} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Feather name="award" size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.foreground }]}>Achievements</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.earnedLabel, { color: colors.primary }]}>{earned.length}/{badges.length}</Text>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${pct}%` as any }]} />
      </View>
      <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>{pct}% complete</Text>

      {/* Earned badges (always visible) */}
      {earned.length > 0 && (
        <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} style={styles.earnedScroll} contentContainerStyle={styles.earnedContent}>
          {earned.map(badge => (
            <View key={badge.id} style={styles.earnedBadge}>
              <View style={[styles.badgeCircle, { backgroundColor: badge.color + "20", borderColor: badge.color + "50" }]}>
                <Feather name={badge.icon} size={18} color={badge.color} />
              </View>
              <Text style={[styles.badgeLabel, { color: colors.foreground }]} numberOfLines={2}>{badge.label}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {earned.length === 0 && (
        <View style={styles.noEarned}>
          <Text style={[styles.noEarnedText, { color: colors.mutedForeground }]}>
            Complete activities to earn your first badge
          </Text>
        </View>
      )}

      {/* Expanded: all locked badges */}
      {expanded && locked.length > 0 && (
        <View style={styles.lockedSection}>
          <Text style={[styles.lockedHeader, { color: colors.mutedForeground }]}>Locked — {locked.length} remaining</Text>
          <View style={styles.lockedGrid}>
            {locked.map(badge => (
              <View key={badge.id} style={[styles.lockedItem, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <View style={[styles.lockedCircle, { backgroundColor: colors.border + "80" }]}>
                  <Feather name="lock" size={12} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.lockedLabel, { color: colors.mutedForeground }]} numberOfLines={2}>{badge.label}</Text>
                <Text style={[styles.lockedReq, { color: colors.mutedForeground }]} numberOfLines={2}>{badge.requirement}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!expanded && (
        <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded(true)} activeOpacity={0.7}>
          <Text style={[styles.expandBtnText, { color: colors.primary }]}>See all {badges.length} badges</Text>
          <Feather name="chevron-down" size={13} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 17,
  },
  earnedLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginBottom: 12,
  },
  earnedScroll: {
    marginBottom: 4,
  },
  earnedContent: {
    gap: 12,
    paddingRight: 8,
  },
  earnedBadge: {
    alignItems: "center",
    width: 68,
  },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  badgeLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 13,
  },
  noEarned: {
    paddingVertical: 12,
    alignItems: "center",
  },
  noEarnedText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
  },
  lockedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  lockedHeader: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  lockedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  lockedItem: {
    width: "47%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: "flex-start",
    gap: 4,
  },
  lockedCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  lockedLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
  },
  lockedReq: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    lineHeight: 13,
    opacity: 0.7,
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  expandBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
