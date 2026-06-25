import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
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

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface Props {
  visible: boolean;
  businessId: string;
  businessName: string;
  onAccepted: () => void;
  onClose: () => void;
}

const PROHIBITED = [
  "Counterfeit, stolen, or infringing goods",
  "Illegal products or services of any kind",
  "Tobacco, alcohol, or vaping products without proper licensing",
  "Prescription medications or controlled substances",
  "Weapons, firearms, or ammunition",
  "Adult or sexually explicit content",
  "Products that misrepresent or exploit Black cultural identity",
  "Pyramid schemes or undisclosed multi-level marketing",
  "Hazardous materials not compliant with shipping regulations",
  "Any item prohibited by applicable federal, state, or local law",
];

const SECTIONS = [
  {
    icon: "users" as const,
    color: "#2D7A4F",
    title: "Who This Agreement Covers",
    body: "This Seller Agreement (\"Agreement\") applies to any individual or business entity (\"Seller\") that lists products, services, or experiences for sale on the Mapping With Melanin™ marketplace. By accepting this Agreement, you represent that you have authority to bind the business to these terms.",
  },
  {
    icon: "check-square" as const,
    color: "#C9922B",
    title: "Product Quality & Accuracy",
    body: "You agree to:\n\n• List only products and services you have the legal right to sell.\n• Provide accurate, complete, and non-misleading descriptions, photos, and pricing.\n• Clearly disclose any material defects, limitations, or conditions.\n• Not misrepresent the origin, quality, or characteristics of any item.\n• Keep listings current — remove or update any listing that becomes inaccurate.",
  },
  {
    icon: "package" as const,
    color: "#3B1F0E",
    title: "Shipping & Fulfillment",
    body: "For physical products:\n\n• Ship within the timeframe stated in your listing, or within 5 business days if no timeframe is stated.\n• Use appropriate packaging to prevent damage in transit.\n• Provide tracking information when available.\n• Notify buyers promptly of any delays, stock-outs, or fulfillment issues.\n\nFor services and digital products, deliver as described and within any stated timeframe.",
  },
  {
    icon: "refresh-ccw" as const,
    color: "#2D7A4F",
    title: "Return & Refund Policy",
    body: "You must:\n\n• Publish a clear return/refund policy on your business profile before making any sales.\n• Honor your stated policy for every transaction.\n• Process any owed refund within 5 business days of a qualifying return or cancellation.\n• Respond to refund or return requests from buyers within 48 hours.\n\nAbsence of a published policy does not exempt you from reasonable buyer remedies.",
  },
  {
    icon: "clock" as const,
    color: "#C9922B",
    title: "Customer Response Time",
    body: "You agree to respond to buyer inquiries, dispute notices, and platform communications within 48 hours of receipt. Failure to respond to a buyer dispute within 72 hours may result in the platform resolving the dispute in the buyer's favor and seeking reimbursement from you.",
  },
  {
    icon: "slash" as const,
    color: "#DC2626",
    title: "Prohibited Products & Services",
    body: "The following are strictly prohibited on the Mapping With Melanin™ marketplace:",
    list: PROHIBITED,
  },
  {
    icon: "file-text" as const,
    color: "#3B1F0E",
    title: "Legal Compliance",
    body: "You agree to:\n\n• Comply with all applicable federal, state, and local laws governing the sale of your products or services, including consumer protection, product safety, labeling, and advertising laws.\n• Obtain and maintain any required licenses, permits, or registrations.\n• Not use the platform to facilitate any unlawful transaction.\n• Cooperate with law enforcement or regulatory authorities when lawfully required.",
  },
  {
    icon: "dollar-sign" as const,
    color: "#2D7A4F",
    title: "Tax Responsibilities",
    body: "You are solely responsible for determining, collecting, reporting, and remitting all taxes applicable to your sales, including sales tax, VAT, income tax, and any other taxes required by law in your jurisdiction or the buyer's jurisdiction.\n\nMapping With Melanin™ does not collect or remit taxes on your behalf unless required by applicable law. Tax information provided during Stripe onboarding is your responsibility to ensure accuracy.",
  },
  {
    icon: "shield" as const,
    color: "#C9922B",
    title: "Indemnification",
    body: "To the fullest extent permitted by law, you agree to defend, indemnify, and hold harmless Mapping With Melanin™, its officers, directors, employees, agents, and partners from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorney's fees) arising from:\n\n• Your products, services, or content.\n• Your violation of this Agreement or any applicable law.\n• Your breach of any buyer's rights.\n• Any claim that your listing infringes a third-party intellectual property right.\n\nThis obligation survives termination of your seller account.",
  },
  {
    icon: "alert-triangle" as const,
    color: "#DC2626",
    title: "Platform Enforcement",
    body: "Mapping With Melanin™ may, at its sole discretion:\n\n• Remove any listing that violates this Agreement.\n• Suspend your selling privileges pending investigation of a complaint.\n• Permanently remove your seller account for repeated or serious violations.\n• Issue refunds to buyers and seek reimbursement from you when violations are substantiated.\n• Report violations to law enforcement when appropriate.\n\nWe will provide reasonable notice before permanent removal except in cases of fraud or illegal activity.",
  },
  {
    icon: "lock" as const,
    color: "#3B1F0E",
    title: "Verification Requirements",
    body: "As a condition of selling on the platform, you have completed or will complete:\n\n• Identity and business verification through our review process.\n• Bank account verification via Stripe Connect Express.\n• Provision of required tax information to Stripe.\n• Agreement to Stripe's Connected Account Agreement.\n\nYou represent that all information provided during verification is accurate and complete.",
  },
];

