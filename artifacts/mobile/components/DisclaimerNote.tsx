import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

type DisclaimerId =
  | "general" | "medical" | "legal" | "financial" | "employment"
  | "safety" | "travel" | "ai" | "community" | "business"
  | "emergency" | "resource" | "external" | "promotions" | "recognition";

const SHORT: Record<DisclaimerId, string> = {
  general:     "Information is for general purposes only. Verify before making important decisions.",
  medical:     "We do not provide medical advice. Consult a qualified healthcare professional.",
  legal:       "We do not provide legal advice. Consult a licensed attorney for your circumstances.",
  financial:   "Financial resources are informational only. Verify eligibility with the sponsoring organization.",
  employment:  "Employer reviews reflect individual user experiences. Exercise your own judgment.",
  safety:      "Safety ratings are community-sourced and may not reflect current conditions.",
  travel:      "Travel details may change without notice. Confirm directly with the business or organization.",
  ai:          "KinfolkAI responses may contain inaccuracies. Do not rely on them as professional advice.",
  community:   "Posts and reviews belong to their authors and do not reflect the views of MWM™.",
  business:    "Verification confirms requirements met at time of review — not an endorsement of future conduct.",
  emergency:   "We are not an emergency service. If you are in danger, call 911 or local emergency services.",
  resource:    "Listed resources are for discovery only. Inclusion is not an endorsement.",
  external:    "External links are provided for convenience. We are not responsible for third-party content.",
  promotions:  "Sponsored content is clearly identified and does not affect our community-first commitment.",
  recognition: "Badges and rankings celebrate engagement — not endorsements or quality guarantees.",
};

interface Props {
  type: DisclaimerId;
  style?: object;
}

export function DisclaimerNote({ type, style }: Props) {
  const colors = useColors();
  const router = useRouter();
  const text = SHORT[type];

  return (
    <View style={[styles.container, { backgroundColor: colors.muted, borderColor: colors.border }, style]}>
      <Feather name="alert-circle" size={14} color="#CA922B" style={styles.icon} />
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        {text}{" "}
        <Text
          style={styles.link}
          onPress={() => router.push(`/trust-and-safety?section=${type}` as never)}
        >
          Full disclaimer
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  icon: {
    marginTop: 1,
    flexShrink: 0,
  },
  text: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  link: {
    color: "#CA922B",
    fontWeight: "600",
  },
});
