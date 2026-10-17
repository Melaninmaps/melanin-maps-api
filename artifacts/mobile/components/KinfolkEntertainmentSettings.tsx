import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const SERVICES = [
  "Netflix",
  "Hulu",
  "Prime Video",
  "Max",
  "Disney+",
  "Apple TV+",
  "Peacock",
  "Paramount+",
];
const COUNTRIES = [
  ["US", "United States"],
  ["CA", "Canada"],
  ["GB", "United Kingdom"],
  ["AU", "Australia"],
] as const;
type Preferences = {
  streamingServices: string[];
  entertainmentCountry: string | null;
  entertainmentCostPolicy: "any" | "included_only";
};
const blank: Preferences = {
  streamingServices: [],
  entertainmentCountry: null,
  entertainmentCostPolicy: "any",
};

function base(): string {
  return process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
}
function normalize(value: unknown): Preferences {
  const input = (value ?? {}) as Partial<Preferences>;
  return {
    streamingServices: Array.isArray(input.streamingServices)
      ? input.streamingServices.filter(
          (item): item is string =>
            typeof item === "string" && SERVICES.includes(item),
        )
      : [],
    entertainmentCountry:
      typeof input.entertainmentCountry === "string" &&
      /^[A-Z]{2}$/.test(input.entertainmentCountry)
        ? input.entertainmentCountry
        : null,
    entertainmentCostPolicy:
      input.entertainmentCostPolicy === "included_only"
        ? "included_only"
        : "any",
  };
}

export function KinfolkEntertainmentSettings() {
  const colors = useColors();
  const [preferences, setPreferences] = useState<Preferences>(blank);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token || !base())
        throw new Error(
          "Please sign in again to manage entertainment preferences.",
        );
      const response = await fetch(
        `${base()}/api/kinfolk/entertainment/preferences`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok)
        throw new Error("Entertainment settings could not be loaded.");
      const payload = (await response.json()) as { preferences?: unknown };
      setPreferences(normalize(payload.preferences));
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Entertainment settings could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const save = async (next: Preferences) => {
    const prior = preferences;
    setPreferences(next);
    setSaving(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token || !base())
        throw new Error("Please sign in again before saving.");
      const response = await fetch(
        `${base()}/api/kinfolk/entertainment/preferences`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(next),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        preferences?: unknown;
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          payload.error ?? "Entertainment settings could not be saved.",
        );
      setPreferences(normalize(payload.preferences ?? next));
    } catch (cause) {
      setPreferences(prior);
      setError(
        cause instanceof Error
          ? cause.message
          : "Entertainment settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <ActivityIndicator color={colors.primary} />;
  return (
    <View style={{ gap: 12 }} testID="kinfolk-entertainment-settings">
      <Text
        style={{
          color: colors.foreground,
          fontSize: 18,
          fontFamily: "Inter_700Bold",
        }}
      >
        Entertainment preferences
      </Text>
      <Text style={{ color: colors.mutedForeground, lineHeight: 18 }}>
        Choose only services you want Kinfolk to remember. Ordinary chat never
        changes this list. When you explicitly ask a current availability or
        showtime question, Kinfolk may return cited web sources for the title
        and selected location; it will not claim a service, price, theater, or
        ticket result without an approved provider.
      </Text>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: "#B42318" }}>
          {error}
        </Text>
      ) : null}
      <Text
        style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}
      >
        Availability country
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {COUNTRIES.map(([code, label]) => (
          <TouchableOpacity
            key={code}
            disabled={saving}
            accessibilityRole="radio"
            accessibilityState={{
              selected: preferences.entertainmentCountry === code,
            }}
            onPress={() =>
              void save({ ...preferences, entertainmentCountry: code })
            }
            style={{
              borderWidth: 1,
              borderColor:
                preferences.entertainmentCountry === code
                  ? colors.primary
                  : colors.border,
              backgroundColor:
                preferences.entertainmentCountry === code
                  ? colors.primary + "18"
                  : colors.card,
              padding: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: colors.foreground }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "Inter_600SemiBold",
          marginTop: 4,
        }}
      >
        Cost preference
      </Text>
      <TouchableOpacity
        disabled={saving}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: preferences.entertainmentCostPolicy === "included_only",
        }}
        onPress={() =>
          void save({
            ...preferences,
            entertainmentCostPolicy:
              preferences.entertainmentCostPolicy === "included_only"
                ? "any"
                : "included_only",
          })
        }
        style={{
          borderWidth: 1,
          borderColor:
            preferences.entertainmentCostPolicy === "included_only"
              ? colors.primary
              : colors.border,
          backgroundColor:
            preferences.entertainmentCostPolicy === "included_only"
              ? colors.primary + "18"
              : colors.card,
          padding: 10,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: colors.foreground }}>
          {preferences.entertainmentCostPolicy === "included_only" ? "✓ " : ""}
          Only show options included with my saved services
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            marginTop: 4,
            lineHeight: 17,
          }}
        >
          A verified provider will exclude rentals and purchases. Kinfolk does
          not show live availability yet.
        </Text>
      </TouchableOpacity>
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "Inter_600SemiBold",
          marginTop: 4,
        }}
      >
        Streaming services
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {SERVICES.map((service) => {
          const selected = preferences.streamingServices.includes(service);
          return (
            <TouchableOpacity
              key={service}
              disabled={saving}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() =>
                void save({
                  ...preferences,
                  streamingServices: selected
                    ? preferences.streamingServices.filter(
                        (item) => item !== service,
                      )
                    : [...preferences.streamingServices, service],
                })
              }
              style={{
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary + "18" : colors.card,
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: colors.foreground }}>
                {selected ? "✓ " : ""}
                {service}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {preferences.streamingServices.length ? (
        <TouchableOpacity
          disabled={saving}
          onPress={() => void save({ ...preferences, streamingServices: [] })}
        >
          <Text style={{ color: "#B42318", fontFamily: "Inter_700Bold" }}>
            Clear saved services
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
