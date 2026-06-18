import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  latitude: number;
  longitude: number;
  name: string;
}

export function BusinessMapView({ name }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.placeholder, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <Feather name="map-pin" size={24} color={colors.primary} />
      <Text style={[styles.text, { color: colors.mutedForeground }]}>Map view available in Expo Go</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});
