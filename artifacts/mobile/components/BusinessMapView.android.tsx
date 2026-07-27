import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  latitude: number;
  longitude: number;
  name: string;
}

export function BusinessMapView({ name }: Props) {
  return (
    <View style={styles.map}>
      <Text style={styles.text}>📍 {name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 160,
    borderRadius: 14,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#9CA3AF", fontSize: 14 },
});
