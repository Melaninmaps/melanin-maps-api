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
import { useTheme } from "@/contexts/ThemeContext";

type Row = {
  id: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  sub?: string;
  route?: string | null;
  value?: string;
};

type SectionId = "account" | "app";

type Section = {
  id: SectionId;
  title: string;
  summary: string;
  rows: Row[];
};

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, toggle: toggleDark } = useTheme();
  const [expandedSection, setExpandedSection] = useState<SectionId | null>(null);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sections: Section[] = [
    {
      id: "account",
      title: "Account",
      summary: "Profile, identity, accounts, and business submission tools",
      rows: [
        { id: "profile", icon: "user", label: "Edit Profile", sub: "Name, photo, bio", route: "/(tabs)/profile" },
        { id: "identity", icon: "heart", label: "Gender & Pronouns", sub: "Private — used only by Kinfolk", route: "/identity-context" },
        { id: "password", icon: "lock", label: "Change Password", sub: "Managed through your account provider", route: null },
        { id: "connected", icon: "link", label: "Connected Accounts", sub: "Managed through your account provider", route: null },
        { id: "add-my-business", icon: "briefcase", label: "Add My Business", sub: "Create a profile tied to your owner request", route: "/list-business?intent=owner" },
        { id: "share-another-business", icon: "share-2", label: "Share Another Business", sub: "Recommend a business without claiming ownership", route: "/list-business" },
        { id: "my-business-submissions", icon: "clock", label: "My Business Submissions", sub: "Review status and information requests", route: "/my-business-submissions" },
      ],
    },
    {
      id: "app",
      title: "App Settings",
      summary: "Kinfolk, notifications, privacy, safety, and appearance",
      rows: [
        { id: "kinfolk", icon: "message-circle", label: "KinfolkAI™", sub: "Conversation mode, voice, memories, and explicit preferences", route: "/kinfolk-settings" },
        { id: "notifications", icon: "bell", label: "Notifications", sub: "Alerts and reminders", route: "/notifications-settings" },
        { id: "video-sources", icon: "play-circle", label: "Video Sources", sub: "Choose YouTube, TikTok, Twitch, Snapchat & more", route: "/social-video-preferences" },
        { id: "privacy", icon: "shield", label: "Privacy & Safety", sub: "Visibility and data", route: "/privacy" },
        { id: "safetyhub", icon: "shield", label: "Safety Hub", sub: "Check-ins, location sharing & meetup verification", route: "/safety-hub" },
        { id: "trusted-safety", icon: "users", label: "Trusted Safety Share", sub: "Share safety alerts with family — nothing else", route: "/trusted-safety-share" },
        { id: "appearance", icon: "moon", label: "Dark Mode", value: isDark ? "On" : "Off", route: null },
      ],
    },
  ];

  const handleRow = (row: Row) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    if (row.id === "appearance") {
      toggleDark();
      return;
    }
    if (row.id === "password") {
      Alert.alert("Change Password", "Your password is managed through your account provider. Use that provider's account page to update it.");
      return;
    }
    if (row.id === "connected") {
      Alert.alert("Connected Accounts", "Your connected accounts are managed through your account provider.");
      return;
    }
    if (row.route) router.push(row.route as never);
  };

  const toggleSection = (id: SectionId) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    setExpandedSection((current) => current === id ? null : id);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.back}
          accessibilityLabel="Back to profile"
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 112 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>Choose a section to manage your account or app controls.</Text>
        {sections.map((section) => {
          const expanded = expandedSection === section.id;
          return (
            <View key={section.id} style={[styles.accordion, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.accordionHeader}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${section.title} settings`}
                accessibilityState={{ expanded }}
                onPress={() => toggleSection(section.id)}
              >
                <View style={[styles.accordionIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={section.id === "account" ? "user" : "sliders"} size={18} color={colors.primary} />
                </View>
                <View style={styles.accordionContent}>
                  <Text style={[styles.accordionTitle, { color: colors.foreground }]}>{section.title}</Text>
                  <Text style={[styles.accordionSummary, { color: colors.mutedForeground }]}>{section.summary}</Text>
                </View>
                <Feather name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.mutedForeground} />
              </TouchableOpacity>

              {expanded ? (
                <View style={[styles.rows, { borderTopColor: colors.border }]}>
                  {section.rows.map((row, index) => (
                    <React.Fragment key={row.id}>
                      <TouchableOpacity
                        style={styles.row}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={row.label}
                        onPress={() => handleRow(row)}
                      >
                        <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
                          <Feather name={row.icon} size={16} color={colors.primary} />
                        </View>
                        <View style={styles.rowContent}>
                          <Text style={[styles.rowLabel, { color: colors.foreground }]}>{row.label}</Text>
                          {row.sub ? <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{row.sub}</Text> : null}
                        </View>
                        {row.value ? (
                          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{row.value}</Text>
                        ) : row.route !== null ? (
                          <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
                        ) : null}
                      </TouchableOpacity>
                      {index < section.rows.length - 1 ? <View style={[styles.separator, { backgroundColor: colors.border }]} /> : null}
                    </React.Fragment>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
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
  scroll: { paddingHorizontal: 20, gap: 14 },
  intro: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginBottom: 2 },
  accordion: { borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  accordionHeader: { minHeight: 84, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  accordionIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  accordionContent: { flex: 1 },
  accordionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  accordionSummary: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 3 },
  rows: { borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  rowValue: { fontSize: 13, fontFamily: "Inter_500Medium" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
});
