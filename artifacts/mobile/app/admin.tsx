import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { useReports } from "@/hooks/useReports";

const ADMIN_TABS = [
  { id: "overview", label: "Overview", icon: "grid" as const },
  { id: "reports", label: "Safety Reports", icon: "flag" as const },
  { id: "reviews", label: "Reviews", icon: "star" as const },
  { id: "claims", label: "Claims", icon: "check-square" as const },
  { id: "submissions", label: "Submissions", icon: "send" as const },
  { id: "referrals", label: "Referrals", icon: "share-2" as const },
  { id: "analytics", label: "Analytics", icon: "bar-chart-2" as const },
  { id: "email", label: "Email", icon: "mail" as const },
  { id: "surveys", label: "Surveys", icon: "clipboard" as const },
  { id: "users", label: "Users", icon: "users" as const },
  { id: "settings", label: "Settings", icon: "settings" as const },
];

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: any }) {
  const colors = useColors();
  return (
    <View style={[adminStyles.statCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
      <View style={[adminStyles.statIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[adminStyles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[adminStyles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[adminStyles.statSub, { color: "#2D7A4F" }]}>{sub}</Text>
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  const colors = useColors();
  return <Text style={[adminStyles.sectionLabel, { color: colors.foreground }]}>{title}</Text>;
}

function ActionRow({ icon, label, sub, color, badge, onPress }: { icon: any; label: string; sub: string; color: string; badge?: number; onPress?: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[adminStyles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
      activeOpacity={0.78}
    >
      <View style={[adminStyles.actionIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon} size={17} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[adminStyles.actionLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[adminStyles.actionSub, { color: colors.mutedForeground }]}>{sub}</Text>
      </View>
      {badge != null && badge > 0 && (
        <View style={[adminStyles.badge, { backgroundColor: color }]}>
          <Text style={adminStyles.badgeText}>{badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function OverviewTab() {
  const colors = useColors();
  const { items, pendingCount, highCount } = useReports("pending");
  const pendingBizCount = items.filter((i) => i.kind === "survey").length;
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={adminStyles.statsGrid}>
        <StatCard label="Total Users" value="3,284" sub="+12% this week" color="#3B1F0E" icon="users" />
        <StatCard label="Businesses" value="35+" sub={pendingBizCount > 0 ? `${pendingBizCount} pending` : "Verified listings"} color="#C9922B" icon="briefcase" />
        <StatCard label="Reviews" value="1,902" sub="+24 today" color="#2D7A4F" icon="star" />
        <StatCard label="Reports" value={String(pendingCount)} sub={highCount > 0 ? `${highCount} high severity` : "All clear"} color="#DC2626" icon="flag" />
      </View>

      <SectionLabel title="Recent Activity" />
      {[
        { icon: "user-plus" as const, text: "New user registered: Simone W.", time: "2 min ago", color: "#2D7A4F" },
        { icon: "briefcase" as const, text: "Business listing submitted: Kingdom Cuts", time: "15 min ago", color: "#C9922B" },
        { icon: "flag" as const, text: "New report: inaccurate info on Listing #23", time: "34 min ago", color: "#DC2626" },
        { icon: "star" as const, text: "New review posted for Sweet Auburn BBQ", time: "1h ago", color: "#3B1F0E" },
        { icon: "calendar" as const, text: "New event submitted: Houston Jazz Night", time: "2h ago", color: "#1D4ED8" },
      ].map((a, i) => (
        <View key={i} style={[adminStyles.activityRow, { borderBottomColor: colors.border }]}>
          <View style={[adminStyles.activityIcon, { backgroundColor: a.color + "15" }]}>
            <Feather name={a.icon} size={14} color={a.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[adminStyles.activityText, { color: colors.foreground }]}>{a.text}</Text>
            <Text style={[adminStyles.activityTime, { color: colors.mutedForeground }]}>{a.time}</Text>
          </View>
        </View>
      ))}

      <SectionLabel title="Quick Actions" />
      <ActionRow icon="check-circle" label="Approve Pending Businesses" sub={pendingBizCount > 0 ? `${pendingBizCount} submissions awaiting review` : "No pending submissions"} color="#2D7A4F" badge={pendingBizCount} />
      <ActionRow icon="flag" label="Review Reports Queue" sub={pendingCount > 0 ? `${pendingCount} report${pendingCount !== 1 ? "s" : ""} need attention` : "All clear"} color="#DC2626" badge={pendingCount} />
      <ActionRow icon="star" label="Moderate Reviews" sub="3 flagged reviews" color="#C9922B" badge={3} />
    </ScrollView>
  );
}

function BusinessesTab() {
  const colors = useColors();
  const STATUSES = [
    { label: "All", count: 148 },
    { label: "Active", count: 134 },
    { label: "Pending", count: 5 },
    { label: "Flagged", count: 9 },
  ];
  const [statusFilter, setStatusFilter] = useState("All");
  const bizList = [
    { name: "Sweet Auburn BBQ", city: "Atlanta, GA", status: "active", score: 94, blackOwned: true },
    { name: "Essence Beauty Lounge", city: "Houston, TX", status: "active", score: 91, blackOwned: true },
    { name: "Kingdom Cuts Barbershop", city: "Atlanta, GA", status: "pending", score: 71, blackOwned: true },
    { name: "Carter & Associates Law", city: "Los Angeles, CA", status: "active", score: 96, blackOwned: true },
    { name: "New Listing Co.", city: "Chicago, IL", status: "pending", score: 55, blackOwned: false },
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s.label}
              style={[adminStyles.filterChip, { backgroundColor: statusFilter === s.label ? colors.primary : colors.secondary, borderColor: statusFilter === s.label ? colors.primary : colors.border }]}
              onPress={() => setStatusFilter(s.label)}
            >
              <Text style={[adminStyles.filterChipText, { color: statusFilter === s.label ? "#FFFFFF" : colors.foreground }]}>{s.label} ({s.count})</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {bizList.map((b, i) => (
        <View key={i} style={[adminStyles.bizRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[adminStyles.bizAvatar, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="briefcase" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[adminStyles.bizName, { color: colors.foreground }]}>{b.name}</Text>
              {b.blackOwned && <Text style={{ fontSize: 10 }}>✊🏾</Text>}
            </View>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>{b.city}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 5 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: b.status === "active" ? "#2D7A4F18" : "#C9922B18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: b.status === "active" ? "#2D7A4F" : "#C9922B" }]}>
                {b.status === "active" ? "Active" : "Pending"}
              </Text>
            </View>
            <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>Score: {b.score}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function UsersTab() {
  const colors = useColors();
  const users = [
    { name: "Simone W.", email: "simone@email.com", role: "user", joined: "Jun 16", color: "#3B1F0E" },
    { name: "Marcus T.", email: "marcus@email.com", role: "moderator", joined: "May 3", color: "#2D7A4F" },
    { name: "Aisha B.", email: "aisha@email.com", role: "user", joined: "Apr 22", color: "#C9922B" },
    { name: "Darius K.", email: "darius@email.com", role: "admin", joined: "Mar 10", color: "#1D4ED8" },
    { name: "Zara M.", email: "zara@email.com", role: "user", joined: "Jun 1", color: "#7B2D8B" },
  ];
  const roleColor = (r: string) => r === "admin" ? "#DC2626" : r === "moderator" ? "#C9922B" : "#2D7A4F";
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={[adminStyles.searchBarInline, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="search" size={14} color={colors.mutedForeground} />
        <Text style={[adminStyles.searchPlaceholder, { color: colors.mutedForeground }]}>Search users...</Text>
      </View>
      {users.map((u, i) => (
        <View key={i} style={[adminStyles.bizRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[adminStyles.bizAvatar, { backgroundColor: u.color }]}>
            <Text style={adminStyles.bizAvatarText}>{u.name.split(" ").map((w) => w[0]).join("")}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[adminStyles.bizName, { color: colors.foreground }]}>{u.name}</Text>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>{u.email}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 5 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: roleColor(u.role) + "18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: roleColor(u.role) }]}>{u.role}</Text>
            </View>
            <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>Joined {u.joined}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function ReportsTab() {
  const colors = useColors();
  const { items, pendingCount, highCount, isLoading, moderate } = useReports("pending");
  const sevColor = (s: string) => s === "high" ? "#DC2626" : s === "medium" ? "#C9922B" : "#2D7A4F";

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      {pendingCount > 0 && (
        <View style={[adminStyles.alertBanner, { backgroundColor: "#DC262612", borderColor: "#DC262630" }]}>
          <Feather name="alert-triangle" size={15} color="#DC2626" />
          <Text style={[adminStyles.alertText, { color: "#DC2626" }]}>
            {pendingCount} report{pendingCount !== 1 ? "s" : ""} require action
            {highCount > 0 ? ` · ${highCount} high severity` : ""}
          </Text>
        </View>
      )}
      {isLoading && (
        <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, textAlign: "center", marginTop: 32 }]}>
          Loading reports…
        </Text>
      )}
      {!isLoading && items.length === 0 && (
        <View style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 32 }]}>
          <Feather name="check-circle" size={28} color="#2D7A4F" style={{ marginBottom: 8 }} />
          <Text style={[adminStyles.bizName, { color: colors.foreground }]}>All clear</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>No pending reports</Text>
        </View>
      )}
      {items.map((r) => (
        <View key={r.id} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: sevColor(r.severity) + "18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: sevColor(r.severity) }]}>{r.severity}</Text>
            </View>
            <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>{timeAgo(r.createdAt)}</Text>
          </View>
          <Text style={[adminStyles.bizName, { color: colors.foreground, marginBottom: 2 }]}>{r.category}</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Target: {r.targetName}</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Reported by: {r.reporterName}</Text>
          {r.description ? (
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginTop: 4, fontStyle: "italic" }]} numberOfLines={2}>
              "{r.description}"
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => void moderate(r.id, r.kind, "approved")}
              style={[adminStyles.smallBtn, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F30" }]}
            >
              <Text style={[adminStyles.smallBtnText, { color: "#2D7A4F" }]}>Resolve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void moderate(r.id, r.kind, "rejected")}
              style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630" }]}
            >
              <Text style={[adminStyles.smallBtnText, { color: "#DC2626" }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function ReviewsTab() {
  const colors = useColors();
  const reviews = [
    { author: "Simone W.", biz: "Sweet Auburn BBQ", text: "Absolutely amazing! The quality exceeded expectations.", rating: 5, status: "approved", time: "3 days ago" },
    { author: "Marcus T.", biz: "Kingdom Cuts", text: "This review contains possible inappropriate language...", rating: 1, status: "flagged", time: "5h ago" },
    { author: "Aisha B.", biz: "Essence Beauty", text: "Best salon ever! So proud to support.", rating: 5, status: "approved", time: "1 week ago" },
    { author: "Unknown", biz: "New Listing Co.", text: "Perfect place totally legit buy now visit today!!!!", rating: 5, status: "flagged", time: "2h ago" },
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      {reviews.map((r, i) => (
        <View key={i} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: r.status === "flagged" ? "#DC262640" : colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: r.status === "flagged" ? "#DC262618" : "#2D7A4F18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: r.status === "flagged" ? "#DC2626" : "#2D7A4F" }]}>
                {r.status}
              </Text>
            </View>
            <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>
              {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
            </Text>
          </View>
          <Text style={[adminStyles.bizName, { color: colors.foreground, marginBottom: 2 }]}>{r.author} → {r.biz}</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginBottom: 8 }]}>"{r.text}"</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F30" }]}>
              <Text style={[adminStyles.smallBtnText, { color: "#2D7A4F" }]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630" }]}>
              <Text style={[adminStyles.smallBtnText, { color: "#DC2626" }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function AnalyticsTab() {
  const colors = useColors();
  const weeks = ["W1", "W2", "W3", "W4"];
  const barData = [65, 82, 74, 96];
  const maxVal = Math.max(...barData);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={[adminStyles.analyticsCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
        <Text style={[adminStyles.analyticsTitle, { color: colors.foreground }]}>New Users This Month</Text>
        <Text style={[adminStyles.analyticsValue, { color: colors.primary }]}>317</Text>
        <Text style={[adminStyles.analyticsSub, { color: "#2D7A4F" }]}>↑ 18% vs last month</Text>
        <View style={adminStyles.barChart}>
          {barData.map((v, i) => (
            <View key={i} style={adminStyles.barCol}>
              <View style={[adminStyles.bar, { height: (v / maxVal) * 90, backgroundColor: colors.primary }]} />
              <Text style={[adminStyles.barLabel, { color: colors.mutedForeground }]}>{weeks[i]}</Text>
            </View>
          ))}
        </View>
      </View>
      {[
        { label: "Top Category", value: "Beauty (34%)", icon: "scissors" as const, color: "#C9922B" },
        { label: "Top City", value: "Atlanta, GA", icon: "map-pin" as const, color: "#3B1F0E" },
        { label: "Avg Session", value: "4m 32s", icon: "clock" as const, color: "#2D7A4F" },
        { label: "Retention Rate", value: "68%", icon: "repeat" as const, color: "#1D4ED8" },
        { label: "DAU/MAU", value: "0.42", icon: "activity" as const, color: "#7B2D8B" },
        { label: "Referral Conv.", value: "24%", icon: "share-2" as const, color: "#C9922B" },
      ].map((m, i) => (
        <View key={i} style={[adminStyles.metricRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[adminStyles.metricIcon, { backgroundColor: m.color + "18" }]}>
            <Feather name={m.icon} size={15} color={m.color} />
          </View>
          <Text style={[adminStyles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
          <Text style={[adminStyles.metricValue, { color: colors.foreground }]}>{m.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function EventsTab() {
  const colors = useColors();
  const events = [
    { title: "Juneteenth Freedom Festival", date: "Jun 19", city: "Atlanta, GA", status: "active", attendees: 1240 },
    { title: "Black Tech Founders Summit", date: "Jul 12", city: "Chicago, IL", status: "active", attendees: 540 },
    { title: "Houston Jazz & Soul Night", date: "Jul 20", city: "Houston, TX", status: "pending", attendees: 0 },
    { title: "Melanin Beauty Expo", date: "Aug 3", city: "Washington, DC", status: "active", attendees: 1820 },
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <ActionRow icon="plus-circle" label="Create New Event" sub="Add an event to the platform" color="#3B1F0E" />
      {events.map((e, i) => (
        <View key={i} style={[adminStyles.bizRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[adminStyles.bizAvatar, { backgroundColor: "#1D4ED820" }]}>
            <Feather name="calendar" size={16} color="#1D4ED8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[adminStyles.bizName, { color: colors.foreground }]}>{e.title}</Text>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>{e.date} · {e.city}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 5 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: e.status === "active" ? "#2D7A4F18" : "#C9922B18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: e.status === "active" ? "#2D7A4F" : "#C9922B" }]}>{e.status}</Text>
            </View>
            {e.attendees > 0 && <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>{e.attendees} RSVP</Text>}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function ContentTab() {
  const colors = useColors();
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <SectionLabel title="Featured Content" />
      <ActionRow icon="star" label="Featured Businesses" sub="Manage which businesses appear featured" color="#C9922B" />
      <ActionRow icon="calendar" label="Featured Events" sub="Control homepage event highlights" color="#1D4ED8" />
      <ActionRow icon="image" label="Hero Banners" sub="Edit homepage discovery banners" color="#3B1F0E" />

      <SectionLabel title="Community Content" />
      <ActionRow icon="message-circle" label="Community Posts" sub="Moderate community discussions" color="#2D7A4F" badge={3} />
      <ActionRow icon="bell" label="Safety Alerts" sub="Manage active community alerts" color="#DC2626" badge={1} />
      <ActionRow icon="book-open" label="Resource Hub" sub="Curate community resources & guides" color="#7B2D8B" />

      <SectionLabel title="Platform Notices" />
      <ActionRow icon="send" label="Push Notifications" sub="Send announcements to all users" color="#3B1F0E" />
      <ActionRow icon="mail" label="Email Campaigns" sub="Community newsletters and updates" color="#1D4ED8" />
    </ScrollView>
  );
}

function SettingsTab() {
  const colors = useColors();
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <SectionLabel title="App Configuration" />
      <ActionRow icon="sliders" label="Confidence Score Weights" sub="Adjust how scores are calculated" color="#3B1F0E" />
      <ActionRow icon="shield" label="Trust & Safety Rules" sub="Content moderation thresholds" color="#DC2626" />
      <ActionRow icon="award" label="Verification Criteria" sub="Set requirements for verified badge" color="#C9922B" />
      <ActionRow icon="gift" label="Referral Rewards" sub="Configure referral tiers and rewards" color="#2D7A4F" />

      <SectionLabel title="Access Control" />
      <ActionRow icon="lock" label="Admin Roles" sub="Manage moderator and admin access" color="#7B2D8B" />
      <ActionRow icon="key" label="API Keys" sub="Manage third-party integrations" color="#1D4ED8" />

      <SectionLabel title="Data & Privacy" />
      <ActionRow icon="database" label="Data Export" sub="Export platform data and analytics" color="#C9922B" />
      <ActionRow icon="trash-2" label="Data Retention" sub="Configure data retention policies" color="#DC2626" />
    </ScrollView>
  );
}

function SurveysTab() {
  const colors = useColors();
  const [typeFilter, setTypeFilter] = useState("All");
  const SURVEY_TYPES = ["All", "Safety", "Neighborhood", "Itinerary", "Preferences"];
  const KPI = [
    { label: "Safety Surveys", value: "284", sub: "+18 today", color: "#DC2626", icon: "shield" as const },
    { label: "Neighborhood Ratings", value: "136", sub: "+7 today", color: "#2D7A4F", icon: "map-pin" as const },
    { label: "Itinerary Feedback", value: "97", sub: "+12 today", color: "#C9922B", icon: "map" as const },
    { label: "Preference Surveys", value: "412", sub: "+31 today", color: "#1D4ED8", icon: "sliders" as const },
  ];
  const RESPONSES = [
    { type: "Safety", business: "Essence Beauty Lounge", city: "Houston, TX", rating: 4, time: "3 min ago", summary: "Felt very safe during evening visit. Good lighting." },
    { type: "Neighborhood", business: "Sweet Auburn, Atlanta", city: "Atlanta, GA", rating: 5, time: "12 min ago", summary: "Well-lit streets, active foot traffic, community watch." },
    { type: "Itinerary", business: "Atlanta Weekend Trip", city: "Atlanta, GA", rating: 5, time: "28 min ago", summary: "Loved it! Great neighborhood picks and safety tips." },
    { type: "Safety", business: "Kingdom Cuts Barbershop", city: "Atlanta, GA", rating: 3, time: "1h ago", summary: "Average experience. Could use better exterior lighting." },
    { type: "Preferences", business: "User: Simone W.", city: "Atlanta, GA", rating: 0, time: "2h ago", summary: "Foodie + Cultural, Atlanta & Houston, Solo travel." },
    { type: "Itinerary", business: "New Orleans Trip", city: "New Orleans, LA", rating: 4, time: "3h ago", summary: "Good recommendations but needed more budget options." },
    { type: "Neighborhood", business: "Bronzeville, Chicago", city: "Chicago, IL", rating: 4, time: "5h ago", summary: "Great daytime safety, mixed nighttime. Police somewhat helpful." },
    { type: "Safety", business: "Harambee Tech Hub", city: "Houston, TX", rating: 5, time: "6h ago", summary: "Excellent safety experience. Solo-friendly space." },
  ];
  const COLORS: Record<string, string> = { Safety: "#DC2626", Neighborhood: "#2D7A4F", Itinerary: "#C9922B", Preferences: "#1D4ED8" };
  const filtered = typeFilter === "All" ? RESPONSES : RESPONSES.filter((r) => r.type === typeFilter);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={adminStyles.statsGrid}>
        {KPI.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} icon={k.icon} />
        ))}
      </View>
      <SectionLabel title="Response Viewer" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {SURVEY_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[adminStyles.filterChip, { backgroundColor: typeFilter === t ? colors.primary : colors.secondary, borderColor: typeFilter === t ? colors.primary : colors.border }]}
              onPress={() => setTypeFilter(t)}
            >
              <Text style={[adminStyles.filterChipText, { color: typeFilter === t ? "#FFFFFF" : colors.foreground }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {filtered.map((r, i) => (
        <View key={i} style={[adminStyles.surveyCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: COLORS[r.type] ?? colors.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <View style={[adminStyles.surveyTypeBadge, { backgroundColor: (COLORS[r.type] ?? "#999") + "18" }]}>
              <Text style={[adminStyles.surveyTypeBadgeText, { color: COLORS[r.type] ?? "#999" }]}>{r.type}</Text>
            </View>
            <Text style={[adminStyles.surveyBiz, { color: colors.foreground }]} numberOfLines={1}>{r.business}</Text>
            <Text style={[adminStyles.surveyTime, { color: colors.mutedForeground }]}>{r.time}</Text>
          </View>
          <Text style={[adminStyles.surveyCity, { color: colors.mutedForeground }]}>{r.city}</Text>
          {r.rating > 0 && (
            <View style={adminStyles.surveyStars}>
              {[1,2,3,4,5].map((n) => (
                <Feather key={n} name="star" size={12} color={n <= r.rating ? "#C9922B" : colors.border} />
              ))}
            </View>
          )}
          <Text style={[adminStyles.surveySummary, { color: colors.mutedForeground }]}>{r.summary}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function ClaimsTab() {
  const colors = useColors();
  const [filter, setFilter] = useState("All");
  const STATUSES = ["All", "Pending", "Approved", "Rejected"];
  const claims = [
    { business: "Kingdom Cuts Barbershop", city: "Atlanta, GA", claimant: "Marcus T.", method: "Email", status: "pending", submitted: "Jun 15" },
    { business: "Essence Beauty Lounge", city: "Houston, TX", claimant: "Aisha B.", method: "Document", status: "approved", submitted: "Jun 10" },
    { business: "Carter & Associates Law", city: "Los Angeles, CA", claimant: "Darius K.", method: "Phone", status: "approved", submitted: "Jun 8" },
    { business: "New Listing Co.", city: "Chicago, IL", claimant: "Unknown User", method: "Email", status: "rejected", submitted: "Jun 5" },
    { business: "Urban Roots Cafe", city: "Oakland, CA", claimant: "Zara M.", method: "Document", status: "pending", submitted: "Jun 16" },
  ];
  const statusColor = (s: string) => s === "approved" ? "#2D7A4F" : s === "rejected" ? "#DC2626" : "#C9922B";
  const filtered = filter === "All" ? claims : claims.filter((c) => c.status === filter.toLowerCase());
  const pending = claims.filter((c) => c.status === "pending").length;
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      {pending > 0 && (
        <View style={[adminStyles.alertBanner, { backgroundColor: "#C9922B12", borderColor: "#C9922B30" }]}>
          <Feather name="check-square" size={15} color="#C9922B" />
          <Text style={[adminStyles.alertText, { color: "#C9922B" }]}>{pending} claim{pending !== 1 ? "s" : ""} awaiting review</Text>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {STATUSES.map((s) => (
            <TouchableOpacity key={s} style={[adminStyles.filterChip, { backgroundColor: filter === s ? colors.primary : colors.secondary, borderColor: filter === s ? colors.primary : colors.border }]} onPress={() => setFilter(s)}>
              <Text style={[adminStyles.filterChipText, { color: filter === s ? "#FFFFFF" : colors.foreground }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {filtered.map((c, i) => (
        <View key={i} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: statusColor(c.status) + "18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: statusColor(c.status) }]}>{c.status}</Text>
            </View>
            <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>Submitted {c.submitted}</Text>
          </View>
          <Text style={[adminStyles.bizName, { color: colors.foreground, marginBottom: 2 }]}>{c.business}</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>{c.city}</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Claimant: {c.claimant} · Method: {c.method}</Text>
          {c.status === "pending" && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F30" }]}>
                <Text style={[adminStyles.smallBtnText, { color: "#2D7A4F" }]}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630" }]}>
                <Text style={[adminStyles.smallBtnText, { color: "#DC2626" }]}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Request Docs</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function SubmissionsTab() {
  const colors = useColors();
  const [filter, setFilter] = useState("All");
  const STATUSES = ["All", "Pending", "Approved", "Rejected"];
  const submissions = [
    { name: "Kingdom Cuts Barbershop", category: "Beauty", city: "Atlanta, GA", submittedBy: "Marcus T.", blackOwned: true, status: "pending", submitted: "Jun 16" },
    { name: "Urban Roots Cafe", category: "Restaurant", city: "Oakland, CA", submittedBy: "Zara M.", blackOwned: true, status: "pending", submitted: "Jun 15" },
    { name: "Harambee Tech Hub", category: "Coworking", city: "Houston, TX", submittedBy: "Kwame A.", blackOwned: true, status: "approved", submitted: "Jun 10" },
    { name: "New Listing Co.", category: "Retail", city: "Chicago, IL", submittedBy: "Anonymous", blackOwned: false, status: "rejected", submitted: "Jun 5" },
    { name: "Cleo's Bistro", category: "Restaurant", city: "Washington, DC", submittedBy: "Simone W.", blackOwned: true, status: "pending", submitted: "Jun 17" },
  ];
  const statusColor = (s: string) => s === "approved" ? "#2D7A4F" : s === "rejected" ? "#DC2626" : "#C9922B";
  const filtered = filter === "All" ? submissions : submissions.filter((s) => s.status === filter.toLowerCase());
  const pending = submissions.filter((s) => s.status === "pending").length;
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      {pending > 0 && (
        <View style={[adminStyles.alertBanner, { backgroundColor: "#3B1F0E12", borderColor: "#3B1F0E30" }]}>
          <Feather name="send" size={15} color="#3B1F0E" />
          <Text style={[adminStyles.alertText, { color: "#3B1F0E" }]}>{pending} submission{pending !== 1 ? "s" : ""} awaiting review</Text>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {STATUSES.map((s) => (
            <TouchableOpacity key={s} style={[adminStyles.filterChip, { backgroundColor: filter === s ? colors.primary : colors.secondary, borderColor: filter === s ? colors.primary : colors.border }]} onPress={() => setFilter(s)}>
              <Text style={[adminStyles.filterChipText, { color: filter === s ? "#FFFFFF" : colors.foreground }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {filtered.map((s, i) => (
        <View key={i} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: statusColor(s.status) + "18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: statusColor(s.status) }]}>{s.status}</Text>
            </View>
            <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>{s.submitted}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <Text style={[adminStyles.bizName, { color: colors.foreground }]}>{s.name}</Text>
            {s.blackOwned && <Text style={{ fontSize: 12 }}>✊🏾</Text>}
          </View>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>{s.category} · {s.city}</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Submitted by: {s.submittedBy}</Text>
          {s.status === "pending" && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F30" }]}>
                <Text style={[adminStyles.smallBtnText, { color: "#2D7A4F" }]}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630" }]}>
                <Text style={[adminStyles.smallBtnText, { color: "#DC2626" }]}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function ReferralsTab() {
  const colors = useColors();
  const KPI = [
    { label: "Total Referrals", value: "824", sub: "+47 this week", color: "#3B1F0E", icon: "share-2" as const },
    { label: "Conversions", value: "312", sub: "38% conv. rate", color: "#2D7A4F", icon: "user-check" as const },
    { label: "Ambassadors", value: "18", sub: "25+ referrals", color: "#C9922B", icon: "award" as const },
    { label: "Credits Issued", value: "$840", sub: "All time", color: "#1D4ED8", icon: "dollar-sign" as const },
  ];
  const topReferrers = [
    { name: "Simone W.", referrals: 38, tier: "Legend", earned: "$100", color: "#3B1F0E" },
    { name: "Marcus T.", referrals: 29, tier: "Legend", earned: "$100", color: "#2D7A4F" },
    { name: "Aisha B.", referrals: 17, tier: "Ambassador", earned: "$25", color: "#C9922B" },
    { name: "Kwame A.", referrals: 12, tier: "Ambassador", earned: "$25", color: "#1D4ED8" },
    { name: "Zara M.", referrals: 6, tier: "Connector", earned: "$5", color: "#7B2D8B" },
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={adminStyles.statsGrid}>
        {KPI.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} icon={k.icon} />
        ))}
      </View>
      <SectionLabel title="Top Referrers" />
      {topReferrers.map((r, i) => (
        <View key={i} style={[adminStyles.bizRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[adminStyles.bizAvatar, { backgroundColor: r.color }]}>
            <Text style={adminStyles.bizAvatarText}>{r.name.split(" ").map((w) => w[0]).join("")}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[adminStyles.bizName, { color: colors.foreground }]}>{r.name}</Text>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>{r.referrals} referrals · {r.earned} earned</Text>
          </View>
          <View style={[adminStyles.statusBadge, { backgroundColor: r.color + "18" }]}>
            <Text style={[adminStyles.statusBadgeText, { color: r.color }]}>{r.tier}</Text>
          </View>
        </View>
      ))}
      <SectionLabel title="Program Settings" />
      <ActionRow icon="gift" label="Reward Tiers" sub="Configure tier thresholds and rewards" color="#3B1F0E" />
      <ActionRow icon="link" label="Referral Links" sub="View and manage all referral links" color="#C9922B" />
      <ActionRow icon="download" label="Export Data" sub="Download full referral report CSV" color="#2D7A4F" />
    </ScrollView>
  );
}

function EmailTab() {
  const colors = useColors();
  const KPI = [
    { label: "Subscribers", value: "2,841", sub: "+184 this week", color: "#3B1F0E", icon: "mail" as const },
    { label: "Open Rate", value: "46%", sub: "+3% vs avg", color: "#2D7A4F", icon: "eye" as const },
    { label: "Click Rate", value: "18%", sub: "Industry: 11%", color: "#C9922B", icon: "mouse-pointer" as const },
    { label: "Unsubscribes", value: "12", sub: "0.4% rate", color: "#1D4ED8", icon: "user-x" as const },
  ];
  const drip = [
    { day: "Day 0", subject: "Welcome to Mapping With Melanin™", sent: 2841, opened: 1847, clicked: 612, status: "active" },
    { day: "Day 2", subject: "Discover Black-owned businesses near you", sent: 2614, opened: 1180, clicked: 447, status: "active" },
    { day: "Day 5", subject: "Rate your first neighborhood", sent: 1823, opened: 910, clicked: 302, status: "active" },
    { day: "Day 10", subject: "Your safety impact so far", sent: 1240, opened: 694, clicked: 208, status: "active" },
    { day: "Day 30", subject: "You've been with us a month 🙌", sent: 412, opened: 267, clicked: 89, status: "active" },
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={adminStyles.statsGrid}>
        {KPI.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} icon={k.icon} />
        ))}
      </View>
      <SectionLabel title="Onboarding Drip Sequence" />
      {drip.map((d, i) => (
        <View key={i} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: "#2D7A4F18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: "#2D7A4F" }]}>{d.day}</Text>
            </View>
            <View style={[adminStyles.statusBadge, { backgroundColor: "#2D7A4F10" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: "#2D7A4F" }]}>Active</Text>
            </View>
          </View>
          <Text style={[adminStyles.bizName, { color: colors.foreground, marginBottom: 6 }]}>{d.subject}</Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Sent: {d.sent.toLocaleString()}</Text>
            <Text style={[adminStyles.bizCity, { color: "#2D7A4F" }]}>Open: {Math.round(d.opened / d.sent * 100)}%</Text>
            <Text style={[adminStyles.bizCity, { color: "#C9922B" }]}>Click: {Math.round(d.clicked / d.sent * 100)}%</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#3B1F0E18", borderColor: "#3B1F0E30" }]}>
              <Text style={[adminStyles.smallBtnText, { color: "#3B1F0E" }]}>Trigger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <SectionLabel title="Actions" />
      <ActionRow icon="users" label="Subscriber List" sub="Browse and search all email subscribers" color="#3B1F0E" />
      <ActionRow icon="user-minus" label="Unsubscribe Management" sub="Handle unsubscribe requests" color="#DC2626" />
      <ActionRow icon="send" label="Send Announcement" sub="One-off email to all subscribers" color="#C9922B" />
    </ScrollView>
  );
}

const TAB_COMPONENTS: Record<string, React.FC> = {
  overview: OverviewTab,
  reports: ReportsTab,
  reviews: ReviewsTab,
  claims: ClaimsTab,
  submissions: SubmissionsTab,
  referrals: ReferralsTab,
  analytics: AnalyticsTab,
  email: EmailTab,
  surveys: SurveysTab,
  users: UsersTab,
  settings: SettingsTab,
};

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const TabContent = TAB_COMPONENTS[activeTab] ?? OverviewTab;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Admin Panel</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Mapping With Melanin™</Text>
        </View>
        <View style={[styles.adminBadge, { backgroundColor: "#DC262618", borderColor: "#DC262640" }]}>
          <Feather name="shield" size={13} color="#DC2626" />
          <Text style={[styles.adminBadgeText, { color: "#DC2626" }]}>Admin</Text>
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}
      >
        {ADMIN_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabPill,
                {
                  backgroundColor: active ? colors.primary : "transparent",
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
              activeOpacity={0.8}
            >
              <Feather name={tab.icon} size={13} color={active ? "#FFFFFF" : colors.mutedForeground} />
              <Text style={[styles.tabLabel, { color: active ? "#FFFFFF" : colors.mutedForeground }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab content */}
      <View style={[styles.content, { paddingBottom: bottomPad }]}>
        <TabContent />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  adminBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  tabBar: { borderBottomWidth: 1, maxHeight: 56 },
  tabPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginVertical: 10, flexShrink: 0 },
  tabLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  content: { flex: 1 },
});

const adminStyles = StyleSheet.create({
  tabContent: { padding: 16, gap: 10, paddingBottom: 60 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 6 },
  statCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    gap: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 24 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statSub: { fontFamily: "Inter_500Medium", fontSize: 11 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 8, marginBottom: 4 },
  activityRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  activityIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  activityText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  activityTime: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 0 },
  actionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  actionSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, minWidth: 22, alignItems: "center" },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#FFFFFF" },
  bizRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  bizAvatar: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bizAvatarText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
  bizName: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 2 },
  bizCity: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  scoreText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  searchBarInline: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  searchPlaceholder: { fontFamily: "Inter_400Regular", fontSize: 14 },
  reportCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  smallBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  alertText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  analyticsCard: { borderRadius: 18, padding: 18, gap: 6, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2, marginBottom: 4 },
  analyticsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  analyticsValue: { fontFamily: "Inter_700Bold", fontSize: 36 },
  analyticsSub: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 8 },
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 10, height: 110, paddingTop: 14 },
  barCol: { flex: 1, alignItems: "center", gap: 6 },
  bar: { width: "100%", borderRadius: 6, minHeight: 6 },
  barLabel: { fontFamily: "Inter_500Medium", fontSize: 11 },
  metricRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  metricIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  metricLabel: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13 },
  metricValue: { fontFamily: "Inter_700Bold", fontSize: 15 },
  surveyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    gap: 4,
  },
  surveyTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  surveyTypeBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  surveyBiz: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 13 },
  surveyCity: { fontFamily: "Inter_400Regular", fontSize: 12 },
  surveyTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  surveyStars: { flexDirection: "row", gap: 2, marginVertical: 2 },
  surveySummary: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
});
