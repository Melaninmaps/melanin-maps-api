import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const SECTIONS = [
  {
    icon: "heart" as const,
    title: "Be Respectful",
    color: "#3B1F0E",
    rules: [
      "Treat every community member with dignity, regardless of background, belief, or identity.",
      "Disagree respectfully — challenge ideas, never attack people.",
      "Use inclusive language that welcomes everyone to the conversation.",
      "Avoid language that demeans, stereotypes, or marginalizes any group.",
    ],
  },
  {
    icon: "check-circle" as const,
    title: "Be Honest",
    color: "#2D7A4F",
    rules: [
      "Only review businesses you have genuinely visited — fabricated reviews harm real owners.",
      "Share accurate safety information — incorrect reports can put community members at risk.",
      "Disclose conflicts of interest (e.g. if you own or work at a business you're reviewing).",
      "Don't share misinformation, rumors, or unverified safety claims.",
    ],
  },
  {
    icon: "shield" as const,
    title: "Protect the Community",
    color: "#C9922B",
    rules: [
      "Report safety concerns accurately — this data shapes real decisions for real people.",
      "Do not share private information about other users without consent.",
      "Avoid sharing the personal details of business owners without their permission.",
      "If you see something harmful, use the Report button — don't engage or escalate.",
    ],
  },
  {
    icon: "star" as const,
    title: "Keep It Constructive",
    color: "#3B1F0E",
    rules: [
      "Write reviews that help people make informed decisions — specific details are more helpful than vague ratings.",
      "Focus on the experience, not on personal grievances unrelated to the visit.",
      "If an experience was negative, explain what could have been better.",
      "Business owners are community members too — keep feedback fair and proportionate.",
    ],
  },
  {
    icon: "slash" as const,
    title: "What's Not Allowed",
    color: "#DC2626",
    rules: [
      "Harassment, threats, hate speech, or discrimination of any kind.",
      "Spam, promotional content, or paid reviews without disclosure.",
      "Impersonating another user, business, or community figure.",
      "Sharing illegal content, inciting violence, or coordinating harmful activity.",
      "Manipulating safety scores or business ratings through fake submissions.",
    ],
  },
];

export default function CommunityGuidelinesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community Guidelines</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={[styles.introIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="users" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.introTitle, { color: colors.foreground }]}>Our Community Standards</Text>
          <Text style={[styles.introBody, { color: colors.mutedForeground }]}>
            Mapping with Melanin™ connects people to trusted businesses, meaningful relationships, and thriving communities through the power of shared experiences. These guidelines protect that mission.
          </Text>
          <Text style={[styles.introUpdate, { color: colors.mutedForeground }]}>Last updated: June 2026</Text>
        </View>

        {SECTIONS.map((sec) => (
          <View key={sec.title} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: sec.color + "15" }]}>
                <Feather name={sec.icon} size={18} color={sec.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{sec.title}</Text>
            </View>
            <View style={{ gap: 10 }}>
              {sec.rules.map((rule, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={[styles.ruleDot, { backgroundColor: sec.color }]} />
                  <Text style={[styles.ruleTxt, { color: colors.foreground }]}>{rule}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={[styles.footerCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="flag" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.footerTitle, { color: colors.foreground }]}>See a Violation?</Text>
            <Text style={[styles.footerBody, { color: colors.mutedForeground }]}>
              Use the Report button on any business, review, or post. Our moderation team reviews all reports within 24 hours.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  scroll: { padding: 20, gap: 16 },
  intro: { alignItems: "center", gap: 10, paddingBottom: 8 },
  introIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  introTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  introBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  introUpdate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  ruleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ruleDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  ruleTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  footerCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  footerTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  footerBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
