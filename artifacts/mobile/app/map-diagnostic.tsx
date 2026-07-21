/**
 * MAP DIAGNOSTIC SCREEN
 *
 * Minimal MapView with no markers, fetches, overlays, or custom styling.
 * Used to isolate whether react-native-maps itself renders on device
 * before adding production features back layer by layer.
 *
 * Access: navigate to /map-diagnostic from your device
 * (add a button in Profile > Settings during testing, then remove after verified)
 *
 * Watch console for:
 *   MAP_LAYOUT w=<N> h=<N>
 *   MAP_READY
 *   MAP_LOADED
 */
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { PROVIDER_DEFAULT } from "react-native-maps";

export default function MapDiagnosticScreen() {
  const router = useRouter();

  return (
    <View style={styles.outer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Map Diagnostic</Text>
        <Text style={styles.sub}>Minimal render — no markers, overlays, or fetches</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: 39.9526,
            longitude: -75.1652,
            latitudeDelta: 0.18,
            longitudeDelta: 0.18,
          }}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            console.log(`MAP_LAYOUT w=${width} h=${height}`);
          }}
          onMapReady={() => {
            console.log("MAP_READY");
          }}
          onMapLoaded={() => {
            console.log("MAP_LOADED");
          }}
        />
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTxt}>
          If you see Apple Maps tiles, the native module is working.{"\n"}
          Check console for MAP_READY and MAP_LOADED.{"\n"}
          If map is white, check console for errors.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#000" },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#111",
  },
  back: { marginBottom: 8 },
  backTxt: { color: "#CA922B", fontSize: 15 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  sub:   { color: "#999", fontSize: 12 },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  legend: {
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  legendTxt: { color: "#aaa", fontSize: 12, lineHeight: 18 },
});
