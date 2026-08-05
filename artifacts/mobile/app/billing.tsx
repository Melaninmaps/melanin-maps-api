/**
 * Billing screen — SIMPLIFIED for v1.0 free release.
 * No subscription management. Subscriptions will be introduced in v1.1.
 */
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function BillingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.back}
          activeOpacity={0.85}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Billing</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
          <Feather name="credit-card" size={28} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.heading, { color: colors.foreground }]}>No active subscription</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Mapping With Melanin is free to use. Subscription options will be available in a future update.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  sub: { fontSize: 14, textAlign: "center", lineHeight: 21 },
});
