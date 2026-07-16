import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export const MARKETPLACE_TERMS_KEY = "@melanin_maps_marketplace_terms_v1";

export async function hasAcceptedMarketplaceTerms(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(MARKETPLACE_TERMS_KEY);
    return val === "accepted";
  } catch {
    return false;
  }
}

export async function acceptMarketplaceTerms(): Promise<void> {
  await AsyncStorage.setItem(MARKETPLACE_TERMS_KEY, "accepted");
}

interface Props {
  visible: boolean;
  onAccepted: () => void;
  onClose: () => void;
}

const SECTIONS = [
  {
    icon: "shopping-bag" as const,
    color: "#2D7A4F",
    title: "Who You're Buying From",
    body: "Mapping With Melanin™ is a marketplace that connects you with independent Black-owned businesses. When you make a purchase, your transaction is directly with the business owner — not with Mapping With Melanin™.\n\nThe seller's name is displayed on every listing. You are entering a contract of sale with that business, and they are responsible for fulfilling your order.",
  },
  {
    icon: "refresh-ccw" as const,
    color: "#C9922B",
    title: "Refunds & Returns",
    body: "Each seller sets their own return and refund policy, which is shown to you before you complete checkout. Mapping With Melanin™ does not set or guarantee individual seller policies.\n\nIf a seller has no published policy, you should contact them directly before purchasing. For platform membership refunds (not product purchases), our 7-day refund policy applies — see our full Terms of Service.",
  },
  {
    icon: "alert-circle" as const,
    color: "#3B1F0E",
    title: "How Disputes Are Resolved",
    body: "If you have an unresolved issue with a purchase — such as an item not received, an item not as described, a defective product, or suspected fraud — you can file a dispute through:\n\n• Settings → Orders & Disputes (in-app)\n• Emailing contact@mappingwithmelanin.com\n• Your card issuer (for payment card disputes)\n\nDisputes must be filed within 60 days of purchase. We will contact the seller and mediate in good faith, but we cannot guarantee outcomes in all cases.",
  },
  {
    icon: "shield" as const,
    color: "#2D7A4F",
    title: "What We're Responsible For",
    body: "Mapping With Melanin™ is responsible for:\n\n✓ Processing your payment accurately and securely\n✓ Maintaining records of your transaction\n✓ Facilitating communication between you and sellers\n✓ Investigating fraud reports\n✓ Removing sellers who repeatedly violate platform policies\n✓ Providing a dispute process when issues arise",
  },
  {
    icon: "info" as const,
    color: "#DC2626",
    title: "What We're Not Responsible For",
    body: "Mapping With Melanin™ is not responsible for:\n\n✗ Product quality, safety, or fitness for a particular purpose\n✗ Accurate fulfillment of your order by the seller\n✗ Seller's compliance with their stated return policy\n✗ Delays or failures in shipping or delivery\n✗ Claims arising from the seller's products or conduct\n\nAll sellers on the platform are verified Black-owned businesses, but verification of ownership does not constitute an endorsement of product quality or business practices.",
  },
];

export function MarketplaceTermsModal({ visible, onAccepted, onClose }: Props) {
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);
  const [saving, setSaving] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 60) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    setSaving(true);
    try {
      await acceptMarketplaceTerms();
      onAccepted();
    } catch {
      onAccepted();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={saving}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Marketplace Terms</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
        keyboardDismissMode="on-drag"
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={100}
        >
          {/* Preamble */}
          <View style={[styles.preamble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.preambleIconBox, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="shopping-bag" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.preambleTitle, { color: colors.foreground }]}>
              Before You Shop
            </Text>
            <Text style={[styles.preambleBody, { color: colors.mutedForeground }]}>
              Mapping With Melanin™ connects you with independent Black-owned businesses. Please read these short terms so you know exactly what to expect when you buy.
            </Text>
          </View>

          {SECTIONS.map((sec) => (
            <View key={sec.title} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.secHeader}>
                <View style={[styles.secIcon, { backgroundColor: sec.color + "18" }]}>
                  <Feather name={sec.icon} size={16} color={sec.color} />
                </View>
                <Text style={[styles.secTitle, { color: colors.foreground }]}>{sec.title}</Text>
              </View>
              <Text style={[styles.secBody, { color: colors.foreground }]}>{sec.body}</Text>
            </View>
          ))}

          {!scrolledToBottom && (
            <View style={[styles.scrollHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="chevrons-down" size={14} color={colors.mutedForeground} />
              <Text style={[styles.scrollHintText, { color: colors.mutedForeground }]}>
                Scroll down to read all terms
              </Text>
            </View>
          )}

          <View style={{ height: 8 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
            By tapping "I Understand", you acknowledge you have read and understood these marketplace terms.
          </Text>

          <TouchableOpacity
            style={[
              styles.agreeBtn,
              { backgroundColor: scrolledToBottom ? colors.primary : colors.muted },
              saving && { opacity: 0.6 },
            ]}
            onPress={() => void handleAccept()}
            disabled={saving || !scrolledToBottom}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Feather name="check" size={16} color="#FFF" />
            )}
            <Text style={styles.agreeBtnText}>
              {scrolledToBottom ? "I Understand — Continue Shopping" : "Scroll to read all terms"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  preamble: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  preambleIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  preambleTitle: { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  preambleBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  secHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  secIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secTitle: { fontFamily: "Inter_700Bold", fontSize: 14, flex: 1 },
  secBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  scrollHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  scrollHintText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  footer: {
    borderTopWidth: 1,
    padding: 16,
    paddingBottom: Platform.OS === "android" ? 24 : 16,
    gap: 10,
  },
  footerNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  agreeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  agreeBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFF" },
  cancelBtn: { alignItems: "center", paddingVertical: 6 },
  cancelText: { fontFamily: "Inter_400Regular", fontSize: 13 },
});
