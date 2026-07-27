import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const BURGUNDY = "#4D0E0E";
const GOLD = "#C9922B";

interface Props {
  verified?: boolean;
  size?: "sm" | "md";
}

export function MinorityOwnedBadge({ verified = false, size = "sm" }: Props) {
  const isMd = size === "md";

  return (
    <View style={[styles.badge, isMd ? styles.badgeMd : styles.badgeSm]}>
      <Text style={isMd ? styles.emojiMd : styles.emojiSm}>🏅</Text>
      <Text style={[styles.label, isMd ? styles.labelMd : styles.labelSm]}>
        Minority Owned
      </Text>
      {verified && (
        <View style={styles.verifiedPill}>
          <Feather name="check" size={isMd ? 9 : 8} color={BURGUNDY} />
          <Text style={[styles.verifiedText, isMd ? styles.verifiedMd : styles.verifiedSm]}>
            VERIFIED
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BURGUNDY,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  badgeSm: {
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeMd: {
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  emojiSm: { fontSize: 10 },
  emojiMd: { fontSize: 13 },
  label: {
    fontFamily: "Inter_600SemiBold",
    color: GOLD,
  },
  labelSm: { fontSize: 10 },
  labelMd: { fontSize: 12 },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: GOLD,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedText: {
    fontFamily: "Inter_700Bold",
    color: BURGUNDY,
    letterSpacing: 0.4,
  },
  verifiedSm: { fontSize: 8 },
  verifiedMd: { fontSize: 9 },
});
