import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

/**
 * Location-based community intelligence is deliberately retired. This screen
 * remains as a transparent, non-collecting path so stale navigation links do
 * not fall back to device-location reporting.
 */
export default function ReportIntelligenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community Intelligence</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}>
        <View style={[styles.iconWrap, { backgroundColor: "#CA922B18" }]}>
          <Feather name="shield" size={30} color="#CA922B" />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Location-based alerts are unavailable</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Kinfolk does not request, retain, display, or share a member&apos;s current or recent location. Nearby alert maps, location-triggered reporting, and member proximity notifications have been retired.
        </Text>
        <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noticeTitle, { color: colors.foreground }]}>Need to report a safety concern?</Text>
          <Text style={[styles.noticeBody, { color: colors.mutedForeground }]}>Use the moderated report flow and provide only the incident city or a general neighborhood. Do not provide a street address, ZIP code, or device location.</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Report a safety concern without location"
          style={[styles.action, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/report-safety")}
        >
          <Feather name="file-text" size={16} color={colors.primaryForeground} />
          <Text style={[styles.actionText, { color: colors.primaryForeground }]}>Open moderated safety report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  backButton: { width: 36, minHeight: 36, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: 28, paddingTop: 52 },
  iconWrap: { width: 68, height: 68, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 22 },
  title: { fontFamily: "Inter_700Bold", fontSize: 21, textAlign: "center" },
  body: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 12 },
  notice: { width: "100%", borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 28 },
  noticeTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 6 },
  noticeBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  action: { width: "100%", minHeight: 52, borderRadius: 14, marginTop: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  actionText: { fontFamily: "Inter_700Bold", fontSize: 15, textAlign: "center" },
});
