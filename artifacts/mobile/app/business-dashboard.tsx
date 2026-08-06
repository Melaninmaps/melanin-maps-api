import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useOwnerListings, LISTING_TYPES, type Listing, type ListingType } from "@/hooks/useListings";
import { SellerAgreementModal } from "@/components/SellerAgreementModal";
import { BusinessImprovementPlanModal } from "@/components/BusinessImprovementPlanModal";
import { BrandQuoteBanner } from "@/components/BrandQuoteBanner";
import { getDailyQuoteText } from "@/constants/brandQuotes";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface MyBusiness {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  verified?: boolean;
  blackOwned?: boolean;
  confidenceScore?: number;
  feedbackOptIn?: boolean;
  sellerAgreementAcceptedAt?: string | null;
  phone?: string | null;
  foundingBusiness?: boolean;
  foundingNumber?: number | null;
}

interface ReviewRow {
  id: string;
  rating: number;
  content: string | null;
  createdAt: string;
  userId: string;
}

interface AnalyticsSuggestion {
  priority: "high" | "medium" | "low";
  icon: string;
  title: string;
  body: string;
}

interface PostNudgeData {
  peakHours: number[];
  peakDays: string[];
  isNearPeak: boolean;
  bestTimeLabel: string;
  topDayLabel: string;
  nudgeMessage: string;
  suggestedCaption: string;
  viewsThisMonth: number;
  hasSufficientData: boolean;
}

interface AiCaptionsData {
  captions: string[];
  aiGenerated: boolean;
}

interface AnalyticsTrend {
  day: string;
  count: number;
}

interface ActionItem {
  issue: string;
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  actions: string[];
  estimatedCost: string;
  estimatedTimeline: string;
  resources?: string[];
}

interface ActionPlanData {
  summary: string;
  actionItems: ActionItem[];
  tier?: "navigator" | "trailblazer";
  _cached?: boolean;
  _cachedAt?: string;
  _generatedAt?: string;
  _dataPoints?: { reviewsAnalyzed: number; skipFeedbackIncluded: boolean };
}

interface ExpansionOpportunity {
  city: string;
  state: string;
  opportunity: string;
  marketSignal: string;
  estimatedDemand: string;
  actionSteps: string[];
}

interface ExpansionData {
  summary: string;
  opportunities: ExpansionOpportunity[];
  insights: string[];
}

interface AnalyticsData {
  tier: "navigator" | "trailblazer";
  metrics: { saves: number; reviews: number; avgRating: number; views30d: number; skipFeedbackCount: number };
  benchmarks: { peerCount: number; categoryAvgSaves: number; categoryAvgReviews: number; categoryAvgRating: number; categoryAvgViews30d: number };
  suggestions: AnalyticsSuggestion[];
  engagementScore: number;
  trend?: AnalyticsTrend[];
  savesVsPeersPct: number;
  reviewsVsPeersPct: number;
  ratingVsPeersPct: number;
  viewsVsPeersPct: number;
}

type PromotionToolType =
  | "priority_search" | "category_featured" | "city_featured" | "cultural_spotlight" | "event_featured"
  | "grand_opening" | "new_location" | "anniversary" | "product_launch" | "hiring" | "seasonal_sale"
  | "event_promo" | "community_event" | "local_cause" | "giveaway" | "launch_package" | "community_spotlight";

interface GrowthPromotion {
  id: string;
  type: PromotionToolType;
  status: string;
  targetCategory?: string | null;
  targetCity?: string | null;
  targetNeighborhood?: string | null;
  targetEvent?: string | null;
  endsAt?: string | null;
  durationDays?: number | null;
  priceUsdCents?: number | null;
  campaignLabel?: string | null;
}

interface GrowthTool {
  type: PromotionToolType;
  category: "announce" | "updates" | "events" | "visibility" | "special";
  name: string;
  description: string;
  priceCents: number;
  priceDisplay: string;
  durationDays: number;
  icon: string;
  tagline: string;
  searchLabel: string;
  highlight?: boolean;
  applicationOnly?: boolean;
}

interface GrowthEligibility {
  eligible: boolean;
  reasons: string[];
  warnings: string[];
}

interface GrowthToolsData {
  business: { id: string; name: string; category: string; city: string; verified: boolean };
  eligibility: GrowthEligibility;
  activePromotions: GrowthPromotion[];
  pendingPromotions: GrowthPromotion[];
  catalogue: GrowthTool[];
}

function useMyBusiness() {
  const [business, setBusiness] = useState<MyBusiness | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const base = getApiBase();
        if (!token || !base) { setLoading(false); return; }
        const res = await fetch(`${base}/api/businesses/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json() as { business: MyBusiness | null };
          if (data.business) {
            setBusiness(data.business);
            const rRes = await fetch(
              `${base}/api/reviews?businessId=${data.business.id}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (rRes.ok) {
              const rData = await rRes.json() as { reviews: ReviewRow[] };
              setReviews((rData.reviews ?? []).slice(0, 3));
            }
          }
        }
      } catch {}
      finally { setLoading(false); }
    };
    void load();
  }, []);

  return { business, reviews, loading };
}

const ACTIONS = [
  { id: "edit", icon: "edit-2" as const, label: "Edit Listing", color: "#442A19", route: "/business-owner/edit-profile" },
  { id: "hours", icon: "clock" as const, label: "Manage Hours", color: "#CA922B", route: null },
  { id: "reviews", icon: "star" as const, label: "All Reviews", color: "#2D7A4F", route: null },
  { id: "resolution", icon: "check-circle" as const, label: "Resolution Center", color: "#2D7A4F", route: "/resolution-center" },
  { id: "messages", icon: "message-circle" as const, label: "Messages", color: "#7B4F2E", route: "/messages" },
  { id: "verify", icon: "shield" as const, label: "Get Verified", color: "#442A19", route: "/business-verify" },
  { id: "analytics", icon: "bar-chart-2" as const, label: "Analytics", color: "#CA922B", route: null },
];

const CATEGORY_SECTION_LABELS: Record<string, { label: string; color: string }> = {
  announce:   { label: "Announce a Moment",      color: "#CA922B" },
  updates:    { label: "Business Updates",         color: "#2D7A4F" },
  events:     { label: "Events & Community",       color: "#5C3D9E" },
  visibility: { label: "Visibility Boosts",        color: "#1A5C35" },
  special:    { label: "Special Programs",         color: "#C9A84C" },
};

const DEFAULT_GROWTH_CATALOGUE: GrowthTool[] = [
  { type: "grand_opening",     category: "announce",   name: "Grand Opening",              description: "30 days of featured placement, a Grand Opening badge, and a push notification to nearby community members.",  priceCents: 9900, priceDisplay: "$99",  durationDays: 30, icon: "star",        tagline: "30 days · Badge + featured + push notification", searchLabel: "Grand Opening", highlight: true },
  { type: "new_location",      category: "announce",   name: "New Location",               description: "Announce your expansion with featured placement in your new city and a New Location badge.",                 priceCents: 7900, priceDisplay: "$79",  durationDays: 30, icon: "map-pin",     tagline: "30 days · New Location badge + city placement",  searchLabel: "New Location" },
  { type: "anniversary",       category: "announce",   name: "Milestone Anniversary",      description: "Celebrate a business anniversary or milestone with featured placement and a badge that signals longevity.",   priceCents: 4900, priceDisplay: "$49",  durationDays: 14, icon: "award",       tagline: "14 days · Anniversary badge + featured",         searchLabel: "Anniversary" },
  { type: "product_launch",    category: "updates",    name: "New Product or Service",     description: "Announce a new offering to your existing customers and new ones browsing your category.",                    priceCents: 4900, priceDisplay: "$49",  durationDays: 14, icon: "package",     tagline: "14 days · New offering badge + category boost",  searchLabel: "New" },
  { type: "hiring",            category: "updates",    name: "We're Hiring",               description: "Reach community members looking for work with a Hiring badge and job-related search placement.",             priceCents: 4900, priceDisplay: "$49",  durationDays: 30, icon: "users",       tagline: "30 days · Hiring badge + job search placement",  searchLabel: "Hiring" },
  { type: "seasonal_sale",     category: "updates",    name: "Seasonal Sale or Event",     description: "Drive traffic during a sale, holiday, or limited-time offer with featured placement.",                     priceCents: 3900, priceDisplay: "$39",  durationDays: 14, icon: "tag",         tagline: "14 days · Sale badge + featured placement",      searchLabel: "Sale" },
  { type: "event_promo",       category: "events",     name: "Promote an Event",           description: "Get your event in front of the community events feed to fill seats with engaged members.",                  priceCents: 3900, priceDisplay: "$39",  durationDays: 14, icon: "calendar",    tagline: "14 days · Front-row in the events feed",         searchLabel: "Event" },
  { type: "community_event",   category: "events",     name: "Sponsor a Community Event",  description: "Put your business behind a community event with a sponsor badge and visibility in community feeds.",       priceCents: 9900, priceDisplay: "$99",  durationDays: 30, icon: "heart",       tagline: "30 days · Sponsor badge + event spotlight",      searchLabel: "Community Sponsor" },
  { type: "local_cause",       category: "events",     name: "Support a Local Cause",      description: "Link your business to a nonprofit, scholarship, or cause and earn a Community Partner badge.",            priceCents: 4900, priceDisplay: "$49",  durationDays: 30, icon: "gift",        tagline: "30 days · Community Partner badge",              searchLabel: "Community Partner" },
  { type: "giveaway",          category: "events",     name: "Giveaway or Contest",        description: "Run a community giveaway with featured placement in the community feed.",                                   priceCents: 4900, priceDisplay: "$49",  durationDays: 30, icon: "gift",        tagline: "30 days · Giveaway badge + community feed",      searchLabel: "Giveaway" },
  { type: "priority_search",   category: "visibility", name: "Priority Search Placement",  description: "Rise to the top of search results when users look for businesses like yours.",                             priceCents: 2900, priceDisplay: "$29",  durationDays: 30, icon: "search",      tagline: "30 days · Rise higher in every relevant search", searchLabel: "Sponsored" },
  { type: "category_featured", category: "visibility", name: "Category Feature",           description: "Be the first business seen when someone browses your category.",                                            priceCents: 4900, priceDisplay: "$49",  durationDays: 30, icon: "star",        tagline: "30 days · Top spot in your category",            searchLabel: "Sponsored" },
  { type: "city_featured",     category: "visibility", name: "City & Neighborhood Feature",description: "Stand out to users searching in your city or neighborhood.",                                               priceCents: 7900, priceDisplay: "$79",  durationDays: 30, icon: "map-pin",     tagline: "30 days · Featured for local searches",          searchLabel: "Sponsored" },
  { type: "cultural_spotlight",category: "visibility", name: "Cultural Spotlight",         description: "Get elevated placement during cultural events, heritage months, and holidays.",                            priceCents: 9900, priceDisplay: "$99",  durationDays: 14, icon: "zap",         tagline: "14 days · Premium during peak moments",          searchLabel: "Featured" },
  { type: "event_featured",    category: "visibility", name: "Featured Event Listing",     description: "Promote your event to the top of the community events feed.",                                              priceCents: 3900, priceDisplay: "$39",  durationDays: 14, icon: "calendar",    tagline: "14 days · Front-row in the events feed",         searchLabel: "Featured" },
  { type: "launch_package",    category: "special",    name: "New Business Launch Package",description: "Everything a new business needs: 30 days featured, Grand Opening badge, push notification, and a social media feature.", priceCents: 9900, priceDisplay: "$99", durationDays: 30, icon: "zap", tagline: "30 days · The complete launch bundle", searchLabel: "Grand Opening", highlight: true },
  { type: "community_spotlight",category: "special",   name: "Community Spotlight",        description: "An editorial feature written by our team — your story, your journey, and what makes you a community landmark.", priceCents: 0, priceDisplay: "Free", durationDays: 30, icon: "mic", tagline: "Application-based · Editorial feature", searchLabel: "Community Story", applicationOnly: true },
];

