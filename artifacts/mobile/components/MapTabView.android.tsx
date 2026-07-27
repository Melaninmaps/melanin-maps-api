import React from "react";
import { View, Text, StyleSheet } from "react-native";

export function MapTabView() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map coming soon on Android</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C0E06",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#9CA3AF", fontSize: 16 },
});
