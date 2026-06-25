import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";

type Props = {
  visible: boolean;
  onClose: () => void;
  feature?: string;
};

const PERKS = [
  "AI-powered travel assistance — KinfolkAI personal guide",
  "Advanced trip planning & unlimited itineraries",
  "Personalized business recommendations",
  "Premium relocation insights for any city",
  "Advanced safety alerts & neighborhood intelligence",
  "Exclusive member events, groups & Premium discounts",
  "Priority customer support + Premium member badge",
];

export function UpgradeModal({ visible, onClose, feature }: Props) {
  const colors = useColors();
  const router = useRouter();

  function openMembership() {
    onClose();
    router.push("/membership");
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Text style={{ fontSize: 26 }}>⭐</Text>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {feature ? `${feature} is Premium` : "Upgrade to Community Premium"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Start your 90-day free trial — no credit card required until your trial ends.
            </Text>
          </View>

          <View style={styles.perks}>
            {PERKS.map((perk, i) => (
              <View key={i} style={styles.perkRow}>
                <Feather name="check-circle" size={14} color="#CA922B" />
                <Text style={[styles.perkText, { color: colors.mutedForeground }]}>{perk}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.trialBadge, { backgroundColor: "#2D7A4F18" }]}>
            <Text style={{ fontSize: 14 }}>🎁</Text>
            <Text style={[styles.trialText, { color: "#2D7A4F" }]}>
              Launch Offer — 90-day free trial for new Premium members
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
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#CA922B18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  perks: {
    gap: 10,
    marginBottom: 16,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  perkText: {
    fontSize: 14,
    flex: 1,
  },
  trialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  trialText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  cta: {
    backgroundColor: "#CA922B",
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  dismiss: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dismissText: {
    fontSize: 14,
  },
});
