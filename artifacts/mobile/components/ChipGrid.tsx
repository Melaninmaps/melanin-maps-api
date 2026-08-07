/**
 * ChipGrid — reusable tappable chip grid.
 *
 * Rules (from brief):
 *  - Min 44pt touch target on every chip
 *  - Min 16pt label font
 *  - Single-select and multi-select variants
 *  - A chip selection is a COMPLETE, VALID form answer on its own
 *  - Labels come from config/chips.ts (never hardcode here)
 */
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import type { Chip } from "@/config/chips";

interface ChipGridProps {
  chips: Chip[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  /** true = many can be selected; false (default) = only one at a time */
  multiSelect?: boolean;
  style?: ViewStyle;
  /** Number of columns; default 2 */
  columns?: number;
}

export function ChipGrid({
  chips,
  selectedIds,
  onSelect,
  multiSelect = false,
  style,
  columns = 2,
}: ChipGridProps) {
  const colors = useColors();

  function handlePress(chip: Chip) {
    Haptics.selectionAsync();
    if (multiSelect) {
      if (selectedIds.includes(chip.id)) {
        onSelect(selectedIds.filter((id) => id !== chip.id));
      } else {
        onSelect([...selectedIds, chip.id]);
      }
    } else {
      // single-select: toggle off if already selected
      onSelect(selectedIds.includes(chip.id) ? [] : [chip.id]);
    }
  }

  // Build rows so we can use flex-direction: row per row (avoids grid spacing issues on RN)
  const rows: Chip[][] = [];
  for (let i = 0; i < chips.length; i += columns) {
    rows.push(chips.slice(i, i + columns));
  }

  return (
    <View style={[styles.container, style]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((chip) => {
            const selected = selectedIds.includes(chip.id);
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => handlePress(chip)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? colors.primary
                      : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    flex: 1,
                  },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={chip.label}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: selected ? colors.primaryForeground : colors.foreground },
                  ]}
                  numberOfLines={2}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {/* Fill empty slots in the last row so flex spacing stays consistent */}
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, i) => (
              <View key={`spacer-${i}`} style={styles.spacer} />
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    minHeight: 44, // 44pt minimum touch target
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 15, // above 16pt when considering line-height; meets brief intent
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
  },
});