export function SellerAgreementModal({ visible, businessId, businessName, onAccepted, onClose }: Props) {
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 60;
    if (isNearBottom) setScrolledToBottom(true);
  };

  const handleAccept = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      const res = await fetch(`${base}/api/businesses/${businessId}/seller-agreement`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Failed to record agreement. Try again.");
        return;
      }
      onAccepted();
    } catch {
      setError("Network error. Please check your connection and try again.");
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Seller Agreement</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
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
              <Feather name="shopping-bag" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.preambleTitle, { color: colors.foreground }]}>Marketplace Seller Agreement</Text>
            <Text style={[styles.preambleBody, { color: colors.mutedForeground }]}>
              Before you can list products or services on Mapping With Melanin™, you must read and accept this Seller Agreement.
              It establishes your responsibilities as a seller and protects buyers in our community.
            </Text>
            <Text style={[styles.preambleBusiness, { color: colors.primary }]}>Seller: {businessName}</Text>
            <Text style={[styles.preambleDate, { color: colors.mutedForeground }]}>
              Effective upon acceptance · Last updated June 2026
            </Text>
          </View>

          {/* Agreement sections */}
          {SECTIONS.map((sec) => (
            <View key={sec.title} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.secHeader}>
                <View style={[styles.secIcon, { backgroundColor: sec.color + "18" }]}>
                  <Feather name={sec.icon} size={16} color={sec.color} />
                </View>
                <Text style={[styles.secTitle, { color: colors.foreground }]}>{sec.title}</Text>
              </View>
              <Text style={[styles.secBody, { color: colors.foreground }]}>{sec.body}</Text>
              {sec.list?.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <View style={[styles.bullet, { backgroundColor: sec.color }]} />
                  <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
                </View>
              ))}
            </View>
          ))}

          {/* Scroll prompt */}
          {!scrolledToBottom && (
            <View style={[styles.scrollPrompt, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="chevrons-down" size={16} color={colors.mutedForeground} />
              <Text style={[styles.scrollPromptText, { color: colors.mutedForeground }]}>
                Scroll to read the full agreement before accepting
              </Text>
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: "#DC262618", borderColor: "#DC262640" }]}>
              <Feather name="alert-circle" size={13} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
            By tapping "I Agree", you ({businessName}) accept all terms above and represent you have authority to bind this business.
          </Text>

          <TouchableOpacity
            style={[
              styles.agreeBtn,
              { backgroundColor: scrolledToBottom ? colors.primary : colors.muted },
              saving && { opacity: 0.6 },
            ]}
            onPress={handleAccept}
            disabled={saving || !scrolledToBottom}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Feather name="check" size={16} color="#FFF" />
            )}
            <Text style={styles.agreeBtnText}>
              {saving ? "Recording acceptance…" : scrolledToBottom ? "I Agree to Seller Terms" : "Scroll to read all terms"}
            </Text>
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
  preambleIconBox: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  preambleTitle: { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  preambleBody: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  preambleBusiness: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginTop: 4 },
  preambleDate: { fontFamily: "Inter_400Regular", fontSize: 11 },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  secHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  secIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  secTitle: { fontFamily: "Inter_700Bold", fontSize: 14, flex: 1 },
  secBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingLeft: 4 },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  bulletText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, flex: 1 },
  scrollPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  scrollPromptText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  footer: {
    borderTopWidth: 1,
    padding: 16,
    paddingBottom: Platform.OS === "android" ? 24 : 16,
    gap: 10,
  },
  footerNote: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, textAlign: "center" },
  agreeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  agreeBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFF" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#DC2626", flex: 1 },
});
