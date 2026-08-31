import React, { useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { BusinessCard } from "./BusinessCard";
import { SkipFeedbackModal } from "./SkipFeedbackModal";
import type { Business } from "@/constants/types";

interface Props {
  business: Business;
  onPress: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export function SwipeableBusinessCard({ business, onPress, isSaved, onToggleSave }: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleSave();
    swipeRef.current?.close();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    swipeRef.current?.close();
    if (business.feedbackOptIn) {
      setShowFeedback(true);
    }
  };

  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1], extrapolate: "clamp" });
    const opacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.8, 1], extrapolate: "clamp" });
    return (
      <Animated.View style={[styles.actionContainer, { opacity, transform: [{ scale }] }]}>
        <TouchableOpacity
          onPress={handleSkip}
          style={[styles.skipAction, { backgroundColor: "#6B7280" }]}
          accessibilityRole="button"
          accessibilityLabel={`Skip ${business.name}`}
        >
          <Feather name="skip-forward" size={20} color="white" />
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
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
    <>
      <Swipeable
        ref={swipeRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        leftThreshold={40}
        rightThreshold={40}
        overshootLeft={false}
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

      {showFeedback && (
        <SkipFeedbackModal
          visible={showFeedback}
          businessId={business.id}
          businessName={business.name}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  actionContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  saveAction: {
    width: 72,
    height: "100%",
    marginLeft: 8,
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
  skipAction: {
    width: 72,
    height: "100%",
    marginRight: 8,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  skipText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
});
