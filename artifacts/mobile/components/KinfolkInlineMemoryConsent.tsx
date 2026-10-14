import * as SecureStore from "expo-secure-store";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getApiBase } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export type KinfolkInlineMemoryConsentPlan = {
  purpose: string;
  ordinary: Array<{ id: string; label: string; content: string }>;
  sensitive: Array<{ id: string; label: string; content: string }>;
  oneTimeUseAvailable?: boolean;
};

export function KinfolkInlineMemoryConsent({
  message,
  plan,
  sessionId,
  onSaved,
  onDismiss,
  onUseOnce,
}: {
  message: string;
  plan: KinfolkInlineMemoryConsentPlan;
  sessionId?: string | null;
  onSaved: () => void;
  onDismiss: () => void;
  /** Queues a style instruction locally for exactly the next chat request. */
  onUseOnce?: (instruction: string) => void;
}) {
  const colors = useColors();
  const allItems = useMemo(() => [...plan.ordinary, ...plan.sensitive], [plan]);
  const [selected, setSelected] = useState<string[]>([]);
  const [choosing, setChoosing] = useState(false);
  const [sensitiveConsent, setSensitiveConsent] = useState(false);
  const [sensitivePassword, setSensitivePassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedSensitive = plan.sensitive.some((item) => selected.includes(item.id));

  const save = async (ids: string[], confirmedSensitive = false) => {
    if (!ids.length) return;
    const includesSensitive = plan.sensitive.some((item) => ids.includes(item.id));
    if (includesSensitive && !confirmedSensitive) {
      setError("Confirm separately before Kinfolk saves a sensitive detail.");
      return;
    }
    setSaving(true); setError("");
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) throw new Error("Sign in to save a private memory.");
      if (includesSensitive) {
        if (!sensitivePassword) throw new Error("Confirm your password before saving a sensitive detail.");
        const reauth = await fetch(`${getApiBase()}/api/kinfolk/sensitive-memory-vault/reauth`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ password: sensitivePassword }),
        });
        const reauthBody = await reauth.json().catch(() => ({})) as { error?: string };
        if (!reauth.ok) throw new Error(reauthBody.error ?? "Password confirmation failed.");
        setSensitivePassword("");
      }
      const response = await fetch(`${getApiBase()}/api/kinfolk/memory-consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ consent: true, message, selectedIds: ids, sessionId: sessionId ?? undefined, ...(includesSensitive ? { sensitiveConsent: true } : {}) }),
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
  const saveAll = () => {
    if (plan.sensitive.length > 0) {
      setChoosing(true);
      setSelected(allItems.map((item) => item.id));
      setSensitiveConsent(false);
      return;
    }
    void save(allItems.map((item) => item.id));
  };

  return <View testID="kinfolk-inline-memory-consent" style={{ marginHorizontal: 14, marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.primary + "55", backgroundColor: colors.primary + "0D", padding: 12 }}>
    <View style={{ flexDirection: "row", gap: 8 }}><Feather name="lock" size={16} color={colors.primary} /><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 12 }}>What should Kinfolk remember?</Text><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 3 }}>Nothing has been saved yet. Preferences can guide relevant searches. Personal details stay private and are used only when relevant—not for promotion, advertising, or community sharing.</Text></View></View>
    {!!error && <Text style={{ color: "#B91C1C", fontFamily: "Inter_500Medium", fontSize: 10, marginTop: 8 }}>{error}</Text>}
    {!choosing ? <View style={{ gap: 8, marginTop: 10 }}>
      <TouchableOpacity disabled={saving} onPress={saveAll} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, opacity: saving ? 0.6 : 1 }}><Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 11 }}>{saving ? "Saving…" : plan.oneTimeUseAvailable ? "Save and use in future" : "Save all for relevant use"}</Text></TouchableOpacity>
      {plan.oneTimeUseAvailable && onUseOnce ? <TouchableOpacity disabled={saving} onPress={() => { onUseOnce(message); onDismiss(); }} style={{ borderWidth: 1, borderColor: colors.primary + "66", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 }}><Text style={{ color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 11 }}>Use this once</Text></TouchableOpacity> : plan.ordinary.length > 0 && <TouchableOpacity disabled={saving} onPress={() => void save(plan.ordinary.map((item) => item.id))} style={{ borderWidth: 1, borderColor: colors.primary + "66", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 }}><Text style={{ color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 11 }}>Save only preferences and interests</Text></TouchableOpacity>}
      <TouchableOpacity disabled={saving} onPress={() => { setChoosing(true); setSelected([]); setSensitiveConsent(false); }}><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>{plan.oneTimeUseAvailable ? "Choose different instructions" : "Choose individually"}</Text></TouchableOpacity>
      <TouchableOpacity disabled={saving} onPress={onDismiss}><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>{plan.oneTimeUseAvailable ? "No memory" : "Don’t save"}</Text></TouchableOpacity>
    </View> : <View style={{ gap: 8, marginTop: 10 }}>
      {plan.ordinary.map((item) => <TouchableOpacity key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(item.id) }} onPress={() => toggle(item.id)} style={{ flexDirection: "row", gap: 8, alignItems: "center", borderRadius: 10, backgroundColor: colors.card, padding: 9 }}><Switch value={selected.includes(item.id)} onValueChange={() => toggle(item.id)} trackColor={{ false: colors.border, true: colors.primary + "99" }} /><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 11 }}>{item.label}</Text><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 2 }}>{item.content}</Text></View></TouchableOpacity>)}
      {plan.sensitive.map((item) => <TouchableOpacity key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(item.id) }} onPress={() => toggle(item.id)} style={{ flexDirection: "row", gap: 8, alignItems: "center", borderRadius: 10, backgroundColor: colors.card, padding: 9 }}><Switch value={selected.includes(item.id)} onValueChange={() => toggle(item.id)} trackColor={{ false: colors.border, true: colors.primary + "99" }} /><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 11 }}>{item.label}</Text><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 2 }}>Sensitive—used only when it helps with a relevant question.</Text></View></TouchableOpacity>)}
      {selectedSensitive && <View accessibilityRole="checkbox" accessibilityState={{ checked: sensitiveConsent }} style={{ flexDirection: "row", gap: 8, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.primary + "66", backgroundColor: colors.card, padding: 9 }}><Switch value={sensitiveConsent} onValueChange={setSensitiveConsent} trackColor={{ false: colors.border, true: colors.primary + "99" }} /><Text style={{ flex: 1, color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 15 }}>I agree to save the selected sensitive details for relevant use.</Text></View>}
      {selectedSensitive && <TextInput accessibilityLabel="Confirm password before saving selected sensitive memories" secureTextEntry value={sensitivePassword} onChangeText={setSensitivePassword} placeholder="Confirm your password" placeholderTextColor={colors.mutedForeground} style={{ color: colors.foreground, borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }} />}
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}><TouchableOpacity disabled={saving || selected.length === 0 || (selectedSensitive && !sensitiveConsent)} onPress={() => void save(selected, sensitiveConsent)} style={{ backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, opacity: saving || selected.length === 0 || (selectedSensitive && !sensitiveConsent) ? 0.55 : 1 }}>{saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 11 }}>Save selected</Text>}</TouchableOpacity><TouchableOpacity disabled={saving} onPress={onDismiss}><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>Don’t save</Text></TouchableOpacity></View>
    </View>}
  </View>;
}
