import React, { useState } from "react";
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
import { useListings, type Listing } from "@/hooks/useListings";
import { useColors } from "@/hooks/useColors";

interface Props {
  businessId: string;
  businessName: string;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function ListingCard({ listing, onBuy, buying }: { listing: Listing; onBuy: () => void; buying: boolean }) {
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
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{listing.name}</Text>
        {listing.description ? (
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{listing.description}</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(listing.priceInCents, listing.currency)}</Text>
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

export function BusinessListingsSection({ businessId, businessName }: Props) {
  const colors = useColors();
  const { listings, loading, openCheckout } = useListings(businessId);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (listings.length === 0) return null;

  const handleBuy = async (listing: Listing) => {
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
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shop</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {listings.map((l) => (
          <ListingCard
            key={l.id}
            listing={l}
            onBuy={() => void handleBuy(l)}
            buying={buyingId === l.id}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 12, paddingHorizontal: 16 },
  loadingRow: { justifyContent: "center", alignItems: "center", paddingVertical: 16 },
  scroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  card: {
    width: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
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
});
