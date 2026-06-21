import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/contexts/ThemeContext";

type Row = {
  id: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  sub?: string;
  route?: string | null;
  value?: string;
  danger?: boolean;
  destructive?: boolean;
};

type Section = {
  title: string;
  rows: Row[];
};

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggle: toggleDark } = useTheme();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const SECTIONS: Section[] = [
    {
      title: "Account",
      rows: [
        { id: "profile", icon: "user", label: "Edit Profile", sub: "Name, photo, bio", route: "/(tabs)/profile" },
        { id: "email", icon: "mail", label: "Email Address", sub: user?.email ?? "Not signed in", route: null },
        { id: "password", icon: "lock", label: "Change Password", sub: "Managed via Replit account", route: null },
        { id: "connected", icon: "link", label: "Connected Accounts", sub: "Managed via Replit Auth", route: null },
      ],
    },
    {
      title: "App Settings",
      rows: [
        { id: "notifications", icon: "bell", label: "Notifications", sub: "Alerts and reminders", route: "/notifications-settings" },
        { id: "privacy", icon: "shield", label: "Privacy & Safety", sub: "Visibility and data", route: "/privacy" },
        { id: "appearance", icon: "moon", label: "Dark Mode", value: isDark ? "On" : "Off", route: null },
      ],
    },
    {
      title: "Community",
      rows: [
        { id: "reviews", icon: "star", label: "My Reviews", route: "/(tabs)/profile" },
        { id: "reports", icon: "flag", label: "My Safety Reports", route: "/(tabs)/profile" },
        { id: "saved", icon: "bookmark", label: "Saved Businesses", route: "/(tabs)/profile" },
        { id: "membership", icon: "award", label: "Membership", sub: "Explore (Free)", route: "/membership" },
      ],
    },
    {
      title: "Business",
      rows: [
        { id: "list", icon: "plus-circle", label: "List My Business", route: "/list-business" },
        { id: "dashboard", icon: "bar-chart-2", label: "Business Dashboard", route: "/business-dashboard" },
        { id: "verify", icon: "check-circle", label: "Verify My Business", route: "/business-verify" },
      ],
    },
    {
      title: "Support",
      rows: [
        { id: "contact", icon: "mail", label: "Contact Us", sub: "Questions, bugs, partnerships", route: "/contact" },
        { id: "roadmap", icon: "map", label: "Product Roadmap", sub: "See what we're building", route: "/roadmap" },
        { id: "waitlist", icon: "zap", label: "Early Access Waitlist", sub: "Skip the line", route: "/waitlist" },
        { id: "referral", icon: "share-2", label: "Referral Program", sub: "Earn rewards", route: "/referral" },
      ],
    },
    {
      title: "Legal",
      rows: [
        { id: "terms", icon: "file-text", label: "Terms of Service", route: "/terms" },
        { id: "privacypolicy", icon: "file", label: "Privacy Policy", route: "/privacy-policy" },
        { id: "guidelines", icon: "users", label: "Community Guidelines", route: "/community-guidelines" },
        { id: "standards", icon: "book-open", label: "Community Standards", route: "/community-standards" },
        { id: "safetyinfo", icon: "shield", label: "Our Safety Philosophy", route: "/safety-info" },
        { id: "licenses", icon: "code", label: "Open Source Licenses", route: null, sub: "React Native, Expo, and more" },
        { id: "version", icon: "info", label: "Version", value: "1.0.0", route: null },
      ],
    },
  ];

  const DANGER: Row[] = [
    { id: "signout", icon: "log-out", label: "Sign Out", danger: true, route: null },
    { id: "delete", icon: "trash-2", label: "Delete Account", destructive: true, sub: "Permanently remove your account", route: null },
  ];

  const handleRow = (row: Row) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (row.id === "appearance") { toggleDark(); return; }
    if (row.id === "password") {
      Alert.alert("Change Password", "Your password is managed through your Replit account. Visit replit.com/account to update it.");
      return;
    }
    if (row.id === "connected") {
      Alert.alert("Connected Accounts", "Your connected accounts are managed through Replit Auth at replit.com/account.");
      return;
    }
    if (row.id === "licenses") {
      Alert.alert("Open Source Licenses", "This app is built on React Native, Expo, Drizzle ORM, and many other open source projects. Thank you to all contributors.");
      return;
    }
    if (row.id === "signout") {
      logout();
      router.replace("/login");
      return;
    }
    if (row.id === "delete") {
      if (Platform.OS !== "web") {
        Alert.alert(
          "Delete Account",
          "This will permanently delete all your data. This cannot be undone.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => router.replace("/login") },
          ]
        );
      }
      return;
    }
    if (row.route) router.push(row.route as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.rows.map((row, idx) => (
                <React.Fragment key={row.id}>
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => handleRow(row)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
                      <Feather name={row.icon} size={16} color={colors.primary} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{row.label}</Text>
                      {row.sub && <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{row.sub}</Text>}
                    </View>
                    {row.value ? (
                      <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{row.value}</Text>
                    ) : row.route !== null ? (
                      <Feather name="chevron-right" size={16} color={colors.border} />
                    ) : null}
                  </TouchableOpacity>
                  {idx < section.rows.length - 1 && (
                    <View style={[styles.sep, { backgroundColor: colors.border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.sectionBlock}>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {DANGER.map((row, idx) => (
              <React.Fragment key={row.id}>
                <TouchableOpacity style={styles.row} onPress={() => handleRow(row)} activeOpacity={0.7}>
                  <View style={[styles.rowIcon, { backgroundColor: row.destructive ? "#FEE2E2" : "#FFF5F5" }]}>
                    <Feather name={row.icon} size={16} color={row.destructive ? colors.destructive : "#E11D48"} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowLabel, { color: row.destructive ? colors.destructive : "#E11D48" }]}>
                      {row.label}
                    </Text>
                    {row.sub && <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{row.sub}</Text>}
                  </View>
                </TouchableOpacity>
                {idx === 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20 },
  sectionBlock: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  rowValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  sep: { height: 1, marginLeft: 60 },
});
