import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import { useMembership } from "@/hooks/useMembership";
import { useSubscription } from "@/lib/revenuecat";

type Billing = "monthly" | "annual";
type Audience = "consumer" | "business" | "creator";

interface Plan {
  id: string;
  icon: string;
  benefit: string;
  name: string;
  stripeKey?: string;
  rcOfferingId?: string;
  tagline: string;
  badge: string | null;
  monthlyPrice: number;
  annualTotal: number;
  color: string;
  bg: string | null;
  features: string[];
  cta: string;
  ctaActive: boolean;
  familySeatsIncluded?: number;
  aiPool?: number;
  addOnPriceCents?: number;
}

const MATCHING_PERSONAL_TIER: Record<string, string> = {
  growth_business:   "Community Builder",
  premium_business:  "Legacy Member",
  founding_business: "Legacy Member",
};

const INCLUDED_BENEFITS: Array<{ icon: string; label: string; highlight?: boolean }> = [
  { icon: "map-pin",        label: "Business Profile" },
  { icon: "user",           label: "One Matching Community Membership", highlight: true },
  { icon: "globe",          label: "FREE Website Clicks — 0% referral fee", highlight: true },
  { icon: "bar-chart-2",    label: "Analytics Dashboard" },
  { icon: "star",           label: "Community Reviews" },
  { icon: "calendar",       label: "Events" },
  { icon: "link",           label: "Website & Social Links" },
  { icon: "check-circle",   label: "Claim Your Business" },
  { icon: "heart",          label: "Show Love Recognition" },
  { icon: "message-circle", label: "Business Messaging" },
  { icon: "users",          label: "Support Local Campaigns" },
];

const MISSION_ITEMS: Array<{ icon: string; label: string }> = [
  { icon: "home",      label: "Sponsor local community events" },
  { icon: "book-open", label: "Support scholarships" },
  { icon: "briefcase", label: "Promote Black-owned businesses" },
  { icon: "map",       label: "Expand to new cities" },
  { icon: "shield",    label: "Build new safety features" },
];

