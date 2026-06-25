import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useListings, type Listing } from "@/hooks/useListings";
import { useColors } from "@/hooks/useColors";
import {
  MarketplaceTermsModal,
  hasAcceptedMarketplaceTerms,
} from "@/components/MarketplaceTermsModal";

interface Props {
  businessId: string;
  businessName: string;
  returnPolicy?: string | null;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function ListingCard({
  listing,
  onBuy,
  buying,
}: {
  listing: Listing;
  onBuy: () => void;
  buying: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {listing.imageUrl ? (
        <Image source={{ uri: listing.imageUrl }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.muted }]}>
          <Text style={{ fontSize: 32 }}>🛍️</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        {listing.category ? (
          <Text style={[styles.category, { color: colors.mutedForeground }]}>{listing.category}</Text>
        ) : null}
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
          {listing.name}
        </Text>
        {listing.description ? (
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
            {listing.description}
          </Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {formatPrice(listing.priceInCents, listing.currency)}
          </Text>
          <TouchableOpacity
            style={[styles.buyBtn, { backgroundColor: colors.primary }, buying && { opacity: 0.6 }]}
            onPress={onBuy}
            disabled={buying}
            activeOpacity={0.8}
          >
            {buying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buyBtnText}>Buy</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const DISCLAIMER_TEXT =
  "Mapping With Melanin™ is a marketplace. Your purchase is directly with the business owner, " +
  "not with Mapping With Melanin™. The business is responsible for fulfillment and their stated return policy.";

export function BusinessListingsSection({ businessId, businessName, returnPolicy }: Props) {
  const colors = useColors();
  const { listings, loading, openCheckout } = useListings(businessId);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [disclaimerExpanded, setDisclaimerExpanded] = useState(false);

  // Marketplace terms state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  // When terms are accepted, immediately trigger the pending buy if one is queued
  const [pendingListing, setPendingListing] = useState<Listing | null>(null);

  useEffect(() => {
    void hasAcceptedMarketplaceTerms().then(setTermsAccepted);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (listings.length === 0) return null;

  const proceedToCheckout = async (listing: Listing) => {
    const returnNote = returnPolicy
      ? `Return policy: ${returnPolicy}`
      : "This business has not published a return policy. Contact them directly before purchasing.";

    Alert.alert(
      "Before You Buy",
      `You are purchasing from ${businessName}, an independent seller on Mapping With Melanin™.\n\n` +
        `${returnNote}\n\n` +
        "Mapping With Melanin™ is a marketplace and is not the seller of this item.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue to Checkout",
          onPress: async () => {
            setBuyingId(listing.id);
            try {
              const url = await openCheckout(listing);
              if (url) {
                await Linking.openURL(url);
              } else {
                Alert.alert("Oops", "Couldn't open checkout. Try again.");
              }
            } finally {
              setBuyingId(null);
            }
          },
        },
      ]
    );
  };

  const handleBuy = (listing: Listing) => {
    if (!termsAccepted) {
      setPendingListing(listing);
      setShowTermsModal(true);
    } else {
      void proceedToCheckout(listing);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shop</Text>

      {/* Marketplace disclaimer */}
      <TouchableOpacity
        style={[styles.disclaimer, { backgroundColor: colors.secondary, borderColor: colors.border }]}
        onPress={() => setDisclaimerExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.disclaimerRow}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.disclaimerLabel, { color: colors.mutedForeground }]}>
            Marketplace — {businessName} is the seller
          </Text>
          <Feather
            name={disclaimerExpanded ? "chevron-up" : "chevron-down"}
            size={13}
            color={colors.mutedForeground}
          />
        </View>
        {disclaimerExpanded && (
          <Text style={[styles.disclaimerBody, { color: colors.mutedForeground }]}>{DISCLAIMER_TEXT}</Text>
        )}
      </TouchableOpacity>

      {/* Return policy */}
      {returnPolicy ? (
        <View style={[styles.policyBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="refresh-ccw" size={13} color={colors.primary} />
          <Text style={[styles.policyText, { color: colors.foreground }]}>
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>Return policy: </Text>
            {returnPolicy}
          </Text>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {listings.map((l) => (
          <ListingCard
            key={l.id}
            listing={l}
            onBuy={() => handleBuy(l)}
            buying={buyingId === l.id}
          />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.reportRow}
        onPress={() =>
          Alert.alert(
            "Report an Issue",
            "Had a problem with an order? File a dispute through Settings → Orders & Disputes, or contact the business directly.",
            [{ text: "OK" }]
          )
        }
        activeOpacity={0.7}
      >
        <Feather name="flag" size={12} color={colors.mutedForeground} />
        <Text style={[styles.reportText, { color: colors.mutedForeground }]}>
          Problem with an order? Report an issue
        </Text>
      </TouchableOpacity>

      {/* Marketplace terms modal — shown once before first purchase */}
      <MarketplaceTermsModal
        visible={showTermsModal}
        onAccepted={() => {
          setTermsAccepted(true);
          setShowTermsModal(false);
          if (pendingListing) {
            const listing = pendingListing;
            setPendingListing(null);
            void proceedToCheckout(listing);
          }
        }}
        onClose={() => {
          setShowTermsModal(false);
          setPendingListing(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 8, paddingHorizontal: 16 },
  loadingRow: { justifyContent: "center", alignItems: "center", paddingVertical: 16 },
  disclaimer: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  disclaimerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  disclaimerLabel: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  disclaimerBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  policyBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  policyText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  scroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  card: { width: 200, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  cardImage: { width: "100%", height: 120 },
  cardImagePlaceholder: { width: "100%", height: 120, justifyContent: "center", alignItems: "center" },
  cardBody: { padding: 12 },
  category: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", marginBottom: 4 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 4 },
  cardDesc: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8, lineHeight: 17 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  price: { fontFamily: "Inter_700Bold", fontSize: 16 },
  buyBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  buyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  reportText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
