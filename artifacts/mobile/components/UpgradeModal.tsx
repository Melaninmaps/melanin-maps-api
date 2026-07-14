import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  onClose: () => void;
  feature?: string;
  reason?: string;
};

const FREE_ALWAYS = [
  { icon: "search" as const,       label: "Search & discover minority-owned businesses" },
  { icon: "star" as const,         label: "Read and leave reviews" },
  { icon: "camera" as const,       label: "Upload photos" },
  { icon: "users" as const,        label: "Join groups & RSVP to events" },
  { icon: "message-circle" as const, label: "Basic messaging" },
  { icon: "shield" as const,       label: "Submit safety, neighborhood & employer surveys" },
  { icon: "heart" as const,        label: "Save businesses & community posts" },
];

const PREMIUM_PERKS = [
  { icon: "cpu" as const,          label: "KinfolkAI — personal AI guide for travel, relocation & discovery" },
  { icon: "map-pin" as const,      label: "Smart Pathways™ — personalized moving, travel & safety plans" },
  { icon: "file-text" as const,    label: "Relocation Intelligence Reports — full city deep-dives" },
  { icon: "bar-chart-2" as const,  label: "Advanced Safety Intelligence — AI summaries, trends & comparisons" },
  { icon: "navigation" as const,   label: "AI Trip Planner — full itineraries built around minority-owned businesses" },
  { icon: "video" as const,        label: "Unlimited video uploads (5 free, unlimited with Premium)" },
  { icon: "award" as const,        label: "Premium member badge & priority support" },
];

export function UpgradeModal({ visible, onClose, feature, reason }: Props) {
  const colors = useColors();
  const router = useRouter();

  function openMembership() {
    onClose();
    router.push("/membership" as never);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Text style={{ fontSize: 26 }}>⭐</Text>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {feature ? `${feature} is Premium` : "Upgrade to Community Premium"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {reason ?? "Community discovery is always free. Premium unlocks personalized intelligence — AI that does the heavy work on your behalf."}
            </Text>
          </View>

          <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
            {/* Always free section */}
            <View style={[styles.freeSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: "#16A34A" }]}>✓ Always free — forever</Text>
              {FREE_ALWAYS.map((item, i) => (
                <View key={i} style={styles.perkRow}>
                  <Feather name={item.icon} size={13} color="#16A34A" />
                  <Text style={[styles.perkText, { color: colors.mutedForeground }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Premium section */}
            <View style={styles.premiumSection}>
              <Text style={[styles.sectionLabel, { color: "#CA922B" }]}>⭐ Premium — intelligence & automation</Text>
              {PREMIUM_PERKS.map((item, i) => (
                <View key={i} style={styles.perkRow}>
                  <Feather name={item.icon} size={13} color="#CA922B" />
                  <Text style={[styles.perkText, { color: colors.foreground }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Trial badge */}
          <View style={[styles.trialBadge, { backgroundColor: "#2D7A4F18" }]}>
            <Text style={{ fontSize: 14 }}>🎁</Text>
            <Text style={[styles.trialText, { color: "#2D7A4F" }]}>
              Launch offer — 90-day free trial, no credit card required
            </Text>
          </View>

          <TouchableOpacity style={styles.cta} onPress={openMembership} activeOpacity={0.85}>
            <Text style={styles.ctaText}>View Plans &amp; Start Free Trial</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismiss} onPress={onClose}>
            <Text style={[styles.dismissText, { color: colors.mutedForeground }]}>Not right now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header: { alignItems: "center", marginBottom: 16 },
  iconBadge: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#CA922B18", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 19, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: "center", lineHeight: 19, paddingHorizontal: 4 },
  freeSection: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10, gap: 7 },
  premiumSection: { gap: 7, marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 4 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  perkText: { fontSize: 13, flex: 1, lineHeight: 17 },
  trialBadge: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginBottom: 16, marginTop: 4 },
  trialText: { fontSize: 13, fontWeight: "600", flex: 1 },
  cta: { backgroundColor: "#CA922B", borderRadius: 50, paddingVertical: 15, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  dismiss: { alignItems: "center", paddingVertical: 6 },
  dismissText: { fontSize: 14 },
});
