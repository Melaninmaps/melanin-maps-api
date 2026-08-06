import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const PRINCIPLES = [
  {
    icon: "users" as const,
    title: "Community-Powered, Not Algorithm-Driven",
    body: "Every safety score on Mapping with Melanin comes from real people who visited real places. We don't infer safety from crime statistics, census data, or third-party databases — all of which carry systemic bias. Safety here means how it actually felt to be there, as a minority, in that space.",
    color: "#CA922B",
  },
  {
    icon: "eye-off" as const,
    title: "Anonymity by Design",
    body: "All safety surveys and incident reports are submitted anonymously. Your name, profile, and location are never attached to a safety report. We designed this deliberately — we know that fear of retaliation can silence the most important voices.",
    color: "#2D7A4F",
  },
  {
    icon: "trending-up" as const,
    title: "Weighted, Not Simple",
    body: "Safety scores aren't simple averages. Nighttime safety is weighted more heavily than daytime (40% vs 30%) because after-dark experiences carry disproportionate risk. Return-alone intent accounts for 35% of a business safety score because that single question captures a lot.",
    color: "#C9922B",
  },
  {
    icon: "alert-triangle" as const,
    title: "Incident Reporting Is Serious",
    body: "When a community member reports a racial profiling incident, harassment, or police involvement at a business or in a neighborhood, that data is flagged, reviewed, and weighted more heavily in our safety model. We don't hide negative data to protect business interests.",
    color: "#DC2626",
  },
  {
    icon: "lock" as const,
    title: "No Surveillance, No Profiling",
    body: "We will never use Mapping with Melanin data to profile communities, share location data with emergency services, or allow businesses to identify individual reviewers. Our data is for the community — not about it.",
    color: "#CA922B",
  },
  {
    icon: "bar-chart-2" as const,
    title: "Transparency in Scoring",
    body: "Every score has a confidence indicator based on sample size. A business with 3 ratings shows a lower confidence badge than one with 300. We show you how many responses each score is based on so you can judge the data yourself.",
    color: "#2D7A4F",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Community surveys", desc: "Users complete safety surveys after visiting businesses or neighborhoods" },
  { step: "2", title: "Weighted scoring", desc: "Responses are weighted by recency, visit type, and question weight" },
  { step: "3", title: "Aggregation", desc: "Scores are aggregated and updated in real time as new surveys come in" },
  { step: "4", title: "Confidence badge", desc: "A confidence score reflects sample size — more responses = higher confidence" },
];

export default function SafetyInfoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Our Safety Philosophy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroBanner, { backgroundColor: colors.primary }]}>
          <Feather name="shield" size={36} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroTitle}>Safety Built for Us</Text>
          <Text style={styles.heroSub}>
            Traditional safety scores weren't built with melanated travelers in mind. Mapping with Melanin is different — built by the community, for the community.
          </Text>
        </View>

        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionLabelTxt, { color: colors.foreground }]}>Our Core Principles</Text>
        </View>

        {PRINCIPLES.map((p) => (
          <View key={p.title} style={[styles.principleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.principleIcon, { backgroundColor: p.color + "15" }]}>
              <Feather name={p.icon} size={20} color={p.color} />
            </View>
            <Text style={[styles.principleTitle, { color: colors.foreground }]}>{p.title}</Text>
            <Text style={[styles.principleBody, { color: colors.mutedForeground }]}>{p.body}</Text>
          </View>
        ))}

        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionLabelTxt, { color: colors.foreground }]}>How Scores Are Calculated</Text>
        </View>

        <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {HOW_IT_WORKS.map((step, i) => (
            <View key={step.step} style={[styles.stepRow, i < HOW_IT_WORKS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
              <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumTxt}>{step.step}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
                <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.ctaCard, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.ctaTitle, { color: colors.foreground }]}>Help Build the Safety Network</Text>
          <Text style={[styles.ctaBody, { color: colors.mutedForeground }]}>
            Every survey you complete makes the community safer. Rate a neighborhood, review a business, or report an incident — your experience matters.
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
  heroBanner: { borderRadius: 20, padding: 24, alignItems: "center", gap: 12 },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF", textAlign: "center" },
  heroSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 22 },
  sectionLabel: { paddingTop: 4 },
  sectionLabelTxt: { fontSize: 18, fontFamily: "Inter_700Bold" },
  principleCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  principleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  principleTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  principleBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  stepsCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 16 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNumTxt: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFF" },
  stepTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  stepDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  ctaCard: { borderRadius: 16, padding: 18, gap: 8 },
  ctaTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  ctaBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