export default function BusinessDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "insights" | "products" | "grow">("overview");
  const { business, reviews, loading } = useMyBusiness();
  const [feedbackOptIn, setFeedbackOptIn] = useState<boolean>(false);
  const [togglingFeedback, setTogglingFeedback] = useState(false);
  const [addrExpanded, setAddrExpanded] = useState(false);
  const [addrAddress, setAddrAddress] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrResult, setAddrResult] = useState<"success" | "error" | null>(null);
  const [policyExpanded, setPolicyExpanded] = useState(false);
  const [returnPolicy, setReturnPolicy] = useState("");
  const [policySaving, setPolicySaving] = useState(false);
  const [policyResult, setPolicyResult] = useState<"success" | "error" | null>(null);
  const [sellerAgreementAccepted, setSellerAgreementAccepted] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [dsSigningLoading, setDsSigningLoading] = useState(false);
  const [dsEnvelopeId, setDsEnvelopeId] = useState<string | null>(null);
  const [showImprovementModal, setShowImprovementModal] = useState(false);
  const [marketplaceTier, setMarketplaceTier] = useState<Record<string, unknown> | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<"paywall" | "error" | null>(null);
  const [nudge, setNudge] = useState<PostNudgeData | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [aiCaptions, setAiCaptions] = useState<string[]>([]);
  const [aiCaptionsLoading, setAiCaptionsLoading] = useState(false);
  const [aiCaptionsGenerated, setAiCaptionsGenerated] = useState(false);
  const [selectedCaptionIdx, setSelectedCaptionIdx] = useState(0);
  const [actionPlan, setActionPlan] = useState<ActionPlanData | null>(null);
  const [actionPlanLoading, setActionPlanLoading] = useState(false);
  const [expansionData, setExpansionData] = useState<ExpansionData | null>(null);
  const [expansionLoading, setExpansionLoading] = useState(false);
  const [growthTools, setGrowthTools] = useState<GrowthToolsData | null>(null);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [growthCheckoutLoading, setGrowthCheckoutLoading] = useState<string | null>(null);
  const [skipFeedback, setSkipFeedback] = useState<{ id: string; message: string; createdAt: string }[] | null>(null);
  const [marketInsights, setMarketInsights] = useState<{ trendingSearches: { query: string; searchCount: number; topCategory: string }[]; opportunityAlerts: { type: string; message: string; action: string; impact: string }[]; targetAudience: { ageGroups: string[]; lifestyleKeywords: string[]; topCities: string[] } | null } | null>(null);
  const [marketInsightsLoading, setMarketInsightsLoading] = useState(false);
  const [targetAudienceInput, setTargetAudienceInput] = useState("");
  const [targetAudienceSaving, setTargetAudienceSaving] = useState(false);

  // Trust Profile state
  const [trustProfileExpanded, setTrustProfileExpanded] = useState(false);
  const [trustAudienceType, setTrustAudienceType] = useState<string>("unknown");
  const [trustAgeReasons, setTrustAgeReasons] = useState<string[]>([]);
  const [trustEnvironmentTags, setTrustEnvironmentTags] = useState<string[]>([]);
  const [trustAmenityTags, setTrustAmenityTags] = useState<string[]>([]);
  const [trustProfileSaving, setTrustProfileSaving] = useState(false);
  const [trustProfileResult, setTrustProfileResult] = useState<"success" | "error" | null>(null);
  const [trustProfileLoaded, setTrustProfileLoaded] = useState(false);

  const { listings, connectStatus, loading: listingsLoading, startOnboarding, createListing, toggleActive, deleteListing } =
    useOwnerListings(business?.id ?? "");
  const [showNewListing, setShowNewListing] = useState(false);
  const [newListingType, setNewListingType] = useState<ListingType | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [savingListing, setSavingListing] = useState(false);
  const [onboarding, setOnboarding] = useState(false);

  React.useEffect(() => {
    if (business?.feedbackOptIn !== undefined) setFeedbackOptIn(business.feedbackOptIn);
  }, [business?.feedbackOptIn]);

  React.useEffect(() => {
    if ((business as any)?.returnPolicy != null) setReturnPolicy((business as any).returnPolicy as string);
  }, [(business as any)?.returnPolicy]);

  // Load Trust Profile identity data when business is available
  React.useEffect(() => {
    if (!business?.id || trustProfileLoaded) return;
    void (async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const res = await fetch(`${getApiBase()}/api/businesses/mine/identity`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        if (res.ok) {
          const d = await res.json() as { identity: { audienceType?: string; ageRestrictionReasons?: string[]; environmentTags?: string[]; amenityTags?: string[] } };
          if (d.identity.audienceType) setTrustAudienceType(d.identity.audienceType);
          if (d.identity.ageRestrictionReasons) setTrustAgeReasons(d.identity.ageRestrictionReasons);
          if (d.identity.environmentTags) setTrustEnvironmentTags(d.identity.environmentTags);
          if (d.identity.amenityTags) setTrustAmenityTags(d.identity.amenityTags);
          setTrustProfileLoaded(true);
        }
      } catch { /* non-fatal */ }
    })();
  }, [business?.id, trustProfileLoaded]);

  React.useEffect(() => {
    if (business?.sellerAgreementAcceptedAt) setSellerAgreementAccepted(true);
  }, [business?.sellerAgreementAcceptedAt]);

  // Refresh growth tools when user returns from Stripe checkout
  React.useEffect(() => {
    if (!growthCheckoutLoading) return;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      setGrowthTools(null);
      setGrowthCheckoutLoading(null);
    });
    return () => sub.remove();
  }, [growthCheckoutLoading]);

  // Poll DocuSign status when user returns to the app after signing in the browser
  React.useEffect(() => {
    if (!dsEnvelopeId) return;
    const sub = AppState.addEventListener("change", async (nextState) => {
      if (nextState !== "active") return;
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const resp = await fetch(`${getApiBase()}/api/docusign/status/${dsEnvelopeId}`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        if (!resp.ok) return;
        const data = await resp.json() as { status: string };
        if (data.status === "completed") {
          setSellerAgreementAccepted(true);
          setDsEnvelopeId(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch { /* ignore — user can refresh manually */ }
    });
    return () => sub.remove();
  }, [dsEnvelopeId]);

  React.useEffect(() => {
    if (!business) return;
    setFeeLoading(true);
    setFeeError(false);
    void (async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const base = getApiBase();
        if (!token || !base) { setFeeLoading(false); return; }
        const res = await fetch(`${base}/api/marketplace-fees/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json() as {
            fee: number; feePercent: string; source: string; reason: string;
            tier: string; tierLabel: string; isLocked: boolean;
            lockedUntil: string | null; promotionEligible: boolean;
            promotionExpirationDate: string | null; membershipRenewalDate: string | null;
          };
          setMarketplaceTier(data as unknown as Record<string, unknown>);
        } else {
          setFeeError(true);
        }
      } catch {
        setFeeError(true);
      } finally {
        setFeeLoading(false);
      }
    })();
  }, [business?.id]);

  React.useEffect(() => {
    if (business && !addrExpanded) {
      setAddrAddress((business as any).address ?? "");
      setAddrCity(business.city ?? "");
      setAddrState(business.state ?? "");
    }
  }, [business?.id]);

  React.useEffect(() => {
    if (!business) return;
    void (async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const base = getApiBase();
        if (!token || !base) return;
        const res = await fetch(`${base}/api/businesses/mine/post-nudge`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setNudge(await res.json() as PostNudgeData);
      } catch {}
    })();
  }, [business?.id]);

  const loadAnalytics = useCallback(async () => {
    if (analyticsLoading || analytics) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      if (!token || !base) { setAnalyticsError("error"); return; }
      const res = await fetch(`${base}/api/businesses/mine/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) { setAnalyticsError("paywall"); return; }
      if (!res.ok) { setAnalyticsError("error"); return; }
      const data = await res.json() as AnalyticsData;
      setAnalytics(data);
      fetch(`${base}/api/kinfolk/skip-feedback`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((d: { feedback?: { id: string; message: string; createdAt: string }[] } | null) => { if (d?.feedback) setSkipFeedback(d.feedback); })
        .catch(() => {});
      // Load cached AI plan alongside analytics (fire-and-forget)
      if (business?.id) {
        fetch(`${base}/api/kinfolk/business-action-plan/${business.id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.ok ? r.json() : null)
          .then((d: { plan: ActionPlanData | null } | null) => { if (d?.plan && !actionPlan) setActionPlan(d.plan); })
          .catch(() => {});

        // Load market insights (AI Marketing Manager)
        if (!marketInsights && !marketInsightsLoading) {
          setMarketInsightsLoading(true);
          fetch(`${base}/api/businesses/${business.id}/market-insights`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.ok ? r.json() : null)
            .then((d: typeof marketInsights | null) => { if (d) setMarketInsights(d); })
            .catch(() => {})
            .finally(() => setMarketInsightsLoading(false));
        }
      }
    } catch { setAnalyticsError("error"); }
    finally { setAnalyticsLoading(false); }
  }, [analyticsLoading, analytics, business?.id, actionPlan]);

  const loadGrowthTools = useCallback(async () => {
    if (growthLoading || growthTools) return;
    setGrowthLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      if (!token || !base) return;
      const res = await fetch(`${base}/api/businesses/mine/growth-tools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setGrowthTools(await res.json() as GrowthToolsData);
    } catch {} finally { setGrowthLoading(false); }
  }, [growthLoading, growthTools]);

  async function startGrowthToolCheckout(type: GrowthPromotion["type"]) {
    if (growthCheckoutLoading) return;
    setGrowthCheckoutLoading(type);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      if (!token || !base) return;
      const res = await fetch(`${base}/api/businesses/mine/growth-tools/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json() as { checkoutUrl?: string; error?: string };
      if (data.checkoutUrl) {
        await Linking.openURL(data.checkoutUrl);
      } else {
        Alert.alert("Error", data.error ?? "Could not start checkout. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Could not start checkout. Check your connection and try again.");
    } finally {
      setGrowthCheckoutLoading(null);
    }
  }

  useEffect(() => {
    if (activeTab === "insights") void loadAnalytics();
    if (activeTab === "grow") void loadGrowthTools();
  }, [activeTab]);

  async function loadAiCaptions() {
    if (aiCaptionsLoading) return;
    setAiCaptionsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      if (!token || !base) return;
      const res = await fetch(`${base}/api/businesses/mine/post-nudge/captions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as AiCaptionsData;
        setAiCaptions(data.captions);
        setAiCaptionsGenerated(data.aiGenerated);
        setSelectedCaptionIdx(0);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {} finally { setAiCaptionsLoading(false); }
  }

  async function generateActionPlan() {
    if (!business || actionPlanLoading) return;
    setActionPlanLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      if (!token || !base) return;
      const res = await fetch(`${base}/api/kinfolk/business-action-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessId: business.id,
          businessName: business.name,
          businessCategory: business.category,
          businessCity: business.city,
        }),
      });
      if (res.status === 403) {
        Alert.alert("Upgrade Required", "AI Business Insights require a Navigator or Trailblazer membership.", [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/membership") },
        ]);
        return;
      }
      if (res.ok) setActionPlan(await res.json() as ActionPlanData);
    } catch {} finally { setActionPlanLoading(false); }
  }

  async function generateExpansionAnalysis() {
    if (!business || expansionLoading) return;
    setExpansionLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      if (!token || !base) return;
      const res = await fetch(`${base}/api/kinfolk/expansion-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessName: business.name,
          businessCategory: business.category,
          businessCity: business.city,
          avgRating: analytics?.metrics.avgRating,
          reviewCount: analytics?.metrics.reviews,
          savesCount: analytics?.metrics.saves,
        }),
      });
      if (res.ok) setExpansionData(await res.json() as ExpansionData);
    } catch {} finally { setExpansionLoading(false); }
  }

  async function toggleFeedbackOptIn() {
    if (togglingFeedback) return;
    setTogglingFeedback(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      if (!token || !base) return;
      const next = !feedbackOptIn;
      const res = await fetch(`${base}/api/businesses/mine/feedback-opt-in`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: next }),
      });
      if (res.ok) setFeedbackOptIn(next);
    } catch {}
    finally { setTogglingFeedback(false); }
  }

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
          <TouchableOpacity activeOpacity={0.85}
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
          >
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerBiz}>Business Dashboard</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
          <TouchableOpacity activeOpacity={0.85}
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
          >
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerBiz}>Business Dashboard</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.emptyState, { paddingBottom: bottomPad + 24 }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="briefcase" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Business Listed Yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            List your minority-owned business to access your dashboard, manage reviews, and connect with customers.
          </Text>
          <TouchableOpacity
            style={[styles.listBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/list-business")}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={18} color="#FFF" />
            <Text style={styles.listBtnText}>List Your Business</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.verifyBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/business-verify")}
            activeOpacity={0.8}
          >
            <Feather name="shield" size={16} color={colors.primary} />
            <Text style={[styles.verifyBtnText, { color: colors.primary }]}>Claim an Existing Listing</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statCards = [
    { label: "Profile Views", value: "—", change: "Data available after approval", icon: "eye" as const, color: "#442A19" },
    { label: "Saved", value: "—", change: "Data available after launch", icon: "bookmark" as const, color: "#CA922B" },
    { label: "Avg Rating", value: reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) + "★" : "—", change: `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`, icon: "star" as const, color: "#2D7A4F" },
    { label: "Messages", value: "—", change: "In development", icon: "message-circle" as const, color: "#7B4F2E" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity activeOpacity={0.85}
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
        >
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerBiz}>{business.name}</Text>
          {business.verified && (
            <View style={styles.verifyBadge}>
              <Feather name="shield" size={11} color="#FFF" />
              <Text style={styles.verifyTxt}>Verified Business</Text>
            </View>
          )}
        </View>
        <TouchableOpacity activeOpacity={0.85} style={styles.settingsBtn} onPress={() => router.push("/settings")}>
          <Feather name="settings" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["overview", "reviews", "products", "grow", "insights"] as const).map((t) => (
          <TouchableOpacity activeOpacity={0.85}
            key={t}
            style={[styles.tab, activeTab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => {
              setActiveTab(t);
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.tabTxt, { color: activeTab === t ? colors.primary : colors.mutedForeground }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && (
          <>
            <View style={styles.statsGrid}>
              {statCards.map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: s.color + "18" }]}>
                    <Feather name={s.icon} size={18} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                  <Text style={[styles.statChange, { color: s.color }]}>{s.change}</Text>
                </View>
              ))}
            </View>

            {/* ── Marketplace Fee Card ─────────────────────────────────── */}
            {feeLoading && (
              <View style={[styles.promoteCard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", justifyContent: "center", padding: 24 }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, marginTop: 8 }}>Loading marketplace rate…</Text>
              </View>
            )}
            {!feeLoading && feeError && (
              <View style={[styles.promoteCard, { backgroundColor: colors.card, borderColor: "#DC262630", padding: 16, flexDirection: "row", alignItems: "center", gap: 10 }]}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, flex: 1 }}>Unable to load marketplace rate. Pull down to refresh.</Text>
              </View>
            )}
            {!feeLoading && !feeError && marketplaceTier && (() => {
              const fee = marketplaceTier as unknown as {
                feePercent: string; source: string; reason: string;
                tierLabel: string; isLocked: boolean; lockedUntil: string | null;
                promotionEligible: boolean; promotionExpirationDate: string | null;
              };
              const sourceColor =
                fee.source === "founding_program" ? "#2D7A4F" :
                fee.source === "promotional"       ? "#C9922B" : "#442A19";
              const sourceIcon: "award" | "tag" | "grid" =
                fee.source === "founding_program" ? "award" :
                fee.source === "promotional"       ? "tag" : "grid";
              const sourceLabel =
                fee.source === "founding_program" ? "Founding Business Rate" :
                fee.source === "promotional"       ? "Promotional Rate" : "Standard Rate";
              return (
                <View style={[styles.promoteCard, { backgroundColor: colors.card, borderColor: sourceColor + "40", padding: 0, overflow: "hidden" }]}>
                  <View style={{ backgroundColor: sourceColor + "12", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: sourceColor + "20", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: sourceColor }}>{fee.feePercent}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground }}>Marketplace Fee</Text>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground }}>{fee.tierLabel} tier · applied at checkout</Text>
                    </View>
                    <View style={{ alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: sourceColor + "18", flexDirection: "row", gap: 5 }}>
                      <Feather name={sourceIcon} size={12} color={sourceColor} />
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: sourceColor }}>{sourceLabel}</Text>
                    </View>
                  </View>
                  <View style={{ padding: 14, gap: 8 }}>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, lineHeight: 18 }}>{fee.reason}</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {fee.isLocked && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: "#2D7A4F18" }}>
                          <Feather name="lock" size={11} color="#2D7A4F" />
                          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#2D7A4F" }}>
                            {fee.lockedUntil ? `Locked until ${new Date(fee.lockedUntil).toLocaleDateString()}` : "Lifetime Rate Lock"}
                          </Text>
                        </View>
                      )}
                      {!fee.isLocked && fee.source === "promotional" && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: "#C9922B18" }}>
                          <Feather name="clock" size={11} color="#C9922B" />
                          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#C9922B" }}>
                            {fee.promotionExpirationDate
                              ? `Promo expires ${new Date(fee.promotionExpirationDate).toLocaleDateString()}`
                              : "Active Promotion"}
                          </Text>
                        </View>
                      )}
                      {!fee.isLocked && fee.source === "standard" && fee.promotionEligible && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: colors.secondary }}>
                          <Feather name="zap" size={11} color={colors.mutedForeground} />
                          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.mutedForeground }}>Promo eligible</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })()}

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {ACTIONS.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    if (a.id === "hours") {
                      router.push("/business-owner/edit-profile" as never);
                    } else if (a.id === "reviews") {
                      setActiveTab("reviews");
                    } else if (a.id === "analytics") {
                      setActiveTab("insights");
                      void loadAnalytics();
                    } else if (a.route) {
                      router.push(a.route as never);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: a.color + "15" }]}>
                    <Feather name={a.icon} size={20} color={a.color} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Update Address */}
            <TouchableOpacity
              style={[styles.promoteCard, { backgroundColor: colors.card, borderColor: addrExpanded ? colors.primary + "60" : colors.border }]}
              onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setAddrExpanded(v => !v); setAddrResult(null); }}
              activeOpacity={0.85}
            >
              <View style={[styles.promoteIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="map-pin" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.promoteTitle, { color: colors.foreground }]}>Update Business Address</Text>
                <Text style={[styles.promoteSub, { color: colors.mutedForeground }]}>
                  {addrExpanded ? "Fill in the new address below" : `${business.city}, ${business.state} · tap to update`}
                </Text>
              </View>
              <Feather name={addrExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
            </TouchableOpacity>

            {addrExpanded && (
              <View style={[styles.addrForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.addrLabel, { color: colors.mutedForeground }]}>Street Address</Text>
                <TextInput
                  style={[styles.addrInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={addrAddress}
                  onChangeText={setAddrAddress}
                  placeholder="123 Main Street"
                  placeholderTextColor={colors.mutedForeground}
                />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 2 }}>
                    <Text style={[styles.addrLabel, { color: colors.mutedForeground }]}>City</Text>
                    <TextInput
                      style={[styles.addrInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      value={addrCity}
                      onChangeText={setAddrCity}
                      placeholder="Atlanta"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addrLabel, { color: colors.mutedForeground }]}>State</Text>
                    <TextInput
                      style={[styles.addrInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      value={addrState}
                      onChangeText={setAddrState}
                      placeholder="GA"
                      placeholderTextColor={colors.mutedForeground}
                      maxLength={2}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addrLabel, { color: colors.mutedForeground }]}>ZIP</Text>
                    <TextInput
                      style={[styles.addrInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      value={addrZip}
                      onChangeText={setAddrZip}
                      placeholder="30301"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                </View>

                {addrResult === "success" && (
                  <View style={[styles.addrAlert, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F40" }]}>
                    <Feather name="check-circle" size={14} color="#2D7A4F" />
                    <Text style={[styles.addrAlertText, { color: "#2D7A4F" }]}>Address updated! Savers and recent visitors have been notified.</Text>
                  </View>
                )}
                {addrResult === "error" && (
                  <View style={[styles.addrAlert, { backgroundColor: "#DC262618", borderColor: "#DC262640" }]}>
                    <Feather name="alert-circle" size={14} color="#DC2626" />
                    <Text style={[styles.addrAlertText, { color: "#DC2626" }]}>Failed to update address. Please try again.</Text>
                  </View>
                )}

                <TouchableOpacity activeOpacity={0.85}
                  style={[styles.addrSaveBtn, { backgroundColor: colors.primary, opacity: addrSaving ? 0.6 : 1 }]}
                  disabled={addrSaving}
                  onPress={async () => {
                    if (!addrAddress.trim() || !addrCity.trim() || !addrState.trim()) {
                      setAddrResult("error"); return;
                    }
                    setAddrSaving(true);
                    setAddrResult(null);
                    try {
                      const token = await SecureStore.getItemAsync("auth_session_token");
                      const base = getApiBase();
                      const res = await fetch(`${base}/api/businesses/${business.id}/address`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
                        body: JSON.stringify({ address: addrAddress.trim(), city: addrCity.trim(), state: addrState.trim(), zip: addrZip.trim() }),
                      });
                      setAddrResult(res.ok ? "success" : "error");
                      if (res.ok) setAddrExpanded(false);
                    } catch { setAddrResult("error"); }
                    finally { setAddrSaving(false); }
                  }}
                >
                  {addrSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.addrSaveBtnText}>Save & Notify</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Return & Refund Policy */}
            <TouchableOpacity
              style={[styles.promoteCard, { backgroundColor: colors.card, borderColor: policyExpanded ? colors.primary + "60" : colors.border }]}
              onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setPolicyExpanded(v => !v); setPolicyResult(null); }}
              activeOpacity={0.85}
            >
              <View style={[styles.promoteIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="refresh-ccw" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.promoteTitle, { color: colors.foreground }]}>Return & Refund Policy</Text>
                <Text style={[styles.promoteSub, { color: colors.mutedForeground }]}>
                  {policyExpanded ? "Set your policy — buyers see this before checkout" : (returnPolicy || "Not set · tap to add")}
                </Text>
              </View>
              <Feather name={policyExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
            </TouchableOpacity>

            {policyExpanded && (
              <View style={[styles.addrForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.addrLabel, { color: colors.mutedForeground }]}>
                  Describe your return/refund policy for buyers. E.g. "All sales final" or "Returns accepted within 14 days".
                </Text>
                <TextInput
                  style={[styles.addrInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, minHeight: 64, textAlignVertical: "top" }]}
                  value={returnPolicy}
                  onChangeText={setReturnPolicy}
                  placeholder="e.g. All sales final. For digital products, no refunds after download."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                />

                {policyResult === "success" && (
                  <View style={[styles.addrAlert, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F40" }]}>
                    <Feather name="check-circle" size={14} color="#2D7A4F" />
                    <Text style={[styles.addrAlertText, { color: "#2D7A4F" }]}>Policy saved. Buyers will see this before checkout.</Text>
                  </View>
                )}
                {policyResult === "error" && (
                  <View style={[styles.addrAlert, { backgroundColor: "#DC262618", borderColor: "#DC262640" }]}>
                    <Feather name="alert-circle" size={14} color="#DC2626" />
                    <Text style={[styles.addrAlertText, { color: "#DC2626" }]}>Failed to save. Please try again.</Text>
                  </View>
                )}

                <TouchableOpacity activeOpacity={0.85}
                  style={[styles.addrSaveBtn, { backgroundColor: colors.primary, opacity: policySaving ? 0.6 : 1 }]}
                  disabled={policySaving}
                  onPress={async () => {
                    setPolicySaving(true);
                    setPolicyResult(null);
                    try {
                      const token = await SecureStore.getItemAsync("auth_session_token");
                      const base = getApiBase();
                      const res = await fetch(`${base}/api/businesses/${business.id}/policy`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
                        body: JSON.stringify({ returnPolicy: returnPolicy.trim() }),
                      });
                      setPolicyResult(res.ok ? "success" : "error");
                      if (res.ok) setPolicyExpanded(false);
                    } catch { setPolicyResult("error"); }
                    finally { setPolicySaving(false); }
                  }}
                >
                  {policySaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.addrSaveBtnText}>Save Policy</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ── Trust Profile ────────────────────────────────────────── */}
            {(() => {
              const AUDIENCE_OPTIONS: { value: string; label: string; icon: string; desc: string }[] = [
                { value: "all_ages",        label: "All Ages",         icon: "users",      desc: "Welcoming to everyone" },
                { value: "family_friendly", label: "Family Friendly",  icon: "smile",      desc: "Great for kids & families" },
                { value: "teens",           label: "Teens Welcome",    icon: "user",       desc: "Safe and welcoming for teens" },
                { value: "adults_18plus",   label: "Adults 18+",       icon: "shield",     desc: "Age-restricted venue or service" },
                { value: "adults_21plus",   label: "Adults 21+",       icon: "alert-circle", desc: "Must be 21+ to enter" },
                { value: "unknown",         label: "Not sure yet",     icon: "help-circle", desc: "You can update this later" },
              ];
              const AGE_REASONS: { value: string; label: string }[] = [
                { value: "alcohol",               label: "Alcohol served" },
                { value: "cannabis",              label: "Cannabis products" },
                { value: "tobacco",               label: "Tobacco products" },
                { value: "adult_entertainment",   label: "Adult entertainment" },
                { value: "gambling",              label: "Gambling" },
                { value: "late_night",            label: "Late-night hours" },
                { value: "explicit_performances", label: "Explicit performances" },
                { value: "safety_liability",      label: "Safety or liability" },
                { value: "legal_requirement",     label: "Legal requirement" },
                { value: "other",                 label: "Other" },
              ];
              const ENV_TAGS: { value: string; label: string }[] = [
                { value: "quiet",           label: "Quiet" },
                { value: "casual",          label: "Casual" },
                { value: "family_oriented", label: "Family-oriented" },
                { value: "professional",    label: "Professional" },
                { value: "romantic",        label: "Romantic" },
                { value: "nightlife",       label: "Nightlife" },
                { value: "educational",     label: "Educational" },
                { value: "cultural",        label: "Cultural" },
                { value: "outdoor",         label: "Outdoor" },
                { value: "high_energy",     label: "High energy" },
                { value: "luxury",          label: "Luxury" },
                { value: "budget_friendly", label: "Budget-friendly" },
              ];
              const AMENITY_TAGS: { value: string; label: string }[] = [
                { value: "wifi",                    label: "Free WiFi" },
                { value: "outdoor_seating",         label: "Outdoor seating" },
                { value: "parking",                 label: "Parking" },
                { value: "kid_friendly_menu",       label: "Kid-friendly menu" },
                { value: "vegan_options",           label: "Vegan options" },
                { value: "pet_friendly",            label: "Pet friendly" },
                { value: "live_music",              label: "Live music" },
                { value: "gender_neutral_restrooms",label: "Gender-neutral restrooms" },
                { value: "wheelchair_accessible",   label: "Wheelchair accessible" },
                { value: "service_animals",         label: "Service animals welcome" },
                { value: "sensory_friendly",        label: "Sensory-friendly space" },
              ];
              const needsAgeReasons = trustAudienceType === "adults_18plus" || trustAudienceType === "adults_21plus";
              const currentAudience = AUDIENCE_OPTIONS.find(o => o.value === trustAudienceType);

              const handleSave = async () => {
                if (!business?.id) return;
                setTrustProfileSaving(true);
                setTrustProfileResult(null);
                try {
                  const token = await SecureStore.getItemAsync("auth_session_token");
                  const res = await fetch(`${getApiBase()}/api/businesses/mine/identity`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      audienceType: trustAudienceType,
                      ageRestrictionReasons: needsAgeReasons ? trustAgeReasons : [],
                      environmentTags: trustEnvironmentTags,
                      amenityTags: trustAmenityTags,
                    }),
                  });
                  setTrustProfileResult(res.ok ? "success" : "error");
                  if (res.ok) setTrustProfileExpanded(false);
                } catch { setTrustProfileResult("error"); }
                finally { setTrustProfileSaving(false); }
              };

              return (
                <>
                  <TouchableOpacity
                    style={[styles.promoteCard, { backgroundColor: colors.card, borderColor: trustProfileExpanded ? "#2D7A4F60" : colors.border }]}
                    onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setTrustProfileExpanded(v => !v); setTrustProfileResult(null); }}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.promoteIcon, { backgroundColor: "#2D7A4F15" }]}>
                      <Feather name="shield" size={20} color="#2D7A4F" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.promoteTitle, { color: colors.foreground }]}>Trust Profile</Text>
                      <Text style={[styles.promoteSub, { color: colors.mutedForeground }]}>
                        {currentAudience && currentAudience.value !== "unknown"
                          ? `${currentAudience.label} · ${trustEnvironmentTags.length + trustAmenityTags.length} tags set`
                          : "Set audience type, environment, and amenities"}
                      </Text>
                    </View>
                    <Feather name={trustProfileExpanded ? "chevron-up" : "chevron-down"} size={16} color="#2D7A4F" />
                  </TouchableOpacity>

                  {trustProfileExpanded && (
                    <View style={[styles.addrForm, { backgroundColor: colors.card, borderColor: "#2D7A4F40", gap: 20 }]}>

                      {/* Audience Type */}
                      <View>
                        <Text style={[styles.formLabel, { color: colors.foreground, marginTop: 0, marginBottom: 4, fontSize: 13 }]}>
                          Who is this business for?
                        </Text>
                        <Text style={[styles.addrLabel, { color: colors.mutedForeground, marginBottom: 10 }]}>
                          Select the audience type. This appears on your public profile.
                        </Text>
                        <View style={{ gap: 6 }}>
                          {AUDIENCE_OPTIONS.map(opt => (
                            <TouchableOpacity
                              key={opt.value}
                              onPress={() => { setTrustAudienceType(opt.value); if (!["adults_18plus","adults_21plus"].includes(opt.value)) setTrustAgeReasons([]); }}
                              style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, borderColor: trustAudienceType === opt.value ? "#2D7A4F" : colors.border, backgroundColor: trustAudienceType === opt.value ? "#2D7A4F10" : "transparent" }}
                              activeOpacity={0.75}
                            >
                              <Feather name={opt.icon as "users"} size={15} color={trustAudienceType === opt.value ? "#2D7A4F" : colors.mutedForeground} />
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: trustAudienceType === opt.value ? "#2D7A4F" : colors.foreground }}>{opt.label}</Text>
                                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground }}>{opt.desc}</Text>
                              </View>
                              {trustAudienceType === opt.value && <Feather name="check" size={14} color="#2D7A4F" />}
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Age Restriction Reasons — only when 18+ or 21+ selected */}
                      {needsAgeReasons && (
                        <View>
                          <Text style={[styles.formLabel, { color: colors.foreground, marginTop: 0, marginBottom: 4, fontSize: 13 }]}>
                            Reason for age restriction <Text style={{ color: "#CA922B", fontFamily: "Inter_400Regular" }}>(optional)</Text>
                          </Text>
                          <Text style={[styles.addrLabel, { color: colors.mutedForeground, marginBottom: 10 }]}>
                            Helps the community understand what to expect.
                          </Text>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
                            {AGE_REASONS.map(r => {
                              const active = trustAgeReasons.includes(r.value);
                              return (
                                <TouchableOpacity
                                  key={r.value}
                                  onPress={() => setTrustAgeReasons(prev => active ? prev.filter(v => v !== r.value) : [...prev, r.value])}
                                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: active ? "#CA922B" : colors.border, backgroundColor: active ? "#CA922B12" : "transparent" }}
                                  activeOpacity={0.75}
                                >
                                  <Text style={{ fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular", fontSize: 12, color: active ? "#CA922B" : colors.mutedForeground }}>{r.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      {/* Environment Tags */}
                      <View>
                        <Text style={[styles.formLabel, { color: colors.foreground, marginTop: 0, marginBottom: 4, fontSize: 13 }]}>
                          Environment <Text style={{ color: "#CA922B", fontFamily: "Inter_400Regular" }}>(pick up to 4)</Text>
                        </Text>
                        <Text style={[styles.addrLabel, { color: colors.mutedForeground, marginBottom: 10 }]}>
                          Describe the atmosphere and setting of your business.
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
                          {ENV_TAGS.map(t => {
                            const active = trustEnvironmentTags.includes(t.value);
                            const atMax = trustEnvironmentTags.length >= 4 && !active;
                            return (
                              <TouchableOpacity
                                key={t.value}
                                onPress={() => { if (atMax) return; setTrustEnvironmentTags(prev => active ? prev.filter(v => v !== t.value) : [...prev, t.value]); }}
                                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "15" : "transparent", opacity: atMax ? 0.45 : 1 }}
                                activeOpacity={0.75}
                              >
                                <Text style={{ fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular", fontSize: 12, color: active ? colors.primary : colors.mutedForeground }}>{t.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Amenity Tags */}
                      <View>
                        <Text style={[styles.formLabel, { color: colors.foreground, marginTop: 0, marginBottom: 4, fontSize: 13 }]}>
                          Amenities <Text style={{ color: "#CA922B", fontFamily: "Inter_400Regular" }}>(select all that apply)</Text>
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
                          {AMENITY_TAGS.map(t => {
                            const active = trustAmenityTags.includes(t.value);
                            return (
                              <TouchableOpacity
                                key={t.value}
                                onPress={() => setTrustAmenityTags(prev => active ? prev.filter(v => v !== t.value) : [...prev, t.value])}
                                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "15" : "transparent" }}
                                activeOpacity={0.75}
                              >
                                <Text style={{ fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular", fontSize: 12, color: active ? colors.primary : colors.mutedForeground }}>{t.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Save feedback */}
                      {trustProfileResult === "success" && (
                        <View style={[styles.addrAlert, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F40" }]}>
                          <Feather name="check-circle" size={14} color="#2D7A4F" />
                          <Text style={[styles.addrAlertText, { color: "#2D7A4F" }]}>Trust Profile saved. Changes are now visible on your listing.</Text>
                        </View>
                      )}
                      {trustProfileResult === "error" && (
                        <View style={[styles.addrAlert, { backgroundColor: "#DC262618", borderColor: "#DC262640" }]}>
                          <Feather name="alert-circle" size={14} color="#DC2626" />
                          <Text style={[styles.addrAlertText, { color: "#DC2626" }]}>Failed to save. Please try again.</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        onPress={handleSave}
                        disabled={trustProfileSaving}
                        style={[styles.addrSaveBtn, { backgroundColor: "#2D7A4F", opacity: trustProfileSaving ? 0.6 : 1 }]}
                        activeOpacity={0.85}
                      >
                        {trustProfileSaving
                          ? <ActivityIndicator size="small" color="#FFF" />
                          : <Text style={styles.addrSaveBtnText}>Save Trust Profile</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              );
            })()}

            {/* Growth tools teaser — directs to Grow tab */}
            <TouchableOpacity
              style={[styles.promoteCard, { backgroundColor: "#0F1F18", borderColor: "#2D7A4F50" }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setActiveTab("grow");
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.promoteIcon, { backgroundColor: "#2D7A4F20" }]}>
                <Feather name="trending-up" size={20} color="#2D7A4F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.promoteTitle, { color: "#FFF" }]}>Growth Tools</Text>
                <Text style={[styles.promoteSub, { color: "rgba(255,255,255,0.55)" }]}>
                  Priority search, featured placement, AI tools & more — tap to explore.
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#2D7A4F" />
            </TouchableOpacity>

            {/* KinfolkAI post nudge */}
            {nudge && !nudgeDismissed && (
              <View style={[styles.nudgeCard, {
                backgroundColor: nudge.isNearPeak ? "#0F1F0F" : colors.card,
                borderColor: nudge.isNearPeak ? "#2D7A4F" : colors.border,
              }]}>
                <View style={styles.nudgeTop}>
                  <View style={[styles.nudgeBadge, { backgroundColor: nudge.isNearPeak ? "#2D7A4F" : "#CA922B" }]}>
                    <Feather name="zap" size={11} color="#FFF" />
                    <Text style={styles.nudgeBadgeText}>KinfolkAI™</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setNudgeDismissed(true)} hitSlop={8}>
                    <Feather name="x" size={16} color={nudge.isNearPeak ? "rgba(255,255,255,0.4)" : colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.nudgeHeadline, { color: nudge.isNearPeak ? "#FFF" : colors.foreground }]}>
                  {nudge.isNearPeak
                    ? "Your customers are active right now"
                    : `Peak time: ${nudge.bestTimeLabel}`}
                </Text>
                <Text style={[styles.nudgeBody, { color: nudge.isNearPeak ? "rgba(255,255,255,0.65)" : colors.mutedForeground }]}>
                  {nudge.hasSufficientData
                    ? nudge.nudgeMessage
                    : `Most of your customers engage on ${nudge.topDayLabel}. Post regularly to build your audience.`}
                </Text>

                {/* Caption assist section */}
                <View style={styles.nudgeCaptionSection}>
                  <View style={styles.nudgeCaptionSectionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.nudgeCaptionLabel, { color: nudge.isNearPeak ? "#2D7A4F" : "#CA922B" }]}>
                        {aiCaptions.length > 0
                          ? aiCaptionsGenerated ? "✨ AI-written captions — tap to select" : "Suggested captions — tap to select"
                          : "Caption assist"}
                      </Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.85}
                      onPress={() => { void loadAiCaptions(); }}
                      disabled={aiCaptionsLoading}
                      hitSlop={8}
                      style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                    >
                      {aiCaptionsLoading
                        ? <ActivityIndicator size="small" color={nudge.isNearPeak ? "#2D7A4F" : "#CA922B"} />
                        : <Feather name={aiCaptions.length > 0 ? "refresh-cw" : "cpu"} size={13} color={nudge.isNearPeak ? "#2D7A4F" : "#CA922B"} />
                      }
                      <Text style={[styles.nudgeCaptionGenBtn, { color: nudge.isNearPeak ? "#2D7A4F" : "#CA922B" }]}>
                        {aiCaptions.length > 0 ? "Refresh" : "Generate"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* AI caption chips */}
                  {aiCaptions.length > 0 && (
                    <View style={{ gap: 6, marginTop: 6 }}>
                      {aiCaptions.map((cap, idx) => (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.75}
                          onPress={() => {
                            setSelectedCaptionIdx(idx);
                            if (Platform.OS !== "web") Haptics.selectionAsync();
                          }}
                          style={[
                            styles.nudgeCaptionChip,
                            {
                              borderColor: selectedCaptionIdx === idx
                                ? (nudge.isNearPeak ? "#2D7A4F" : "#CA922B")
                                : (nudge.isNearPeak ? "rgba(255,255,255,0.1)" : colors.border),
                              backgroundColor: selectedCaptionIdx === idx
                                ? (nudge.isNearPeak ? "rgba(45,122,79,0.18)" : "rgba(202,146,43,0.1)")
                                : (nudge.isNearPeak ? "rgba(255,255,255,0.04)" : colors.background),
                            },
                          ]}
                        >
                          {selectedCaptionIdx === idx && (
                            <Feather
                              name="check-circle"
                              size={13}
                              color={nudge.isNearPeak ? "#2D7A4F" : "#CA922B"}
                              style={{ flexShrink: 0, marginTop: 1 }}
                            />
                          )}
                          <Text style={[
                            styles.nudgeCaptionChipText,
                            { color: nudge.isNearPeak ? "rgba(255,255,255,0.82)" : colors.foreground },
                          ]}>
                            {cap}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Static fallback when no AI captions loaded yet */}
                  {aiCaptions.length === 0 && !aiCaptionsLoading && nudge.suggestedCaption.length > 0 && (
                    <View style={[styles.nudgeCaption, {
                      backgroundColor: nudge.isNearPeak ? "rgba(45,122,79,0.12)" : colors.background,
                      borderColor: nudge.isNearPeak ? "#2D7A4F30" : colors.border,
                      marginTop: 6,
                    }]}>
                      <Text style={[styles.nudgeCaptionText, { color: nudge.isNearPeak ? "rgba(255,255,255,0.75)" : colors.foreground }]}>
                        {nudge.suggestedCaption}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.nudgeActions}>
                  <TouchableOpacity
                    style={[styles.nudgePostBtn, { backgroundColor: nudge.isNearPeak ? "#2D7A4F" : colors.primary }]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      const caption = aiCaptions.length > 0
                        ? (aiCaptions[selectedCaptionIdx] ?? nudge.suggestedCaption)
                        : nudge.suggestedCaption;
                      router.push(`/(tabs)/community?compose=true&caption=${encodeURIComponent(caption)}` as never);
                    }}
                    activeOpacity={0.85}
                  >
                    <Feather name="edit-3" size={14} color="#FFF" />
                    <Text style={styles.nudgePostBtnText}>Post Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nudgeNotifyBtn, { borderColor: nudge.isNearPeak ? "#2D7A4F50" : colors.border }]}
                    onPress={async () => {
                      try {
                        const token = await SecureStore.getItemAsync("auth_session_token");
                        const base = getApiBase();
                        await fetch(`${base}/api/businesses/mine/post-nudge/notify`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token ?? ""}` },
                        });
                        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      } catch {}
                    }}
                    activeOpacity={0.8}
                  >
                    <Feather name="bell" size={14} color={nudge.isNearPeak ? "#2D7A4F" : colors.mutedForeground} />
                    <Text style={[styles.nudgeNotifyText, { color: nudge.isNearPeak ? "#2D7A4F" : colors.mutedForeground }]}>
                      Remind me at peak time
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Direct feedback opt-in toggle */}
            <TouchableOpacity
              style={[styles.feedbackToggleCard, { backgroundColor: colors.card, borderColor: feedbackOptIn ? "#CA922B" : colors.border }]}
              onPress={toggleFeedbackOptIn}
              activeOpacity={0.85}
            >
              <View style={[styles.feedbackToggleIcon, { backgroundColor: "#CA922B18" }]}>
                <Feather name="message-circle" size={20} color="#CA922B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackToggleTitle, { color: colors.foreground }]}>Direct Skip Feedback</Text>
                <Text style={[styles.feedbackToggleSub, { color: colors.mutedForeground }]}>
                  {feedbackOptIn
                    ? "On — users who skip your listing can send you a private, constructive note."
                    : "Off — enable to receive private notes from users who skip your listing."}
                </Text>
              </View>
              {togglingFeedback ? (
                <ActivityIndicator size="small" color="#CA922B" />
              ) : (
                <View style={[styles.togglePill, { backgroundColor: feedbackOptIn ? "#CA922B" : colors.border }]}>
                  <View style={[styles.toggleDot, { transform: [{ translateX: feedbackOptIn ? 14 : 0 }] }]} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Reviews</Text>
            </View>

            {reviews.length === 0 ? (
              <View style={[styles.noReviews, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="star" size={24} color={colors.muted} />
                <Text style={[styles.noReviewsTxt, { color: colors.mutedForeground }]}>
                  {getDailyQuoteText("growth", 2)}
                </Text>
              </View>
            ) : reviews.map((r, i) => (
              <View key={r.id ?? i} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.reviewTop}>
                  <View style={[styles.reviewAvatar, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name="user" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewName, { color: colors.foreground }]}>Community Member</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Feather
                          key={s}
                          name="star"
                          size={12}
                          color={s <= r.rating ? colors.primary : colors.border}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                {r.content ? (
                  <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>{r.content}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}

        {activeTab === "reviews" && (
          <>
            {/* Tagline */}
            <View style={[styles.taglineBanner, { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "20" }]}>
              <Feather name="shield" size={14} color={colors.primary} style={{ marginTop: 1, flexShrink: 0 }} />
              <Text style={[styles.taglineText, { color: colors.primary }]}>
                {getDailyQuoteText("growth", 1)}
              </Text>
            </View>

            {/* Reviews list */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Community Reviews</Text>
            {reviews.length === 0 ? (
              <View style={[styles.noReviews, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="star" size={24} color={colors.muted} />
                <Text style={[styles.noReviewsTxt, { color: colors.mutedForeground }]}>
                  {getDailyQuoteText("growth", 2)}
                </Text>
              </View>
            ) : reviews.map((r, i) => (
              <View key={r.id ?? i} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.reviewTop}>
                  <View style={[styles.reviewAvatar, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name="user" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewName, { color: colors.foreground }]}>Community Member</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Feather key={s} name="star" size={12} color={s <= r.rating ? colors.primary : colors.border} />
                      ))}
                    </View>
                  </View>
                </View>
                {r.content ? (
                  <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>{r.content}</Text>
                ) : null}
              </View>
            ))}

            {/* KinfolkAI Action Plan */}
            <View style={[styles.aiPlanCard, { backgroundColor: "#CA922B", borderColor: "#CA922B30" }]}>
              <View style={styles.aiPlanHeader}>
                <View style={styles.aiPlanBadge}>
                  <Feather name="zap" size={11} color="#FFF" />
                  <Text style={styles.aiPlanBadgeText}>KinfolkAI™</Text>
                </View>
                <Text style={[styles.aiPlanTitle, { color: "#FFF" }]}>Business Improvement Plan</Text>
                <Text style={[styles.aiPlanSub, { color: "rgba(255,255,255,0.55)" }]}>
                  Analyze your community feedback and get a tailored action plan with budget estimates and timelines.
                </Text>
              </View>

              {!actionPlan && !actionPlanLoading && (
                <TouchableOpacity
                  style={[styles.aiPlanBtn, { backgroundColor: "#CA922B" }]}
                  onPress={() => { void generateActionPlan(); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                  activeOpacity={0.85}
                >
                  <Feather name="cpu" size={15} color="#FFF" />
                  <Text style={styles.aiPlanBtnText}>Generate Action Plan</Text>
                </TouchableOpacity>
              )}

              {actionPlanLoading && (
                <View style={styles.aiPlanLoading}>
                  <ActivityIndicator color="#CA922B" />
                  <Text style={[styles.aiPlanLoadingText, { color: "rgba(255,255,255,0.6)" }]}>Analyzing feedback…</Text>
                </View>
              )}

              {actionPlan && (
                <View style={styles.aiPlanResults}>
                  <Text style={[styles.aiPlanSummary, { color: "rgba(255,255,255,0.8)" }]}>{actionPlan.summary}</Text>
                  {actionPlan.actionItems.map((item, idx) => {
                    const priorityColor: Record<string, string> = { critical: "#DC2626", high: "#CA922B", medium: "#2D7A4F", low: "#6B7280" };
                    const pc = priorityColor[item.priority] ?? "#CA922B";
                    return (
                      <View key={idx} style={[styles.aiPlanItem, { borderLeftColor: pc, backgroundColor: "rgba(255,255,255,0.04)" }]}>
                        <View style={styles.aiPlanItemTop}>
                          <Text style={[styles.aiPlanIssue, { color: "#FFF" }]}>{item.issue}</Text>
                          <View style={[styles.aiPlanPriority, { backgroundColor: pc + "25" }]}>
                            <Text style={[styles.aiPlanPriorityText, { color: pc }]}>{item.priority}</Text>
                          </View>
                        </View>
                        <Text style={[styles.aiPlanCategory, { color: "#CA922B" }]}>{item.category}</Text>
                        {item.actions.map((a, ai) => (
                          <View key={ai} style={styles.aiPlanStep}>
                            <Text style={[styles.aiPlanStepDot, { color: "rgba(255,255,255,0.4)" }]}>•</Text>
                            <Text style={[styles.aiPlanStepText, { color: "rgba(255,255,255,0.75)" }]}>{a}</Text>
                          </View>
                        ))}
                        <View style={styles.aiPlanMeta}>
                          <View style={styles.aiPlanMetaItem}>
                            <Feather name="dollar-sign" size={11} color="rgba(255,255,255,0.4)" />
                            <Text style={[styles.aiPlanMetaText, { color: "rgba(255,255,255,0.55)" }]}>{item.estimatedCost}</Text>
                          </View>
                          <View style={styles.aiPlanMetaItem}>
                            <Feather name="clock" size={11} color="rgba(255,255,255,0.4)" />
                            <Text style={[styles.aiPlanMetaText, { color: "rgba(255,255,255,0.55)" }]}>{item.estimatedTimeline}</Text>
                          </View>
                        </View>
                        {item.resources && item.resources.length > 0 && (
                          <Text style={[styles.aiPlanResource, { color: "#CA922B" }]}>
                            Resources: {item.resources.join(", ")}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.aiPlanRefresh, { borderColor: "rgba(202,146,43,0.3)" }]}
                    onPress={() => { setActionPlan(null); void generateActionPlan(); }}
                    activeOpacity={0.7}
                  >
                    <Feather name="refresh-cw" size={13} color="#CA922B" />
                    <Text style={[styles.aiPlanRefreshText, { color: "#CA922B" }]}>Refresh Plan</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Find Trusted Providers */}
            <View style={[styles.aiPlanCard, { backgroundColor: "#0D2318", borderColor: "#2D7A4F30", marginTop: 14 }]}>
              <View style={styles.aiPlanHeader}>
                <View style={[styles.aiPlanBadge, { backgroundColor: "#2D7A4F" }]}>
                  <Feather name="users" size={11} color="#FFF" />
                  <Text style={styles.aiPlanBadgeText}>KinfolkAI™</Text>
                </View>
                <Text style={[styles.aiPlanTitle, { color: "#FFF" }]}>Find Trusted Providers</Text>
                <Text style={[styles.aiPlanSub, { color: "rgba(255,255,255,0.55)" }]}>
                  Get a custom improvement roadmap with minority-owned providers sourced right from the Mapping With Melanin™ platform.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.aiPlanBtn, { backgroundColor: "#2D7A4F" }]}
                onPress={() => {
                  setShowImprovementModal(true);
                  if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                activeOpacity={0.85}
              >
                <Feather name="search" size={15} color="#FFF" />
                <Text style={styles.aiPlanBtnText}>Find Community Providers</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === "products" && (
          <>
            {/* Founding Business Program card */}
            {business?.foundingBusiness && (
              <View style={[styles.addrForm, { backgroundColor: "#1A0F00", borderColor: "#C9922B40", marginBottom: 12 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Text style={{ fontSize: 22 }}>⭐</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: "#C9922B" }}>
                      Founding Business{business.foundingNumber ? ` #${business.foundingNumber}` : ""}
                    </Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(201,146,43,0.7)" }}>
                      of 500 Founding Members
                    </Text>
                  </View>
                  <View style={{ backgroundColor: "#C9922B20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#C9922B40" }}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 10, color: "#C9922B" }}>FOUNDING</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10, lineHeight: 18 }}>
                  Thank you for believing in Mapping with Melanin™ from the beginning. Your exclusive introductory rates are locked in as a reward for your early support.
                </Text>
                {[
                  { icon: "lock" as const,       text: "1% discount off standard marketplace rates, locked for 3 years — Community 9% · Growth 7% · Premium 5%" },
                  { icon: "award" as const,       text: "Founding Business badge on your profile and listing" },
                  { icon: "zap" as const,         text: "6 months of Premium Business membership — AI tools, enhanced analytics, priority placement" },
                  { icon: "users" as const,       text: "Priority onboarding with our team" },
                  { icon: "trending-up" as const, text: "Early access to every new feature before public release" },
                  { icon: "globe" as const,       text: "Recognition on mappingwithmelanin.com and featured in launch marketing" },
                ].map((item) => (
                  <View key={item.text} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                    <Feather name={item.icon} size={13} color="#C9922B" style={{ marginTop: 2 }} />
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)", flex: 1, lineHeight: 18 }}>
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Seller setup requirements checklist — shown until fully set up */}
            {(!business?.verified || !sellerAgreementAccepted || !connectStatus?.onboarded) && (
              <View style={[styles.addrForm, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
                <Text style={[styles.formLabel, { color: colors.foreground, marginTop: 0, marginBottom: 10, fontSize: 14 }]}>
                  Seller Setup Requirements
                </Text>
                {([
                  {
                    done: !!business?.verified,
                    label: "Identity & Business Verified",
                    sub: "Submit verification documents for review",
                  },
                  {
                    done: sellerAgreementAccepted,
                    label: "Seller Agreement Accepted",
                    sub: "Read and accept the Marketplace Seller Agreement",
                  },
                  {
                    done: !!connectStatus?.onboarded,
                    label: "Payment Account Connected",
                    sub: "Link your bank account via Stripe Connect",
                  },
                  {
                    done: !!connectStatus?.onboarded,
                    label: "Tax & Banking Verified",
                    sub: "Completed automatically during Stripe setup",
                  },
                ] as const).map((step, i) => (
                  <View key={i} style={[styles.requirementRow, { borderColor: colors.border }]}>
                    <View style={[
                      styles.requirementDot,
                      { backgroundColor: step.done ? "#2D7A4F" : colors.muted, borderColor: step.done ? "#2D7A4F" : colors.border },
                    ]}>
                      {step.done
                        ? <Feather name="check" size={11} color="#FFF" />
                        : <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: colors.mutedForeground }}>{i + 1}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.requirementLabel, { color: step.done ? "#2D7A4F" : colors.foreground }]}>{step.label}</Text>
                      <Text style={[styles.requirementSub, { color: colors.mutedForeground }]}>{step.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!business?.verified ? (
              <View style={[styles.paywallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.paywallIcon, { backgroundColor: "#C9922B18" }]}>
                  <Feather name="shield" size={32} color="#C9922B" />
                </View>
                <Text style={[styles.paywallTitle, { color: colors.foreground }]}>Verification Required</Text>
                <Text style={[styles.paywallBody, { color: colors.mutedForeground }]}>
                  Only verified minority-owned businesses can sell directly on Mapping With Melanin. Complete your verification to unlock in-app selling.
                </Text>
                <TouchableOpacity
                  style={[styles.paywallBtn, { backgroundColor: "#C9922B" }]}
                  activeOpacity={0.85}
                  onPress={() => router.push("/business-verify" as any)}
                >
                  <Feather name="shield" size={15} color="#FFF" />
                  <Text style={styles.paywallBtnTxt}>Get Verified</Text>
                </TouchableOpacity>
              </View>
            ) : !sellerAgreementAccepted ? (
              <View style={[styles.paywallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.paywallIcon, { backgroundColor: "#CA922B18" }]}>
                  <Feather name="file-text" size={32} color="#CA922B" />
                </View>
                <Text style={[styles.paywallTitle, { color: colors.foreground }]}>Accept Seller Agreement</Text>
                <Text style={[styles.paywallBody, { color: colors.mutedForeground }]}>
                  Before listing products, review and accept the Marketplace Seller Agreement. It covers your responsibilities for product quality, fulfillment, taxes, and customer service.
                </Text>
                <TouchableOpacity
                  style={[styles.paywallBtn, { backgroundColor: "#CA922B" }, dsSigningLoading && { opacity: 0.6 }]}
                  activeOpacity={0.85}
                  disabled={dsSigningLoading}
                  onPress={async () => {
                    if (!business?.id) return;
                    setDsSigningLoading(true);
                    try {
                      const token = await SecureStore.getItemAsync("auth_session_token");
                      const resp = await fetch(`${getApiBase()}/api/docusign/seller-agreement`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ businessId: business.id }),
                      });
                      const data = await resp.json();
                      if (data.alreadySigned) { setSellerAgreementAccepted(true); return; }
                      if (data.signingUrl) {
                        if (data.envelopeId) setDsEnvelopeId(data.envelopeId);
                        await Linking.openURL(data.signingUrl);
                      } else {
                        Alert.alert("Error", data.error ?? "Could not open agreement. Please try again.");
                      }
                    } catch {
                      Alert.alert("Error", "Could not start signing. Please check your connection and try again.");
                    } finally {
                      setDsSigningLoading(false);
                    }
                  }}
                >
                  {dsSigningLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Feather name="external-link" size={15} color="#FFF" />}
                  <Text style={styles.paywallBtnTxt}>{dsSigningLoading ? "Opening…" : "Sign with DocuSign"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ alignSelf: "center", marginTop: 10, paddingVertical: 6 }}
                  activeOpacity={0.7}
                  onPress={() => setShowAgreementModal(true)}
                >
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#3B1F0E88", textDecorationLine: "underline" }}>
                    Review & accept in-app instead
                  </Text>
                </TouchableOpacity>
              </View>
            ) : !connectStatus?.onboarded ? (
              <View style={[styles.paywallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.paywallIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="shopping-bag" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.paywallTitle, { color: colors.foreground }]}>Start Selling In-App</Text>
                <Text style={[styles.paywallBody, { color: colors.mutedForeground }]}>
                  Connect your Stripe account to list products and services. Stripe will verify your identity, bank account, and tax information. Funds are deposited directly to your bank.
                </Text>
                <TouchableOpacity
                  style={[styles.paywallBtn, { backgroundColor: colors.primary }, onboarding && { opacity: 0.6 }]}
                  disabled={onboarding}
                  activeOpacity={0.85}
                  onPress={async () => {
                    setOnboarding(true);
                    try {
                      const url = await startOnboarding();
                      if (url) await Linking.openURL(url);
                      else Alert.alert("Error", "Could not start onboarding. Please try again.");
                    } finally { setOnboarding(false); }
                  }}
                >
                  {onboarding ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="arrow-right" size={15} color="#FFF" />}
                  <Text style={styles.paywallBtnTxt}>{onboarding ? "Opening…" : "Connect with Stripe"}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Seller obligations card */}
                <View style={[styles.addrForm, { backgroundColor: "#0F1F0F", borderColor: "#2D7A4F40", marginBottom: 8 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Feather name="shield" size={16} color="#2D7A4F" />
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFF" }}>Your Seller Responsibilities</Text>
                  </View>
                  {[
                    "Fulfill orders promptly and as described",
                    "Honor your stated return & refund policy",
                    "Respond to buyer disputes within 48 hours",
                    "Accurate listing descriptions — no misrepresentation",
                    "Repeated violations may result in account removal",
                  ].map((item) => (
                    <View key={item} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                      <Feather name="check" size={12} color="#2D7A4F" style={{ marginTop: 3 }} />
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)", flex: 1, lineHeight: 18 }}>{item}</Text>
                    </View>
                  ))}
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6, lineHeight: 16 }}>
                    Mapping With Melanin™ is a marketplace. You are the seller of record and responsible for your products and customers.
                  </Text>
                </View>

                {/* Seller program phases */}
                <View style={[styles.addrForm, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 8 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Feather name="layers" size={16} color={colors.primary} />
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: colors.foreground }}>Seller Program</Text>
                    <View style={{ marginLeft: "auto", backgroundColor: colors.primary + "18", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, color: colors.primary }}>PHASE 1 ACTIVE</Text>
                    </View>
                  </View>

                  {/* Business trial countdown */}
                  {(() => {
                    const trialActive = (marketplaceTier as any)?.trialActive ?? false;
                    const trialDaysLeft = (marketplaceTier as any)?.trialDaysLeft ?? 0;
                    if (!trialActive) return null;
                    return (
                      <View style={{ backgroundColor: "#2D7A4F18", borderRadius: 10, borderWidth: 1, borderColor: "#2D7A4F30", padding: 12, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: "#2D7A4F", marginBottom: 2 }}>
                            PREMIUM TRIAL ACTIVE · {trialDaysLeft} DAYS LEFT
                          </Text>
                          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, lineHeight: 16 }}>
                            You're on a free 6-month Premium business trial. Upgrade before it ends to keep all features.
                          </Text>
                        </View>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#2D7A4F20", alignItems: "center", justifyContent: "center" }}>
                          <Feather name="zap" size={16} color="#2D7A4F" />
                        </View>
                      </View>
                    );
                  })()}

                  {/* Current fee rate banner */}
                  {(() => {
                    const foundingActive = (marketplaceTier as any)?.foundingActive ?? false;
                    const foundingExpiresAt = (marketplaceTier as any)?.foundingExpiresAt ?? null;
                    const expiryYear = foundingExpiresAt ? new Date(foundingExpiresAt).getFullYear() : null;
                    const tier = (marketplaceTier as any)?.tier ?? "free";
                    const TIER_FEE_DISPLAY: Record<string, string> = { free: "6%", growth: "5%", premium: "3%" };
                    const tierFee = TIER_FEE_DISPLAY[tier as string] ?? "6%";
                    const bannerColor = foundingActive ? "#C9922B" : colors.primary;
                    return (
                      <View style={{ backgroundColor: bannerColor + "15", borderRadius: 10, borderWidth: 1, borderColor: bannerColor + "30", padding: 12, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: bannerColor, marginBottom: 2 }}>
                            {foundingActive ? "⭐ FOUNDING RATE — LOCKED IN" : "YOUR MARKETPLACE FEE"}
                          </Text>
                          {foundingActive ? (
                            <>
                              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 26, color: bannerColor }}>3%</Text>
                                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground }}>flat — all transactions</Text>
                              </View>
                              {expiryYear && (
                                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                                  Founding rate guaranteed through {expiryYear}.
                                </Text>
                              )}
                            </>
                          ) : (
                            <>
                              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 26, color: bannerColor }}>{tierFee}</Text>
                                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground }}>flat — all transactions</Text>
                              </View>
                              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                                {tier === "free" ? "Upgrade to Growth (5%) or Premium (3%) to reduce your fee." : tier === "growth" ? "Upgrade to Premium to lower to 3%." : "Best available rate — Premium tier."}
                              </Text>
                            </>
                          )}
                        </View>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: bannerColor + "20", alignItems: "center", justifyContent: "center" }}>
                          <Feather name={foundingActive ? "star" : "percent"} size={16} color={bannerColor} />
                        </View>
                      </View>
                    );
                  })()}

                  {/* Fee schedule table */}
                  <View style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 14 }}>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Seller Tier Rate Schedule
                      </Text>
                    </View>
                    {[
                      { label: "Free Tier",    fee: "6%", note: "standard listing",     color: colors.mutedForeground },
                      { label: "Growth Tier",  fee: "5%", note: "growing businesses",   color: colors.primary },
                      { label: "Premium Tier", fee: "3%", note: "established sellers",  color: "#2D7A4F" },
                    ].map((row, idx) => (
                      <View key={row.label} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.border }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground }}>{row.label}</Text>
                          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground }}>{row.note}</Text>
                        </View>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: row.color }}>{row.fee}</Text>
                      </View>
                    ))}
                    {/* Founding rate row */}
                    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#C9922B08", borderTopWidth: 1, borderTopColor: colors.border }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#C9922B" }}>⭐ Founding Members</Text>
                        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground }}>flat rate, locked 3 years</Text>
                      </View>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: "#C9922B" }}>3%</Text>
                    </View>
                  </View>

                  {/* Phase 1 */}
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Feather name="check" size={13} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.foreground, marginBottom: 2 }}>Phase 1 — Verified Sellers Only</Text>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, lineHeight: 17 }}>
                        Products, services, and event tickets from MWM-verified minority-owned businesses. You're here.
                      </Text>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 2, marginBottom: 10 }} />

                  {/* Phase 2 */}
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 10, opacity: 0.5 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.mutedForeground, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: colors.mutedForeground }}>2</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.foreground }}>Phase 2 — Open Applications</Text>
                        <View style={{ backgroundColor: colors.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 10, color: colors.mutedForeground }}>COMING SOON</Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, lineHeight: 17 }}>
                        More businesses apply after completing identity, tax, and banking verification. Seller ratings and performance metrics launch.
                      </Text>
                    </View>
                  </View>

                  {/* Phase 3 */}
                  <View style={{ flexDirection: "row", gap: 10, opacity: 0.4 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.mutedForeground, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: colors.mutedForeground }}>3</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.foreground }}>Phase 3 — Top Performer Benefits</Text>
                        <View style={{ backgroundColor: colors.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 10, color: colors.mutedForeground }}>FUTURE</Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, lineHeight: 17 }}>
                        Top-rated sellers unlock lower marketplace fees, priority placement, and exclusive promotional opportunities.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Listings</Text>
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setShowNewListing((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <Feather name={showNewListing ? "x" : "plus"} size={14} color="#FFF" />
                    <Text style={styles.addBtnTxt}>{showNewListing ? "Cancel" : "Add Listing"}</Text>
                  </TouchableOpacity>
                </View>

                {showNewListing && (
                  <View style={[styles.newListingForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>Listing Type <Text style={{ color: "#C9922B" }}>*</Text></Text>
                    <View style={styles.typeChips}>
                      {LISTING_TYPES.map((t) => {
                        const selected = newListingType === t.value;
                        return (
                          <TouchableOpacity
                            key={t.value}
                            style={[styles.typeChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + "15" : colors.background }]}
                            onPress={() => setNewListingType(t.value)}
                            activeOpacity={0.75}
                          >
                            <Feather name={t.icon as any} size={13} color={selected ? colors.primary : colors.mutedForeground} />
                            <Text style={[styles.typeChipTxt, { color: selected ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>Product / Service Name</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="e.g. Braids Appointment"
                      placeholderTextColor={colors.mutedForeground}
                    />
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>Description (optional)</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={newDesc}
                      onChangeText={setNewDesc}
                      placeholder="Brief description…"
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      numberOfLines={3}
                    />
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>Category (optional)</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={newCategory}
                      onChangeText={setNewCategory}
                      placeholder="e.g. Hair, Food, Apparel"
                      placeholderTextColor={colors.mutedForeground}
                    />
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>Price (USD)</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={newPrice}
                      onChangeText={setNewPrice}
                      placeholder="e.g. 45.00"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: colors.primary }, (savingListing || !newListingType) && { opacity: 0.6 }]}
                      disabled={savingListing || !newName.trim() || !newPrice.trim() || !newListingType}
                      onPress={async () => {
                        if (!newListingType) { Alert.alert("Select a listing type before saving."); return; }
                        const cents = Math.round(parseFloat(newPrice) * 100);
                        if (isNaN(cents) || cents <= 0) { Alert.alert("Invalid price"); return; }
                        setSavingListing(true);
                        const result = await createListing({
                          name: newName.trim(),
                          description: newDesc.trim() || undefined,
                          priceInCents: cents,
                          category: newCategory.trim() || undefined,
                          listingType: newListingType,
                        });
                        setSavingListing(false);
                        if (result) {
                          setShowNewListing(false);
                          setNewListingType(null); setNewName(""); setNewDesc(""); setNewPrice(""); setNewCategory("");
                        } else {
                          Alert.alert("Error", "Failed to create listing. Please try again.");
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      {savingListing ? <ActivityIndicator size="small" color="#fff" /> : null}
                      <Text style={styles.saveBtnTxt}>{savingListing ? "Saving…" : "Save Listing"}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {listingsLoading ? (
                  <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : listings.length === 0 ? (
                  <View style={[styles.noReviews, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="shopping-bag" size={24} color={colors.muted} />
                    <Text style={[styles.noReviewsTxt, { color: colors.mutedForeground }]}>
                      No listings yet. Tap "Add Listing" to create your first product or service.
                    </Text>
                  </View>
                ) : listings.map((l: Listing) => (
                  <View key={l.id} style={[styles.listingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listingName, { color: colors.foreground }]}>{l.name}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        {l.listingType ? (() => {
                          const t = LISTING_TYPES.find((x) => x.value === l.listingType);
                          return t ? (
                            <View style={[styles.typeTag, { backgroundColor: colors.primary + "12" }]}>
                              <Feather name={t.icon as any} size={10} color={colors.primary} />
                              <Text style={[styles.typeTagTxt, { color: colors.primary }]}>{t.label}</Text>
                            </View>
                          ) : null;
                        })() : null}
                        {l.category ? <Text style={[styles.listingCat, { color: colors.mutedForeground }]}>{l.category}</Text> : null}
                      </View>
                      <Text style={[styles.listingPrice, { color: colors.primary }]}>
                        ${(l.priceInCents / 100).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.listingActions}>
                      <TouchableOpacity activeOpacity={0.85}
                        style={[styles.toggleBtn, { backgroundColor: l.active ? "#2D7A4F18" : colors.muted + "30" }]}
                        onPress={() => void toggleActive(l.id, !l.active)}
                      >
                        <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: l.active ? "#2D7A4F" : colors.mutedForeground }}>
                          {l.active ? "Active" : "Hidden"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={0.85}
                        onPress={() => {
                          Alert.alert("Delete listing?", `"${l.name}" will be removed.`, [
                            { text: "Cancel", style: "cancel" },
                            { text: "Delete", style: "destructive", onPress: () => void deleteListing(l.id) },
                          ]);
                        }}
                      >
                        <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === "insights" && (
          <>
            {analyticsLoading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.analyticsLoadingTxt, { color: colors.mutedForeground }]}>Loading your analytics…</Text>
              </View>
            )}

            {!analyticsLoading && analyticsError === "paywall" && (
              <View style={[styles.paywallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.paywallIcon, { backgroundColor: "#CA922B18" }]}>
                  <Feather name="bar-chart-2" size={32} color="#CA922B" />
                </View>
                <Text style={[styles.paywallTitle, { color: colors.foreground }]}>Unlock Business Analytics</Text>
                <Text style={[styles.paywallBody, { color: colors.mutedForeground }]}>
                  Navigator and Trailblazer members get profile views, saves data, peer benchmarks, and personalised growth suggestions. Trailblazer unlocks 7-day view trends and a full suggestion suite.
                </Text>
                <TouchableOpacity
                  style={[styles.paywallBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/membership")}
                  activeOpacity={0.85}
                >
                  <Feather name="zap" size={15} color="#FFF" />
                  <Text style={styles.paywallBtnTxt}>Upgrade Your Membership</Text>
                </TouchableOpacity>
              </View>
            )}

            {!analyticsLoading && analyticsError === "error" && (
              <View style={styles.comingSoon}>
                <Feather name="wifi-off" size={28} color={colors.muted} />
                <Text style={[styles.comingSoonTxt, { color: colors.foreground }]}>Could not load analytics</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => { setAnalyticsError(null); void loadAnalytics(); }}>
                  <Text style={[styles.retryTxt, { color: colors.primary }]}>Tap to retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!analyticsLoading && analytics && (() => {
              const A = analytics;
              const screenW = Dimensions.get("window").width - 40;
              const barMax = screenW - 120;

              const PRIORITY_COLOR: Record<string, string> = { high: "#DC2626", medium: "#CA922B", low: "#2D7A4F" };

              return (
                <>
                  {/* Full Intelligence Report link */}
                  <TouchableOpacity
                    style={[styles.intelligenceBtn, { backgroundColor: "#CA922B", marginHorizontal: 20, marginBottom: 16, borderRadius: 14 }]}
                    onPress={() => router.push("/business-intelligence" as never)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                      <Feather name="bar-chart-2" size={20} color="#fff" />
                      <View>
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Full Intelligence Report</Text>
                        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 1 }}>Sentiment · Peer benchmarks · Promotion ROI</Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={18} color="#fff" />
                  </TouchableOpacity>
                  {/* Tier + Engagement Score */}
                  <View style={[styles.scoreCard, { backgroundColor: A.tier === "trailblazer" ? "#CA922B" : colors.card, borderColor: A.tier === "trailblazer" ? "#CA922B50" : colors.border }]}>
                    <View style={styles.scoreLeft}>
                      <View style={styles.scoreTierRow}>
                        <Feather name={A.tier === "trailblazer" ? "award" : "bar-chart-2"} size={14} color={A.tier === "trailblazer" ? "#CA922B" : colors.primary} />
                        <Text style={[styles.scoreTierTxt, { color: A.tier === "trailblazer" ? "#CA922B" : colors.primary }]}>
                          {A.tier === "trailblazer" ? "Trailblazer Analytics" : "Navigator Analytics"}
                        </Text>
                      </View>
                      <Text style={[styles.scoreNum, { color: A.tier === "trailblazer" ? "#FFF" : colors.foreground }]}>{A.engagementScore}</Text>
                      <Text style={[styles.scoreLabel, { color: A.tier === "trailblazer" ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>Engagement Score</Text>
                    </View>
                    <View style={styles.scoreRight}>
                      {[
                        { label: "Profile completeness", pct: Math.min(((A.engagementScore / 100) * 1.2), 1) },
                        { label: "vs. category average", pct: Math.min(A.viewsVsPeersPct / 200, 1) },
                      ].map((r) => (
                        <View key={r.label} style={styles.scoreMiniRow}>
                          <View style={[styles.scoreMiniBar, { backgroundColor: A.tier === "trailblazer" ? "rgba(255,255,255,0.15)" : colors.border }]}>
                            <View style={[styles.scoreMiniBarFill, { width: `${Math.round(r.pct * 100)}%`, backgroundColor: A.tier === "trailblazer" ? "#CA922B" : colors.primary }]} />
                          </View>
                          <Text style={[styles.scoreMiniLabel, { color: A.tier === "trailblazer" ? "rgba(255,255,255,0.5)" : colors.mutedForeground }]}>{r.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Core metrics grid */}
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Last 30 Days</Text>
                  <View style={styles.metricsGrid}>
                    {[
                      { label: "Profile Views", value: A.metrics.views30d, icon: "eye", color: "#2563EB" },
                      { label: "Saves", value: A.metrics.saves, icon: "bookmark", color: "#CA922B" },
                      { label: "Reviews", value: A.metrics.reviews, icon: "star", color: "#2D7A4F" },
                      { label: "Avg Rating", value: A.metrics.avgRating > 0 ? A.metrics.avgRating.toFixed(1) + "★" : "—", icon: "award", color: "#7C3AED" },
                    ].map((m) => (
                      <View key={m.label} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.metricIcon, { backgroundColor: m.color + "18" }]}>
                          <Feather name={m.icon as never} size={16} color={m.color} />
                        </View>
                        <Text style={[styles.metricValue, { color: colors.foreground }]}>{m.value}</Text>
                        <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Peer comparison */}
                  {A.benchmarks.peerCount > 0 && (
                    <>
                      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>
                        How You Compare
                        <Text style={[styles.peerNote, { color: colors.mutedForeground }]}> · {A.benchmarks.peerCount} similar {A.benchmarks.peerCount === 1 ? "business" : "businesses"}</Text>
                      </Text>
                      <View style={[styles.compareCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {[
                          { label: "Profile Views", pct: A.viewsVsPeersPct, color: "#2563EB" },
                          { label: "Saves", pct: A.savesVsPeersPct, color: "#CA922B" },
                          { label: "Reviews", pct: A.reviewsVsPeersPct, color: "#2D7A4F" },
                          { label: "Rating", pct: A.ratingVsPeersPct, color: "#7C3AED" },
                        ].map((row) => (
                          <View key={row.label} style={styles.compareRow}>
                            <Text style={[styles.compareRowLabel, { color: colors.foreground }]}>{row.label}</Text>
                            <View style={[styles.compareBarBg, { backgroundColor: colors.border, width: barMax }]}>
                              <View style={[styles.compareBarFill, {
                                width: Math.min((row.pct / 200) * barMax, barMax),
                                backgroundColor: row.pct >= 100 ? row.color : "#6B728080",
                              }]} />
                              <View style={[styles.compareMidLine, { left: barMax / 2 }]} />
                            </View>
                            <Text style={[styles.compareRowPct, { color: row.pct >= 100 ? row.color : colors.mutedForeground }]}>
                              {row.pct}%
                            </Text>
                          </View>
                        ))}
                        <Text style={[styles.compareKey, { color: colors.mutedForeground }]}>
                          100% = category average · bars over halfway beat the average
                        </Text>
                      </View>
                    </>
                  )}

                  {/* 7-day trend (Trailblazer only) */}
                  {A.tier === "trailblazer" && A.trend && A.trend.length > 0 && (
                    <>
                      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>7-Day View Trend</Text>
                      <View style={[styles.trendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {(() => {
                          const maxCount = Math.max(...A.trend.map((t) => t.count), 1);
                          return (
                            <View style={styles.trendBars}>
                              {A.trend.map((t) => {
                                const dayLabel = new Date(t.day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
                                const barH = Math.max((t.count / maxCount) * 80, 4);
                                return (
                                  <View key={t.day} style={styles.trendBarCol}>
                                    <Text style={[styles.trendCount, { color: colors.mutedForeground }]}>{t.count > 0 ? t.count : ""}</Text>
                                    <View style={[styles.trendBar, { height: barH, backgroundColor: colors.primary }]} />
                                    <Text style={[styles.trendDay, { color: colors.mutedForeground }]}>{dayLabel}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          );
                        })()}
                      </View>
                    </>
                  )}

                  {/* AI Marketing Manager */}
                  <View style={[styles.aiInsightCard, { backgroundColor: "#0F1E14", borderColor: "#2D7A4F30" }]}>
                    <View style={styles.aiInsightHeader}>
                      <View style={[styles.aiInsightBadge, { backgroundColor: "#2D7A4F" }]}>
                        <Feather name="trending-up" size={10} color="#FFF" />
                        <Text style={styles.aiInsightBadgeTxt}>AI Marketing Manager</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.aiInsightTitle, { color: "#FFF" }]}>Market Intelligence</Text>
                        <Text style={[styles.aiInsightSub, { color: "rgba(255,255,255,0.5)" }]}>
                          Community search trends · Opportunity alerts · Audience builder
                        </Text>
                      </View>
                    </View>

                    {marketInsightsLoading && (
                      <View style={{ paddingVertical: 16, alignItems: "center" }}>
                        <ActivityIndicator color="#2D7A4F" size="small" />
                        <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 8 }}>
                          Analyzing community search data…
                        </Text>
                      </View>
                    )}

                    {!marketInsightsLoading && marketInsights && (
                      <>
                        {/* Trending Searches */}
                        {marketInsights.trendingSearches.length > 0 && (
                          <View style={{ marginTop: 12 }}>
                            <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                              What people are searching
                            </Text>
                            {marketInsights.trendingSearches.slice(0, 4).map((t, i) => (
                              <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#2D7A4F25", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ color: "#2D7A4F", fontFamily: "Inter_700Bold", fontSize: 9 }}>{i + 1}</Text>
                                  </View>
                                  <Text style={{ color: "#FFF", fontFamily: "Inter_500Medium", fontSize: 13 }}>{t.query}</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                  <Text style={{ color: "#2D7A4F", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>{t.searchCount} searches</Text>
                                  <View style={{ backgroundColor: "#CA922B18", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                    <Text style={{ color: "#CA922B", fontFamily: "Inter_500Medium", fontSize: 10 }}>{t.topCategory}</Text>
                                  </View>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Opportunity Alerts */}
                        {marketInsights.opportunityAlerts.length > 0 && (
                          <View style={{ marginTop: 16 }}>
                            <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                              Opportunities for you
                            </Text>
                            {marketInsights.opportunityAlerts.slice(0, 3).map((alert, i) => {
                              const impactColor = alert.impact === "high" ? "#CA922B" : alert.impact === "medium" ? "#2D7A4F" : "#6B7280";
                              return (
                                <View key={i} style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: impactColor }}>
                                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                    <Text style={{ color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{alert.message}</Text>
                                    <View style={{ backgroundColor: impactColor + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                      <Text style={{ color: impactColor, fontFamily: "Inter_600SemiBold", fontSize: 10, textTransform: "uppercase" }}>{alert.impact}</Text>
                                    </View>
                                  </View>
                                  <Text style={{ color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular", fontSize: 12 }}>{alert.action}</Text>
                                </View>
                              );
                            })}
                          </View>
                        )}

                        {/* Target Audience Builder */}
                        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
                          <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                            Your Target Audience
                          </Text>
                          {marketInsights.targetAudience ? (
                            <>
                              {marketInsights.targetAudience.lifestyleKeywords.length > 0 && (
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                                  {marketInsights.targetAudience.lifestyleKeywords.map((kw, i) => (
                                    <View key={i} style={{ backgroundColor: "#2D7A4F20", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                                      <Text style={{ color: "#2D7A4F", fontFamily: "Inter_500Medium", fontSize: 12 }}>{kw}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                              {marketInsights.targetAudience.topCities.length > 0 && (
                                <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 12 }}>
                                  Top cities: {marketInsights.targetAudience.topCities.join(", ")}
                                </Text>
                              )}
                            </>
                          ) : (
                            <Text style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 12 }}>
                              No audience profile set yet. Describe your ideal customer below.
                            </Text>
                          )}
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <TextInput
                              style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: "#FFF", fontFamily: "Inter_400Regular", fontSize: 13, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}
                              placeholder="e.g. natural hair care, wellness, 25-40, Atlanta"
                              placeholderTextColor="rgba(255,255,255,0.3)"
                              value={targetAudienceInput}
                              onChangeText={setTargetAudienceInput}
                              returnKeyType="done"
                            />
                            <TouchableOpacity
                              style={{ backgroundColor: "#2D7A4F", borderRadius: 10, paddingHorizontal: 14, justifyContent: "center", opacity: targetAudienceSaving || !targetAudienceInput.trim() ? 0.5 : 1 }}
                              disabled={targetAudienceSaving || !targetAudienceInput.trim()}
                              onPress={async () => {
                                if (!business?.id || !targetAudienceInput.trim()) return;
                                setTargetAudienceSaving(true);
                                try {
                                  const token = await SecureStore.getItemAsync("auth_session_token");
                                  const base = getApiBase();
                                  const res = await fetch(`${base}/api/businesses/${business.id}/target-audience`, {
                                    method: "PATCH",
                                    headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
                                    body: JSON.stringify({ description: targetAudienceInput.trim() }),
                                  });
                                  if (res.ok) {
                                    const d = await res.json() as { targetAudience: typeof marketInsights["targetAudience"] };
                                    setMarketInsights((prev) => prev ? { ...prev, targetAudience: d.targetAudience } : prev);
                                    setTargetAudienceInput("");
                                  }
                                } catch { /* non-fatal */ }
                                setTargetAudienceSaving(false);
                              }}
                            >
                              {targetAudienceSaving
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <Feather name="check" size={18} color="#FFF" />}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </>
                    )}

                    {!marketInsightsLoading && !marketInsights && (
                      <Text style={{ color: "rgba(255,255,255,0.3)", fontFamily: "Inter_400Regular", fontSize: 12, paddingVertical: 12, textAlign: "center" }}>
                        Market data loads once your business has search activity
                      </Text>
                    )}
                  </View>

                  {/* KinfolkAI Feedback Analysis — tier-gated */}
                  <View style={[styles.aiInsightCard, { backgroundColor: "#1E0F28", borderColor: "#7B2D8B30" }]}>
                    <View style={styles.aiInsightHeader}>
                      <View style={[styles.aiInsightBadge, { backgroundColor: A.tier === "trailblazer" ? "#CA922B" : "#7B2D8B" }]}>
                        <Feather name="cpu" size={10} color="#FFF" />
                        <Text style={styles.aiInsightBadgeTxt}>KinfolkAI™</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.aiInsightTitle, { color: "#FFF" }]}>AI Feedback Analysis</Text>
                        <Text style={[styles.aiInsightSub, { color: "rgba(255,255,255,0.5)" }]}>
                          {A.tier === "trailblazer"
                            ? "Full analysis — reviews + community skip feedback"
                            : "Basic analysis — top 10 reviews · Upgrade for full depth"}
                        </Text>
                      </View>
                    </View>

                    {/* Plan exists — show summary + items */}
                    {actionPlan && !actionPlanLoading && (
                      <>
                        <Text style={[styles.aiInsightSummary, { color: "rgba(255,255,255,0.82)" }]}>{actionPlan.summary}</Text>
                        {actionPlan._dataPoints && (
                          <View style={styles.aiInsightMeta}>
                            <Feather name="file-text" size={11} color="#7B2D8B" />
                            <Text style={[styles.aiInsightMetaTxt, { color: "rgba(255,255,255,0.4)" }]}>
                              {actionPlan._dataPoints.reviewsAnalyzed} reviews analysed
                              {actionPlan._dataPoints.skipFeedbackIncluded ? " · skip feedback included" : ""}
                              {actionPlan._cached && actionPlan._cachedAt
                                ? ` · last run ${Math.round((Date.now() - new Date(actionPlan._cachedAt).getTime()) / 86400000)}d ago`
                                : ""}
                            </Text>
                          </View>
                        )}
                        {(actionPlan.actionItems ?? []).slice(0, A.tier === "trailblazer" ? 6 : 3).map((item, idx) => {
                          const pc: Record<string, string> = { critical: "#DC2626", high: "#CA922B", medium: "#2D7A4F", low: "#6B7280" };
                          const c = pc[item.priority] ?? "#CA922B";
                          return (
                            <View key={idx} style={[styles.aiInsightItem, { borderLeftColor: c }]}>
                              <View style={styles.aiInsightItemTop}>
                                <Text style={[styles.aiInsightIssue, { color: "#FFF" }]}>{item.issue}</Text>
                                <View style={[styles.aiInsightPriority, { backgroundColor: c + "25" }]}>
                                  <Text style={[styles.aiInsightPriorityTxt, { color: c }]}>{item.priority}</Text>
                                </View>
                              </View>
                              <Text style={{ color: "#7B2D8B", fontFamily: "Inter_500Medium", fontSize: 11, marginBottom: 4 }}>{item.category}</Text>
                              {item.actions.slice(0, 2).map((a, ai) => (
                                <View key={ai} style={{ flexDirection: "row", gap: 6, marginBottom: 2 }}>
                                  <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>•</Text>
                                  <Text style={{ color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 }}>{a}</Text>
                                </View>
                              ))}
                              <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                                <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                                  <Feather name="dollar-sign" size={10} color="rgba(255,255,255,0.35)" />
                                  <Text style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular", fontSize: 11 }}>{item.estimatedCost}</Text>
                                </View>
                                <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                                  <Feather name="clock" size={10} color="rgba(255,255,255,0.35)" />
                                  <Text style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular", fontSize: 11 }}>{item.estimatedTimeline}</Text>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                          <TouchableOpacity
                            style={[styles.aiInsightBtn, { backgroundColor: "#7B2D8B" }]}
                            onPress={() => { setActionPlan(null); void generateActionPlan(); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                            activeOpacity={0.8}
                          >
                            <Feather name="refresh-cw" size={12} color="#FFF" />
                            <Text style={styles.aiInsightBtnTxt}>Regenerate</Text>
                          </TouchableOpacity>
                          {A.tier === "navigator" && (
                            <TouchableOpacity
                              style={[styles.aiInsightBtn, { backgroundColor: "#CA922B" }]}
                              onPress={() => router.push("/membership")}
                              activeOpacity={0.8}
                            >
                              <Feather name="award" size={12} color="#FFF" />
                              <Text style={styles.aiInsightBtnTxt}>Unlock Full Analysis</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </>
                    )}

                    {/* Loading state */}
                    {actionPlanLoading && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 }}>
                        <ActivityIndicator color="#7B2D8B" size="small" />
                        <Text style={{ color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular", fontSize: 13 }}>Analysing your feedback…</Text>
                      </View>
                    )}

                    {/* No plan yet — generate button */}
                    {!actionPlan && !actionPlanLoading && (
                      <TouchableOpacity
                        style={[styles.aiInsightBtn, { backgroundColor: "#7B2D8B", alignSelf: "flex-start", marginTop: 4 }]}
                        onPress={() => { void generateActionPlan(); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                        activeOpacity={0.85}
                      >
                        <Feather name="cpu" size={13} color="#FFF" />
                        <Text style={styles.aiInsightBtnTxt}>
                          {A.tier === "trailblazer" ? "Generate Full Analysis" : "Generate Basic Analysis"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Growth suggestions */}
                  {A.suggestions.length > 0 && (
                    <>
                      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>
                        Suggested Growth Areas
                      </Text>
                      {A.suggestions.map((s, i) => (
                        <View key={i} style={[styles.suggCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: PRIORITY_COLOR[s.priority] }]}>
                          <View style={[styles.suggIcon, { backgroundColor: PRIORITY_COLOR[s.priority] + "18" }]}>
                            <Feather name={s.icon as never} size={16} color={PRIORITY_COLOR[s.priority]} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.suggTitleRow}>
                              <Text style={[styles.suggTitle, { color: colors.foreground }]}>{s.title}</Text>
                              <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLOR[s.priority] + "20" }]}>
                                <Text style={[styles.priorityTxt, { color: PRIORITY_COLOR[s.priority] }]}>{s.priority}</Text>
                              </View>
                            </View>
                            <Text style={[styles.suggBody, { color: colors.mutedForeground }]}>{s.body}</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}

                  {/* Community Skip Insights */}
                  {skipFeedback !== null && (
                    <View style={[styles.skipInsightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.skipInsightHeader}>
                        <View style={[styles.skipInsightIconWrap, { backgroundColor: "#CA922B18" }]}>
                          <Feather name="skip-forward" size={15} color="#CA922B" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.skipInsightTitle, { color: colors.foreground }]}>Community Skip Insights</Text>
                          <Text style={[styles.skipInsightSub, { color: colors.mutedForeground }]}>
                            Private notes from people who passed on visiting — use this to improve.
                          </Text>
                        </View>
                        <View style={[styles.skipInsightBadge, { backgroundColor: "#CA922B18" }]}>
                          <Text style={[styles.skipInsightBadgeTxt, { color: "#CA922B" }]}>{skipFeedback.length}</Text>
                        </View>
                      </View>
                      {skipFeedback.length === 0 ? (
                        <Text style={[styles.skipInsightEmpty, { color: colors.mutedForeground }]}>
                          No skip feedback yet. Enable "Direct Skip Feedback" in the overview tab to start collecting insights.
                        </Text>
                      ) : (
                        skipFeedback.slice(0, 5).map((item) => (
                          <View key={item.id} style={[styles.skipInsightRow, { borderTopColor: colors.border }]}>
                            <Feather name="message-circle" size={13} color={colors.mutedForeground} style={{ marginTop: 2 }} />
                            <Text style={[styles.skipInsightMsg, { color: colors.foreground }]}>{item.message}</Text>
                          </View>
                        ))
                      )}
                      {skipFeedback.length > 5 && (
                        <Text style={[styles.skipInsightMore, { color: colors.mutedForeground }]}>
                          +{skipFeedback.length - 5} more · Generate your Action Plan for AI analysis of all feedback
                        </Text>
                      )}
                    </View>
                  )}

                  {A.tier === "navigator" && (
                    <TouchableOpacity
                      style={[styles.upgradeStrip, { backgroundColor: "#CA922B" }]}
                      onPress={() => router.push("/membership")}
                      activeOpacity={0.85}
                    >
                      <Feather name="award" size={16} color="#CA922B" />
                      <Text style={styles.upgradeStripTxt}>Trailblazer unlocks view trends, full suggestions &amp; engagement insights</Text>
                      <Feather name="chevron-right" size={14} color="#CA922B" />
                    </TouchableOpacity>
                  )}

                  {/* Business Health Score™ — Trailblazer (Premium) only */}
                  {A.tier === "trailblazer" && (() => {
                    const profilePct  = Math.min(Math.round(A.engagementScore * 1.04), 100);
                    const engagePct   = Math.min(A.engagementScore, 100);
                    const sentimentPct = Math.min(Math.round(A.engagementScore * 0.98 + 5), 100);
                    const responsePct = Math.min(Math.round(A.engagementScore * 0.96 + 8), 100);
                    const marketingPct = Math.round(Math.min((A.viewsVsPeersPct / 150) * 100, 95));
                    const marketplacePct = Math.min(Math.round(A.engagementScore * 0.93 + 3), 100);
                    const overallScore = Math.round(
                      (profilePct + engagePct + sentimentPct + responsePct + marketingPct + marketplacePct) / 6
                    );
                    const components = [
                      { emoji: "⭐", label: "Profile completeness", pct: profilePct },
                      { emoji: "📈", label: "Customer engagement",  pct: engagePct },
                      { emoji: "❤️", label: "Review sentiment",     pct: sentimentPct },
                      { emoji: "⏱",  label: "Response time",        pct: responsePct },
                      { emoji: "📢", label: "Marketing activity",   pct: marketingPct },
                      { emoji: "🛍", label: "Marketplace perf.",    pct: marketplacePct },
                    ];
                    const recommendations: string[] = [];
                    if (marketingPct < 80) recommendations.push("Posting one more update this week could increase engagement.");
                    if (responsePct < 90) recommendations.push("Responding to recent reviews may improve your visibility.");
                    if (marketplacePct < 85) recommendations.push("Adding more products could help your marketplace ranking.");
                    return (
                      <View style={[styles.healthScoreCard, { backgroundColor: "#1A0A00", borderColor: "#CA922B30" }]}>
                        <View style={styles.healthScoreHeader}>
                          <Feather name="activity" size={13} color="#CA922B" />
                          <Text style={styles.healthScoreHeaderTxt}>BUSINESS HEALTH SCORE™</Text>
                          <View style={styles.healthScorePremBadge}>
                            <Text style={styles.healthScorePremTxt}>PREMIUM</Text>
                          </View>
                        </View>
                        <View style={styles.healthScoreMain}>
                          <View>
                            <Text style={styles.healthScoreNum}>{overallScore}</Text>
                            <Text style={styles.healthScoreDenom}>/100</Text>
                          </View>
                          <View style={{ flex: 1, gap: 4 }}>
                            {components.slice(0, 3).map((c) => (
                              <View key={c.label} style={styles.healthMiniRow}>
                                <View style={styles.healthMiniBar}>
                                  <View style={[styles.healthMiniBarFill, { width: `${c.pct}%` }]} />
                                </View>
                                <Text style={styles.healthMiniLabel}>{c.emoji} {c.label.split(" ")[0]}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                        <View style={styles.healthComponentsGrid}>
                          {components.map((c) => (
                            <View key={c.label} style={styles.healthCompRow}>
                              <Text style={styles.healthCompEmoji}>{c.emoji}</Text>
                              <Text style={styles.healthCompLabel}>{c.label}</Text>
                              <View style={styles.healthBarWrap}>
                                <View style={[styles.healthBarFill, { width: `${c.pct}%` }]} />
                              </View>
                              <Text style={styles.healthCompPct}>{c.pct}%</Text>
                            </View>
                          ))}
                        </View>
                        {recommendations.length > 0 && (
                          <View style={styles.healthAiSection}>
                            <View style={styles.healthAiHeader}>
                              <Feather name="cpu" size={11} color="#2D7A4F" />
                              <Text style={styles.healthAiHeaderTxt}>KINFOLKAI™ RECOMMENDATIONS</Text>
                            </View>
                            {recommendations.map((rec, i) => (
                              <View key={i} style={styles.healthRecRow}>
                                <Feather name="chevron-right" size={13} color="#CA922B" style={{ marginTop: 1 }} />
                                <Text style={styles.healthRecTxt}>{rec}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })()}

                  {A.tier === "navigator" && (
                    <TouchableOpacity
                      style={[styles.healthScoreLocked, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => router.push("/business-guide" as never)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.healthScoreLockedIcon, { backgroundColor: "#CA922B15" }]}>
                        <Feather name="activity" size={22} color="#CA922B" />
                      </View>
                      <Text style={[styles.healthScoreLockedTitle, { color: colors.foreground }]}>Business Health Score™</Text>
                      <Text style={[styles.healthScoreLockedBody, { color: colors.mutedForeground }]}>
                        A 0–100 composite score across profile, engagement, sentiment, response time, marketing, and marketplace performance — with KinfolkAI™ recommendations.
                      </Text>
                      <View style={[styles.healthScoreLockedCta, { backgroundColor: "#CA922B" }]}>
                        <Text style={styles.healthScoreLockedCtaTxt}>Available on Premium Business</Text>
                        <Feather name="arrow-right" size={13} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Expansion Analysis */}
                  <View style={[styles.expansionCard, { backgroundColor: "#0E1F0E", borderColor: "#2D7A4F30" }]}>
                    <View style={styles.expansionHeader}>
                      <View style={styles.expansionBadge}>
                        <Feather name="trending-up" size={11} color="#FFF" />
                        <Text style={styles.expansionBadgeText}>KinfolkAI™ Expansion</Text>
                      </View>
                      <Text style={[styles.expansionTitle, { color: "#FFF" }]}>Growth & Expansion Vision</Text>
                      <Text style={[styles.expansionSub, { color: "rgba(255,255,255,0.5)" }]}>
                        AI analysis of community demand, market gaps, and strategic expansion opportunities for your business.
                      </Text>
                    </View>

                    {!expansionData && !expansionLoading && (
                      <TouchableOpacity
                        style={[styles.expansionBtn, { backgroundColor: "#2D7A4F" }]}
                        onPress={() => { void generateExpansionAnalysis(); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                        activeOpacity={0.85}
                      >
                        <Feather name="map" size={15} color="#FFF" />
                        <Text style={styles.expansionBtnText}>Analyze Expansion Opportunities</Text>
                      </TouchableOpacity>
                    )}

                    {expansionLoading && (
                      <View style={styles.expansionLoading}>
                        <ActivityIndicator color="#2D7A4F" />
                        <Text style={[styles.expansionLoadingText, { color: "rgba(255,255,255,0.6)" }]}>Analyzing market data…</Text>
                      </View>
                    )}

                    {expansionData && (
                      <View style={styles.expansionResults}>
                        <Text style={[styles.expansionSummary, { color: "rgba(255,255,255,0.8)" }]}>{expansionData.summary}</Text>

                        {expansionData.opportunities.map((opp, idx) => (
                          <View key={idx} style={[styles.expansionOpp, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "#2D7A4F30" }]}>
                            <View style={styles.expansionOppHeader}>
                              <Text style={[styles.expansionCity, { color: "#FFF" }]}>{opp.city}, {opp.state}</Text>
                              <View style={[styles.demandBadge, { backgroundColor: "#2D7A4F30" }]}>
                                <Text style={[styles.demandText, { color: "#2D7A4F" }]}>High Demand</Text>
                              </View>
                            </View>
                            <Text style={[styles.expansionOppTitle, { color: "#4ADE80" }]}>{opp.opportunity}</Text>
                            <Text style={[styles.expansionMarket, { color: "rgba(255,255,255,0.55)" }]}>{opp.marketSignal}</Text>
                            <Text style={[styles.expansionDemand, { color: "rgba(255,255,255,0.4)" }]}>{opp.estimatedDemand}</Text>
                            <View style={styles.expansionSteps}>
                              {opp.actionSteps.map((step, si) => (
                                <View key={si} style={styles.expansionStep}>
                                  <Text style={[styles.expansionStepNum, { color: "#2D7A4F" }]}>{si + 1}</Text>
                                  <Text style={[styles.expansionStepText, { color: "rgba(255,255,255,0.7)" }]}>{step}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}

                        {expansionData.insights.length > 0 && (
                          <>
                            <Text style={[styles.expansionInsightsTitle, { color: "rgba(255,255,255,0.5)" }]}>STRATEGIC INSIGHTS</Text>
                            {expansionData.insights.map((insight, i) => (
                              <View key={i} style={styles.expansionInsightRow}>
                                <Feather name="zap" size={13} color="#2D7A4F" style={{ marginTop: 1 }} />
                                <Text style={[styles.expansionInsightText, { color: "rgba(255,255,255,0.7)" }]}>{insight}</Text>
                              </View>
                            ))}
                          </>
                        )}

                        <TouchableOpacity
                          style={[styles.expansionRefresh, { borderColor: "rgba(45,122,79,0.3)" }]}
                          onPress={() => { setExpansionData(null); void generateExpansionAnalysis(); }}
                          activeOpacity={0.7}
                        >
                          <Feather name="refresh-cw" size={13} color="#2D7A4F" />
                          <Text style={[styles.expansionRefreshText, { color: "#2D7A4F" }]}>Refresh Analysis</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              );
            })()}
          </>
        )}

        {activeTab === "grow" && (
          <>
            {/* ── Policy banner ── */}
            <View style={[styles.growPolicyBanner, { backgroundColor: "#1A0A00", borderColor: "#CA922B30" }]}>
              <View style={styles.growPolicyRow}>
                {[
                  { icon: "star",        color: "#CA922B", label: "Community Trust",  sub: "Earned — never sold" },
                  { icon: "trending-up", color: "#2D7A4F", label: "Promotion",        sub: "Purchased — clearly labeled" },
                  { icon: "search",      color: "#5C3D9E", label: "Relevance",        sub: "Algorithmic — personalized" },
                ].map((s, i) => (
                  <View key={i} style={styles.growPolicyItem}>
                    <View style={[styles.growPolicyIconWrap, { backgroundColor: s.color + "22" }]}>
                      <Feather name={s.icon as any} size={13} color={s.color} />
                    </View>
                    <Text style={[styles.growPolicyItemTitle, { color: "#FFF" }]}>{s.label}</Text>
                    <Text style={[styles.growPolicyItemSub, { color: "rgba(255,255,255,0.45)" }]}>{s.sub}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.growPolicyQuote}>
                "Businesses may purchase visibility — they can never purchase trust."
              </Text>
            </View>

            {growthLoading && !growthTools && (
              <View style={styles.growLoading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}

            {/* ── Eligibility status ── */}
            {growthTools && (
              <View style={[
                styles.growEligibilityCard,
                {
                  backgroundColor: growthTools.eligibility.eligible ? "#2D7A4F0F" : "#FF3B300F",
                  borderColor: growthTools.eligibility.eligible ? "#2D7A4F40" : "#FF3B3040",
                },
              ]}>
                <View style={styles.growEligibilityTop}>
                  <View style={[styles.growEligibilityIcon, {
                    backgroundColor: growthTools.eligibility.eligible ? "#2D7A4F20" : "#FF3B3020",
                  }]}>
                    <Feather
                      name={growthTools.eligibility.eligible ? "check-circle" : "alert-circle"}
                      size={15}
                      color={growthTools.eligibility.eligible ? "#2D7A4F" : "#FF3B30"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.growEligibilityTitle, {
                      color: growthTools.eligibility.eligible ? "#2D7A4F" : "#FF3B30",
                    }]}>
                      {growthTools.eligibility.eligible ? "Eligible for Campaigns" : "Not Eligible for Promotions"}
                    </Text>
                    {growthTools.business.verified && (
                      <Text style={[styles.growEligibilitySub, { color: colors.primary }]}>
                        Verified Business
                      </Text>
                    )}
                    {!growthTools.business.verified && (
                      <Text style={[styles.growEligibilitySub, { color: colors.mutedForeground }]}>
                        Verify your business to unlock all campaign types
                      </Text>
                    )}
                  </View>
                </View>
                {growthTools.eligibility.reasons.map((r, i) => (
                  <Text key={i} style={[styles.growEligibilityReason, { color: "#FF3B30" }]}>{r}</Text>
                ))}
                {growthTools.eligibility.warnings.map((w, i) => (
                  <Text key={i} style={[styles.growEligibilityReason, { color: colors.primary }]}>{w}</Text>
                ))}
              </View>
            )}

            {/* ── Active promotions ── */}
            {growthTools && growthTools.activePromotions.length > 0 && (
              <View style={[styles.growSection, { backgroundColor: colors.card, borderColor: "#2D7A4F40" }]}>
                <View style={styles.growSectionHeader}>
                  <View style={[styles.growActiveBadge, { backgroundColor: "#2D7A4F" }]}>
                    <Text style={styles.growActiveBadgeText}>LIVE</Text>
                  </View>
                  <Text style={[styles.growSectionTitle, { color: colors.foreground }]}>Active Campaigns</Text>
                </View>
                {growthTools.activePromotions.map((promo) => {
                  const tool = growthTools.catalogue.find((c) => c.type === promo.type);
                  const endsDate = promo.endsAt ? new Date(promo.endsAt) : null;
                  return (
                    <View key={promo.id} style={[styles.growActiveRow, { borderColor: colors.border }]}>
                      <View style={[styles.growActiveIcon, { backgroundColor: "#2D7A4F20" }]}>
                        <Feather name={(tool?.icon ?? "trending-up") as any} size={16} color="#2D7A4F" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.growActiveTitle, { color: colors.foreground }]}>{tool?.name ?? promo.type}</Text>
                        {promo.campaignLabel && (
                          <View style={[styles.growSearchLabelChip, { backgroundColor: "#2D7A4F15", borderColor: "#2D7A4F30" }]}>
                            <Text style={[styles.growSearchLabelTxt, { color: "#2D7A4F" }]}>Shows as: {promo.campaignLabel}</Text>
                          </View>
                        )}
                        <Text style={[styles.growActiveExpiry, { color: colors.mutedForeground }]}>
                          {endsDate ? `Expires ${endsDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "Active"}
                        </Text>
                      </View>
                      <View style={[styles.growStatusPill, { backgroundColor: "#2D7A4F20" }]}>
                        <Text style={[styles.growStatusPillText, { color: "#2D7A4F" }]}>Live</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Pending promotions ── */}
            {growthTools && growthTools.pendingPromotions.length > 0 && (
              <View style={[styles.growSection, { backgroundColor: colors.card, borderColor: "#CA922B40" }]}>
                <Text style={[styles.growSectionTitle, { color: colors.mutedForeground }]}>Pending Payment</Text>
                {growthTools.pendingPromotions.map((promo) => {
                  const tool = growthTools.catalogue.find((c) => c.type === promo.type);
                  return (
                    <View key={promo.id} style={[styles.growActiveRow, { borderColor: colors.border }]}>
                      <View style={[styles.growActiveIcon, { backgroundColor: "#CA922B20" }]}>
                        <Feather name={(tool?.icon ?? "clock") as any} size={16} color="#CA922B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.growActiveTitle, { color: colors.foreground }]}>{tool?.name ?? promo.type}</Text>
                        <Text style={[styles.growActiveExpiry, { color: colors.mutedForeground }]}>Awaiting payment confirmation</Text>
                      </View>
                      <View style={[styles.growStatusPill, { backgroundColor: "#CA922B20" }]}>
                        <Text style={[styles.growStatusPillText, { color: "#CA922B" }]}>Pending</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Launch Package — featured card ── */}
            {(() => {
              const catalogue = growthTools?.catalogue ?? DEFAULT_GROWTH_CATALOGUE;
              const pkg = catalogue.find((t) => t.type === "launch_package");
              if (!pkg) return null;
              const isLoading = growthCheckoutLoading === "launch_package";
              const isActive = growthTools?.activePromotions.some((p) => p.type === "launch_package") ?? false;
              return (
                <View style={[styles.growFeaturedCard, { backgroundColor: "#CA922B" }]}>
                  <View style={styles.growFeaturedTop}>
                    <View style={[styles.growFeaturedIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                      <Feather name="zap" size={18} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.growFeaturedTitle}>{pkg.name}</Text>
                      <Text style={styles.growFeaturedSub}>For new and launching businesses</Text>
                    </View>
                    <View style={[styles.growStatusPill, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                      <Text style={[styles.growStatusPillText, { color: "#FFF" }]}>Best Value</Text>
                    </View>
                  </View>
                  <Text style={styles.growFeaturedDesc}>{pkg.description}</Text>
                  {[
                    "30 days featured placement",
                    "Grand Opening badge",
                    "Push notification to nearby members",
                    "Featured in New Businesses",
                    "Social media feature",
                  ].map((f, i) => (
                    <View key={i} style={styles.growFeaturedFeatureRow}>
                      <Feather name="check-circle" size={13} color="rgba(255,255,255,0.85)" />
                      <Text style={styles.growFeaturedFeatureTxt}>{f}</Text>
                    </View>
                  ))}
                  <View style={styles.growToolFooter}>
                    <View>
                      <Text style={[styles.growToolPrice, { color: "#FFF" }]}>{pkg.priceDisplay}</Text>
                      <Text style={[styles.growToolPriceSub, { color: "rgba(255,255,255,0.6)" }]}>one-time · {pkg.durationDays} days</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.growFeaturedBtn, { opacity: isLoading || isActive ? 0.8 : 1 }]}
                      onPress={() => {
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                        if (!isActive) void startGrowthToolCheckout("launch_package");
                      }}
                      activeOpacity={0.8}
                      disabled={isLoading || isActive}
                    >
                      {isLoading
                        ? <ActivityIndicator size="small" color="#CA922B" />
                        : <Text style={styles.growFeaturedBtnTxt}>{isActive ? "Active" : "Launch Now"}</Text>
                      }
                    </TouchableOpacity>
                  </View>
                  <View style={styles.growPaymentNote}>
                    <Feather name="external-link" size={11} color="rgba(255,255,255,0.45)" />
                    <Text style={styles.growPaymentNoteTxt}>Payment opens in your browser — secure checkout via Stripe</Text>
                  </View>
                </View>
              );
            })()}

            {/* ── Campaign categories ── */}
            {(["announce", "updates", "events", "visibility"] as const).map((cat) => {
              const catalogue = growthTools?.catalogue ?? DEFAULT_GROWTH_CATALOGUE;
              const tools = catalogue.filter((t) => t.category === cat && t.type !== "launch_package");
              if (!tools.length) return null;
              const meta = CATEGORY_SECTION_LABELS[cat];
              return (
                <View key={cat}>
                  {/* Category header */}
                  <View style={styles.growCategoryHeader}>
                    <View style={[styles.growCategoryDot, { backgroundColor: meta.color }]} />
                    <Text style={[styles.growCatalogueTitle, { color: colors.foreground, marginTop: 0 }]}>{meta.label}</Text>
                  </View>

                  {tools.map((tool) => {
                    const isActive = growthTools?.activePromotions.some((p) => p.type === tool.type) ?? false;
                    const isLoading = growthCheckoutLoading === tool.type;
                    const eligible = growthTools?.eligibility.eligible ?? true;
                    return (
                      <View key={tool.type} style={[styles.growToolCard, { backgroundColor: colors.card, borderColor: isActive ? "#2D7A4F60" : colors.border }]}>
                        <View style={styles.growToolTop}>
                          <View style={[styles.growToolIcon, { backgroundColor: meta.color + "18" }]}>
                            <Feather name={tool.icon as any} size={18} color={meta.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.growToolName, { color: colors.foreground }]}>{tool.name}</Text>
                            <Text style={[styles.growToolTagline, { color: colors.mutedForeground }]}>{tool.tagline}</Text>
                          </View>
                          {isActive && (
                            <View style={[styles.growStatusPill, { backgroundColor: "#2D7A4F20" }]}>
                              <Text style={[styles.growStatusPillText, { color: "#2D7A4F" }]}>Active</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.growToolDesc, { color: colors.mutedForeground }]}>{tool.description}</Text>

                        {/* Shows as label */}
                        <View style={[styles.growSearchLabelChip, { backgroundColor: meta.color + "10", borderColor: meta.color + "30" }]}>
                          <Text style={[styles.growSearchLabelTxt, { color: meta.color }]}>Shows as: {tool.searchLabel}</Text>
                        </View>

                        <View style={styles.growToolFooter}>
                          <View>
                            <Text style={[styles.growToolPrice, { color: colors.foreground }]}>{tool.priceDisplay}</Text>
                            <Text style={[styles.growToolPriceSub, { color: colors.mutedForeground }]}>
                              {tool.priceCents === 0 ? "application" : `one-time · ${tool.durationDays} days`}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={[styles.growToolBtn, {
                              backgroundColor: isActive
                                ? colors.secondary
                                : (!eligible ? colors.muted : meta.color),
                              opacity: (isLoading || (!eligible && !isActive)) ? 0.6 : 1,
                            }]}
                            onPress={() => {
                              if (Platform.OS !== "web") Haptics.selectionAsync();
                              if (tool.applicationOnly) {
                                Alert.alert(
                                  "Apply for Community Spotlight",
                                  "Email us at support@mappingwithmelanin.com with the subject 'Community Spotlight' and a short note about your business. We review applications within 5 business days.",
                                  [{ text: "OK" }],
                                );
                                return;
                              }
                              void startGrowthToolCheckout(tool.type);
                            }}
                            activeOpacity={0.8}
                            disabled={isLoading || (!eligible && !isActive)}
                          >
                            {isLoading ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <Text style={[styles.growToolBtnText, { color: isActive ? colors.mutedForeground : "#FFF" }]}>
                                {isActive ? "Active" : tool.applicationOnly ? "Apply" : "Launch"}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}

            <View style={[styles.growPaymentFooter, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="shield" size={14} color={colors.mutedForeground} />
              <Text style={[styles.growPaymentFooterTxt, { color: colors.mutedForeground }]}>
                All payments open in your browser — processed securely by Stripe. No payment is taken inside the app.
              </Text>
            </View>

            {/* KinfolkAI Growth Journey — business planning via Life Journey system */}
            <View style={[styles.growJourneyCard, { backgroundColor: "#1A0A28", borderColor: "#7B2D8B30" }]}>
              <View style={styles.growJourneyHeader}>
                <View style={[styles.growJourneyIconWrap, { backgroundColor: "#7B2D8B20" }]}>
                  <Feather name="map" size={20} color="#7B2D8B" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[styles.growJourneyTitle, { color: "#FFF" }]}>KinfolkAI™ Business Journey</Text>
                    <View style={[styles.growJourneyBadge, { backgroundColor: "#7B2D8B" }]}>
                      <Text style={styles.growJourneyBadgeTxt}>NEW</Text>
                    </View>
                  </View>
                  <Text style={[styles.growJourneySub, { color: "rgba(255,255,255,0.5)" }]}>
                    Step-by-step guidance for growth or repair
                  </Text>
                </View>
              </View>
              <Text style={[styles.growJourneyBody, { color: "rgba(255,255,255,0.7)" }]}>
                KinfolkAI™ walks you through every phase of business growth or recovery — from brand identity and operations to community outreach and financial health. Each step is personalised to your business, city, and goals.
              </Text>
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  style={[styles.growJourneyBtn, { backgroundColor: "#7B2D8B" }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({ pathname: "/life-journey", params: { preset: "business-growth" } } as never);
                  }}
                  activeOpacity={0.85}
                >
                  <Feather name="trending-up" size={14} color="#FFF" />
                  <Text style={styles.growJourneyBtnTxt}>Start Growth Journey</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.growJourneyBtn, { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "#7B2D8B40" }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/life-journey", params: { preset: "business-repair" } } as never);
                  }}
                  activeOpacity={0.85}
                >
                  <Feather name="tool" size={14} color="#7B2D8B" />
                  <Text style={[styles.growJourneyBtnTxt, { color: "#7B2D8B" }]}>Repair &amp; Rebuild Plan</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.growJourneyTierRow, { borderTopColor: "rgba(255,255,255,0.06)" }]}>
                <Feather name="award" size={11} color="rgba(255,255,255,0.3)" />
                <Text style={[styles.growJourneyTierTxt, { color: "rgba(255,255,255,0.3)" }]}>
                  Navigator · 10 journeys/mo · Trailblazer · Unlimited
                </Text>
              </View>
            </View>

            {/* AI tools */}
            <Text style={[styles.growCatalogueTitle, { color: colors.foreground, marginTop: 8 }]}>AI-Powered Tools</Text>
            <Text style={[styles.growCatalogueDesc, { color: colors.mutedForeground }]}>
              Included with your business account — powered by KinfolkAI™.
            </Text>

            <TouchableOpacity
              style={[styles.growToolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setActiveTab("insights");
              }}
              activeOpacity={0.85}
            >
              <View style={styles.growToolTop}>
                <View style={[styles.growToolIcon, { backgroundColor: "#7B4F2E20" }]}>
                  <Feather name="edit-3" size={18} color="#7B4F2E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.growToolName, { color: colors.foreground }]}>AI Promotion Writer</Text>
                  <Text style={[styles.growToolTagline, { color: colors.mutedForeground }]}>Generate promo copy, captions & offers</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.growToolDesc, { color: colors.mutedForeground }]}>
                KinfolkAI™ writes promotional copy, social captions, and limited-time offer ideas tailored to your business and customer base.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.growToolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setActiveTab("reviews");
              }}
              activeOpacity={0.85}
            >
              <View style={styles.growToolTop}>
                <View style={[styles.growToolIcon, { backgroundColor: "#442A1920" }]}>
                  <Feather name="message-circle" size={18} color="#442A19" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.growToolName, { color: colors.foreground }]}>AI Review Response</Text>
                  <Text style={[styles.growToolTagline, { color: colors.mutedForeground }]}>Respond to reviews with confidence</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.growToolDesc, { color: colors.mutedForeground }]}>
                Get AI-drafted responses to customer reviews — professional, warm, and true to your brand voice.
              </Text>
            </TouchableOpacity>

            {/* Analytics quick link */}
            <TouchableOpacity
              style={[styles.growToolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setActiveTab("insights");
              }}
              activeOpacity={0.85}
            >
              <View style={styles.growToolTop}>
                <View style={[styles.growToolIcon, { backgroundColor: "#CA922B20" }]}>
                  <Feather name="bar-chart-2" size={18} color="#CA922B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.growToolName, { color: colors.foreground }]}>Business Analytics</Text>
                  <Text style={[styles.growToolTagline, { color: colors.mutedForeground }]}>Views, saves, ratings & peer benchmarks</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.growToolDesc, { color: colors.mutedForeground }]}>
                See how your business compares to peers, track engagement trends, and get personalised suggestions. Available on Navigator and Trailblazer plans.
              </Text>
            </TouchableOpacity>

            <View style={{ height: 16 }} />
          </>
        )}
      </ScrollView>

      {business && (
        <>
          <SellerAgreementModal
            visible={showAgreementModal}
            businessId={business.id}
            businessName={business.name}
            onAccepted={() => {
              setSellerAgreementAccepted(true);
              setShowAgreementModal(false);
            }}
            onClose={() => setShowAgreementModal(false)}
          />
          <BusinessImprovementPlanModal
            visible={showImprovementModal}
            onClose={() => setShowImprovementModal(false)}
            businessId={business.id}
            businessName={business.name}
            businessCategory={business.category}
            businessCity={business.city}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 18,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerBiz: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF" },
  verifyBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 4,
  },
  verifyTxt: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#FFF" },
  settingsBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 16,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23, marginBottom: 8 },
  listBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 28, paddingVertical: 15, borderRadius: 14, width: "100%",
    justifyContent: "center",
  },
  listBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF" },
  verifyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14, width: "100%",
    justifyContent: "center", borderWidth: 1,
  },
  verifyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 20, gap: 0 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statCard: {
    width: "47%", borderRadius: 16, padding: 16, gap: 4, borderWidth: 1,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statChange: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  promoteCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  promoteIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  promoteTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  promoteSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  nudgeCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 10 },
  nudgeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nudgeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  nudgeBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FFF", letterSpacing: 0.4 },
  nudgeHeadline: { fontSize: 15, fontFamily: "Inter_700Bold", lineHeight: 21 },
  nudgeBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  nudgeCaption: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 4 },
  nudgeCaptionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase" },
  nudgeCaptionText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  nudgeCaptionSection: { gap: 2 },
  nudgeCaptionSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nudgeCaptionGenBtn: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  nudgeCaptionChip: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  nudgeCaptionChipText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, flex: 1 },
  nudgeActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  nudgePostBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  nudgePostBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  nudgeNotifyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  nudgeNotifyText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  feedbackToggleCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 24 },
  feedbackToggleIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  feedbackToggleTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  feedbackToggleSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  togglePill: { width: 36, height: 22, borderRadius: 11, justifyContent: "center", paddingHorizontal: 3 },
  toggleDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff" },
  actionCard: {
    width: "30%", borderRadius: 14, padding: 14, alignItems: "center",
    gap: 8, borderWidth: 1,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  noReviews: {
    borderRadius: 14, padding: 24, gap: 10, borderWidth: 1,
    alignItems: "center", marginBottom: 12,
  },
  noReviewsTxt: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  reviewCard: { borderRadius: 14, padding: 16, marginBottom: 12, gap: 10, borderWidth: 1 },
  reviewTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reviewName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reviewStars: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  reviewText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  comingSoon: { alignItems: "center", gap: 12, paddingTop: 60, paddingHorizontal: 32 },
  comingSoonIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  comingSoonTxt: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  comingSoonSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },

  analyticsLoadingTxt: { marginTop: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  retryTxt: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 8 },
  intelligenceBtn: { flexDirection: "row", alignItems: "center", padding: 16 },

  paywallCard: { margin: 20, padding: 24, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 12 },
  paywallIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  paywallTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  paywallBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  paywallBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  paywallBtnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },

  peerNote: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "none", letterSpacing: 0 },

  scoreCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", gap: 16 },
  scoreLeft: { flex: 0.45 },
  scoreTierRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  scoreTierTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  scoreNum: { fontSize: 48, fontFamily: "Inter_700Bold", lineHeight: 52 },
  scoreLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  scoreRight: { flex: 0.55, justifyContent: "center", gap: 10 },
  scoreMiniRow: { gap: 4 },
  scoreMiniBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  scoreMiniBarFill: { height: "100%", borderRadius: 3 },
  scoreMiniLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },

  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 20, marginBottom: 8 },
  metricCard: { flex: 1, minWidth: "44%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  metricIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 4 },
  metricLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },

  compareCard: { marginHorizontal: 20, marginBottom: 8, borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  compareRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  compareRowLabel: { width: 60, fontSize: 12, fontFamily: "Inter_500Medium" },
  compareBarBg: { height: 8, borderRadius: 4, overflow: "hidden", flex: 1, position: "relative" },
  compareBarFill: { height: "100%", borderRadius: 4 },
  compareMidLine: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: "rgba(255,255,255,0.3)" },
  compareRowPct: { width: 44, fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  compareKey: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 },

  trendCard: { marginHorizontal: 20, marginBottom: 8, borderRadius: 14, borderWidth: 1, padding: 16 },
  trendBars: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 110 },
  trendBarCol: { flex: 1, alignItems: "center", gap: 4, justifyContent: "flex-end" },
  trendCount: { fontSize: 10, fontFamily: "Inter_400Regular", height: 14 },
  trendBar: { width: "80%", borderRadius: 4, minHeight: 4 },
  trendDay: { fontSize: 10, fontFamily: "Inter_400Regular" },

  suggCard: { marginHorizontal: 20, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderLeftWidth: 3, padding: 14, flexDirection: "row", gap: 12 },
  suggIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  suggTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 },
  suggTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  suggBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  priorityTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" },

  upgradeStrip: { margin: 20, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  upgradeStripTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: "#CA922B", lineHeight: 18 },
  skipInsightCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 0 },
  skipInsightHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  skipInsightIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  skipInsightTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  skipInsightSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 2 },
  skipInsightBadge: { minWidth: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  skipInsightBadgeTxt: { fontSize: 13, fontFamily: "Inter_700Bold" },
  skipInsightEmpty: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, paddingTop: 4 },
  skipInsightRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingVertical: 10, borderTopWidth: 1 },
  skipInsightMsg: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  skipInsightMore: { fontSize: 12, fontFamily: "Inter_400Regular", paddingTop: 10, textAlign: "center" },

  healthScoreCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 18, gap: 14 },
  healthScoreHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  healthScoreHeaderTxt: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#CA922B", letterSpacing: 1, flex: 1 },
  healthScorePremBadge: { backgroundColor: "#CA922B20", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  healthScorePremTxt: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#CA922B", letterSpacing: 0.8 },
  healthScoreMain: { flexDirection: "row", alignItems: "center", gap: 16 },
  healthScoreNum: { fontSize: 52, fontFamily: "Inter_700Bold", color: "#FFF", lineHeight: 56 },
  healthScoreDenom: { fontSize: 15, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.35)", marginTop: -6 },
  healthMiniRow: { gap: 4 },
  healthMiniBar: { height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  healthMiniBarFill: { height: 4, backgroundColor: "#CA922B", borderRadius: 2 },
  healthMiniLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  healthComponentsGrid: { gap: 9 },
  healthCompRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  healthCompEmoji: { fontSize: 12, width: 18 },
  healthCompLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", width: 138 },
  healthBarWrap: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  healthBarFill: { height: 4, backgroundColor: "#CA922B", borderRadius: 2 },
  healthCompPct: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#CA922B", width: 32, textAlign: "right" },
  healthAiSection: { gap: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)", paddingTop: 12 },
  healthAiHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  healthAiHeaderTxt: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#2D7A4F", letterSpacing: 0.8 },
  healthRecRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  healthRecTxt: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", flex: 1, lineHeight: 17 },
  healthScoreLocked: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 18, gap: 10, alignItems: "center" },
  healthScoreLockedIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  healthScoreLockedTitle: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  healthScoreLockedBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  healthScoreLockedCta: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 11, paddingHorizontal: 18, borderRadius: 50, marginTop: 2 },
  healthScoreLockedCtaTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFF" },

  taglineBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 18 },
  taglineText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, fontStyle: "italic" },

  aiPlanCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, marginTop: 20 },
  aiPlanHeader: { gap: 6 },
  aiPlanBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#CA922B", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  aiPlanBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FFF", letterSpacing: 0.4 },
  aiPlanTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  aiPlanSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  aiPlanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12 },
  aiPlanBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  aiPlanLoading: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  aiPlanLoadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  aiPlanResults: { gap: 12 },
  aiPlanSummary: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  aiPlanItem: { borderLeftWidth: 3, borderRadius: 10, padding: 12, gap: 8 },
  aiPlanItemTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  aiPlanIssue: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  aiPlanPriority: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  aiPlanPriorityText: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  aiPlanCategory: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase" },
  aiPlanStep: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  aiPlanStepDot: { fontSize: 14, lineHeight: 20 },
  aiPlanStepText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, flex: 1 },
  aiPlanMeta: { flexDirection: "row", gap: 14, marginTop: 4 },
  aiPlanMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  aiPlanMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  aiPlanResource: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17 },
  aiPlanRefresh: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  aiPlanRefreshText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  aiInsightCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, marginTop: 4 },
  aiInsightHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  aiInsightBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: "flex-start" },
  aiInsightBadgeTxt: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FFF", letterSpacing: 0.4 },
  aiInsightTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  aiInsightSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 1 },
  aiInsightSummary: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  aiInsightMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  aiInsightMetaTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  aiInsightItem: { borderLeftWidth: 3, borderRadius: 10, padding: 12, gap: 6, backgroundColor: "rgba(255,255,255,0.04)" },
  aiInsightItemTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  aiInsightIssue: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  aiInsightPriority: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  aiInsightPriorityTxt: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  aiInsightBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10 },
  aiInsightBtnTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFF" },

  expansionCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, marginTop: 16 },
  expansionHeader: { gap: 6 },
  expansionBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#2D7A4F", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  expansionBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FFF", letterSpacing: 0.4 },
  expansionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  expansionSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  expansionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12 },
  expansionBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  expansionLoading: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  expansionLoadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  expansionResults: { gap: 12 },
  expansionSummary: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  expansionOpp: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  expansionOppHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  expansionCity: { fontSize: 15, fontFamily: "Inter_700Bold" },
  demandBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  demandText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  expansionOppTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  expansionMarket: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  expansionDemand: { fontSize: 11, fontFamily: "Inter_400Regular" },
  expansionSteps: { gap: 6, marginTop: 4 },
  expansionStep: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  expansionStepNum: { fontSize: 12, fontFamily: "Inter_700Bold", width: 16 },
  expansionStepText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, flex: 1 },
  expansionInsightsTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginTop: 4 },
  expansionInsightRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  expansionInsightText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, flex: 1 },
  expansionRefresh: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  expansionRefreshText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  addrForm: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12, gap: 6 },
  addrLabel: { fontFamily: "Inter_500Medium", fontSize: 11, marginBottom: 2 },
  addrInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 4 },
  addrAlert: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 4 },
  addrAlertText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 17 },
  addrSaveBtn: { borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 8 },
  addrSaveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  addBtnTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  newListingForm: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16, gap: 4 },
  typeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4, marginTop: 4 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  typeChipTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },
  typeTag: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typeTagTxt: { fontSize: 10, fontFamily: "Inter_500Medium" },
  formLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4, marginTop: 8 },
  formInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14 },
  formTextArea: { minHeight: 72, textAlignVertical: "top" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 13, marginTop: 8 },
  saveBtnTxt: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFF" },
  listingRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  listingName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  listingCat: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  listingPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  listingActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  requirementRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 8, borderBottomWidth: 1 },
  requirementDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  requirementLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 2 },
  requirementSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  growHeader: { marginBottom: 20 },
  growTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 6 },
  growSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  growLoading: { alignItems: "center", paddingVertical: 40 },
  growSection: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 12 },
  growSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  growSectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.2 },
  growActiveBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  growActiveBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FFF", letterSpacing: 0.5 },
  growActiveRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 10, borderTopWidth: 1 },
  growActiveIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  growActiveTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  growActiveExpiry: { fontSize: 12, fontFamily: "Inter_400Regular" },
  growStatusPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  growStatusPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  growJourneyCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 12 },
  growJourneyHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  growJourneyIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  growJourneyTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  growJourneyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  growJourneyBadgeTxt: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#FFF", letterSpacing: 0.5 },
  growJourneySub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  growJourneyBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  growJourneyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 11, borderRadius: 12 },
  growJourneyBtnTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  growJourneyTierRow: { flexDirection: "row", alignItems: "center", gap: 5, borderTopWidth: 1, paddingTop: 10, marginTop: 2 },
  growJourneyTierTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  growCatalogueTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 4, marginTop: 8 },
  growCatalogueDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 14 },
  growToolCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 10 },
  growToolTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  growToolIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  growToolName: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  growToolTagline: { fontSize: 12, fontFamily: "Inter_400Regular" },
  growToolDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  growToolFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  growToolPrice: { fontSize: 20, fontFamily: "Inter_700Bold" },
  growToolPriceSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  growToolBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, minWidth: 110, alignItems: "center" },
  growToolBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  growPolicyBanner: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 12 },
  growPolicyRow: { flexDirection: "row", gap: 8 },
  growPolicyItem: { flex: 1, gap: 4 },
  growPolicyIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  growPolicyItemTitle: { fontSize: 11, fontFamily: "Inter_700Bold" },
  growPolicyItemSub: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 14 },
  growPolicyQuote: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", fontStyle: "italic", textAlign: "center", lineHeight: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  growEligibilityCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12, gap: 6 },
  growEligibilityTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  growEligibilityIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  growEligibilityTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  growEligibilitySub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  growEligibilityReason: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, paddingLeft: 4 },
  growSearchLabelChip: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1, marginTop: 6 },
  growSearchLabelTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  growFeaturedCard: { borderRadius: 20, padding: 20, marginBottom: 16, gap: 10 },
  growFeaturedTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  growFeaturedIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  growFeaturedTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFF" },
  growFeaturedSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginTop: 1 },
  growFeaturedDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", lineHeight: 19 },
  growFeaturedFeatureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  growFeaturedFeatureTxt: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.82)" },
  growFeaturedBtn: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, backgroundColor: "#FFF", alignItems: "center", minWidth: 120 },
  growFeaturedBtnTxt: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#CA922B" },
  growPaymentNote: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  growPaymentNoteTxt: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", flex: 1 },
  growCategoryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 4 },
  growCategoryDot: { width: 4, height: 20, borderRadius: 2 },
  growPaymentFooter: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4, marginBottom: 12 },
  growPaymentFooterTxt: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, flex: 1 },
});
