import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

function SkeletonBox({ style }: { style?: object }) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={[{ opacity }, style]} />;
}

export function SkeletonBusinessCardVertical() {
  const colors = useColors();
  const bg = colors.muted;

  return (
    <View style={[styles.vCard, { backgroundColor: colors.card }]}>
      <SkeletonBox style={[styles.vImage, { backgroundColor: bg }]} />
      <View style={styles.vContent}>
        <SkeletonBox style={[styles.line, { width: "70%", backgroundColor: bg }]} />
        <SkeletonBox style={[styles.lineShort, { width: "40%", backgroundColor: bg, marginTop: 6 }]} />
        <SkeletonBox style={[styles.lineShort, { width: "55%", backgroundColor: bg, marginTop: 6 }]} />
        <SkeletonBox style={[styles.lineShort, { width: "30%", backgroundColor: bg, marginTop: 8 }]} />
      </View>
    </View>
  );
}

export function SkeletonBusinessCardHorizontal() {
  const colors = useColors();
  const bg = colors.muted;

  return (
    <View style={[styles.hCard, { backgroundColor: colors.card }]}>
      <SkeletonBox style={[styles.hImage, { backgroundColor: bg }]} />
      <View style={styles.hContent}>
        <SkeletonBox style={[styles.line, { width: "80%", backgroundColor: bg }]} />
        <SkeletonBox style={[styles.lineShort, { width: "45%", backgroundColor: bg, marginTop: 6 }]} />
        <SkeletonBox style={[styles.lineShort, { width: "60%", backgroundColor: bg, marginTop: 6 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  vCard: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    elevation: 1,
  },
  vImage: { width: 90, height: 100 },
  vContent: { flex: 1, padding: 12, gap: 2 },
  hCard: {
    width: 220,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 1,
  },
  hImage: { width: "100%", height: 130 },
  hContent: { padding: 12, gap: 4 },
  line: { height: 14, borderRadius: 7 },
  lineShort: { height: 11, borderRadius: 6 },
});
