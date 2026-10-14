import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { CONVERSATION_INSTRUCTIONS, type ConversationInstruction } from "@/hooks/useConversationInstruction";

export function KinfolkConversationInstructionControls({ value, onChange, onClear }: {
  value: ConversationInstruction | null;
  onChange: (value: ConversationInstruction) => void;
  onClear: () => void;
}) {
  const colors = useColors();
  const selectedLabel = CONVERSATION_INSTRUCTIONS.find((option) => option.id === value)?.label;
  return (
    <View style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>This conversation only</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Applies to each answer in this chat. Not saved to your profile, memory, or history.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {CONVERSATION_INSTRUCTIONS.map((option) => (
          <TouchableOpacity key={option.id} accessibilityRole="radio" accessibilityState={{ checked: value === option.id }} accessibilityLabel={option.label} onPress={() => onChange(option.id)} style={{ minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: value === option.id ? colors.primary : colors.border, borderRadius: 12, paddingHorizontal: 10 }}>
            <Text style={{ color: colors.text, fontSize: 11 }}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text accessibilityLiveRegion="polite" style={{ flex: 1, color: colors.mutedForeground, fontSize: 11 }}>Current: {selectedLabel ?? "None"}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear conversation instruction" disabled={!value} accessibilityState={{ disabled: !value }} onPress={onClear} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 10 }}>
          <Text style={{ color: value ? colors.primary : colors.mutedForeground, fontSize: 11 }}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
