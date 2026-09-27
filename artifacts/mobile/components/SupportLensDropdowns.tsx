import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  OWNERSHIP_FILTER_OPTIONS,
  replaceSelectedSupportLensOption,
  selectedSupportLensOption,
  SUPPORT_LENS_PRIMARY_OPTIONS,
  SUPPORT_LENS_SECONDARY_OPTIONS,
} from "@workspace/constants";
import { useColors } from "@/hooks/useColors";

type Props = {
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

type Choice = { id: string; label: string };

function choiceLabel(id: string | null, choices: readonly Choice[], fallback: string) {
  return choices.find((choice) => choice.id === id)?.label ?? fallback;
}

export function SupportLensDropdowns({ selected, onChange, disabled = false }: Props) {
  const colors = useColors();
  const [primaryOpen, setPrimaryOpen] = useState(false);
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const primaryId = selectedSupportLensOption(selected, SUPPORT_LENS_PRIMARY_OPTIONS);
  const secondaryId = selectedSupportLensOption(selected, SUPPORT_LENS_SECONDARY_OPTIONS);
  const visibleIds = useMemo(() => new Set([
    ...SUPPORT_LENS_PRIMARY_OPTIONS.map((option) => option.id),
    ...SUPPORT_LENS_SECONDARY_OPTIONS.map((option) => option.id),
  ]), []);
  const retainedSelections = selected.filter((id) => !visibleIds.has(id));
  const additionalVisibleSelections = selected.filter((id) =>
    id !== primaryId && id !== secondaryId && visibleIds.has(id),
  );
  const retainedLabels = [...additionalVisibleSelections, ...retainedSelections]
    .map((id) => OWNERSHIP_FILTER_OPTIONS.find((option) => option.id === id)?.label ?? id);

  const apply = (choices: readonly Choice[], nextId: string | null) => {
    onChange(replaceSelectedSupportLensOption(selected, choices, nextId));
  };

  const renderMenu = (
    choices: readonly Choice[],
    selectedId: string | null,
    onChoose: (nextId: string | null) => void,
    onClose: () => void,
    noneLabel: string,
  ) => (
    <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        accessibilityRole="radio"
        accessibilityState={{ selected: selectedId === null }}
        activeOpacity={0.8}
        disabled={disabled}
        onPress={() => { onChoose(null); onClose(); }}
        style={[styles.option, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.optionText, { color: colors.mutedForeground }]}>{noneLabel}</Text>
        {selectedId === null ? <Feather name="check" size={17} color={colors.primary} /> : null}
      </TouchableOpacity>
      {choices.map((choice) => {
        const active = choice.id === selectedId;
        return (
          <TouchableOpacity
            key={choice.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            activeOpacity={0.8}
            disabled={disabled}
            onPress={() => { onChoose(choice.id); onClose(); }}
            style={[styles.option, { borderBottomColor: colors.border, backgroundColor: active ? colors.primary + "12" : "transparent" }]}
          >
            <Text style={[styles.optionText, { color: colors.foreground }]}>{choice.label}</Text>
            {active ? <Feather name="check" size={17} color={colors.primary} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: colors.foreground }]}>Primary support choice</Text>
      <Text style={[styles.help, { color: colors.mutedForeground }]}>Choose one main ownership designation. Black / African American-Owned appears first, followed by Foundational Black American-Owned and Latino / Hispanic-Owned.</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: primaryOpen }}
        activeOpacity={0.85}
        disabled={disabled}
        onPress={() => setPrimaryOpen((open) => !open)}
        style={[styles.trigger, { backgroundColor: colors.card, borderColor: primaryId ? colors.primary : colors.border }]}
      >
        <Text style={[styles.triggerText, { color: primaryId ? colors.foreground : colors.mutedForeground }]}>{choiceLabel(primaryId, SUPPORT_LENS_PRIMARY_OPTIONS, "Choose a primary support choice")}</Text>
        <Feather name={primaryOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.primary} />
      </TouchableOpacity>
      {primaryOpen ? renderMenu(SUPPORT_LENS_PRIMARY_OPTIONS, primaryId, (next) => apply(SUPPORT_LENS_PRIMARY_OPTIONS, next), () => setPrimaryOpen(false), "No primary choice") : null}

      <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Additional profile badge <Text style={[styles.optional, { color: colors.mutedForeground }]}>optional</Text></Text>
      <Text style={[styles.help, { color: colors.mutedForeground }]}>Add one additional criterion such as Divine Nine-Affiliated or Veteran-Owned.</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: secondaryOpen }}
        activeOpacity={0.85}
        disabled={disabled}
        onPress={() => setSecondaryOpen((open) => !open)}
        style={[styles.trigger, { backgroundColor: colors.card, borderColor: secondaryId ? colors.primary : colors.border }]}
      >
        <Text style={[styles.triggerText, { color: secondaryId ? colors.foreground : colors.mutedForeground }]}>{choiceLabel(secondaryId, SUPPORT_LENS_SECONDARY_OPTIONS, "Add an optional secondary criterion")}</Text>
        <Feather name={secondaryOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.primary} />
      </TouchableOpacity>
      {secondaryOpen ? renderMenu(SUPPORT_LENS_SECONDARY_OPTIONS, secondaryId, (next) => apply(SUPPORT_LENS_SECONDARY_OPTIONS, next), () => setSecondaryOpen(false), "No secondary criterion") : null}

      {retainedLabels.length > 0 ? (
        <Text style={[styles.retained, { color: colors.mutedForeground }]}>Other saved support choices remain active to preserve your preferences: {retainedLabels.join(", ")}. Clear the Support Lens if you want to remove every saved choice.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  label: { fontFamily: "Inter_700Bold", fontSize: 14 },
  optional: { fontFamily: "Inter_400Regular", fontSize: 12 },
  help: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  trigger: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  triggerText: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 18 },
  menu: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  option: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  optionText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13 },
  retained: { marginTop: 8, fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
});
