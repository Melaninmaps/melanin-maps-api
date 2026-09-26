import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getApiBase } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export function KinfolkSensitiveMemoryConfirmation({
  content,
  purpose,
  sessionId,
  onSaved,
  onDismiss,
}: {
  content: string;
  purpose: string;
  sessionId?: string | null;
  onSaved: () => void;
  onDismiss: () => void;
}) {
  const colors = useColors();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const confirm = async () => {
    setSaving(true); setError("");
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) throw new Error("Sign in to save a private note.");
      const response = await fetch(`${getApiBase()}/api/kinfolk/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ consent: true, sensitiveConsent: true, content, purpose, sessionId: sessionId ?? undefined }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kinfolk could not save that sensitive detail.");
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Kinfolk could not save that sensitive detail."); }
    finally { setSaving(false); }
  };
  return <View testID="kinfolk-sensitive-memory-confirmation" style={{ marginHorizontal: 14, marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.primary + "55", backgroundColor: colors.primary + "0D", padding: 12 }}>
    <View style={{ flexDirection: "row", gap: 8 }}><Feather name="alert-triangle" size={16} color={colors.primary} /><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 12 }}>Save this sensitive detail privately?</Text><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 3 }}>Kinfolk has not saved it. Sensitive details are never retained unless you make this separate choice. You can edit, delete, or turn off memory anytime.</Text></View></View>
    {!!error && <Text style={{ color: "#B91C1C", fontFamily: "Inter_500Medium", fontSize: 10, marginTop: 8 }}>{error}</Text>}
    <View style={{ flexDirection: "row", gap: 10, marginTop: 10, alignItems: "center" }}><TouchableOpacity disabled={saving} onPress={() => void confirm()} style={{ backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, opacity: saving ? 0.6 : 1 }}><Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 11 }}>{saving ? "Saving…" : "Save privately"}</Text></TouchableOpacity><TouchableOpacity disabled={saving} onPress={onDismiss}>{saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>Do not save</Text>}</TouchableOpacity></View>
  </View>;
}
