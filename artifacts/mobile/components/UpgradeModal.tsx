import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  onClose: () => void;
  feature?: string;
};

const PERKS = [
  "Unlimited saved favorites & personalized recommendations",
  "Enhanced safety insights & neighborhood ratings",
  "Advanced filters by safety score, rating & category",
  "Community-sourced safety reports for your destinations",
  "KinfolkAI Assistant — personalized travel guidance (Trailblazer)",
  "Premium travel itineraries tailored to your style (Trailblazer)",
];

export function UpgradeModal({ visible, onClose, feature }: Props) {
  const colors = useColors();

  function openMembership() {
    onClose();
    Linking.openURL("https://mappingwithmelanin.com/membership");
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Feather name="star" size={22} color="#CA922B" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {feature ? `${feature} is Premium` : "Upgrade to Premium"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Start your free trial — no credit card required until your trial ends.
            </Text>
          </View>

          {/* Perks */}
          <View style={styles.perks}>
            {PERKS.map((perk, i) => (
              <View key={i} style={styles.perkRow}>
                <Feather name="check-circle" size={14} color="#CA922B" />
                <Text style={[styles.perkText, { color: colors.mutedForeground }]}>{perk}</Text>
              </View>
            ))}
          </View>

          {/* Trial badge */}
          <View style={[styles.trialBadge, { backgroundColor: "#CA922B18" }]}>
            <Feather name="clock" size={13} color="#CA922B" />
            <Text style={styles.trialText}>14-day free trial for individual members</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.cta} onPress={openMembership} activeOpacity={0.85}>
            <Text style={styles.ctaText}>View Plans &amp; Start Free Trial</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>

          {/* Dismiss */}
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
    marginBottom: 24,
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
    color: "#CA922B",
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
