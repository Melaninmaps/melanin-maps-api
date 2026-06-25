import { Feather, Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSpaceDetail } from "@/hooks/useSpaces";

const TYPE_META: Record<string, { label: string; color: string; icon: keyof typeof Feather.glyphMap }> = {
  rent: { label: "For Rent", color: "#2D7A4F", icon: "home" },
  sale: { label: "For Sale", color: "#7C3AED", icon: "trending-up" },
  business: { label: "Business Space", color: "#C9922B", icon: "briefcase" },
  residential: { label: "Residential", color: "#3B82F6", icon: "heart" },
};

export default function SpaceDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { space, isLoading } = useSpaceDetail(id ?? "");

  if (isLoading || !space) {
    return (
      <View style={[styles.loadWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const meta = TYPE_META[space.spaceType] ?? TYPE_META.rent;
  const locationParts = [space.address, space.neighborhood, space.city, space.state].filter(Boolean);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          Space Detail
        </Text>
        {space.listingUrl ? (
          <TouchableOpacity onPress={() => Linking.openURL(space.listingUrl!)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="external-link" size={19} color={colors.primary} />
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Type + Price badge row */}
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: meta.color + "18" }]}>
            <Feather name={meta.icon} size={13} color={meta.color} />
            <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {space.priceLabel && (
            <Text style={[styles.price, { color: colors.foreground }]}>{space.priceLabel}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>{space.title}</Text>

        {/* Location */}
        {locationParts.length > 0 && (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]}>{locationParts.join(", ")}</Text>
          </View>
        )}

        {/* Sqft */}
        {space.sqft ? (
          <View style={styles.locationRow}>
            <Feather name="maximize-2" size={13} color={colors.mutedForeground} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]}>{space.sqft.toLocaleString()} sqft</Text>
          </View>
        ) : null}

        {/* Description */}
        {space.description ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About this Space</Text>
            <Text style={[styles.descText, { color: colors.mutedForeground }]}>{space.description}</Text>
          </View>
        ) : null}

        {/* View Full Listing CTA */}
        {space.listingUrl ? (
          <TouchableOpacity
            style={[styles.primaryCta, { backgroundColor: meta.color }]}
            onPress={() => Linking.openURL(space.listingUrl!)}
            activeOpacity={0.85}
          >
            <Ionicons name="open-outline" size={18} color="#FBF7F0" />
            <Text style={styles.primaryCtaText}>View Full Listing</Text>
          </TouchableOpacity>
        ) : null}

        {/* Realtor / Agent */}
        {(space.agentName || space.agentPhone || space.agentEmail || space.agentUrl) && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.agentHeader}>
              <View style={[styles.agentAvatar, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="user" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.agentName, { color: colors.foreground }]}>
                  {space.agentName ?? "Real Estate Agent"}
                </Text>
                <Text style={[styles.agentRole, { color: colors.mutedForeground }]}>
                  Realtor / Agent
                </Text>
              </View>
            </View>
            <View style={styles.contactBtns}>
              {space.agentPhone && (
                <TouchableOpacity
                  style={[styles.contactBtn, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F33" }]}
                  onPress={() => Linking.openURL(`tel:${space.agentPhone}`)}
                  activeOpacity={0.8}
                >
                  <Feather name="phone" size={15} color="#2D7A4F" />
                  <Text style={[styles.contactBtnText, { color: "#2D7A4F" }]}>Call Agent</Text>
                </TouchableOpacity>
              )}
              {space.agentEmail && (
                <TouchableOpacity
                  style={[styles.contactBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}
                  onPress={() => Linking.openURL(`mailto:${space.agentEmail}?subject=Inquiry about: ${encodeURIComponent(space.title)}`)}
                  activeOpacity={0.8}
                >
                  <Feather name="mail" size={15} color={colors.primary} />
                  <Text style={[styles.contactBtnText, { color: colors.primary }]}>Email Agent</Text>
                </TouchableOpacity>
              )}
              {space.agentUrl && (
                <TouchableOpacity
                  style={[styles.contactBtn, { backgroundColor: "#7C3AED18", borderColor: "#7C3AED33" }]}
                  onPress={() => Linking.openURL(space.agentUrl!)}
                  activeOpacity={0.8}
                >
                  <Feather name="globe" size={15} color="#7C3AED" />
                  <Text style={[styles.contactBtnText, { color: "#7C3AED" }]}>Agent Website</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Posted by */}
        <Text style={[styles.postedBy, { color: colors.mutedForeground }]}>
          Shared by {space.postedByName ?? "Community Member"} · {new Date(space.createdAt).toLocaleDateString()}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 17 },
  content: { padding: 20, gap: 16 },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  typeBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  price: { fontFamily: "Inter_700Bold", fontSize: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, lineHeight: 30 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -8 },
  locationText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  descText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryCtaText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FBF7F0" },
  agentHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  agentAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  agentName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  agentRole: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  contactBtns: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  contactBtn: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  postedBy: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", marginTop: 4 },
});
