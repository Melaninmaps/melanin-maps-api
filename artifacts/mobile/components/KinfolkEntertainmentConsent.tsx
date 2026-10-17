import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export type KinfolkEntertainmentConsentPlan = {
  operation: "add" | "remove" | "replace" | "set_cost_policy";
  add: string[];
  remove: string[];
  costPolicy: "any" | "included_only" | null;
  summary: string;
};

function base(): string {
  return process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
}

export function KinfolkEntertainmentConsent({
  plan,
  onSaved,
  onDismiss,
}: {
  plan: KinfolkEntertainmentConsentPlan;
  onSaved: () => void;
  onDismiss: () => void;
}) {
  const colors = useColors();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token || !base())
        throw new Error("Please sign in again before saving.");
      const response = await fetch(
        `${base()}/api/kinfolk/entertainment/consent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ consent: true, ...plan }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          payload.error ??
            "Kinfolk could not save this entertainment preference.",
        );
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Kinfolk could not save this entertainment preference.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <View
      testID="kinfolk-entertainment-consent"
      style={{
        gap: 10,
        borderWidth: 1,
        borderColor: colors.primary + "55",
        backgroundColor: colors.primary + "10",
        padding: 14,
        borderRadius: 12,
      }}
    >
      <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold" }}>
        Save an entertainment preference?
      </Text>
      <Text style={{ color: colors.mutedForeground, lineHeight: 18 }}>
        {plan.summary} Kinfolk will use it only for relevant entertainment
        choices. It does not prove live availability, change a subscription, or
        make a purchase.
      </Text>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: "#B42318" }}>
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <TouchableOpacity
          disabled={saving}
          onPress={() => void save()}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 20,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontFamily: "Inter_700Bold" }}>
              Save privately
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity disabled={saving} onPress={onDismiss}>
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Don’t save
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
