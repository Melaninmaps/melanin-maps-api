import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import type { Business } from "@/constants/types";
import { RatingStars } from "./RatingStars";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function openSocial(raw: string, baseUrl: string, allowedDomains: readonly string[]) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  try {
    const url = new URL(/^https:\/\//i.test(raw.trim()) ? raw.trim() : `${baseUrl}${raw.trim().replace(/^@/, "")}`);
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (url.protocol !== "https:" || url.username || url.password || !allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      throw new Error("provider mismatch");
    }
    void Linking.openURL(url.toString());
  } catch {
    Alert.alert("Link unavailable", "This social profile link needs to be corrected by the business owner.");
  }
}

function getComplimentChips(business: Business): { label: string; color: string; bg: string }[] {
  const chips: { label: string; color: string; bg: string }[] = [];
  if (business.foundingBusiness) chips.push({ label: "🔑 Founding Member", color: "#92400E", bg: "#FEF3C720" });
  if (business.verified) chips.push({ label: "✓ Verified", color: "#166534", bg: "#DCFCE730" });
  if (business.rating >= 4.5 && business.reviewCount >= 5) chips.push({ label: "⭐ Community Fave", color: "#1D4ED8", bg: "#DBEAFE30" });
  if ((business.wouldReturnAlone ?? 0) > 0.65) chips.push({ label: "👍 Worth the Return", color: "#6D28D9", bg: "#EDE9FE30" });
  if ((business.recommendationRate ?? 0) > 0.8) chips.push({ label: "❤️ Top Pick", color: "#BE123C", bg: "#FFE4E620" });
  return chips;
}

const SOCIAL_PLATFORMS = [
  { key: "tiktok", label: "TikTok", icon: "music" as const, color: "#000000", bg: "#00000015", baseUrl: "https://tiktok.com/@", allowedDomains: ["tiktok.com"] },
  { key: "instagram", label: "Instagram", icon: "instagram" as const, color: "#E1306C", bg: "#E1306C18", baseUrl: "https://instagram.com/", allowedDomains: ["instagram.com"] },
  { key: "youtube", label: "YouTube", icon: "youtube" as const, color: "#FF0000", bg: "#FF000015", baseUrl: "https://youtube.com/@", allowedDomains: ["youtube.com", "youtu.be"] },
  { key: "facebook", label: "Facebook", icon: "facebook" as const, color: "#1877F2", bg: "#1877F218", baseUrl: "https://facebook.com/", allowedDomains: ["facebook.com", "fb.watch"] },
  { key: "twitch", label: "Twitch", icon: "twitch" as const, color: "#9146FF", bg: "#9146FF18", baseUrl: "https://twitch.tv/", allowedDomains: ["twitch.tv"] },
  { key: "snapchat", label: "Snapchat", icon: "camera" as const, color: "#7A6500", bg: "#FFFC001A", baseUrl: "https://snapchat.com/add/", allowedDomains: ["snapchat.com"] },
  { key: "twitter", label: "X / Twitter", icon: "twitter" as const, color: "#1DA1F2", bg: "#1DA1F218", baseUrl: "https://x.com/", allowedDomains: ["x.com", "twitter.com"] },
];

const CATEGORY_IMAGES: Record<string, any> = {
  Food: require("@/assets/images/bento-businesses.jpg"),
  Beauty: require("@/assets/images/bento-nightlife.jpg"),
  Retail: require("@/assets/images/bento-nightlife.jpg"),
  Tech: require("@/assets/images/bento-businesses.jpg"),
  Health: require("@/assets/images/bento-culture.jpg"),
  Legal: require("@/assets/images/bento-businesses.jpg"),
  Finance: require("@/assets/images/bento-businesses.jpg"),
};

interface Props {
  business: Business | null;
  visible: boolean;
  onClose: () => void;
  onViewProfile: () => void;
}