const CONSUMER_PLANS: Plan[] = [
  {
    id: "explorer_free",
    icon: "compass",
    benefit: "Discover your community.",
    name: "Explorer",
    tagline: "Discover your community — always free.",
    badge: null,
    monthlyPrice: 0,
    annualTotal: 0,
    color: "#A87A40",
    bg: null,
    features: [
      "Search Black-owned businesses",
      "Browse community updates",
      "View Community Hubs",
      "Save favorites",
      "Create a profile",
      "RSVP to events",
      "Join Kinfolk Circles",
      "Access basic safety information",
      "One linked creator/business video per profile",
    ],
    cta: "Current Plan",
    ctaActive: false,
  },
  {
    id: "navigator",
    icon: "navigation",
    benefit: "Travel and explore with confidence.",
    name: "Navigator",
    stripeKey: "Navigator",
    rcOfferingId: "navigator",
    tagline: "For users who travel or explore regularly.",
    badge: "Most Popular",
    monthlyPrice: 7.99,
    annualTotal: 79.9,
    color: "#CA922B",
    bg: "#CA922B",
    familySeatsIncluded: 1,
    aiPool: 30,
    addOnPriceCents: 299,
    features: [
      "Everything in Explorer, plus:",
      "150 saved places · 20 followed topics",
      "AI trip planning — 30 requests/mo",
      "1 family seat included (+$2.99/additional)",
      "Create 1 Kinfolk Circle",
      "Daily safety digest",
      "Enhanced safety notifications",
      "Priority feature access",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
  {
    id: "trailblazer",
    icon: "globe",
    benefit: "Explore and relocate with premium tools.",
    name: "Trailblazer",
    stripeKey: "Trailblazer",
    rcOfferingId: "trailblazer",
    tagline: "For frequent travelers, relocators, and community explorers.",
    badge: null,
    monthlyPrice: 19.99,
    annualTotal: 199.9,
    color: "#1A5C35",
    bg: "#1A5C35",
    familySeatsIncluded: 1,
    aiPool: 100,
    addOnPriceCents: 399,
    features: [
      "Everything in Navigator, plus:",
      "500 saved places · 50 followed topics",
      "AI trip planning — 100 requests/mo",
      "1 family seat included (+$3.99/additional)",
      "Create 3 Kinfolk Circles",
      "Advanced relocation tools",
      "Premium city guides",
      "Early access to new features",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
  {
    id: "community_builder",
    icon: "users",
    benefit: "Lead, mentor, and grow your community.",
    name: "Community Builder",
    stripeKey: "Community Builder",
    rcOfferingId: "community_builder",
    tagline: "For mentors, creators, volunteers, and highly engaged members.",
    badge: null,
    monthlyPrice: 29.99,
    annualTotal: 299.9,
    color: "#5C3D9E",
    bg: "#5C3D9E",
    familySeatsIncluded: 1,
    aiPool: 300,
    addOnPriceCents: 499,
    features: [
      "Everything in Trailblazer, plus:",
      "Unlimited saved places and topics",
      "AI trip planning — 300 requests/mo",
      "1 family seat included (+$4.99/additional)",
      "Create up to 10 Kinfolk Circles",
      "Creator insights and mentor profile",
      "Priority profile placement",
      "Community Builder badge",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
  {
    id: "legacy_member",
    icon: "award",
    benefit: "Maximize everything — for you and your family.",
    name: "Legacy Member",
    stripeKey: "Legacy Member",
    rcOfferingId: "legacy_member",
    tagline: "For families and power users who want everything.",
    badge: "Premium",
    monthlyPrice: 79.99,
    annualTotal: 799.9,
    color: "#1A0A00",
    bg: "#1A0A00",
    familySeatsIncluded: 1,
    aiPool: -1,
    addOnPriceCents: 699,
    features: [
      "Everything above, plus:",
      "Unlimited everything — no caps",
      "Unlimited KinfolkAI — shared family pool",
      "1 family seat included (+$6.99/additional)",
      "Unlimited Kinfolk Circles",
      "Concierge-style planning",
      "Premium partner offers",
      "VIP customer support",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
];

const BUSINESS_PLANS: Plan[] = [
  {
    id: "biz_free",
    icon: "map-pin",
    benefit: "Get discovered by the community.",
    name: "Community Business",
    tagline: "Get discovered by the community — always free.",
    badge: null,
    monthlyPrice: 0,
    annualTotal: 0,
    color: "#A87A40",
    bg: null,
    features: [
      "Claim your business",
      "Business profile",
      "Website & social media links",
      "Business hours",
      "Customer reviews",
      "Respond to reviews",
      "Basic analytics",
    ],
    cta: "List Your Business",
    ctaActive: true,
  },
  {
    id: "growth_business",
    icon: "trending-up",
    benefit: "Reach more customers and grow faster.",
    name: "Growth Business",
    stripeKey: "Growth Business",
    rcOfferingId: "growth_business",
    tagline: "Designed for growing businesses.",
    badge: "Recommended",
    monthlyPrice: 29.99,
    annualTotal: 299.9,
    color: "#CA922B",
    bg: "#CA922B",
    features: [
      "Everything in Community Business, plus:",
      "Enhanced analytics",
      "Featured business opportunities",
      "Business insights",
      "AI-assisted profile recommendations",
      "Event promotion",
      "Job postings",
      "Volunteer opportunities",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
  {
    id: "premium_business",
    icon: "star",
    benefit: "Expand your reach and automate engagement.",
    name: "Premium Business",
    stripeKey: "Premium Business",
    rcOfferingId: "premium_business",
    tagline: "For businesses focused on expansion.",
    badge: "Full Access",
    monthlyPrice: 79.99,
    annualTotal: 799.9,
    color: "#1A0A00",
    bg: "#1A0A00",
    features: [
      "Everything in Growth Business, plus:",
      "Priority placement",
      "Advanced analytics",
      "Promotional campaigns",
      "Customer insights",
      "Expanded business tools",
      "AI-generated business roadmaps",
      "Additional team members",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
  {
    id: "founding_business",
    icon: "award",
    benefit: "Maximize visibility, analytics, and enterprise tools.",
    name: "Founding Business",
    stripeKey: "Founding Business",
    rcOfferingId: "founding_business",
    tagline: "Your highest-tier business membership.",
    badge: "Enterprise",
    monthlyPrice: 199.99,
    annualTotal: 1999.9,
    color: "#0A0A0A",
    bg: "#0A0A0A",
    features: [
      "Everything in Premium Business, plus:",
      "Founding Business badge",
      "National spotlight opportunities",
      "Invitation to advisory sessions",
      "Featured storytelling opportunities",
      "Advanced AI growth planning",
      "Early access to new business features",
      "Concierge onboarding and support",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
];

function RestorePurchasesButton() {
  const colors = useColors();
  const { restore, isRestoring } = useSubscription();

  const handleRestore = async () => {
    try {
      await restore();
      Alert.alert("Restored", "Your purchases have been restored successfully.");
    } catch {
      Alert.alert("Restore Failed", "Could not restore purchases. Please try again or contact support@mappingwithmelanin.com.");
    }
  };

  return (
    <TouchableOpacity
      style={{ alignItems: "center", paddingVertical: 16, marginBottom: 8 }}
      onPress={handleRestore}
      disabled={isRestoring}
      activeOpacity={0.7}
    >
      <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular" }}>
        {isRestoring ? "Restoring…" : "Restore Purchases"}
      </Text>
    </TouchableOpacity>
  );
}

export default function MembershipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [billing, setBilling] = useState<Billing>("monthly");
  const [audience, setAudience] = useState<Audience>("consumer");

  const { subscription, checkoutLoading, checkoutPlanId, initiateCheckout, openPortal } = useMembership();
  const { purchase, offerings, customerInfo, isLoading: rcLoading } = useSubscription();
  const [rcPurchasingId, setRcPurchasingId] = useState<string | null>(null);
  const activeRcProductId = customerInfo?.entitlements?.active?.["premium"]?.productIdentifier ?? "";

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleCta = useCallback(async (plan: Plan) => {
    if (!plan.ctaActive) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (plan.id === "biz_free") { router.push("/list-business"); return; }

    if (Platform.OS !== "web" && plan.rcOfferingId) {
      if (rcLoading) {
        Alert.alert("Loading", "Store products are loading. Please try again in a moment.");
        return;
      }

      const offering = offerings?.all[plan.rcOfferingId];
      const pkg = billing === "annual" ? offering?.annual : offering?.monthly;

      if (!pkg) {
        Alert.alert(
          "Unavailable",
          `The ${plan.name} plan is not currently available for purchase. Please contact support@mappingwithmelanin.com for assistance.`,
          [
            {
              text: "Contact Support",
              onPress: () => Linking.openURL("mailto:support@mappingwithmelanin.com?subject=Membership%20Plan%20Unavailable"),
            },
            { text: "Cancel", style: "cancel" },
          ],
        );
        return;
      }

      setRcPurchasingId(plan.id);
      try {
        await purchase(pkg);
        const token = await SecureStore.getItemAsync("auth_session_token");
        if (token) {
          const apiBase = process.env.EXPO_PUBLIC_DOMAIN
            ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
            : "";
          await fetch(`${apiBase}/api/revenuecat/sync`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ productIdentifier: pkg.product.identifier }),
          });
        }
        Alert.alert(
          "Welcome!",
          `Your ${plan.name} membership is now active. Thank you for supporting the community.`,
        );
      } catch (err: unknown) {
        const e = err as { userCancelled?: boolean; code?: string };
        if (!e.userCancelled && e.code !== "PURCHASE_CANCELLED") {
          Alert.alert(
            "Purchase Failed",
            "Something went wrong. Please try again or contact support@mappingwithmelanin.com.",
          );
        }
      } finally {
        setRcPurchasingId(null);
      }
      return;
    }

    const result = await initiateCheckout(plan.stripeKey ?? plan.name, billing);

    if (result === "no_auth") {
      Alert.alert(
        "Sign in required",
        "Create a free account to start your membership.",
        [
          { text: "Sign In", onPress: () => router.push("/login") },
          { text: "Cancel", style: "cancel" },
        ],
      );
    } else if (result === "no_product") {
      Alert.alert(
        "Coming Soon",
        "This plan is being set up. Join the waitlist to be first to know when it's available!",
        [
          { text: "Join Waitlist", onPress: () => router.push("/waitlist") },
          { text: "Maybe Later", style: "cancel" },
        ],
      );
    } else if (result === "error") {
      Alert.alert("Something went wrong", "Please try again in a moment.");
    }
  }, [router, billing, initiateCheckout, purchase, offerings, rcLoading]);

  const plans = audience === "consumer" ? CONSUMER_PLANS : BUSINESS_PLANS;

  const getPrice = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return "Free";
    if (billing === "annual") {
      return `$${(plan.annualTotal / 12).toFixed(2)}/mo`;
    }
    return `$${plan.monthlyPrice.toFixed(2)}/mo`;
  };

  const isSubscribed = (plan: Plan): boolean => {
    if (subscription !== null && subscription.productName === (plan.stripeKey ?? plan.name)) return true;
    if (plan.rcOfferingId && activeRcProductId.includes(plan.rcOfferingId)) return true;
    return false;
  };

  const getCtaLabel = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return plan.cta;
    if (isSubscribed(plan)) return "Manage Subscription";
    return plan.cta;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity activeOpacity={0.85}
          style={styles.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Membership</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Support the community & unlock premium features
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Audience toggle ── */}
      <View style={[styles.audienceToggle, { backgroundColor: colors.secondary }]}>
        {([
          { id: "consumer", label: "Personal", icon: "user" },
          { id: "business", label: "Business", icon: "briefcase" },
          { id: "creator", label: "Creator", icon: "film" },
        ] as { id: Audience; label: string; icon: string }[]).map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.audienceOption, audience === a.id && { backgroundColor: colors.card }]}
            onPress={() => {
              setAudience(a.id);
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
            activeOpacity={0.75}
          >
            <Feather
              name={a.icon as any}
              size={13}
              color={audience === a.id ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.audienceTxt, { color: audience === a.id ? colors.foreground : colors.mutedForeground }]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Billing toggle ── */}
      {audience !== "creator" && (
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
      )}

      {/* ── Active subscription bar ── */}
      {subscription && (
        <TouchableOpacity
          style={[styles.manageBar, { backgroundColor: colors.secondary }]}
          onPress={openPortal}
          activeOpacity={0.8}
        >
          <Feather name="credit-card" size={15} color={colors.primary} />
          <Text style={[styles.manageTxt, { color: colors.foreground }]}>
            Active: <Text style={{ fontFamily: "Inter_600SemiBold" }}>{subscription.productName ?? "Member"}</Text>
            {subscription.status === "trialing" ? " · Free trial" : ""}
          </Text>
          <Text style={[styles.manageLink, { color: colors.primary }]}>Manage →</Text>
        </TouchableOpacity>
      )}

      {/* ── Launch offer banner (consumer only) ── */}
      {audience === "consumer" && (
        <View style={[styles.launchBanner, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F44" }]}>
          <Feather name="gift" size={16} color="#2D7A4F" />
          <Text style={[styles.launchTxt, { color: "#2D7A4F" }]}>
            Launch Offer — 90-day free Premium trial, no credit card required
          </Text>
        </View>
      )}

      {/* ── ScrollView ── */}
      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Business Success Promise (scrolls with content) ── */}
        {audience === "business" && (
          <View style={[styles.promiseCard, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}>
            <View style={styles.promiseHeader}>
              <View style={[styles.promiseIconWrap, { backgroundColor: colors.primary + "18" }]}>
                <Feather name="trending-up" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.promiseTitle, { color: colors.foreground }]}>
                Business Success Promise
              </Text>
            </View>
            <Text style={[styles.promiseBody, { color: colors.mutedForeground }]}>
              Every upgrade answers one question:{" "}
              <Text style={[styles.promiseEmphasis, { color: colors.foreground }]}>why would I pay more?</Text>
            </Text>
            <Text style={[styles.promiseBody, { color: colors.mutedForeground }]}>
              Every tier is designed to help you earn more, save time, and grow your business — not just unlock more features.
            </Text>
            <TouchableOpacity
              style={[styles.guideBtn, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "0F" }]}
              onPress={() => router.push("/business-guide" as never)}
              activeOpacity={0.8}
            >
              <Feather name="book-open" size={14} color={colors.primary} />
              <Text style={[styles.guideBtnTxt, { color: colors.primary }]}>Read the Business Tier Guide</Text>
              <Feather name="arrow-right" size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Included with Every Business Membership ── */}
        {audience === "business" && (
          <View style={[styles.includedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.includedHeader}>
              <Feather name="check-circle" size={16} color={colors.primary} />
              <Text style={[styles.includedTitle, { color: colors.foreground }]}>
                Included with Every Business Membership
              </Text>
            </View>
            <Text style={[styles.includedSub, { color: colors.mutedForeground }]}>
              Before you compare tiers — here's what every business gets, regardless of plan.
            </Text>

            {/* Matching membership — prominent callout */}
            <View style={[styles.matchingCallout, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}>
              <View style={styles.matchingCalloutTop}>
                <View style={[styles.matchingIconWrap, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name="gift" size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.matchingCalloutTitle, { color: colors.foreground }]}>
                    One Matching Community Membership
                  </Text>
                  <Text style={[styles.matchingCalloutSub, { color: colors.mutedForeground }]}>
                    Your business tier is your personal tier too. Buy Growth Business, become a Community Builder — included.
                  </Text>
                </View>
              </View>
              <View style={[styles.matchingBadge, { backgroundColor: colors.primary }]}>
                <Feather name="gift" size={11} color="#FFF" />
                <Text style={styles.matchingBadgeTxt}>Included — No Extra Cost</Text>
              </View>
            </View>

            {/* Baseline benefits list */}
            <View style={styles.includedList}>
              {INCLUDED_BENEFITS.filter((b) => b.label !== "One Matching Community Membership").map((b, i) => (
                <View key={i} style={styles.includedRow}>
                  <View style={[
                    styles.includedIconWrap,
                    { backgroundColor: b.highlight ? colors.primary + "18" : colors.secondary },
                  ]}>
                    <Feather
                      name={b.icon as any}
                      size={13}
                      color={b.highlight ? colors.primary : colors.mutedForeground}
                    />
                  </View>
                  <Text style={[
                    styles.includedLabel,
                    { color: b.highlight ? colors.foreground : colors.mutedForeground },
                    b.highlight && { fontFamily: "Inter_600SemiBold" },
                  ]}>
                    {b.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Creator Program ── */}
        {audience === "creator" && (
          <>
            <View style={[styles.creatorHero, { backgroundColor: "#1A3B2B" }]}>
              <View style={[styles.creatorHeroIcon, { backgroundColor: "rgba(202,146,43,0.18)" }]}>
                <Feather name="video" size={36} color="#CA922B" />
              </View>
              <Text style={styles.creatorHeroTitle}>Creator Program</Text>
              <Text style={styles.creatorHeroSub}>
                A third side of the Mapping With Melanin™ marketplace — alongside Community Members and Businesses.
              </Text>
            </View>

            <View style={[styles.creatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.creatorCardTitle, { color: colors.foreground }]}>Why Creators Matter</Text>
              <Text style={[styles.creatorCardBody, { color: colors.mutedForeground }]}>
                Authentic community videos are what will help this platform rank in search, keep people engaged, and build the kind of trust that no marketing budget can buy.
              </Text>
              <Text style={[styles.creatorCardBody, { color: colors.mutedForeground }]}>
                We don't hide travel videos behind a paywall — community content belongs to everyone. We monetize the{" "}
                <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>tools</Text>
                , not the ability to contribute.
              </Text>
            </View>

            <View style={[styles.creatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.creatorPerksHeader}>
                <Feather name="award" size={18} color={colors.primary} />
                <Text style={[styles.creatorCardTitle, { color: colors.foreground }]}>Selected Creators Receive</Text>
              </View>
              {[
                { icon: "check-circle", label: "Verified Creator badge", detail: "A trusted signal on every video and your profile." },
                { icon: "map-pin",     label: "Featured placement",      detail: "Your content surfaces first in destination searches." },
                { icon: "calendar",    label: "Invitations to events",   detail: "Early access and press credentials at partner events." },
                { icon: "users",       label: "Business partnerships",   detail: "Match with local businesses for collaborative content." },
                { icon: "dollar-sign", label: "Future revenue-sharing",  detail: "First in line when monetization launches." },
                { icon: "bar-chart-2", label: "Creator analytics",       detail: "Views, likes, saves, profile visits, and follower growth." },
              ].map((p, i) => (
                <View key={i} style={styles.creatorPerkRow}>
                  <Feather name={p.icon as any} size={16} color={colors.primary} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.creatorPerkLabel, { color: colors.foreground }]}>{p.label}</Text>
                    <Text style={[styles.creatorPerkDetail, { color: colors.mutedForeground }]}>{p.detail}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.creatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.creatorCardTitle, { color: colors.foreground }]}>Who Qualifies</Text>
              {[
                "Share authentic travel experiences from a Black perspective",
                "Upload at least 3 videos showing real destinations, businesses, or communities",
                "Engage with the community — responses, likes, and discussions",
                "Maintain content that aligns with community standards",
              ].map((q, i) => (
                <View key={i} style={styles.creatorQualRow}>
                  <Feather name="check-circle" size={14} color={colors.primary} />
                  <Text style={[styles.creatorQualTxt, { color: colors.mutedForeground }]}>{q}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.creatorVibeCard, { backgroundColor: "#CA922B" }]}>
              <Feather name="film" size={22} color="#FFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.creatorVibeTitle}>Power the "Show Me the Vibe" feature</Text>
                <Text style={styles.creatorVibeSub}>
                  When someone searches a city or business, your videos become the first thing they see — authentic community experiences instead of polished ads.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/waitlist")}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaTxt, { color: "#fff" }]}>Apply for the Creator Program</Text>
            </TouchableOpacity>

            <Text style={[styles.creatorNote, { color: colors.mutedForeground }]}>
              The Creator Program is invite-based during our launch phase. Community Premium members are reviewed first for acceptance.
            </Text>
          </>
        )}

        {/* ── Plan cards ── */}
        {audience !== "creator" && plans.map((plan) => {
          const isHighlight = plan.bg !== null;
          const loading = (checkoutLoading && checkoutPlanId === (plan.stripeKey ?? plan.name)) || rcPurchasingId === plan.id;
          const subscribed = isSubscribed(plan);
          const matchingTier = audience === "business" ? MATCHING_PERSONAL_TIER[plan.id] : null;

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
                <View style={[styles.planBadge, { backgroundColor: plan.id === "biz_free" ? colors.secondary : "rgba(255,255,255,0.22)" }]}>
                  <Text style={[styles.planBadgeTxt, { color: isHighlight ? "#FFF" : plan.color }]}>
                    {plan.badge}
                  </Text>
                </View>
              )}

              <View style={styles.planTop}>
                <View style={styles.planNameRow}>
                  <View style={[
                    styles.planIconWrap,
                    { backgroundColor: isHighlight ? "rgba(255,255,255,0.2)" : colors.secondary },
                  ]}>
                    <Feather
                      name={plan.icon as any}
                      size={18}
                      color={isHighlight ? "#FFF" : plan.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: isHighlight ? "#FFF" : colors.foreground }]}>
                      {plan.name}
                    </Text>
                    <Text style={[styles.planBenefit, { color: isHighlight ? "rgba(255,255,255,0.8)" : colors.primary }]}>
                      {plan.benefit}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.planTagline, { color: isHighlight ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
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

              {/* Matching community membership callout — paid business plans only */}
              {audience === "business" && matchingTier && (
                <View style={[
                  styles.matchingInCard,
                  { backgroundColor: isHighlight ? "rgba(255,255,255,0.14)" : colors.primary + "10", borderColor: isHighlight ? "rgba(255,255,255,0.25)" : colors.primary + "35" },
                ]}>
                  <Feather name="gift" size={13} color={isHighlight ? "#FFF" : colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.matchingInCardLabel, { color: isHighlight ? "#FFF" : colors.foreground }]}>
                      Includes {matchingTier} membership
                    </Text>
                    <Text style={[styles.matchingInCardSub, { color: isHighlight ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
                      Your personal community membership — no extra charge
                    </Text>
                  </View>
                </View>
              )}

              {/* AI + Family seat chips (consumer paid plans only) */}
              {audience === "consumer" && plan.aiPool !== undefined && plan.aiPool !== 0 && (
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, paddingHorizontal: 2 }}>
                  <View style={{
                    flex: 1,
                    backgroundColor: isHighlight ? "rgba(255,255,255,0.14)" : "rgba(202,146,43,0.12)",
                    borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10, alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: isHighlight ? "rgba(255,255,255,0.65)" : "#CA922B", marginBottom: 2, letterSpacing: 0.4 }}>
                      KINFOLK AI
                    </Text>
                    <Text style={{ fontSize: 15, fontFamily: "Inter_800ExtraBold", color: isHighlight ? "#FFF" : colors.foreground, letterSpacing: -0.3 }}>
                      {plan.aiPool === -1 ? "Unlimited" : `${plan.aiPool}/mo`}
                    </Text>
                    <Text style={{ fontSize: 10, color: isHighlight ? "rgba(255,255,255,0.5)" : colors.mutedForeground, marginTop: 1 }}>
                      shared family pool
                    </Text>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: isHighlight ? "rgba(255,255,255,0.14)" : "rgba(26,107,74,0.1)",
                    borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10, alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: isHighlight ? "rgba(255,255,255,0.65)" : "#1A6B4A", marginBottom: 2, letterSpacing: 0.4 }}>
                      FAMILY SEAT
                    </Text>
                    <Text style={{ fontSize: 15, fontFamily: "Inter_800ExtraBold", color: isHighlight ? "#FFF" : colors.foreground, letterSpacing: -0.3 }}>
                      1 Included
                    </Text>
                    <Text style={{ fontSize: 10, color: isHighlight ? "rgba(255,255,255,0.5)" : colors.mutedForeground, marginTop: 1 }}>
                      +{plan.addOnPriceCents ? `$${(plan.addOnPriceCents / 100).toFixed(2)}/extra` : ""}
                    </Text>
                  </View>
                </View>
              )}

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
                    backgroundColor: subscribed
                      ? (isHighlight ? "rgba(255,255,255,0.3)" : colors.secondary)
                      : (isHighlight ? "rgba(255,255,255,0.2)" : colors.muted),
                    borderWidth: isHighlight ? 1.5 : 0,
                    borderColor: isHighlight ? "rgba(255,255,255,0.4)" : "transparent",
                    opacity: (!plan.ctaActive || loading) ? 0.7 : 1,
                  },
                ]}
                onPress={() => {
                  if (subscribed) {
                    if (Platform.OS !== "web" && plan.rcOfferingId) {
                      void Linking.openURL(
                        Platform.OS === "android"
                          ? "https://play.google.com/store/account/subscriptions"
                          : "https://apps.apple.com/account/subscriptions"
                      );
                    } else {
                      void openPortal();
                    }
                    return;
                  }
                  void handleCta(plan);
                }}
                disabled={!plan.ctaActive || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={isHighlight ? "#FFF" : colors.mutedForeground} />
                ) : (
                  <Text style={[styles.ctaTxt, { color: isHighlight ? "#FFF" : colors.mutedForeground }]}>
                    {getCtaLabel(plan)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* ── Founding 500 Offer ── */}
        {audience === "business" && (
          <View style={[styles.foundingCard, { backgroundColor: colors.card, borderColor: "#C9A84C" }]}>
            <View style={styles.foundingHeader}>
              <View style={[styles.foundingIconWrap, { backgroundColor: "#C9A84C22" }]}>
                <Feather name="award" size={22} color="#C9A84C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.foundingName, { color: colors.foreground }]}>Founding 500 Offer</Text>
                <View style={[styles.foundingBadge, { backgroundColor: "#C9A84C22" }]}>
                  <Text style={[styles.foundingBadgeTxt, { color: "#C9A84C" }]}>First 500 verified businesses · Exclusively during launch</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.featureTxt, { color: colors.mutedForeground, lineHeight: 20 }]}>
              Founding 500 is a launch incentive, not a tier — it's recognition for the businesses that believed in Mapping With Melanin™ from the beginning. Selected businesses receive one year of Premium Business benefits and a permanent Founding Business badge, not a discounted subscription.
            </Text>

            <View style={styles.featureList}>
              {[
                "One year of Premium Business benefits",
                "Permanent Founding Business badge on your profile",
                "Recognition inside the app and on our website",
                "Featured during the Welcome Home Tour",
                "Opportunity to be featured in documentary content",
                "Priority access to new features",
                "Help shape future platform development",
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Feather name="star" size={14} color="#C9A84C" />
                  <Text style={[styles.featureTxt, { color: colors.foreground }]}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: "#C9A84C22", borderWidth: 1.5, borderColor: "#C9A84C" }]}
              onPress={() => router.push("/list-business")}
              activeOpacity={0.8}
            >
              <Text style={[styles.ctaTxt, { color: "#C9A84C" }]}>Apply as a Founding Business</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Marketplace Fees ── */}
        {audience === "business" && (
          <View style={[styles.feeTable, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.feeTableHeader}>
              <Feather name="percent" size={15} color={colors.primary} />
              <Text style={[styles.feeTableTitle, { color: colors.foreground }]}>Marketplace Fees</Text>
            </View>
            <Text style={[styles.feeNote, { color: colors.mutedForeground }]}>
              Fees apply only when a transaction happens inside the app. Sending traffic to your own website is always free.
            </Text>

            {/* Website clicks — highlighted as FREE */}
            <View style={[styles.feeRowFree, { backgroundColor: "#1A6B4A18", borderColor: "#1A6B4A33" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <Feather name="globe" size={14} color="#1A6B4A" />
                <Text style={[styles.feeRowName, { color: colors.foreground }]}>Website clicks</Text>
              </View>
              <View style={[styles.freeChip, { backgroundColor: "#1A6B4A" }]}>
                <Text style={styles.freeChipTxt}>FREE</Text>
              </View>
            </View>

            {[
              { label: "In-app bookings",               fee: "10%" },
              { label: "Physical products (under $25)", fee: "5%"  },
              { label: "Physical products ($25+)",      fee: "10%" },
              { label: "Digital products",              fee: "10%" },
              { label: "Event tickets",                 fee: "6%"  },
              { label: "Donations (nonprofits)",        fee: "3%"  },
            ].map((row, i, arr) => (
              <View key={i} style={[styles.feeRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Text style={[styles.feeRowName, { color: colors.foreground, flex: 1 }]}>{row.label}</Text>
                <Text style={[styles.feeRowVal, { color: colors.primary }]}>{row.fee}</Text>
              </View>
            ))}

            <View style={[styles.feeDisclaimer, { backgroundColor: colors.secondary, borderRadius: 8 }]}>
              <Feather name="info" size={12} color={colors.mutedForeground} />
              <Text style={[styles.feeLegal, { color: colors.mutedForeground }]}>
                Full fee schedule and tier discounts explained in the Business Tier Guide.
              </Text>
            </View>
          </View>
        )}

        {/* ── How We Verify Businesses ── */}
        {audience === "business" && (
          <View style={[styles.verifyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.verifyHeader}>
              <View style={[styles.verifyIconWrap, { backgroundColor: colors.primary + "18" }]}>
                <Feather name="shield" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.verifyTitle, { color: colors.foreground }]}>How We Verify Businesses</Text>
                <Text style={[styles.verifySub, { color: colors.mutedForeground }]}>
                  Our verification confirms minority ownership — so the community can discover and trust with confidence.
                </Text>
              </View>
            </View>

            {[
              { step: "1", icon: "file-text" as const, label: "Submit your business",       detail: "Provide your business name, category, location, and contact info when you list." },
              { step: "2", icon: "check-square" as const, label: "Ownership documentation", detail: "We review proof of minority ownership — such as a business license, LLC filing, or signed attestation." },
              { step: "3", icon: "users" as const, label: "Community signals",              detail: "Community reviews, check-ins, and referrals from existing verified businesses add trust weight." },
              { step: "4", icon: "award" as const, label: "Verified badge awarded",         detail: "Once approved, your listing displays a Verified Black-Owned badge visible to every user." },
            ].map((s, i) => (
              <View key={i} style={styles.verifyStep}>
                <View style={[styles.verifyStepNum, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.verifyStepNumTxt, { color: colors.primary }]}>{s.step}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name={s.icon} size={13} color={colors.primary} />
                    <Text style={[styles.verifyStepLabel, { color: colors.foreground }]}>{s.label}</Text>
                  </View>
                  <Text style={[styles.verifyStepDetail, { color: colors.mutedForeground }]}>{s.detail}</Text>
                </View>
              </View>
            ))}

            <View style={[styles.verifyNote, { backgroundColor: colors.primary + "11", borderColor: colors.primary + "33" }]}>
              <Feather name="info" size={13} color={colors.primary} />
              <Text style={[styles.verifyNoteTxt, { color: colors.mutedForeground }]}>
                Verification is available at every membership tier — including Community Business (free). It's about trust, not the tier you choose.
              </Text>
            </View>
          </View>
        )}

        {/* ── Where Your Membership Goes ── */}
        {audience === "business" && (
          <View style={[styles.missionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.missionHeader}>
              <Feather name="heart" size={16} color={colors.primary} />
              <Text style={[styles.missionTitle, { color: colors.foreground }]}>
                Where Your Membership Goes
              </Text>
            </View>
            <Text style={[styles.missionSub, { color: colors.mutedForeground }]}>
              Every subscription helps us build something bigger than a directory.
            </Text>
            {MISSION_ITEMS.map((item, i) => (
              <View key={i} style={styles.missionRow}>
                <View style={[styles.missionIconWrap, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name={item.icon as any} size={14} color={colors.primary} />
                </View>
                <Text style={[styles.missionLabel, { color: colors.foreground }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Money-back guarantee ── */}
        {audience !== "creator" && (
          <View style={[styles.guaranteeBox, { backgroundColor: colors.secondary }]}>
            <Feather name="shield" size={20} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.guaranteeTitle, { color: colors.foreground }]}>
                90-day free trial + money-back guarantee
              </Text>
              <Text style={[styles.guaranteeSub, { color: colors.mutedForeground }]}>
                Cancel anytime. No questions asked. No credit card required to start.
              </Text>
            </View>
          </View>
        )}

        {Platform.OS === "ios" && (
          <RestorePurchasesButton />
        )}
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
    padding: 4, marginBottom: 12,
  },
  billingOption: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 10, borderRadius: 9,
  },
  billingTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  savingsBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  savingsTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  manageBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 20, marginBottom: 10, padding: 12, borderRadius: 12,
  },
  manageTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  manageLink: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  launchBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 20, marginBottom: 14, padding: 12, borderRadius: 12,
    borderWidth: 1,
  },
  launchTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  scroll: { paddingHorizontal: 20, gap: 16 },

  // Promise card
  promiseCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  promiseHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  promiseIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  promiseTitle: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1 },
  promiseBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  promiseEmphasis: { fontFamily: "Inter_600SemiBold" },
  guideBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginTop: 2 },
  guideBtnTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },

  // Included benefits card
  includedCard: { borderRadius: 16, padding: 18, gap: 14, borderWidth: 1 },
  includedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  includedTitle: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1 },
  includedSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: -4 },
  matchingCallout: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  matchingCalloutTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  matchingIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  matchingCalloutTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 3 },
  matchingCalloutSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  matchingBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  matchingBadgeTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  includedList: { gap: 10 },
  includedRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  includedIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  includedLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },

  // Plan cards
  planCard: { borderRadius: 20, padding: 22, gap: 18 },
  planBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  planBadgeTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  planTop: { gap: 4 },
  planNameRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  planIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  planName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  planBenefit: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  planTagline: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  planPrice: { fontSize: 30, fontFamily: "Inter_700Bold" },
  planPriceSub: { fontSize: 13, fontFamily: "Inter_400Regular" },

  // Matching tier inside plan card
  matchingInCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 10, borderWidth: 1, padding: 12 },
  matchingInCardLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  matchingInCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },

  featureList: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  featureTxt: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  ctaBtn: { alignItems: "center", paddingVertical: 15, borderRadius: 12 },
  ctaTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  // Founding 500
  foundingCard: { borderRadius: 20, padding: 22, gap: 18, borderWidth: 1.5 },
  foundingHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  foundingIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  foundingName: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 6 },
  foundingBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  foundingBadgeTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  // Fee table
  feeTable: { borderRadius: 16, padding: 18, gap: 0, borderWidth: 1 },
  feeTableHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  feeTableTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  feeNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 12 },
  feeRowFree: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 4 },
  feeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  feeRowName: { fontSize: 14, fontFamily: "Inter_400Regular" },
  feeRowVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  freeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  freeChipTxt: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#FFF", letterSpacing: 0.5 },
  feeDisclaimer: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 10, padding: 10 },
  feeLegal: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, flex: 1 },

  // Verify
  verifyCard: { borderRadius: 16, padding: 18, gap: 16, borderWidth: 1 },
  verifyHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  verifyIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  verifyTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  verifySub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  verifyStep: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  verifyStepNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 1 },
  verifyStepNumTxt: { fontSize: 13, fontFamily: "Inter_700Bold" },
  verifyStepLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  verifyStepDetail: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 2 },
  verifyNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  verifyNoteTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },

  // Mission
  missionCard: { borderRadius: 16, padding: 18, gap: 12, borderWidth: 1 },
  missionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  missionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1 },
  missionSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: -4 },
  missionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  missionIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  missionLabel: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },

  // Guarantee
  guaranteeBox: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 14 },
  guaranteeTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  guaranteeSub: { fontSize: 13, fontFamily: "Inter_400Regular" },

  // Creator
  creatorHero: { borderRadius: 18, padding: 22, gap: 10, alignItems: "center" },
  creatorHeroIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  creatorHeroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center" },
  creatorHeroSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 19 },
  creatorCard: { borderRadius: 16, padding: 18, gap: 12, borderWidth: 1 },
  creatorCardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  creatorCardBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  creatorPerksHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  creatorPerkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  creatorPerkLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  creatorPerkDetail: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  creatorQualRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  creatorQualTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  creatorVibeCard: { borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  creatorVibeTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 4 },
  creatorVibeSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", lineHeight: 17 },
  creatorNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18, marginTop: 4 },
});
