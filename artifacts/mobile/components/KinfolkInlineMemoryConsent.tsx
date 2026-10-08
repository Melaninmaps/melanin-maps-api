import * as SecureStore from "expo-secure-store";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Switch, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getApiBase } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export type KinfolkInlineMemoryConsentPlan = {
  purpose: string;
  ordinary: Array<{ id: string; label: string; content: string }>;
  sensitive: Array<{ id: string; label: string; content: string }>;
};

export function KinfolkInlineMemoryConsent({
  message,
  plan,
  sessionId,
  onSaved,
  onDismiss,
}: {
  message: string;
  plan: KinfolkInlineMemoryConsentPlan;
  sessionId?: string | null;
  onSaved: () => void;
  onDismiss: () => void;
}) {
  const colors = useColors();
  const allItems = useMemo(() => [...plan.ordinary, ...plan.sensitive], [plan]);
  const [selected, setSelected] = useState<string[]>([]);
  const [sensitiveConsent, setSensitiveConsent] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (ids: string[]) => {
    if (!ids.length) return;
    const includesSensitive = plan.sensitive.some((item) => ids.includes(item.id));
    if (includesSensitive && !sensitiveConsent) {
      setError("Confirm the sensitive details separately before saving them.");
      return;
    }
    setSaving(true); setError("");
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) throw new Error("Sign in to save a private memory.");
      const response = await fetch(`${getApiBase()}/api/kinfolk/memory-consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ consent: true, sensitiveConsent: includesSensitive, message, selectedIds: ids, sessionId: sessionId ?? undefined }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kinfolk could not save the selected details.");
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Kinfolk could not save the selected details."); }
    finally { setSaving(false); }
  };

  const toggle = (id: string) => setSelected((current) => current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]);

  return <View testID="kinfolk-inline-memory-consent" style={{ marginHorizontal: 14, marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.primary + "55", backgroundColor: colors.primary + "0D", padding: 12 }}>
    <View style={{ flexDirection: "row", gap: 8 }}><Feather name="lock" size={16} color={colors.primary} /><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 12 }}>What should Kinfolk remember?</Text><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 3 }}>Nothing has been saved yet. Preferences can guide relevant searches. Personal details stay private and are used only when relevant—not for promotion, advertising, or community sharing.</Text></View></View>
    {!!error && <Text style={{ color: "#B91C1C", fontFamily: "Inter_500Medium", fontSize: 10, marginTop: 8 }}>{error}</Text>}
    {!choosing ? <View style={{ gap: 8, marginTop: 10 }}>
      <TouchableOpacity disabled={saving} onPress={() => { setChoosing(true); setSelected(allItems.map((item) => item.id)); setSensitiveConsent(false); }} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, opacity: saving ? 0.6 : 1 }} accessibilityLabel="Review all Kinfolk memory choices"><Text style={{ color: colors.primaryForeground, fontFamily: "Inter_700Bold", fontSize: 11 }}>{saving ? "Saving…" : plan.sensitive.length ? "Review all, including sensitive details" : "Save all for relevant use"}</Text></TouchableOpacity>
      {plan.ordinary.length > 0 && <TouchableOpacity disabled={saving} onPress={() => void save(plan.ordinary.map((item) => item.id))} style={{ borderWidth: 1, borderColor: colors.primary + "66", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 }}><Text style={{ color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 11 }}>Save only preferences and interests</Text></TouchableOpacity>}
      <TouchableOpacity disabled={saving} onPress={() => { setChoosing(true); setSelected([]); setSensitiveConsent(false); }}><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>Choose individually</Text></TouchableOpacity>
      <TouchableOpacity disabled={saving} onPress={onDismiss}><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>Don’t save</Text></TouchableOpacity>
    </View> : <View style={{ gap: 8, marginTop: 10 }}>
      {plan.ordinary.map((item) => <TouchableOpacity key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(item.id) }} onPress={() => toggle(item.id)} style={{ flexDirection: "row", gap: 8, alignItems: "center", borderRadius: 10, backgroundColor: colors.card, padding: 9 }}><Switch value={selected.includes(item.id)} onValueChange={() => toggle(item.id)} trackColor={{ false: colors.border, true: colors.primary + "99" }} /><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 11 }}>{item.label}</Text><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 2 }}>{item.content}</Text></View></TouchableOpacity>)}
      {plan.sensitive.map((item) => <TouchableOpacity key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(item.id) }} onPress={() => toggle(item.id)} style={{ flexDirection: "row", gap: 8, alignItems: "center", borderRadius: 10, backgroundColor: colors.card, padding: 9 }}><Switch value={selected.includes(item.id)} onValueChange={() => toggle(item.id)} trackColor={{ false: colors.border, true: colors.primary + "99" }} /><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 11 }}>{item.label}</Text><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 2 }}>Sensitive—used only when it helps with a relevant question.</Text></View></TouchableOpacity>)}
      {plan.sensitive.some((item) => selected.includes(item.id)) ? <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: sensitiveConsent }} onPress={() => setSensitiveConsent((value) => !value)} style={{ flexDirection: "row", gap: 8, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.primary + "66", padding: 9 }}><Switch value={sensitiveConsent} onValueChange={setSensitiveConsent} trackColor={{ false: colors.border, true: colors.primary + "99" }} /><Text style={{ flex: 1, color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 11, lineHeight: 16 }}>I separately confirm these selected sensitive details may be saved privately for relevant Kinfolk use.</Text></TouchableOpacity> : null}
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}><TouchableOpacity disabled={saving || selected.length === 0 || (plan.sensitive.some((item) => selected.includes(item.id)) && !sensitiveConsent)} onPress={() => void save(selected)} style={{ backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, opacity: saving || selected.length === 0 || (plan.sensitive.some((item) => selected.includes(item.id)) && !sensitiveConsent) ? 0.55 : 1 }} accessibilityLabel="Save selected Kinfolk memories">{saving ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Text style={{ color: colors.primaryForeground, fontFamily: "Inter_700Bold", fontSize: 11 }}>Save selected</Text>}</TouchableOpacity><TouchableOpacity disabled={saving} onPress={onDismiss}><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>Don’t save</Text></TouchableOpacity></View>
    </View>}
  </View>;
}
