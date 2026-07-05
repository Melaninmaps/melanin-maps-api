import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

interface Deal {
  id: string;
  partner: string;
  category: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  iconColor: string;
  tagline: string;
  discount: string;
  detail: string;
  url: string;
  membersOnly: boolean;
  badge?: string;
}

const DEALS: Deal[] = [
  {
    id: "booking",
    partner: "Booking.com",
    category: "Hotels",
    icon: "home",
    iconColor: "#003580",
    tagline: "Hotels, resorts & vacation rentals",
    discount: "Up to 15% off",
    detail: "Exclusive rates on 28M+ properties worldwide — curated to put you near minority-owned businesses.",
    url: "https://www.booking.com",
    membersOnly: false,
    badge: "Most Popular",
  },
  {
    id: "expedia",
    partner: "Expedia",
    category: "Flights & Hotels",
    icon: "send",
    iconColor: "#FFC72C",
    tagline: "Flights, hotels & bundles",
    discount: "10% off bundles",
    detail: "Save when you book flights and hotels together. Great for planning city-hopping itineraries.",
    url: "https://www.expedia.com",
    membersOnly: false,
  },
  {
    id: "enterprise",
    partner: "Enterprise Rent-A-Car",
    category: "Car Rental",
    icon: "truck",
    iconColor: "#007A33",
    tagline: "Car rental at 9,500+ locations",
    discount: "Up to 20% off",
    detail: "Get around your destination comfortably with a dedicated Member discount on all vehicle classes.",
    url: "https://www.enterprise.com",
    membersOnly: true,
    badge: "Members Only",
  },
  {
    id: "viator",
    partner: "Viator",
    category: "Experiences",
    icon: "map-pin",
    iconColor: "#C9922B",
    tagline: "Tours, activities & cultural experiences",
    discount: "10% off bookings",
    detail: "Book Black heritage tours, food experiences, and cultural activities in cities across the US and beyond.",
    url: "https://www.viator.com",
    membersOnly: true,
    badge: "Members Only",
  },
  {
    id: "clear",
    partner: "CLEAR",
    category: "Airport Security",
    icon: "shield",
    iconColor: "#2D7A4F",
    tagline: "Skip the TSA line",
    discount: "$50 off membership",
    detail: "CLEAR gets you through airport security faster with biometric ID. Perfect for frequent travelers.",
    url: "https://www.clearme.com",
    membersOnly: true,
    badge: "Members Only",
  },
  {
    id: "flightclub",
    partner: "Scott's Cheap Flights",
    category: "Flight Deals",
    icon: "compass",
    iconColor: "#7B4F2E",
    tagline: "Mistake fares & cheap flight alerts",
    discount: "Free premium trial",
    detail: "Get email alerts on deeply discounted flights — including international flights for under $400 roundtrip.",
    url: "https://app.goingapp.com",
    membersOnly: false,
  },
  {
    id: "airbnb",
    partner: "Airbnb",
    category: "Stays",
    icon: "heart",
    iconColor: "#FF5A5F",
    tagline: "Unique stays & experiences",
    discount: "$50 travel credit",
    detail: "Stay in minority-owned properties and support community hosts. Credit applied to first qualifying booking.",
    url: "https://www.airbnb.com",
    membersOnly: true,
    badge: "Members Only",
  },
  {
    id: "travelinsurance",
    partner: "Allianz Travel",
    category: "Travel Insurance",
    icon: "umbrella",
    iconColor: "#1D4ED8",
    tagline: "Trip protection you can trust",
    discount: "15% off plans",
    detail: "Protect your trip against cancellations, medical emergencies, and lost luggage — starting at $20.",
    url: "https://www.allianztravelinsurance.com",
    membersOnly: false,
  },
];

const CATEGORIES = ["All", "Hotels", "Flights & Hotels", "Car Rental", "Experiences", "Airport Security", "Flight Deals", "Stays", "Travel Insurance"];

export default function AffiliateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subscription } = useMembership();
  const isMember = !!subscription;

  const [activeCategory, setActiveCategory] = useState("All");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = activeCategory === "All"
    ? DEALS
    : DEALS.filter((d) => d.category === activeCategory);

  const handleDeal = async (deal: Deal) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (deal.membersOnly && !isMember) {
      router.push("/membership");
      return;
    }
    await Linking.openURL(deal.url);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85}
          style={styles.back}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Partner Discounts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {!isMember && (
          <TouchableOpacity
            style={[styles.upsellBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}
            onPress={() => router.push("/membership")}
            activeOpacity={0.85}
          >
            <Feather name="award" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.upsellTitle, { color: colors.primary }]}>Unlock Members-Only Deals</Text>
              <Text style={[styles.upsellSub, { color: colors.mutedForeground }]}>
                Upgrade to Family membership to access exclusive partner discounts on hotels, experiences, and more.
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catPill,
                {
                  backgroundColor: activeCategory === cat ? colors.primary : colors.secondary,
                  borderColor: activeCategory === cat ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.catText, { color: activeCategory === cat ? "#FFFFFF" : colors.foreground }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.dealsList}>
          {filtered.map((deal) => {
            const locked = deal.membersOnly && !isMember;
            return (
              <TouchableOpacity
                key={deal.id}
                style={[styles.dealCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: locked ? 0.85 : 1 }]}
                onPress={() => handleDeal(deal)}
                activeOpacity={0.8}
              >
                <View style={styles.dealTop}>
                  <View style={[styles.dealIcon, { backgroundColor: deal.iconColor + "15" }]}>
                    <Feather name={deal.icon} size={22} color={deal.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.partnerRow}>
                      <Text style={[styles.partnerName, { color: colors.foreground }]}>{deal.partner}</Text>
                      {deal.badge && (
                        <View style={[
                          styles.badge,
                          { backgroundColor: deal.membersOnly ? colors.primary + "18" : "#2D7A4F18" }
                        ]}>
                          <Text style={[
                            styles.badgeText,
                            { color: deal.membersOnly ? colors.primary : "#2D7A4F" }
                          ]}>
                            {deal.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>{deal.category}</Text>
                  </View>
                  <View style={[styles.discountChip, { backgroundColor: "#2D7A4F18" }]}>
                    <Text style={[styles.discountText, { color: "#2D7A4F" }]}>{deal.discount}</Text>
                  </View>
                </View>

                <Text style={[styles.tagline, { color: colors.foreground }]}>{deal.tagline}</Text>
                <Text style={[styles.detail, { color: colors.mutedForeground }]}>{deal.detail}</Text>

                {locked ? (
                  <View style={[styles.lockedRow, { borderColor: colors.border }]}>
                    <Feather name="lock" size={13} color={colors.primary} />
                    <Text style={[styles.lockedText, { color: colors.primary }]}>Upgrade to Family to unlock</Text>
                  </View>
                ) : (
                  <View style={[styles.claimRow, { borderColor: colors.border }]}>
                    <Text style={[styles.claimText, { color: colors.primary }]}>Access deal</Text>
                    <Feather name="external-link" size={13} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Discount availability and terms are set by our partner companies. Mapping With Melanin™ may earn a commission from qualifying purchases at no additional cost to you.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  upsellBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  upsellTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  upsellSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  categoryRow: { gap: 8, paddingBottom: 20, paddingRight: 4 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  dealsList: { gap: 14 },
  dealCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  dealTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  dealIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  partnerRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  partnerName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  categoryLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  discountChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  discountText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tagline: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  detail: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  lockedText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  claimRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  claimText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 12,
  },
});
