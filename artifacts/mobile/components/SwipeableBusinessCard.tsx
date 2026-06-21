import React, { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { BusinessCard } from "./BusinessCard";
import type { Business } from "@/constants/types";
import { useColors } from "@/hooks/useColors";

interface Props {
  business: Business;
  onPress: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export function SwipeableBusinessCard({ business, onPress, isSaved, onToggleSave }: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const colors = useColors();

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleSave();
    swipeRef.current?.close();
  };

  const renderRightAction = (progress: Animated.AnimatedInterpolation<number>) => {
    const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1], extrapolate: "clamp" });
    const opacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.8, 1], extrapolate: "clamp" });
    return (
      <Animated.View style={[styles.actionContainer, { opacity, transform: [{ scale }] }]}>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveAction, { backgroundColor: isSaved ? "#DC2626" : "#CA922B" }]}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? `Remove ${business.name} from saved` : `Save ${business.name}`}
        >
          <Feather name={isSaved ? "bookmark" : "bookmark"} size={22} color="white" />
          <Text style={styles.saveText}>{isSaved ? "Saved ✓" : "Save"}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightAction}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
      containerStyle={styles.container}
    >
      <BusinessCard
        business={business}
        onPress={onPress}
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  actionContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginBottom: 12,
  },
  saveAction: {
    width: 72,
    height: "100%",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  saveText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
});
