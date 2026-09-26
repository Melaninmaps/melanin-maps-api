import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/lib/api";

export type KinfolkCompanionMemoryOffer = Readonly<{
  label: string;
  prompt: string;
}>;

const AUTH_TOKEN_KEY = "auth_session_token";

export function KinfolkCompanionMemoryOfferCard({
  offer,
  sessionId,
  offset = true,
}: {
  offer: KinfolkCompanionMemoryOffer;
  sessionId?: string | null;
  offset?: boolean;
}) {
  const colors = useColors();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [sensitiveConfirmationRequired, setSensitiveConfirmationRequired] = useState(false);

  if (dismissed) return null;

  const save = async (sensitiveConsent = false) => {
    const trimmed = notes.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError("");
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (!token) throw new Error("Sign in to save a private note.");
      const response = await fetch(`${getApiBase()}/api/kinfolk/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          consent: true,
          purpose: "companion_context",
          companionLabel: offer.label,
          companionNotes: trimmed,
          sessionId: sessionId ?? undefined,
          sensitiveConsent,
        }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (response.status === 409) {
        setSensitiveConfirmationRequired(true);
        return;
      }
      if (!response.ok) throw new Error(body.error ?? "Could not save that private note.");
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save that private note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      testID="kinfolk-companion-memory-offer"
      style={{
        marginLeft: offset ? 42 : 0,
        marginTop: 10,
        maxWidth: "86%",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.primary + "55",
        backgroundColor: colors.primary + "0D",
        padding: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <Feather name="users" size={15} color={colors.primary} style={{ marginTop: 1 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 12 }}>
            A private note for {offer.label}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 3 }}>
            {offer.prompt}
          </Text>
        </View>
      </View>
      {saved ? (
        <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 11, lineHeight: 16, marginTop: 10 }}>
          Saved privately. You can forget this companion note any time in What KinfolkAI™ Knows.
        </Text>
      ) : (
        <>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={`What should Kinfolk consider about ${offer.label}?`}
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={800}
            style={{
              minHeight: 62,
              marginTop: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              lineHeight: 17,
              paddingHorizontal: 10,
              paddingVertical: 8,
              textAlignVertical: "top",
            }}
            accessibilityLabel={`Private note for ${offer.label}`}
          />
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 14, marginTop: 7 }}>
            Separate from your profile. Kinfolk uses it only when you bring up {offer.label}, and your current request always comes first.
          </Text>
          {sensitiveConfirmationRequired && <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium", fontSize: 10, lineHeight: 14, marginTop: 7 }}>This note may include a sensitive detail. Kinfolk has not saved it. Choose separately if you want to keep it private.</Text>}
          {!!error && <Text style={{ color: "#B91C1C", fontFamily: "Inter_500Medium", fontSize: 10, marginTop: 6 }}>{error}</Text>}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => void save(sensitiveConfirmationRequired)}
              disabled={!notes.trim() || saving}
              style={{ backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 7, opacity: !notes.trim() || saving ? 0.55 : 1 }}
              accessibilityLabel={`Save a private note about ${offer.label}`}
            >
              <Text style={{ color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
                {saving ? "Saving…" : sensitiveConfirmationRequired ? "Save sensitive note privately" : "Save private note"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDismissed(true)} accessibilityLabel="Dismiss companion memory offer">
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 11 }}>Not now</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
