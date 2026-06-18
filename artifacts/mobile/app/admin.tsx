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

const ADMIN_TABS = [
  { id: "overview", label: "Overview", icon: "grid" as const },
  { id: "businesses", label: "Businesses", icon: "briefcase" as const },
  { id: "events", label: "Events", icon: "calendar" as const },
  { id: "users", label: "Users", icon: "users" as const },
  { id: "reports", label: "Reports", icon: "flag" as const },
  { id: "reviews", label: "Reviews", icon: "star" as const },
  { id: "analytics", label: "Analytics", icon: "bar-chart-2" as const },
  { id: "content", label: "Content", icon: "layers" as const },
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
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={adminStyles.statsGrid}>
        <StatCard label="Total Users" value="3,284" sub="+12% this week" color="#C4622D" icon="users" />
        <StatCard label="Businesses" value="148" sub="+5 pending" color="#D4873A" icon="briefcase" />
        <StatCard label="Reviews" value="1,902" sub="+24 today" color="#2D7A4F" icon="star" />
        <StatCard label="Events" value="37" sub="8 this month" color="#1D4ED8" icon="calendar" />
      </View>

      <SectionLabel title="Recent Activity" />
      {[
        { icon: "user-plus" as const, text: "New user registered: Simone W.", time: "2 min ago", color: "#2D7A4F" },
        { icon: "briefcase" as const, text: "Business listing submitted: Kingdom Cuts", time: "15 min ago", color: "#D4873A" },
        { icon: "flag" as const, text: "New report: inaccurate info on Listing #23", time: "34 min ago", color: "#DC2626" },
        { icon: "star" as const, text: "New review posted for Sweet Auburn BBQ", time: "1h ago", color: "#C4622D" },
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
      <ActionRow icon="check-circle" label="Approve Pending Businesses" sub="5 listings awaiting review" color="#2D7A4F" badge={5} />
      <ActionRow icon="flag" label="Review Reports Queue" sub="8 reports need attention" color="#DC2626" badge={8} />
      <ActionRow icon="star" label="Moderate Reviews" sub="3 flagged reviews" color="#D4873A" badge={3} />
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
              <Text style={[adminStyles.filterChipText, { color: statusFilter === s.label ? "#FBF7F0" : colors.foreground }]}>{s.label} ({s.count})</Text>
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
            <View style={[adminStyles.statusBadge, { backgroundColor: b.status === "active" ? "#2D7A4F18" : "#D4873A18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: b.status === "active" ? "#2D7A4F" : "#D4873A" }]}>
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
    { name: "Simone W.", email: "simone@email.com", role: "user", joined: "Jun 16", color: "#C4622D" },
    { name: "Marcus T.", email: "marcus@email.com", role: "moderator", joined: "May 3", color: "#2D7A4F" },
    { name: "Aisha B.", email: "aisha@email.com", role: "user", joined: "Apr 22", color: "#D4873A" },
    { name: "Darius K.", email: "darius@email.com", role: "admin", joined: "Mar 10", color: "#1D4ED8" },
    { name: "Zara M.", email: "zara@email.com", role: "user", joined: "Jun 1", color: "#7B2D8B" },
  ];
  const roleColor = (r: string) => r === "admin" ? "#DC2626" : r === "moderator" ? "#D4873A" : "#2D7A4F";
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
  const reports = [
    { cat: "Inaccurate Info", target: "Kingdom Cuts Barbershop", reporter: "Anonymous", time: "1h ago", severity: "medium" as const },
    { cat: "Not Black-Owned", target: "New Listing Co.", reporter: "Zara M.", time: "3h ago", severity: "high" as const },
    { cat: "Discrimination", target: "Downtown Cafe", reporter: "Anonymous", time: "5h ago", severity: "high" as const },
    { cat: "Safety Concern", target: "West End area", reporter: "Kwame A.", time: "1d ago", severity: "medium" as const },
    { cat: "Spam", target: "Fake Listing #99", reporter: "System", time: "2d ago", severity: "low" as const },
  ];
  const sevColor = (s: string) => s === "high" ? "#DC2626" : s === "medium" ? "#D4873A" : "#2D7A4F";
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={[adminStyles.alertBanner, { backgroundColor: "#DC262612", borderColor: "#DC262630" }]}>
        <Feather name="alert-triangle" size={15} color="#DC2626" />
        <Text style={[adminStyles.alertText, { color: "#DC2626" }]}>8 reports require action · 2 high severity</Text>
      </View>
      {reports.map((r, i) => (
        <View key={i} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: sevColor(r.severity) + "18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: sevColor(r.severity) }]}>{r.severity}</Text>
            </View>
            <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>{r.time}</Text>
          </View>
          <Text style={[adminStyles.bizName, { color: colors.foreground, marginBottom: 2 }]}>{r.cat}</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Target: {r.target}</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Reported by: {r.reporter}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F30" }]}>
              <Text style={[adminStyles.smallBtnText, { color: "#2D7A4F" }]}>Resolve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630" }]}>
              <Text style={[adminStyles.smallBtnText, { color: "#DC2626" }]}>Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Investigate</Text>
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
        { label: "Top Category", value: "Beauty (34%)", icon: "scissors" as const, color: "#D4873A" },
        { label: "Top City", value: "Atlanta, GA", icon: "map-pin" as const, color: "#C4622D" },
        { label: "Avg Session", value: "4m 32s", icon: "clock" as const, color: "#2D7A4F" },
        { label: "Retention Rate", value: "68%", icon: "repeat" as const, color: "#1D4ED8" },
        { label: "DAU/MAU", value: "0.42", icon: "activity" as const, color: "#7B2D8B" },
        { label: "Referral Conv.", value: "24%", icon: "share-2" as const, color: "#D4873A" },
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
      <ActionRow icon="plus-circle" label="Create New Event" sub="Add an event to the platform" color="#C4622D" />
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
            <View style={[adminStyles.statusBadge, { backgroundColor: e.status === "active" ? "#2D7A4F18" : "#D4873A18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: e.status === "active" ? "#2D7A4F" : "#D4873A" }]}>{e.status}</Text>
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
      <ActionRow icon="star" label="Featured Businesses" sub="Manage which businesses appear featured" color="#D4873A" />
      <ActionRow icon="calendar" label="Featured Events" sub="Control homepage event highlights" color="#1D4ED8" />
      <ActionRow icon="image" label="Hero Banners" sub="Edit homepage discovery banners" color="#C4622D" />

      <SectionLabel title="Community Content" />
      <ActionRow icon="message-circle" label="Community Posts" sub="Moderate community discussions" color="#2D7A4F" badge={3} />
      <ActionRow icon="bell" label="Safety Alerts" sub="Manage active community alerts" color="#DC2626" badge={1} />
      <ActionRow icon="book-open" label="Resource Hub" sub="Curate community resources & guides" color="#7B2D8B" />

      <SectionLabel title="Platform Notices" />
      <ActionRow icon="send" label="Push Notifications" sub="Send announcements to all users" color="#C4622D" />
      <ActionRow icon="mail" label="Email Campaigns" sub="Community newsletters and updates" color="#1D4ED8" />
    </ScrollView>
  );
}

function SettingsTab() {
  const colors = useColors();
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <SectionLabel title="App Configuration" />
      <ActionRow icon="sliders" label="Confidence Score Weights" sub="Adjust how scores are calculated" color="#C4622D" />
      <ActionRow icon="shield" label="Trust & Safety Rules" sub="Content moderation thresholds" color="#DC2626" />
      <ActionRow icon="award" label="Verification Criteria" sub="Set requirements for verified badge" color="#D4873A" />
      <ActionRow icon="gift" label="Referral Rewards" sub="Configure referral tiers and rewards" color="#2D7A4F" />

      <SectionLabel title="Access Control" />
      <ActionRow icon="lock" label="Admin Roles" sub="Manage moderator and admin access" color="#7B2D8B" />
      <ActionRow icon="key" label="API Keys" sub="Manage third-party integrations" color="#1D4ED8" />

      <SectionLabel title="Data & Privacy" />
      <ActionRow icon="database" label="Data Export" sub="Export platform data and analytics" color="#D4873A" />
      <ActionRow icon="trash-2" label="Data Retention" sub="Configure data retention policies" color="#DC2626" />
    </ScrollView>
  );
}

const TAB_COMPONENTS: Record<string, React.FC> = {
  overview: OverviewTab,
  businesses: BusinessesTab,
  events: EventsTab,
  users: UsersTab,
  reports: ReportsTab,
  reviews: ReviewsTab,
  analytics: AnalyticsTab,
  content: ContentTab,
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
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Mapping with Melanin™</Text>
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
              <Feather name={tab.icon} size={13} color={active ? "#FBF7F0" : colors.mutedForeground} />
              <Text style={[styles.tabLabel, { color: active ? "#FBF7F0" : colors.mutedForeground }]}>
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
});
