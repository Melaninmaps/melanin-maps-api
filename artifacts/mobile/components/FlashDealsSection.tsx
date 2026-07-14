import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { type FlashDeal } from "@/hooks/useDeals";

interface Props {
  deals: FlashDeal[];
}

function timeLeft(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  return "Ending soon";
}

export function FlashDealsSection({ deals }: Props) {
  const colors = useColors();
  if (deals.length === 0) return null;

  return (
    <View>
      <View style={styles.header}>
        <Feather name="zap" size={16} color="#CA922B" />
        <Text style={[styles.title, { color: colors.foreground }]}>Flash Deals</Text>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
      <ScrollView
        keyboardDismissMode="on-drag"
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {deals.map((deal) => (
          <View key={deal.id} style={[styles.card, { backgroundColor: "#CA922B12", borderColor: "#CA922B30" }]}>
            {deal.discountText && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{deal.discountText}</Text>
              </View>
            )}
            <Text style={[styles.dealTitle, { color: colors.foreground }]}>{deal.title}</Text>
            {deal.description && (
              <Text style={[styles.dealDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {deal.description}
              </Text>
            )}
            {deal.expiresAt && (
              <View style={styles.expiry}>
                <Feather name="clock" size={11} color="#CA922B" />
                <Text style={styles.expiryText}>{timeLeft(deal.expiresAt)}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  title: { fontFamily: "Inter_700Bold", fontSize: 17, flex: 1 },
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#DC262618", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#DC2626" },
  liveText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#DC2626" },
  scroll: { gap: 10, paddingRight: 4 },
  card: {
    borderRadius: 14, borderWidth: 1.5, padding: 14,
    minWidth: 200, maxWidth: 240, gap: 6,
  },
  discountBadge: {
    backgroundColor: "#CA922B", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start",
  },
  discountText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#FFFFFF" },
  dealTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  dealDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  expiry: { flexDirection: "row", alignItems: "center", gap: 4 },
  expiryText: { fontFamily: "Inter_500Medium", fontSize: 11, color: "#CA922B" },
});
