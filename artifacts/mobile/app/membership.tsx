import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

type Billing = "monthly" | "annual";
type Audience = "consumer" | "business" | "creator";

interface Plan {
  id: string;
  emoji: string;
  name: string;
  stripeKey?: string;
  tagline: string;
  badge: string | null;
  fee?: string;
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
    emoji: "👥",
    name: "Community Member",
    tagline: "Discover, connect, review, and participate.",
    badge: null,
    monthlyPrice: 0,
    annualTotal: 0,
    color: "#8B7355",
    bg: null,
    features: [
      "Search and discover businesses",
      "Interactive map",
      "Business reviews and ratings",
      "Leave reviews",
      "Neighborhood safety surveys",
      "Employer reviews",
      "Upload up to 5 travel videos",
      "Upload photos",
      "Create posts & share travel experiences",
      "Appear in destination search results",
      "Community feed",
      "Join groups",
      "RSVP to public events",
      "Save favorite businesses",
      "Basic itinerary & trip planning",
      "Report safety concerns",
      "Basic messaging",
      "Melanin Points rewards",
    ],
    cta: "Current Plan",
    ctaActive: false,
  },
  {
    id: "navigator",
    emoji: "⭐",
    name: "Community Premium",
    stripeKey: "Navigator",
    tagline: "Travel smarter, relocate confidently, and unlock AI-powered tools.",
    badge: "Recommended",
    monthlyPrice: 7.99,
    annualTotal: 79,
    color: "#3B1F0E",
    bg: "#3B1F0E",
    features: [
      "Everything in Community Member",
      "Unlimited video uploads",
      "Longer videos (up to 10 min)",
      "Featured travel guides",
      "Creator analytics — views, likes, saves",
      "AI-generated captions & hashtags",
      "Destination collections (e.g. 'My Favorites in Brazil')",
      "Creator badge on your profile",
      "Priority placement in destination searches",
      "Eligible for future creator partnerships",
      "AI-powered travel assistance (KinfolkAI)",
      "Advanced trip planning & unlimited itineraries",
      "Personalized recommendations",
      "Premium relocation insights",
      "Advanced safety alerts",
      "Priority customer support",
      "Early access to new features",
      "Exclusive member events and groups",
      "Premium discounts with participating businesses",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
];

const BUSINESS_PLANS: Plan[] = [
  {
    id: "biz_free",
    emoji: "🏢",
    name: "Community Business",
    tagline: "Get discovered.",
    badge: null,
    fee: "6% Marketplace Fee",
    monthlyPrice: 0,
    annualTotal: 0,
    color: "#8B7355",
    bg: null,
    features: [
      "Business profile",
      "Business verification eligibility",
      "Search listing",
      "Business map placement",
      "Business hours & contact information",
      "Photos",
      "Receive & respond to reviews",
      "Basic analytics",
      "Basic messaging",
      "Event creation",
      "Sell products and services",
      "Marketplace access",
    ],
    cta: "List Your Business",
    ctaActive: true,
  },
  {
    id: "growth_business",
    emoji: "🚀",
    name: "Growth Business",
    stripeKey: "Growth Business",
    tagline: "Grow your audience.",
    badge: "Recommended",
    fee: "5% Marketplace Fee",
    monthlyPrice: 29,
    annualTotal: 290,
    color: "#3B1F0E",
    bg: "#3B1F0E",
    features: [
      "Everything in Community Business",
      "Priority search placement",
      "Enhanced analytics",
      "Customer insights",
      "More photos and videos",
      "Featured events",
      "Promotional offers",
      "AI business assistant",
      "Marketing recommendations",
      "Business performance reports",
      "Advanced messaging",
      "Featured during local searches",
      "Growth badge",
    ],
    cta: "Start Free Trial",
    ctaActive: true,
  },
  {
    id: "premium_business",
    emoji: "👑",
    name: "Premium Business",
    stripeKey: "Premium Business",
    tagline: "Scale your business.",
    badge: "Full Access",
    fee: "3% Marketplace Fee",
    monthlyPrice: 79,
    annualTotal: 790,
    color: "#1A0A00",
    bg: "#1A0A00",
    features: [
      "Everything in Growth Business",
      "Highest search priority",
      "Advanced AI business tools",
      "Full analytics dashboard",
      "Competitor insights (aggregated marketplace trends)",
      "Premium promotional opportunities",
      "Featured homepage consideration",
      "Featured city placement",
      "Unlimited products and services",
      "Priority customer support",
      "Beta access to new business tools",
      "Dedicated onboarding assistance",
      "Premium badge",
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
  const [audience, setAudience] = useState<Audience>("consumer");

  const { subscription, checkoutLoading, checkoutPlanId, initiateCheckout, openPortal } = useMembership();

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
  }, [router, billing, initiateCheckout]);

  const plans = audience === "consumer" ? CONSUMER_PLANS : BUSINESS_PLANS;

  const getPrice = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return "Free";
    if (billing === "annual") {
      return `$${(plan.annualTotal / 12).toFixed(2)}/mo`;
    }
    return `$${plan.monthlyPrice.toFixed(2)}/mo`;
  };

  const isSubscribed = (plan: Plan) =>
    subscription !== null && subscription.productName === (plan.stripeKey ?? plan.name);

  const getCtaLabel = (plan: Plan) => {
    if (plan.id === "free") return plan.cta;
    if (isSubscribed(plan)) return "Manage Subscription";
    return plan.cta;
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
            Support the community & unlock premium features
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Consumer / Business / Creator toggle */}
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

      {/* Billing toggle — hidden for creator tab */}
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

      {/* Launch offer banner — consumer only */}
      {audience === "consumer" && (
        <View style={[styles.launchBanner, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F44" }]}>
          <Text style={{ fontSize: 16 }}>🎁</Text>
          <Text style={[styles.launchTxt, { color: "#2D7A4F" }]}>
            Launch Offer — 90-day free Premium trial, no credit card required
          </Text>
        </View>
      )}

      {/* Business Success Promise — business only */}
      {audience === "business" && (
        <View style={[styles.promiseCard, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}>
          <View style={styles.promiseHeader}>
            <Text style={{ fontSize: 20 }}>🤝</Text>
            <Text style={[styles.promiseTitle, { color: colors.foreground }]}>
              Business Success Promise
            </Text>
          </View>
          <Text style={[styles.promiseBody, { color: colors.mutedForeground }]}>
            Our memberships aren't designed to charge you more — they're designed to help you{" "}
            <Text style={[styles.promiseEmphasis, { color: colors.foreground }]}>earn more.</Text>
          </Text>
          <Text style={[styles.promiseBody, { color: colors.mutedForeground }]}>
            Every upgrade saves you time, attracts more customers, improves your visibility, and reduces your marketplace costs.
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Creator Program ── */}
        {audience === "creator" && (
          <>
            {/* Hero */}
            <View style={[styles.creatorHero, { backgroundColor: "#1A3B2B" }]}>
              <Text style={styles.creatorHeroEmoji}>🎥</Text>
              <Text style={styles.creatorHeroTitle}>Creator Program</Text>
              <Text style={styles.creatorHeroSub}>
                A third side of the Mapping With Melanin™ marketplace — alongside Community Members and Businesses.
              </Text>
            </View>

            {/* What creators do */}
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

            {/* Program perks */}
            <View style={[styles.creatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.creatorPerksHeader}>
                <Text style={{ fontSize: 18 }}>🏅</Text>
                <Text style={[styles.creatorCardTitle, { color: colors.foreground }]}>Selected Creators Receive</Text>
              </View>
              {[
                { icon: "✅", label: "Verified Creator badge", detail: "A trusted signal on every video and your profile." },
                { icon: "📌", label: "Featured placement", detail: "Your content surfaces first in destination searches." },
                { icon: "🎉", label: "Invitations to events", detail: "Early access and press credentials at partner events." },
                { icon: "🤝", label: "Business partnerships", detail: "Match with local businesses for collaborative content." },
                { icon: "💰", label: "Future revenue-sharing", detail: "First in line when monetization launches." },
                { icon: "📊", label: "Creator analytics", detail: "Views, likes, saves, profile visits, and follower growth." },
              ].map((p, i) => (
                <View key={i} style={styles.creatorPerkRow}>
                  <Text style={{ fontSize: 18, lineHeight: 24 }}>{p.icon}</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.creatorPerkLabel, { color: colors.foreground }]}>{p.label}</Text>
                    <Text style={[styles.creatorPerkDetail, { color: colors.mutedForeground }]}>{p.detail}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Who qualifies */}
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

            {/* Show Me the Vibe callout */}
            <View style={[styles.creatorVibeCard, { backgroundColor: "#3B1F0E" }]}>
              <Text style={{ fontSize: 22 }}>🎬</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.creatorVibeTitle}>Power the "Show Me the Vibe" feature</Text>
                <Text style={styles.creatorVibeSub}>
                  When someone searches a city or business, your videos become the first thing they see — authentic community experiences instead of polished ads.
                </Text>
              </View>
            </View>

            {/* Apply CTA */}
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

        {/* ── Standard plans ── */}
        {audience !== "creator" && plans.map((plan) => {
          const isHighlight = plan.bg !== null;
          const loading = checkoutLoading && checkoutPlanId === (plan.stripeKey ?? plan.name);
          const subscribed = isSubscribed(plan);
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
                {plan.fee && (
                  <View style={[styles.feeBadge, { backgroundColor: isHighlight ? "rgba(255,255,255,0.15)" : colors.secondary }]}>
                    <Feather name="percent" size={11} color={isHighlight ? "rgba(255,255,255,0.9)" : colors.mutedForeground} />
                    <Text style={[styles.feeBadgeTxt, { color: isHighlight ? "rgba(255,255,255,0.9)" : colors.mutedForeground }]}>
                      {plan.fee}
                    </Text>
                  </View>
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
                    backgroundColor: subscribed
                      ? (isHighlight ? "rgba(255,255,255,0.3)" : colors.secondary)
                      : (isHighlight ? "rgba(255,255,255,0.2)" : colors.muted),
                    borderWidth: isHighlight ? 1.5 : 0,
                    borderColor: isHighlight ? "rgba(255,255,255,0.4)" : "transparent",
                    opacity: (plan.id === "free" || loading) ? 0.7 : 1,
                  },
                ]}
                onPress={() => {
                  if (subscribed) { void openPortal(); return; }
                  void handleCta(plan);
                }}
                disabled={plan.id === "free" || loading}
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

        {/* Founding Business Program — business only */}
        {audience === "business" && (
          <View style={[styles.foundingCard, { backgroundColor: colors.card, borderColor: "#C9A84C" }]}>
            <View style={styles.foundingHeader}>
              <Text style={styles.foundingEmoji}>🎁</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.foundingName, { color: colors.foreground }]}>Founding Business Program</Text>
                <View style={[styles.foundingBadge, { backgroundColor: "#C9A84C22" }]}>
                  <Text style={[styles.foundingBadgeTxt, { color: "#C9A84C" }]}>First 500 verified businesses · First 6 months after launch</Text>
                </View>
              </View>
            </View>
            <View style={styles.featureList}>
              {[
                "Six months of Premium Business membership",
                "Founding Business badge on your profile",
                "Marketplace fee locked for 3 years",
                "Early access to new features",
                "Recognition as an early supporter",
                "Opportunities to be featured in launch marketing",
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={{ fontSize: 14 }}>⭐</Text>
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

        {/* Marketplace Fees table — business only */}
        {audience === "business" && (
          <View style={[styles.feeTable, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.feeTableHeader}>
              <Feather name="percent" size={15} color={colors.primary} />
              <Text style={[styles.feeTableTitle, { color: colors.foreground }]}>Marketplace Fees</Text>
            </View>
            {[
              { name: "Community Business", fee: "6%" },
              { name: "Growth Business", fee: "5%" },
              { name: "Premium Business", fee: "3%" },
            ].map((row, i) => (
              <View key={i} style={[styles.feeRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Text style={[styles.feeRowName, { color: colors.foreground }]}>{row.name}</Text>
                <Text style={[styles.feeRowVal, { color: colors.primary }]}>{row.fee}</Text>
              </View>
            ))}
            <Text style={[styles.feeNote, { color: colors.mutedForeground }]}>
              Fees apply to products and services sold through the Mapping With Melanin marketplace.
            </Text>
          </View>
        )}

        {/* Verified Business section — business only */}
        {audience === "business" && (
          <View style={[styles.verifyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.verifyHeader}>
              <Text style={{ fontSize: 20 }}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.verifyTitle, { color: colors.foreground }]}>How We Verify Businesses</Text>
                <Text style={[styles.verifySub, { color: colors.mutedForeground }]}>
                  Our verification confirms Black ownership — so the community can discover and trust with confidence.
                </Text>
              </View>
            </View>

            {[
              {
                step: "1",
                icon: "file-text" as const,
                label: "Submit your business",
                detail: "Provide your business name, category, location, and contact info when you list.",
              },
              {
                step: "2",
                icon: "check-square" as const,
                label: "Ownership documentation",
                detail: "We review proof of Black ownership — such as a business license, LLC filing, or signed attestation.",
              },
              {
                step: "3",
                icon: "users" as const,
                label: "Community signals",
                detail: "Community reviews, check-ins, and referrals from existing verified businesses add trust weight.",
              },
              {
                step: "4",
                icon: "award" as const,
                label: "Verified badge awarded",
                detail: "Once approved, your listing displays a Verified Black-Owned badge visible to every user.",
              },
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
  verifyCard: {
    borderRadius: 16, padding: 18, gap: 16, borderWidth: 1,
  },
  verifyHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  verifyTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  verifySub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  verifyStep: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  verifyStepNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  verifyStepNumTxt: { fontSize: 13, fontFamily: "Inter_700Bold" },
  verifyStepLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  verifyStepDetail: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 2 },
  verifyNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  verifyNoteTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  promiseCard: {
    marginHorizontal: 20, marginBottom: 14, padding: 16, borderRadius: 14, borderWidth: 1, gap: 10,
  },
  promiseHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  promiseTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  promiseBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  promiseEmphasis: { fontFamily: "Inter_600SemiBold" },
  feeBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, marginTop: 6,
  },
  feeBadgeTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },
  feeTable: {
    borderRadius: 16, padding: 18, gap: 0,
    borderWidth: 1,
  },
  feeTableHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  feeTableTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  feeRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12,
  },
  feeRowName: { fontSize: 14, fontFamily: "Inter_400Regular" },
  feeRowVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  feeNote: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 10, lineHeight: 18 },
  guaranteeBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    padding: 16, borderRadius: 14,
  },
  guaranteeTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  guaranteeSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  creatorHero: {
    borderRadius: 18, padding: 22, gap: 10, alignItems: "center",
  },
  creatorHeroEmoji: { fontSize: 40 },
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
