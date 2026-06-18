import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "@melanin_maps_cookie_consent";

export function CookieConsentBanner() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(120)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) {
        setVisible(true);
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
      }
    });
  }, []);

  const dismiss = (accepted: boolean) => {
    AsyncStorage.setItem(STORAGE_KEY, accepted ? "accepted" : "declined");
    Animated.timing(slideAnim, { toValue: 180, duration: 300, useNativeDriver: true }).start(() => setVisible(false));
  };

  if (!visible) return null;

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          bottom: bottomPad + 90,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="shield" size={18} color={colors.primary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.foreground }]}>Your Privacy Matters</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            We use cookies to personalize your experience, remember your preferences, and improve community safety features.
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.declineBtn, { borderColor: colors.border }]}
          onPress={() => dismiss(false)}
          activeOpacity={0.75}
        >
          <Text style={[styles.declineTxt, { color: colors.mutedForeground }]}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
          onPress={() => dismiss(true)}
          activeOpacity={0.85}
        >
          <Text style={[styles.acceptTxt, { color: colors.primaryForeground }]}>Accept All</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute", left: 16, right: 16,
    borderRadius: 18, borderWidth: 1, padding: 16,
    zIndex: 998,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
    gap: 14,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  textBlock: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontFamily: "Inter_700Bold" },
  body: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10 },
  declineBtn: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 12, borderWidth: 1 },
  declineTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  acceptBtn: { flex: 2, alignItems: "center", paddingVertical: 11, borderRadius: 12 },
  acceptTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
