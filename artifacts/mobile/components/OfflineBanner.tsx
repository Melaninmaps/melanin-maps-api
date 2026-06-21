import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-80)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isOnline) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else if (wasOffline) {
      Animated.timing(translateY, {
        toValue: -80,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, wasOffline, translateY]);

  if (isOnline && !wasOffline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { paddingTop: insets.top + 10, transform: [{ translateY }] },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={isOnline ? "Back online" : "You're offline"}
    >
      <Feather
        name={isOnline ? "wifi" : "wifi-off"}
        size={14}
        color="#FFFFFF"
      />
      <Text style={styles.text}>
        {isOnline ? "Back online" : "You're offline — some features may be unavailable"}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#1A1A1A",
  },
  text: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#FFFFFF",
  },
});