export function BusinessPreviewModal({ business, visible, onClose, onViewProfile }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pinnedCount, setPinnedCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  useEffect(() => {
    if (!visible || !business) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setPinnedCount(null);
        setLoadingCount(true);
      }
      return fetch(`${getApiBase()}/api/saved-places/${business.id}/count`);
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d: { count?: number } | null) => {
        if (!cancelled && d?.count != null) setPinnedCount(d.count);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingCount(false); });
    return () => { cancelled = true; };
  }, [visible, business]);

  const displayedPinnedCount = visible ? pinnedCount : null;

  if (!business) return null;

  const chips = getComplimentChips(business);
  const captions = (business.topCaptions ?? []).slice(0, 4);
  const img = CATEGORY_IMAGES[business.category] ?? CATEGORY_IMAGES["Food"];
  const biz = business as any;
  const activeSocials = SOCIAL_PLATFORMS.filter((s) => !!biz[s.key]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={[s.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
        {/* Drag handle */}
        <View style={[s.handle, { backgroundColor: colors.border }]} />

        <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} bounces={false}>
          {/* Hero */}
          <View style={s.heroWrap}>
            <Image
              source={business.imageUrl ? { uri: business.imageUrl } : img}
              style={s.heroImage}
              contentFit="cover"
            />
            <View style={s.heroOverlay} />
            <View style={s.heroContent}>
              <Text style={s.heroName} numberOfLines={2}>{business.name}</Text>
              <Text style={s.heroCategory}>{business.category}{business.city ? ` · ${business.city}` : ""}</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Feather name="x" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={s.body}>
            {/* Rating row */}
            <View style={s.ratingRow}>
              <RatingStars rating={business.rating} reviewCount={business.reviewCount} size={14} showLabel />
              {/* Pinned count */}
              <View style={[s.pinnedBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                <Feather name="bookmark" size={13} color={colors.primary} />
                {loadingCount ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ width: 30 }} />
                ) : (
                  <Text style={[s.pinnedText, { color: colors.primary }]}>
                    {displayedPinnedCount != null ? `${displayedPinnedCount} pinned` : "Pinned"}
                  </Text>
                )}
              </View>
            </View>

            {/* Specialized rating chips */}
            {chips.length > 0 && (
              <View style={s.section}>
                <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>COMMUNITY RATINGS</Text>
                <View style={s.chipsWrap}>
                  {chips.map((c) => (
                    <View key={c.label} style={[s.chip, { backgroundColor: c.bg, borderColor: c.color + "50" }]}>
                      <Text style={[s.chipText, { color: c.color }]}>{c.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Community captions */}
            {captions.length > 0 && (
              <View style={s.section}>
                <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>COMMUNITY SAYS</Text>
                <View style={s.chipsWrap}>
                  {captions.map((cap) => (
                    <View key={cap} style={[s.chip, { backgroundColor: "#C4622D0F", borderColor: "#C4622D40" }]}>
                      <Text style={[s.chipText, { color: "#C4622D" }]}>&quot;{cap}&quot;</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Social media links */}
            {activeSocials.length > 0 && (
              <View style={s.section}>
                <View style={s.socialHeader}>
                  <Feather name="heart" size={13} color={colors.primary} />
                  <Text style={[s.sectionLabel, { color: colors.mutedForeground, marginBottom: 0 }]}>SUPPORT AT THE SOURCE</Text>
                </View>
                <View style={s.socialsRow}>
                  {activeSocials.map((platform) => (
                    <TouchableOpacity
                      key={platform.key}
                      style={[s.socialBtn, { backgroundColor: platform.bg, borderColor: platform.color + "40" }]}
                      onPress={() => openSocial(biz[platform.key], platform.baseUrl, platform.allowedDomains)}
                      accessibilityRole="link"
                      accessibilityLabel={`Visit ${business.name} on ${platform.label}`}
                    >
                      <Feather name={platform.icon} size={16} color={platform.color} />
                      <Text style={[s.socialBtnLabel, { color: platform.color }]}>{platform.label}</Text>
                      <Feather name="external-link" size={11} color={platform.color} style={{ opacity: 0.7 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* View full profile CTA */}
            <TouchableOpacity
              style={[s.viewBtn, { backgroundColor: colors.primary }]}
              onPress={() => { onClose(); onViewProfile(); }}
              activeOpacity={0.85}
            >
              <Text style={s.viewBtnText}>View Full Profile</Text>
              <Feather name="arrow-right" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#00000060",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  heroWrap: {
    height: 180,
    position: "relative",
    overflow: "hidden",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#00000055",
  },
  heroContent: {
    position: "absolute",
    bottom: 14,
    left: 16,
    right: 56,
  },
  heroName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFF",
    lineHeight: 26,
  },
  heroCategory: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#FFFFFF99",
    marginTop: 3,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#00000050",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 16,
    gap: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  pinnedText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  socialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  socialsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  socialBtnLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  viewBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#FFF",
  },
});
