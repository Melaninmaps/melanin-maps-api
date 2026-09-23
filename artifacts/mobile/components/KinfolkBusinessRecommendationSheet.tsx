import { Feather } from "@expo/vector-icons";
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
import { useColors } from "@/hooks/useColors";

export type KinfolkBusinessRecommendation = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  state?: string | null;
  address?: string | null;
  description?: string | null;
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

function locationLabel(recommendation: KinfolkBusinessRecommendation): string {
  return [recommendation.city, recommendation.state].filter(Boolean).join(", ") || "Location not listed";
}

export function KinfolkBusinessRecommendationSheet({
  recommendation,
  visible,
  onClose,
  onViewBusiness,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  if (!recommendation) return null;

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
          style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) + 8 }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>{recommendation.name}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {[recommendation.category, locationLabel(recommendation)].filter(Boolean).join(" · ")}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close recommendation">
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={[styles.notice, { backgroundColor: "#CA922B12", borderColor: "#CA922B45" }]}>
              <Feather name="star" size={20} color="#A66D15" />
              <Text style={[styles.noticeText, { color: colors.foreground }]}>{recommendation.recommendationReason ?? "Kinfolk matched this currently public listing to your request. Confirm details directly with the business before you go."}</Text>
            </View>

            {recommendation.description ? <Text style={[styles.description, { color: colors.mutedForeground }]}>{recommendation.description}</Text> : null}
            {recommendation.address ? (
              <View style={styles.addressRow}>
                <Feather name="map-pin" size={15} color={colors.mutedForeground} />
                <Text style={[styles.address, { color: colors.mutedForeground }]}>{recommendation.address}</Text>
              </View>
            ) : null}

            <View style={styles.doubleActions}>
              <TouchableOpacity
                style={[styles.outlineAction, { borderColor: "#CA922B" }, !recommendation.address && styles.disabled]}
                disabled={!recommendation.address}
                onPress={openDirections}
                accessibilityRole="button"
              >
                <Feather name="navigation" size={17} color="#A66D15" />
                <Text style={styles.outlineActionText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.outlineAction, { borderColor: "#CA922B" }, !recommendation.website && styles.disabled]}
                disabled={!recommendation.website}
                onPress={() => recommendation.website && void Linking.openURL(recommendation.website).catch(() => undefined)}
                accessibilityRole="link"
              >
                <Feather name="external-link" size={17} color="#A66D15" />
                <Text style={styles.outlineActionText}>Website</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.viewAction}
              onPress={() => { onClose(); onViewBusiness(recommendation.id); }}
              accessibilityRole="button"
            >
              <Feather name="briefcase" size={19} color="#fff" />
              <Text style={styles.viewActionText}>View Business</Text>
            </TouchableOpacity>
            {recommendation.phone ? (
              <TouchableOpacity onPress={() => void Linking.openURL(`tel:${recommendation.phone}`).catch(() => undefined)} style={styles.callAction} accessibilityRole="link">
                <Feather name="phone" size={15} color="#A66D15" />
                <Text style={styles.callActionText}>Call {recommendation.phone}</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={[styles.disclosure, { color: colors.mutedForeground }]}>
              {recommendation.verified ? "Verified listing" : "Unverified public listing"}{recommendation.claimed ? " · Claimed by the business" : ""}
            </Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(27, 15, 8, 0.38)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, minHeight: 430, maxHeight: "88%", paddingHorizontal: 22, paddingTop: 11 },
  handle: { width: 48, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 19 },
  headingRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  name: { fontFamily: "Inter_800ExtraBold", fontSize: 29, lineHeight: 35, letterSpacing: -0.5 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 16, lineHeight: 23, marginTop: 5 },
  close: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19 },
  body: { paddingTop: 24, gap: 15 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, padding: 14, borderRadius: 16 },
  noticeText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 21 },
  description: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  address: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  doubleActions: { flexDirection: "row", gap: 12 },
  outlineAction: { flex: 1, minHeight: 58, borderWidth: 2, borderRadius: 18, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, paddingHorizontal: 8 },
  disabled: { opacity: 0.38 },
  outlineActionText: { color: "#A66D15", fontFamily: "Inter_700Bold", fontSize: 15 },
  viewAction: { minHeight: 64, borderRadius: 20, backgroundColor: "#CA922B", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  viewActionText: { color: "#fff", fontFamily: "Inter_800ExtraBold", fontSize: 20 },
  callAction: { alignSelf: "center", minHeight: 38, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12 },
  callActionText: { color: "#A66D15", fontFamily: "Inter_700Bold", fontSize: 14 },
  disclosure: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", paddingBottom: 2 },
});
