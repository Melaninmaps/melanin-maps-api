import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Linking,
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
type Audience = "consumer" | "business";

interface Plan {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  badge: string | null;
  monthlyPrice: number;
  annualTotal: number;
  color: string;
  bg: string | null;
  features: string[];
  cta: string;
  ctaActive: boolean;
}

const CONSUMER_PLANS: Plan[] = [
  {
    id: "free",
    emoji: "🧭",
    name: "Explorer",
    tagline: "For users discovering the platform",
    badge: null,
    monthlyPrice: 0,
    annualTotal: 0,
    color: "#8B7355",
    bg: null,
    features: [
      "Business search & maps",
      "Reviews & community feed",
      "Event discovery",
      "Basic recommendations",
    ],
    cta: "Current Plan",
    ctaActive: false,
  },
  {
    id: "navigator",
    emoji: "🌍",
    name: "Navigator",
    tagline: "For active users who want deeper insights",
    badge: "Most Popular",
    monthlyPrice: 7.99,
    annualTotal: 79,
    color: "#3B1F0E",
    bg: "#3B1F0E",
    features: [
      "Everything in Explorer",
      "Unlimited favorites",
      "Advanced filters",
      "Enhanced safety insights",
      "Neighborhood ratings",
      "Personalized recommendations",
      "Enhanced event discovery",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
  {
    id: "trailblazer",
    emoji: "👑",
    name: "Trailblazer",
    tagline: "For power users and frequent travelers",
    badge: "All Access",
    monthlyPrice: 14.99,
    annualTotal: 149,
    color: "#1A0A00",
    bg: "#1A0A00",
    features: [
      "Everything in Navigator",
      "Cultural Compass™ AI Assistant",
      "Advanced relocation insights",
      "Premium travel itineraries",
      "Priority support",
      "Early access to new features",
      "Exclusive partner discounts",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
];

const BUSINESS_PLANS: Plan[] = [
  {
    id: "biz_free",
    emoji: "📍",
    name: "Community Listing",
    tagline: "For businesses joining the community",
    badge: null,
    monthlyPrice: 0,
    annualTotal: 0,
    color: "#8B7355",
    bg: null,
    features: [
      "Business profile & map placement",
      "Appear in search results",
      "Receive & respond to reviews",
      "Basic business information",
      "Community visibility",
    ],
    cta: "List Your Business",
    ctaActive: true,
  },
  {
    id: "growth_partner",
    emoji: "🚀",
    name: "Growth Partner",
    tagline: "For growing businesses",
    badge: "Popular",
    monthlyPrice: 24.99,
    annualTotal: 249,
    color: "#3B1F0E",
    bg: "#3B1F0E",
    features: [
      "Everything in Community Listing",
      "Verification eligibility",
      "Enhanced profile & more photos",
      "Business analytics",
      "Event creation",
      "Promotional offers",
      "Referral tracking",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
  {
    id: "community_leader",
    emoji: "⭐",
    name: "Community Leader",
    tagline: "For established businesses",
    badge: "Best Value",
    monthlyPrice: 69.99,
    annualTotal: 699,
    color: "#2D7A4F",
    bg: "#2D7A4F",
    features: [
      "Everything in Growth Partner",
      "Featured placement",
      "Enhanced analytics",
      "Lead generation tools",
      "Advanced promotions",
      "Priority support",
      "Additional admin users",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
  {
    id: "legacy_partner",
    emoji: "🏆",
    name: "Legacy Partner",
    tagline: "For organizations, franchises & multi-location businesses",
    badge: "Full Suite",
    monthlyPrice: 199.99,
    annualTotal: 1999,
    color: "#1A0A00",
    bg: "#1A0A00",
    features: [
      "Everything in Community Leader",
      "Multi-location management",
      "Advanced reporting",
      "Sponsorship opportunities",
      "Dedicated support",
      "Custom campaigns",
      "API integrations (coming soon)",
    ],
    cta: "Contact Sales",
    ctaActive: true,
  },
];

export default function MembershipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [billing, setBilling] = useState<Billing>("monthly");
  const [audience, setAudience] = useState<Audience>("consumer");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleCta = useCallback(async (plan: Plan) => {
    if (!plan.ctaActive) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (plan.id === "free") return;
    if (plan.id === "biz_free") { router.push("/list-business"); return; }
    if (plan.id === "legacy_partner") {
      await Linking.openURL("mailto:sales@melaninmaps.app?subject=Legacy%20Partner%20Plan%20Inquiry%20%E2%80%94%20Mapping%20with%20Melanin");
      return;
    }
    Alert.alert(
      "Coming Soon 🎉",
      "Paid memberships are launching very soon! Join the waitlist to be first to know.",
      [
        { text: "Join Waitlist", onPress: () => router.push("/waitlist") },
        { text: "Maybe Later", style: "cancel" },
      ],
    );
  }, [router]);

  const plans = audience === "consumer" ? CONSUMER_PLANS : BUSINESS_PLANS;

  const getPrice = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return "Free";
    if (billing === "annual") {
      return `$${(plan.annualTotal / 12).toFixed(2)}/mo`;
    }
    return `$${plan.monthlyPrice.toFixed(2)}/mo`;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Membership</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Support the community & unlock more
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Consumer / Business toggle */}
      <View style={[styles.audienceToggle, { backgroundColor: colors.secondary }]}>
        {(["consumer", "business"] as Audience[]).map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.audienceOption, audience === a && { backgroundColor: colors.card }]}
            onPress={() => {
              setAudience(a);
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
            activeOpacity={0.75}
          >
            <Feather
              name={a === "consumer" ? "user" : "briefcase"}
              size={14}
              color={audience === a ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.audienceTxt, { color: audience === a ? colors.foreground : colors.mutedForeground }]}>
              {a === "consumer" ? "Personal" : "Business"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Billing toggle */}
      <View style={[styles.billingToggle, { backgroundColor: colors.secondary }]}>
        {(["monthly", "annual"] as Billing[]).map((b) => (
          <TouchableOpacity
            key={b}
            style={[styles.billingOption, billing === b && { backgroundColor: colors.card }]}
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
                <Text style={[styles.savingsTxt, { color: colors.successForeground }]}>Save 17%</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {plans.map((plan) => {
          const isHighlight = plan.bg !== null;
          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                {
                  backgroundColor: isHighlight ? plan.bg! : colors.card,
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
                <View style={styles.planNameRow}>
                  <Text style={styles.planEmoji}>{plan.emoji}</Text>
                  <Text style={[styles.planName, { color: isHighlight ? "#FFF" : colors.foreground }]}>
                    {plan.name}
                  </Text>
                </View>
                <Text style={[styles.planTagline, { color: isHighlight ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>
                  {plan.tagline}
                </Text>
                <Text style={[styles.planPrice, { color: isHighlight ? "#FFF" : colors.foreground }]}>
                  {getPrice(plan)}
                </Text>
                {billing === "annual" && plan.annualTotal > 0 && (
                  <Text style={[styles.planPriceSub, { color: isHighlight ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
                    Billed ${plan.annualTotal.toFixed(0)}/yr
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
                    opacity: 1,
                  },
                ]}
                onPress={() => { void handleCta(plan); }}
                disabled={plan.id === "free"}
                activeOpacity={0.8}
              >
                <Text style={[styles.ctaTxt, { color: isHighlight ? "#FFF" : colors.mutedForeground }]}>
                  {plan.id === "free" ? plan.cta : "Coming Soon"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Founding Partner — business only */}
        {audience === "business" && (
          <View style={[styles.foundingCard, { backgroundColor: colors.card, borderColor: "#C9A84C" }]}>
            <View style={styles.foundingHeader}>
              <Text style={styles.foundingEmoji}>🌟</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.foundingName, { color: colors.foreground }]}>Founding Partner</Text>
                <View style={[styles.foundingBadge, { backgroundColor: "#C9A84C22" }]}>
                  <Text style={[styles.foundingBadgeTxt, { color: "#C9A84C" }]}>Invite Only · First Year Free</Text>
                </View>
              </View>
            </View>
            <View style={styles.featureList}>
              {[
                "Growth Partner features free for 12 months",
                "Founding Partner badge on your profile",
                "Early access to new platform features",
                "Help shape the platform direction",
                "Refer up to 20 users for premium benefits",
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Feather name="star" size={14} color="#C9A84C" />
                  <Text style={[styles.featureTxt, { color: colors.foreground }]}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: "#C9A84C22", borderWidth: 1.5, borderColor: "#C9A84C" }]}
              onPress={() => router.push("/waitlist")}
              activeOpacity={0.8}
            >
              <Text style={[styles.ctaTxt, { color: "#C9A84C" }]}>Join the Waitlist</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.guaranteeBox, { backgroundColor: colors.secondary }]}>
          <Feather name="shield" size={20} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.guaranteeTitle, { color: colors.foreground }]}>
              14-day free trial + money-back guarantee
            </Text>
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
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  audienceToggle: {
    flexDirection: "row", marginHorizontal: 20, borderRadius: 12,
    padding: 4, marginBottom: 10,
  },
  audienceOption: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 9,
  },
  audienceTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
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
  planNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  planEmoji: { fontSize: 22 },
  planName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  planTagline: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  planPrice: { fontSize: 30, fontFamily: "Inter_700Bold" },
  planPriceSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  featureList: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  featureTxt: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  ctaBtn: { alignItems: "center", paddingVertical: 15, borderRadius: 12 },
  ctaTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  foundingCard: {
    borderRadius: 20, padding: 22, gap: 18,
    borderWidth: 1.5,
  },
  foundingHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  foundingEmoji: { fontSize: 28 },
  foundingName: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 6 },
  foundingBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  foundingBadgeTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  guaranteeBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    padding: 16, borderRadius: 14,
  },
  guaranteeTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  guaranteeSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
