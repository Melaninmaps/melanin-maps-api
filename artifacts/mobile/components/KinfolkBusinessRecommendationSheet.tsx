import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getBusinessCategoryIcon } from "@/components/BusinessCategoryVisual";

export type KinfolkBusinessRecommendation = {
  id: string;
  name: string;
  category: string | null;
  subcategory?: string | null;
  city: string | null;
  state?: string | null;
  address?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  website?: string | null;
  phone?: string | null;
  verified?: boolean | null;
  claimed?: boolean;
  recommendationReason?: string;
};

type Props = {
  recommendation: KinfolkBusinessRecommendation | null;
  visible: boolean;
  onClose: () => void;
  onViewBusiness: (id: string) => void;
};

const VISUAL = {
  espresso: "#3A1F0E",
  cream: "#FAF6EF",
  paper: "#FFFCF8",
  gold: "#CA922B",
  goldSoft: "#F5D99A",
  green: "#2D7A4F",
  line: "#E8D3BA",
  muted: "#6D5642",
} as const;

function locationLabel(recommendation: KinfolkBusinessRecommendation): string {
  return [recommendation.city, recommendation.state].filter(Boolean).join(", ") || "Location not listed";
}

export function KinfolkBusinessRecommendationSheet({
  recommendation,
  visible,
  onClose,
  onViewBusiness,
}: Props) {
  const insets = useSafeAreaInsets();
  if (!recommendation) return null;

  const categoryIcon = getBusinessCategoryIcon(recommendation.category, recommendation.subcategory);

  const openDirections = () => {
    const destination = [recommendation.address, recommendation.name, locationLabel(recommendation)]
      .filter(Boolean)
      .join(", ");
    if (!destination) return;
    const encoded = encodeURIComponent(destination);
    const url = Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${encoded}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    void Linking.openURL(url).catch(() => undefined);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close recommendation">
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.hero}>
            {recommendation.imageUrl ? (
              <Image
                source={{ uri: recommendation.imageUrl }}
                style={styles.heroImage}
                contentFit="cover"
                accessibilityLabel={`${recommendation.name} business image`}
              />
            ) : (
              <View style={styles.categoryHero} accessibilityLabel={`${recommendation.category ?? "Business"} category visual`}>
                <View style={styles.categoryPlate}>
                  <Feather name={categoryIcon} size={36} color={VISUAL.gold} />
                </View>
              </View>
            )}
            <TouchableOpacity
              onPress={onClose}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel="Close recommendation"
            >
              <Feather name="x" size={20} color={VISUAL.paper} />
            </TouchableOpacity>
          </View>

          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <Text style={styles.eyebrow}>KINFOLK PICK</Text>
              <Text style={styles.name} numberOfLines={2}>{recommendation.name}</Text>
              <Text style={styles.meta} numberOfLines={2}>
                {[recommendation.category, locationLabel(recommendation)].filter(Boolean).join(" · ")}
              </Text>
            </View>
            {recommendation.verified ? (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={12} color={VISUAL.green} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.notice}>
              <View style={styles.noticeIcon}>
                <Feather name="star" size={17} color={VISUAL.espresso} />
              </View>
              <Text style={styles.noticeText}>
                {recommendation.recommendationReason ?? "Kinfolk matched this currently public listing to your request. Confirm details directly with the business before you go."}
              </Text>
            </View>

            {recommendation.description ? <Text style={styles.description}>{recommendation.description}</Text> : null}
            {recommendation.address ? (
              <View style={styles.addressRow}>
                <View style={styles.addressIcon}>
                  <Feather name="map-pin" size={15} color={VISUAL.green} />
                </View>
                <Text style={styles.address}>{recommendation.address}</Text>
              </View>
            ) : null}

            <View style={styles.doubleActions}>
              <TouchableOpacity
                style={[styles.outlineAction, !recommendation.address && styles.disabled]}
                disabled={!recommendation.address}
                onPress={openDirections}
                accessibilityRole="button"
                accessibilityLabel={`Get directions to ${recommendation.name}`}
              >
                <Feather name="navigation" size={17} color={VISUAL.espresso} />
                <Text style={styles.outlineActionText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.outlineAction, !recommendation.website && styles.disabled]}
                disabled={!recommendation.website}
                onPress={() => recommendation.website && void Linking.openURL(recommendation.website).catch(() => undefined)}
                accessibilityRole="link"
                accessibilityLabel={`Open ${recommendation.name} website`}
              >
                <Feather name="external-link" size={17} color={VISUAL.espresso} />
                <Text style={styles.outlineActionText}>Website</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.viewAction}
              onPress={() => { onClose(); onViewBusiness(recommendation.id); }}
              accessibilityRole="button"
              accessibilityLabel={`View ${recommendation.name} profile`}
            >
              <Feather name="briefcase" size={18} color={VISUAL.paper} />
              <Text style={styles.viewActionText}>View Business</Text>
            </TouchableOpacity>
            {recommendation.phone ? (
              <TouchableOpacity
                onPress={() => void Linking.openURL(`tel:${recommendation.phone}`).catch(() => undefined)}
                style={styles.callAction}
                accessibilityRole="link"
                accessibilityLabel={`Call ${recommendation.name}`}
              >
                <Feather name="phone" size={15} color={VISUAL.gold} />
                <Text style={styles.callActionText}>Call {recommendation.phone}</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.disclosure}>
              {recommendation.verified ? "Verified listing" : "Unverified public listing"}{recommendation.claimed ? " · Claimed by the business" : ""}
            </Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(36, 18, 8, 0.46)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: VISUAL.cream,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: 430,
    maxHeight: "90%",
    overflow: "hidden",
  },
  handle: { width: 48, height: 5, borderRadius: 3, alignSelf: "center", marginTop: 11, marginBottom: 11, backgroundColor: VISUAL.line },
  hero: { height: 144, marginHorizontal: 18, borderRadius: 20, overflow: "hidden", backgroundColor: VISUAL.espresso },
  heroImage: { width: "100%", height: "100%" },
  categoryHero: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: VISUAL.espresso },
  categoryPlate: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "#CA922B20", borderWidth: 1, borderColor: "#CA922B78" },
  close: { position: "absolute", top: 10, right: 10, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(36, 18, 8, 0.74)", borderWidth: 1, borderColor: "#FFFFFF38" },
  headingRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingHorizontal: 22, paddingTop: 16, paddingBottom: 6 },
  headingCopy: { flex: 1 },
  eyebrow: { color: VISUAL.gold, fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.15 },
  name: { color: VISUAL.espresso, fontFamily: "Inter_800ExtraBold", fontSize: 25, lineHeight: 30, letterSpacing: -0.4, marginTop: 4 },
  meta: { color: VISUAL.muted, fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20, marginTop: 4 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 9, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, backgroundColor: "#2D7A4F14", borderWidth: 1, borderColor: "#2D7A4F35" },
  verifiedText: { color: VISUAL.green, fontFamily: "Inter_700Bold", fontSize: 10 },
  body: { paddingHorizontal: 22, paddingTop: 16, gap: 14 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderColor: VISUAL.line, backgroundColor: "#F5D99A33", padding: 13, borderRadius: 16 },
  noticeIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: VISUAL.goldSoft, flexShrink: 0 },
  noticeText: { flex: 1, color: VISUAL.espresso, fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 },
  description: { color: VISUAL.muted, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 2 },
  addressIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#2D7A4F14" },
  address: { flex: 1, color: VISUAL.muted, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, paddingTop: 3 },
  doubleActions: { flexDirection: "row", gap: 10 },
  outlineAction: { flex: 1, minHeight: 54, borderWidth: 1, borderColor: VISUAL.line, borderRadius: 16, backgroundColor: VISUAL.paper, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, paddingHorizontal: 8 },
  disabled: { opacity: 0.38 },
  outlineActionText: { color: VISUAL.espresso, fontFamily: "Inter_700Bold", fontSize: 14 },
  viewAction: { minHeight: 58, borderRadius: 18, backgroundColor: VISUAL.espresso, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, shadowColor: VISUAL.espresso, shadowOpacity: 0.16, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  viewActionText: { color: VISUAL.paper, fontFamily: "Inter_800ExtraBold", fontSize: 17 },
  callAction: { alignSelf: "center", minHeight: 38, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12 },
  callActionText: { color: VISUAL.espresso, fontFamily: "Inter_700Bold", fontSize: 14 },
  disclosure: { color: VISUAL.muted, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", paddingBottom: 3 },
});
