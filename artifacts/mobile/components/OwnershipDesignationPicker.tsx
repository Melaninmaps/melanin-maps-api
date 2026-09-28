import React, { useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { filterOwnershipDesignationSearchOptions } from "@workspace/constants";

export type OwnershipDesignationOption = { id: string; label: string };

type Props = {
  options: readonly OwnershipDesignationOption[];
  selectedIds: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
  label?: string;
  helperText?: string;
};

/**
 * Search-first, bounded selector for documented or owner-provided business
 * designations. It exposes only supplied options and never accepts free text
 * as an ownership claim.
 */
export function OwnershipDesignationPicker({
  options,
  selectedIds,
  onChange,
  maxSelections = 10,
  label = "Ownership designations",
  helperText = "Type a few letters to find a designation, then select it.",
}: Props) {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const suggestions = useMemo(() => {
    const available = options.filter((option) => !selectedIds.includes(option.id));
    if (!normalizedQuery) return available.slice(0, 8);
    return filterOwnershipDesignationSearchOptions(
      available.map((option) => ({ value: option.id, label: option.label })),
      normalizedQuery,
    ).map((option) => ({ id: option.value, label: option.label })).slice(0, 12);
  }, [normalizedQuery, options, selectedIds]);

  function select(id: string) {
    if (selectedIds.includes(id) || selectedIds.length >= maxSelections) return;
    onChange([...selectedIds, id]);
    setQuery("");
    setFocused(false);
  }

  function remove(id: string) {
    onChange(selectedIds.filter((selected) => selected !== id));
  }

  const selected = selectedIds.map((id) => options.find((option) => option.id === id) ?? { id, label: id });
  const showMenu = focused || normalizedQuery.length > 0;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.helper, { color: colors.mutedForeground }]}>{helperText}</Text>
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: focused ? colors.primary : colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            if (Platform.OS !== "web") setTimeout(() => setFocused(false), 140);
          }}
          placeholder="Start typing: Black, Hispanic, Ethiopian…"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search ownership designations"
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
      </View>
      {showMenu && (
        <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLabel="Ownership designation suggestions">
          {suggestions.length > 0 ? suggestions.map((option) => (
            <TouchableOpacity
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={`Add ${option.label}`}
              onPress={() => select(option.id)}
              disabled={selectedIds.length >= maxSelections}
              style={styles.suggestion}
              activeOpacity={0.75}
            >
              <Text style={[styles.suggestionText, { color: colors.foreground }]}>{option.label}</Text>
              <Text style={[styles.addText, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
          )) : (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>No approved designation matches that text.</Text>
          )}
        </View>
      )}
      {selected.length > 0 && (
        <View style={styles.selectedWrap} accessibilityLabel="Selected ownership designations">
          {selected.map((option) => (
            <TouchableOpacity
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${option.label}`}
              onPress={() => remove(option.id)}
              style={[styles.selectedChip, { backgroundColor: colors.primary + "16", borderColor: colors.primary + "55" }]}
              activeOpacity={0.75}
            >
              <Feather name="check" size={12} color={colors.primary} />
              <Text style={[styles.selectedText, { color: colors.foreground }]}>{option.label}</Text>
              <Feather name="x" size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Text style={[styles.count, { color: colors.mutedForeground }]}>{selectedIds.length}/{maxSelections} selected</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 6 },
  helper: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginBottom: 8 },
  searchWrap: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 13 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, paddingVertical: 11 },
  menu: { maxHeight: 260, borderWidth: 1, borderRadius: 12, marginTop: 6, overflow: "hidden" },
  suggestion: { minHeight: 44, paddingHorizontal: 13, paddingVertical: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(43,21,7,0.12)" },
  suggestionText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14 },
  addText: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginLeft: 12 },
  empty: { fontFamily: "Inter_400Regular", fontSize: 13, padding: 13 },
  selectedWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  selectedChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  selectedText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  count: { fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 8 },
});
