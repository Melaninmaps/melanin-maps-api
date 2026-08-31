/**
 * Membership screen — SIMPLIFIED for v1.0 free release.
 * No purchase flow. Subscriptions will be introduced in v1.1.
 */
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const FREE_FEATURES = [
  { icon: "search" as const,        label: "Search & discover minority-owned businesses" },
  { icon: "map-pin" as const,       label: "Browse the community map" },
  { icon: "star" as const,          label: "Read and leave reviews" },
  { icon: "camera" as const,        label: "Upload photos" },
  { icon: "users" as const,         label: "Join Kinfolk Circles & RSVP to events" },
  { icon: "message-circle" as const, label: "Community messaging" },
  { icon: "shield" as const,        label: "Safety, neighborhood & employer surveys" },
  { icon: "heart" as const,         label: "Save businesses & community posts" },
  { icon: "cpu" as const,           label: "KinfolkAI — personalized discovery guide" },
  { icon: "book-open" as const,     label: "Cultural heritage explorer & city stories" },
  { icon: "calendar" as const,      label: "Events, meetups & community gatherings" },
  { icon: "trending-up" as const,   label: "Community reports & safety insights" },
];

export default function MembershipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.back}
          activeOpacity={0.85}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Community Membership</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <View style={[styles.heroBadge, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="users" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Mapping With Melanin™
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            A free community platform — built for the culture, by the culture.
          </Text>
          <View style={[styles.freeBadge, { backgroundColor: "#2D7A4F18" }]}>
            <Feather name="check-circle" size={14} color="#2D7A4F" />
            <Text style={[styles.freeBadgeTxt, { color: "#2D7A4F" }]}>
              All features free — no subscription required
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Everything included, free
          </Text>
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {FREE_FEATURES.map((item, i) => (
              <View
                key={i}
                style={[styles.featureRow, i < FREE_FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <View style={[styles.iconWrap, { backgroundColor: "#2D7A4F12" }]}>
                  <Feather name={item.icon} size={15} color="#2D7A4F" />
                </View>
                <Text style={[styles.featureTxt, { color: colors.foreground }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mission */}
        <View style={[styles.missionCard, { backgroundColor: colors.primary + "0A", borderColor: colors.primary + "25" }]}>
          <Feather name="heart" size={18} color={colors.primary} />
          <Text style={[styles.missionTxt, { color: colors.mutedForeground }]}>
            Mapping With Melanin is a community platform first. Every feature is free because the community&apos;s safety, connection, and prosperity shouldn&apos;t be paywalled.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700" },
  scroll: { paddingTop: 24, paddingHorizontal: 20, gap: 20 },
  hero: { borderRadius: 18, borderWidth: 1, padding: 24, alignItems: "center", gap: 10 },
  heroBadge: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  heroSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  freeBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 4 },
  freeBadgeTxt: { fontSize: 13, fontWeight: "700" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  featureCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featureTxt: { fontSize: 13, flex: 1, fontWeight: "500" },
  missionCard: { borderRadius: 14, borderWidth: 1, padding: 18, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  missionTxt: { fontSize: 13, lineHeight: 20, flex: 1 },
});
