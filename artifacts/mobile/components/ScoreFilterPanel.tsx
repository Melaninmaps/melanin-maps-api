import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const PRESET_CHIPS = [
  { label: "Any", min: 0 },
  { label: "60+", min: 60 },
  { label: "75+", min: 75 },
  { label: "90+", min: 90 },
];

interface FilterState {
  minScore: number;
  verifiedOnly: boolean;
  blackOwnedOnly: boolean;
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function ScoreFilterPanel({ filters, onChange }: Props) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const activeCount = (filters.minScore > 0 ? 1 : 0) + (filters.verifiedOnly ? 1 : 0) + (filters.blackOwnedOnly ? 1 : 0);

  const update = (patch: Partial<FilterState>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ ...filters, ...patch });
  };

  const reset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ minScore: 0, verifiedOnly: false, blackOwnedOnly: false });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded((v) => !v);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Feather name="sliders" size={16} color={colors.primary} />
          <Text style={[styles.headerText, { color: colors.foreground }]}>Filters</Text>
          {activeCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{activeCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {activeCount > 0 && (
            <TouchableOpacity onPress={reset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
            </TouchableOpacity>
          )}
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.body, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Confidence Score</Text>
          <View style={styles.presets}>
            {PRESET_CHIPS.map((p) => (
              <TouchableOpacity
                key={p.label}
                style={[
                  styles.chip,
                  {
                    backgroundColor: filters.minScore === p.min ? colors.primary : colors.secondary,
                    borderColor: filters.minScore === p.min ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => update({ minScore: p.min })}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: filters.minScore === p.min ? "#FBF7F0" : colors.foreground }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => update({ verifiedOnly: !filters.verifiedOnly })}
            activeOpacity={0.8}
          >
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIcon, { backgroundColor: "#2D7A4F18" }]}>
                <Feather name="check-circle" size={15} color="#2D7A4F" />
              </View>
              <View>
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Verified Only</Text>
                <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>Community-verified businesses</Text>
              </View>
            </View>
            <View style={[styles.toggle, { backgroundColor: filters.verifiedOnly ? "#2D7A4F" : colors.border }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: filters.verifiedOnly ? 20 : 2 }] }]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => update({ blackOwnedOnly: !filters.blackOwnedOnly })}
            activeOpacity={0.8}
          >
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIcon, { backgroundColor: "#2D1A0E" }]}>
                <Text style={{ fontSize: 14 }}>✊🏾</Text>
              </View>
              <View>
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Black-Owned Only</Text>
                <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>Show only Black-owned businesses</Text>
              </View>
            </View>
            <View style={[styles.toggle, { backgroundColor: filters.blackOwnedOnly ? "#D4873A" : colors.border }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: filters.blackOwnedOnly ? 20 : 2 }] }]} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#FFFFFF",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clearText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  body: {
    borderTopWidth: 1,
    padding: 14,
    gap: 14,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  presets: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  divider: {
    height: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  toggleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  toggleSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
});
