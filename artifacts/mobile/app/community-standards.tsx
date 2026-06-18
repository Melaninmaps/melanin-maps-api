import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const STANDARDS = [
  {
    id: "reviews",
    icon: "star" as const,
    title: "Review Standards",
    color: "#3B1F0E",
    items: [
      { label: "Authenticity", body: "Reviews must reflect genuine firsthand experiences. Third-party accounts, secondhand reports, or hypothetical reviews are not permitted." },
      { label: "Specificity", body: "Effective reviews include specific details: what you ordered, when you visited, what made the experience notable. Vague one-liners help no one." },
      { label: "Proportionality", body: "A single negative interaction doesn't define an entire business. Assess the full experience fairly." },
      { label: "No incentivized reviews", body: "Accepting compensation — including discounts or free items — in exchange for a positive review is a violation and will result in removal." },
    ],
  },
  {
    id: "safety",
    icon: "shield" as const,
    title: "Safety Reporting Standards",
    color: "#2D7A4F",
    items: [
      { label: "Accuracy is everything", body: "Safety data shapes real decisions. Inaccurate or exaggerated reports harm businesses and mislead community members who depend on this information." },
      { label: "Incident categories", body: "Use the correct incident category when reporting. Racial profiling, harassment, police involvement, and property damage each have different community impacts and response protocols." },
      { label: "Anonymous but responsible", body: "Anonymity protects reporters — it doesn't protect false reports. Deliberately fabricating safety incidents is a serious violation and may result in a permanent ban." },
      { label: "Severity calibration", body: "Reserve the highest severity flags for situations involving physical danger or immediate risk. Everyday discomfort, while valid, should be noted in the tips section rather than escalated." },
    ],
  },
  {
    id: "moderation",
    icon: "eye" as const,
    title: "Moderation Framework",
    color: "#C9922B",
    items: [
      { label: "Tiered enforcement", body: "First violations result in a warning and content removal. Repeated violations lead to posting restrictions. Severe violations — harassment, threats, fraud — result in immediate suspension." },
      { label: "Business owner rights", body: "Business owners may respond to reviews but may not request removal of negative reviews unless they contain factual falsehoods or policy violations." },
      { label: "Appeal process", body: "Any user whose content is removed may appeal within 14 days via the contact form. Appeals are reviewed by a human moderator, not automated systems." },
      { label: "Transparency", body: "Moderation decisions are logged with timestamps and reason codes. Aggregate moderation data is reported quarterly in our community trust report." },
    ],
  },
  {
    id: "data",
    icon: "database" as const,
    title: "Data & Privacy Standards",
    color: "#3B1F0E",
    items: [
      { label: "Minimal collection", body: "We collect only what's necessary to provide the service: email, profile info, reviews, and survey responses. We don't sell personal data to third parties." },
      { label: "Survey anonymity", body: "All four community surveys are submitted and stored anonymously. Survey responses are aggregated before being displayed — no individual response is ever publicly attributed." },
      { label: "Right to deletion", body: "You may request deletion of your account and all associated data at any time via Settings → Privacy & Safety → Delete Account." },
      { label: "Location data", body: "GPS is used only for 'Near Me' searches and is never stored or used for profiling. You can use the app fully without enabling location services." },
    ],
  },
];

export default function CommunityStandardsScreen() {
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community Standards</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={[styles.introIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="book-open" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.introTitle, { color: colors.foreground }]}>Our Detailed Standards</Text>
          <Text style={[styles.introBody, { color: colors.mutedForeground }]}>
            These standards give specific guidance for reviews, safety reporting, moderation decisions, and how we handle your data. They complement our Community Guidelines.
          </Text>
        </View>

        {STANDARDS.map((std) => (
          <View key={std.id} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: std.color + "15" }]}>
                <Feather name={std.icon} size={18} color={std.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{std.title}</Text>
            </View>
            <View style={{ gap: 14 }}>
              {std.items.map((item) => (
                <View key={item.label} style={[styles.itemBlock, { borderLeftColor: std.color + "50" }]}>
                  <Text style={[styles.itemLabel, { color: std.color }]}>{item.label}</Text>
                  <Text style={[styles.itemBody, { color: colors.foreground }]}>{item.body}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={[styles.updateNote, { backgroundColor: colors.secondary }]}>
          <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
          <Text style={[styles.updateTxt, { color: colors.mutedForeground }]}>
            These standards are reviewed and updated quarterly. Last revision: June 2026.
          </Text>
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
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  itemBlock: { borderLeftWidth: 3, paddingLeft: 12, gap: 4 },
  itemLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  itemBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  updateNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 14, borderRadius: 12 },
  updateTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
