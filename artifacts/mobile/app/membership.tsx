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

type Billing = "monthly" | "annual";

const PLANS = [
  {
    id: "free",
    name: "Explore",
    badge: null,
    monthlyPrice: 0,
    annualPrice: 0,
    color: "#8B7355",
    bg: "#F5EDE0",
    features: [
      "Browse Black-owned businesses",
      "Basic safety alerts",
      "Community feed (read-only)",
      "10 saved businesses",
      "Standard search filters",
    ],
    cta: "Current Plan",
    ctaActive: false,
  },
  {
    id: "pro",
    name: "Community Pro",
    badge: "Most Popular",
    monthlyPrice: 9.99,
    annualPrice: 7.99,
    color: "#C4622D",
    bg: "#C4622D",
    features: [
      "Everything in Explore",
      "Unlimited saved businesses",
      "Priority safety alerts",
      "AI travel planner",
      "Community posting & voting",
      "Early access to new features",
      "Ad-free experience",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
  {
    id: "business",
    name: "Business Pro",
    badge: "For Owners",
    monthlyPrice: 29.99,
    annualPrice: 24.99,
    color: "#2D7A4F",
    bg: "#2D7A4F",
    features: [
      "Everything in Community Pro",
      "Business dashboard & analytics",
      "Respond to reviews publicly",
      "Verified business badge",
      "Promotional spotlight listings",
      "Priority customer support",
      "Multi-location management",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
];

export default function MembershipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [billing, setBilling] = useState<Billing>("monthly");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const getPrice = (plan: (typeof PLANS)[0]) => {
    if (plan.monthlyPrice === 0) return "Free";
    const price = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
    return `$${price.toFixed(2)}/mo`;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Membership</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Support the community & unlock more</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.billingToggle, { backgroundColor: colors.secondary }]}>
        {(["monthly", "annual"] as Billing[]).map((b) => (
          <TouchableOpacity
            key={b}
            style={[
              styles.billingOption,
              billing === b && { backgroundColor: colors.card },
            ]}
            onPress={() => {
              setBilling(b);
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
            activeOpacity={0.75}
          >
            <Text style={[styles.billingTxt, { color: billing === b ? colors.foreground : colors.mutedForeground }]}>
              {b === "monthly" ? "Monthly" : "Annual"}
            </Text>
            {b === "annual" && (
              <View style={[styles.savingsBadge, { backgroundColor: colors.success }]}>
                <Text style={[styles.savingsTxt, { color: colors.successForeground }]}>Save 20%</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {PLANS.map((plan) => {
          const isHighlight = plan.id !== "free";
          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                {
                  backgroundColor: isHighlight ? plan.bg : colors.card,
                  borderColor: isHighlight ? "transparent" : colors.border,
                  borderWidth: isHighlight ? 0 : 1,
                },
              ]}
            >
              {plan.badge && (
                <View style={[styles.planBadge, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
                  <Text style={[styles.planBadgeTxt, { color: isHighlight ? "#FFF" : plan.color }]}>
                    {plan.badge}
                  </Text>
                </View>
              )}

              <View style={styles.planTop}>
                <Text style={[styles.planName, { color: isHighlight ? "#FFF" : colors.foreground }]}>
                  {plan.name}
                </Text>
                <Text style={[styles.planPrice, { color: isHighlight ? "#FFF" : colors.foreground }]}>
                  {getPrice(plan)}
                </Text>
                {billing === "annual" && plan.annualPrice > 0 && (
                  <Text style={[styles.planPriceSub, { color: isHighlight ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
                    Billed ${(plan.annualPrice * 12).toFixed(0)}/yr
                  </Text>
                )}
              </View>

              <View style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Feather
                      name="check"
                      size={15}
                      color={isHighlight ? "rgba(255,255,255,0.85)" : colors.success}
                    />
                    <Text style={[styles.featureTxt, { color: isHighlight ? "rgba(255,255,255,0.9)" : colors.foreground }]}>
                      {f}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.ctaBtn,
                  {
                    backgroundColor: isHighlight ? "rgba(255,255,255,0.2)" : colors.muted,
                    borderWidth: isHighlight ? 1.5 : 0,
                    borderColor: isHighlight ? "rgba(255,255,255,0.4)" : "transparent",
                  },
                ]}
                onPress={() => {
                  if (plan.ctaActive) {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/signup");
                  }
                }}
                disabled={!plan.ctaActive}
                activeOpacity={0.8}
              >
                <Text style={[styles.ctaTxt, { color: isHighlight ? "#FFF" : colors.mutedForeground }]}>
                  {plan.cta}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={[styles.guaranteeBox, { backgroundColor: colors.secondary }]}>
          <Feather name="shield" size={20} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.guaranteeTitle, { color: colors.foreground }]}>14-day free trial + money-back guarantee</Text>
            <Text style={[styles.guaranteeSub, { color: colors.mutedForeground }]}>
              Cancel anytime. No questions asked.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20,
    paddingBottom: 16,
  },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  billingToggle: {
    flexDirection: "row", marginHorizontal: 20, borderRadius: 12,
    padding: 4, marginBottom: 20,
  },
  billingOption: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 10, borderRadius: 9,
  },
  billingTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  savingsBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  savingsTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 20, gap: 16 },
  planCard: { borderRadius: 20, padding: 22, gap: 18 },
  planBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  planBadgeTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  planTop: { gap: 4 },
  planName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  planPrice: { fontSize: 30, fontFamily: "Inter_700Bold" },
  planPriceSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  featureList: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  featureTxt: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  ctaBtn: { alignItems: "center", paddingVertical: 15, borderRadius: 12 },
  ctaTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  guaranteeBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    padding: 16, borderRadius: 14,
  },
  guaranteeTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  guaranteeSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
