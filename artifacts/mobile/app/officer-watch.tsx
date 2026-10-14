import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

/**
 * This route remains intentionally non-operational so old deep links cannot
 * re-enable officer identification, tracking, transfer lists, or alerts.
 * Existing records are not read, altered, or exposed here.
 */
export default function OfficerWatchUnavailableScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.canGoBack() ? router.back() : router.replace("/safety-hub" as never)}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Safety Hub</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: "#991B1B18" }]}>
            <Feather name="shield-off" size={28} color="#991B1B" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Officer tracking is not available</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Mapping With Melanin does not identify, track, list, or send alerts about individual officers or department transfers. This protects people from surveillance, harassment, and unverified allegations.
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            You can submit a city- or region-level Police / ICE observation for private moderation. It does not use your device location, create a public officer record, or send an immediate alert.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open Police and ICE awareness"
            onPress={() => router.replace("/report-police" as never)}
            style={styles.primaryButton}
            activeOpacity={0.85}
          >
            <Feather name="shield" size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>Open Police / ICE Awareness</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Return to Safety Hub"
            onPress={() => router.replace("/safety-hub" as never)}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Return to Safety Hub</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  backButton: { width: 34, padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20, paddingBottom: 60 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", gap: 16 },
  icon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 19, textAlign: "center" },
  body: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, textAlign: "center" },
  primaryButton: { width: "100%", minHeight: 50, borderRadius: 14, backgroundColor: "#991B1B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  primaryButtonText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  secondaryButton: { width: "100%", minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
