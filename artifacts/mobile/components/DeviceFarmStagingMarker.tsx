import Constants from "expo-constants";
import { StyleSheet, Text, View } from "react-native";
import { DEVICE_FARM_TEST_IDS } from "@/lib/deviceFarmSelectors";

/**
 * A deliberately small, non-interactive marker that proves a real-device run
 * uses the isolated staging configuration. It is omitted from every non-staging
 * build and therefore cannot alter the member-facing production experience.
 */
export function DeviceFarmStagingMarker() {
  const environment = Constants.expoConfig?.extra?.environment;
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;

  if (environment !== "staging") return null;

  return (
    <View
      testID={DEVICE_FARM_TEST_IDS.stagingBuildMarker}
      accessibilityLabel="Device Farm staging build"
      pointerEvents="none"
      style={styles.marker}
    >
      <Text style={styles.label}>
        STAGING{typeof releaseChannel === "string" ? ` · ${releaseChannel}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: "absolute",
    top: 8,
    right: 12,
    zIndex: 10000,
    borderRadius: 999,
    backgroundColor: "#1C0E06E6",
    borderColor: "#CA922B",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
