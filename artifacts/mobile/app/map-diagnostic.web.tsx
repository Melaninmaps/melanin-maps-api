import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

/**
 * Native map diagnostics rely on react-native-maps, which has no web runtime.
 * Keeping a web-specific route prevents Expo Router's eager route discovery
 * from importing the native module and crashing the entire web preview.
 */
export default function MapDiagnosticWebScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Feather name="map" size={36} color={colors.primary} />
      <Text style={[styles.title, { color: colors.foreground }]}>
        Native map diagnostic
      </Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        This diagnostic is available on iOS and Android devices. The web preview
        uses the browser map experience instead.
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => router.back()}
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
          Go back
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 480,
    textAlign: "center",
  },
  button: {
    borderRadius: 12,
    marginTop: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});