import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useBusinesses } from "@/hooks/useBusinesses";
import type { Business } from "@/constants/types";

const SNOOZE_KEY = "@melanin_nudge_snoozed_until";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

const NUDGE_OPENERS = [
  "New in your area 📍",
  "Community is talking 💬",
  "Worth checking out ✨",
  "Spotted nearby 👀",
  "Fresh on the scene 🌱",
];

export function RecommendationNudge() {
  const colors = useColors();
  const router = useRouter();
  const { businesses } = useBusinesses();
  const [pick, setPick] = useState<Business | null>(null);
  const [opener, setOpener] = useState("");
  const [visible, setVisible] = useState(false);
  const opacity = useState(new Animated.Value(0))[0];

  const checkAndShow = useCallback(async () => {
    try {
      const snoozed = await AsyncStorage.getItem(SNOOZE_KEY);
      if (snoozed && Date.now() < Number(snoozed)) return;

      if (!businesses.length) return;

      const eligible = businesses.filter((b) => b.reviewCount >= 3 && b.rating >= 3.5);
      if (!eligible.length) return;

      const chosen = eligible[Math.floor(Math.random() * eligible.length)];
      const o = NUDGE_OPENERS[Math.floor(Math.random() * NUDGE_OPENERS.length)];

      setPick(chosen);
      setOpener(o);
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: 1800,
        useNativeDriver: true,
      }).start();
    } catch {
      // ignore storage errors
    }
  }, [businesses, opacity]);

  useEffect(() => {
    void checkAndShow();
  }, [checkAndShow]);

  const dismiss = async (snooze: boolean) => {
    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setVisible(false);
    });
    if (snooze) {
      await AsyncStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    }
  };

  if (!visible || !pick) return null;

  return (
    <Animated.View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border, opacity }]}>
      <View style={styles.accent} />
      <View style={styles.content}>
        <Text style={[styles.opener, { color: colors.mutedForeground }]}>{opener}</Text>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{pick.name}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {pick.category} · {pick.city}{pick.state ? `, ${pick.state}` : ""}
        </Text>
        {pick.reviewCount >= 3 && (
          <Text style={[styles.social, { color: colors.mutedForeground }]}>
            {pick.reviewCount} community {pick.reviewCount === 1 ? "voice" : "voices"} · {pick.rating.toFixed(1)} ★
          </Text>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.viewBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            void dismiss(false);
            router.push({ pathname: "/business/[id]", params: { id: pick.id } });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.viewBtnText}>See it →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => dismiss(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.dismissText, { color: colors.mutedForeground }]}>Not now</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => dismiss(false)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="x" size={13} color={colors.mutedForeground} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  accent: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: "#2D7A4F",
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    gap: 2,
  },
  opener: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 0.2,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  meta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  social: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 1,
  },
  actions: {
    alignItems: "center",
    gap: 6,
    paddingRight: 28,
    paddingVertical: 12,
  },
  viewBtn: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  viewBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#fff",
  },
  dismissText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});
