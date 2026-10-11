import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

/**
 * Legacy route retained only so old deep links resolve safely. The app no
 * longer requests device location or offers live member-location sharing.
 */
export default function LocationShareScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/safety-hub" as never)}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to Safety Hub"
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Safety & Privacy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.iconWrap}>
            <Feather name="shield" size={28} color="#2563EB" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Live location sharing is not available</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Mapping With Melanin does not share current or recent member locations, show maps of member activity, retain visit history for others, or offer a “who is here now” feature.
          </Text>
          <View style={[styles.notice, { backgroundColor: "#2563EB0F", borderColor: "#2563EB30" }]}>
            <Feather name="check-circle" size={18} color="#2563EB" />
            <Text style={[styles.noticeText, { color: colors.foreground }]}>
              Safety Check-Ins remain private to the member by default. Trusted contacts can receive only the safety notifications a member separately authorizes; these do not include a live location.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/(tabs)/safety-hub" as never)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Return to Safety Hub</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { width: 34, padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20, paddingBottom: 60 },
  card: { borderRadius: 22, borderWidth: 1, padding: 22, alignItems: "center", gap: 16 },
  iconWrap: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: "#2563EB12" },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, textAlign: "center" },
  body: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, textAlign: "center" },
  notice: { width: "100%", flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  noticeText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  button: { width: "100%", alignItems: "center", borderRadius: 14, backgroundColor: "#2563EB", paddingVertical: 14 },
  buttonText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
});
