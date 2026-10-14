import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/lib/api";

const AUTH_TOKEN_KEY = "auth_session_token";
export type CommunityIntelligenceSuggestion = Readonly<{
  id: string;
  journeyType: "wedding" | "birthday";
  stage: "inspiration";
  intent: "planning";
  categoryKey: string;
  label: string;
  reason: string;
}>;
type SuggestionAction = "helpful" | "not_relevant" | "already_handled";

async function token(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

export function CommunityIntelligenceSuggestionCards({ suggestions }: Readonly<{ suggestions: readonly CommunityIntelligenceSuggestion[] }>) {
  const colors = useColors();
  const [selected, setSelected] = useState<Record<string, SuggestionAction>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  if (suggestions.length === 0) return null;

  const choose = async (suggestionId: string, action: SuggestionAction) => {
    setSelected((current) => ({ ...current, [suggestionId]: action }));
    setSaving(suggestionId);
    setStatus(null);
    try {
      const auth = await token();
      if (!auth) throw new Error("Sign in again before saving feedback.");
      const response = await fetch(`${getApiBase()}/api/kinfolk/community-intelligence/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` },
        body: JSON.stringify({ suggestionId, action }),
      });
      const payload = (await response.json().catch(() => ({}))) as { recorded?: boolean; reason?: string };
      if (!response.ok) throw new Error("That selection could not be saved.");
      setStatus(payload.recorded
        ? "Saved to opted-in Community Intelligence feedback. Your chat text is not included."
        : payload.reason === "collection_disabled"
          ? "Community learning is currently off, so this selection was not collected."
          : "This selection stays private unless you choose participation in Kinfolk Settings.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "That selection could not be saved.");
    } finally { setSaving(null); }
  };

  return <View style={[styles.root, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "34" }]} accessibilityLabel="Community Intelligence planning suggestions">
    <View style={styles.titleRow}><Feather name="compass" color={colors.primary} size={15} /><View style={styles.grow}><Text style={[styles.title, { color: colors.foreground }]}>You might also want to consider…</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Planning details from this conversation — not business recommendations.</Text></View></View>
    {suggestions.map((suggestion) => <View key={suggestion.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.itemTitle, { color: colors.foreground }]}>{suggestion.label}</Text>
      <Text style={[styles.reason, { color: colors.mutedForeground }]}>{suggestion.reason}</Text>
      <View style={styles.actions}>
        <Choice label="Helpful" icon="thumbs-up" selected={selected[suggestion.id] === "helpful"} disabled={saving === suggestion.id} colors={colors} onPress={() => void choose(suggestion.id, "helpful")} />
        <Choice label="Not relevant" icon="thumbs-down" selected={selected[suggestion.id] === "not_relevant"} disabled={saving === suggestion.id} colors={colors} onPress={() => void choose(suggestion.id, "not_relevant")} />
        <Choice label="Already handled" icon="check" selected={selected[suggestion.id] === "already_handled"} disabled={saving === suggestion.id} colors={colors} onPress={() => void choose(suggestion.id, "already_handled")} />
      </View>
      {saving === suggestion.id ? <ActivityIndicator style={styles.loader} size="small" color={colors.primary} /> : null}
    </View>)}
    {status ? <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text> : null}
  </View>;
}

function Choice({ label, icon, selected, disabled, colors, onPress }: Readonly<{ label: string; icon: React.ComponentProps<typeof Feather>["name"]; selected: boolean; disabled: boolean; colors: ReturnType<typeof useColors>; onPress: () => void }>) {
  return <TouchableOpacity disabled={disabled} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected, disabled }} accessibilityLabel={label} style={[styles.choice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.card, opacity: disabled ? 0.55 : 1 }]}><Feather name={icon} size={11} color={selected ? "#fff" : colors.primary} /><Text style={[styles.choiceText, { color: selected ? "#fff" : colors.primary }]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  root: { marginLeft: 42, marginTop: 10, borderWidth: 1, borderRadius: 14, padding: 12, gap: 9 },
  titleRow: { flexDirection: "row", gap: 8 }, grow: { flex: 1 }, title: { fontSize: 13, fontFamily: "Inter_700Bold" }, subtitle: { marginTop: 2, fontSize: 11, lineHeight: 16, fontFamily: "Inter_400Regular" },
  item: { borderWidth: 1, borderRadius: 11, padding: 10 }, itemTitle: { fontSize: 12, fontFamily: "Inter_700Bold" }, reason: { marginTop: 3, fontSize: 11, lineHeight: 16, fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }, choice: { minHeight: 29, borderWidth: 1, borderRadius: 15, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 4 }, choiceText: { fontSize: 10, fontFamily: "Inter_600SemiBold" }, loader: { marginTop: 7, alignSelf: "flex-start" }, status: { fontSize: 10, lineHeight: 15, fontFamily: "Inter_400Regular" },
});
