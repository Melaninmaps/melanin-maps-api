import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

type Preferences = {
  preferredConversationLanguage: "en" | "es";
  regionalSpeechComprehension: string;
  regionalSpeakingStyle: "standard" | "member_selected";
  pronunciationAssistance: boolean;
};
type Correction = {
  id: string;
  writtenForm: string;
  pronunciationGuidance: string;
  status: "active" | "paused";
};
const DEFAULTS: Preferences = {
  preferredConversationLanguage: "en",
  regionalSpeechComprehension: "off",
  regionalSpeakingStyle: "standard",
  pronunciationAssistance: false,
};

function baseUrl() {
  return process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
}
async function headers() {
  const token = await SecureStore.getItemAsync("auth_session_token");
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : null;
}

export function KinfolkRegionalLanguageSettings() {
  const colors = useColors();
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [writtenForm, setWrittenForm] = useState("");
  const [guidance, setGuidance] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const auth = await headers();
    const base = baseUrl();
    if (!auth || !base) return;
    const [pref, correction] = await Promise.all([
      fetch(`${base}/api/kinfolk/preferences`, { headers: auth }),
      fetch(`${base}/api/kinfolk/language/corrections`, { headers: auth }),
    ]);
    if (pref.ok) {
      const json = (await pref.json()) as {
        preferences?: Partial<Preferences>;
      };
      setPreferences({ ...DEFAULTS, ...json.preferences });
    }
    if (correction.ok) {
      const json = (await correction.json()) as { corrections?: Correction[] };
      setCorrections(Array.isArray(json.corrections) ? json.corrections : []);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const save = async (patch: Partial<Preferences>) => {
    const prior = preferences;
    const next = { ...prior, ...patch };
    setPreferences(next);
    setSaving(true);
    try {
      const auth = await headers();
      const base = baseUrl();
      if (!auth || !base)
        throw new Error("Sign in again to save language settings.");
      const response = await fetch(`${base}/api/kinfolk/preferences`, {
        method: "PUT",
        headers: auth,
        body: JSON.stringify(patch),
      });
      if (!response.ok)
        throw new Error("Language settings could not be saved.");
      const json = (await response.json()) as {
        preferences?: Partial<Preferences>;
      };
      setPreferences({ ...next, ...json.preferences });
    } catch (error) {
      setPreferences(prior);
      Alert.alert(
        "Changes not saved",
        error instanceof Error
          ? error.message
          : "Language settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };
  const addCorrection = async () => {
    if (!writtenForm.trim() || !guidance.trim() || !consent) return;
    setSaving(true);
    try {
      const auth = await headers();
      const base = baseUrl();
      if (!auth || !base)
        throw new Error("Sign in again to save a correction.");
      const response = await fetch(`${base}/api/kinfolk/language/corrections`, {
        method: "POST",
        headers: auth,
        body: JSON.stringify({
          writtenForm: writtenForm.trim(),
          pronunciationGuidance: guidance.trim(),
          consent: true,
        }),
      });
      const json = (await response.json()) as {
        correction?: Correction;
        error?: string;
      };
      if (!response.ok || !json.correction)
        throw new Error(json.error ?? "Correction could not be saved.");
      setCorrections((current) => [json.correction!, ...current]);
      setWrittenForm("");
      setGuidance("");
      setConsent(false);
    } catch (error) {
      Alert.alert(
        "Correction not saved",
        error instanceof Error ? error.message : "Try again.",
      );
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id: string) => {
    const auth = await headers();
    const base = baseUrl();
    if (!auth || !base) return;
    const response = await fetch(
      `${base}/api/kinfolk/language/corrections/${id}`,
      { method: "DELETE", headers: auth },
    );
    if (response.ok)
      setCorrections((current) => current.filter((item) => item.id !== id));
    else Alert.alert("Correction not deleted", "Try again.");
  };

  return (
    <View
      style={{ gap: 12, marginTop: 18 }}
      accessibilityLabel="Kinfolk language and place-name settings"
    >
      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          letterSpacing: 0.8,
        }}
      >
        LANGUAGE & PLACE NAMES
      </Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          backgroundColor: colors.card,
          padding: 16,
          gap: 12,
        }}
      >
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
          }}
        >
          Conversation language
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Choice
            label="English"
            selected={preferences.preferredConversationLanguage === "en"}
            disabled={saving}
            colors={colors}
            onPress={() => void save({ preferredConversationLanguage: "en" })}
          />
          <Choice
            label="Español"
            selected={preferences.preferredConversationLanguage === "es"}
            disabled={saving}
            colors={colors}
            onPress={() => void save({ preferredConversationLanguage: "es" })}
          />
        </View>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 12,
            lineHeight: 17,
          }}
        >
          Language is explicit. Kinfolk does not infer it from ordinary chat.
        </Text>
        <Toggle
          label="Understand a selected regional language setting"
          value={preferences.regionalSpeechComprehension !== "off"}
          disabled={saving}
          colors={colors}
          onChange={(enabled) =>
            void save({
              regionalSpeechComprehension: enabled
                ? "follow_destination"
                : "off",
            })
          }
        />
        <Toggle
          label="Optional regional speaking style"
          value={preferences.regionalSpeakingStyle === "member_selected"}
          disabled={saving}
          colors={colors}
          onChange={(enabled) =>
            void save({
              regionalSpeakingStyle: enabled ? "member_selected" : "standard",
            })
          }
        />
        <Toggle
          label="Use reviewed place-name pronunciation help"
          value={preferences.pronunciationAssistance}
          disabled={saving}
          colors={colors}
          onChange={(pronunciationAssistance) =>
            void save({ pronunciationAssistance })
          }
        />
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 12,
            lineHeight: 17,
          }}
        >
          Regional comprehension is separate from speaking style. Neither
          creates an accent or identifies you.
        </Text>
      </View>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          backgroundColor: colors.card,
          padding: 16,
          gap: 10,
        }}
      >
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
          }}
        >
          Private pronunciation corrections
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 12,
            lineHeight: 17,
          }}
        >
          Corrections are private to your Kinfolk experience and are never made
          into community language rules automatically.
        </Text>
        <TextInput
          value={writtenForm}
          onChangeText={setWrittenForm}
          maxLength={200}
          placeholder="Written name, business, or place"
          placeholderTextColor={colors.mutedForeground}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            color: colors.foreground,
            padding: 10,
          }}
          accessibilityLabel="Written form for private pronunciation correction"
        />
        <TextInput
          value={guidance}
          onChangeText={setGuidance}
          maxLength={500}
          placeholder="How Kinfolk should pronounce it"
          placeholderTextColor={colors.mutedForeground}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            color: colors.foreground,
            padding: 10,
          }}
          accessibilityLabel="Private pronunciation guidance"
        />
        <Toggle
          label="Use this private correction only for me"
          value={consent}
          disabled={saving}
          colors={colors}
          onChange={setConsent}
        />
        <TouchableOpacity
          disabled={
            saving || !consent || !writtenForm.trim() || !guidance.trim()
          }
          onPress={() => void addCorrection()}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 10,
            padding: 11,
            opacity: saving || !consent ? 0.55 : 1,
          }}
        >
          <Text
            style={{
              color: "#fff",
              textAlign: "center",
              fontFamily: "Inter_700Bold",
              fontSize: 12,
            }}
          >
            Save private correction
          </Text>
        </TouchableOpacity>
        {corrections.map((item) => (
          <View
            key={item.id}
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 9,
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <Text style={{ flex: 1, color: colors.foreground, fontSize: 12 }}>
              <Text style={{ fontFamily: "Inter_700Bold" }}>
                {item.writtenForm}
              </Text>{" "}
              — {item.pronunciationGuidance}
            </Text>
            <TouchableOpacity
              onPress={() => void remove(item.id)}
              accessibilityLabel={`Delete correction for ${item.writtenForm}`}
            >
              <Text
                style={{
                  color: "#B42318",
                  fontSize: 12,
                  fontFamily: "Inter_700Bold",
                }}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <Text
        style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}
      >
        Future automatic language detection and code switching remain disabled;
        this screen does not activate translation or automatic switching.
      </Text>
    </View>
  );
}

function Choice({
  label,
  selected,
  disabled,
  colors,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        borderRadius: 10,
        backgroundColor: selected ? colors.primary : colors.card,
        padding: 10,
      }}
    >
      <Text
        style={{
          color: selected ? "#fff" : colors.foreground,
          textAlign: "center",
          fontFamily: "Inter_600SemiBold",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
function Toggle({
  label,
  value,
  disabled,
  colors,
  onChange,
}: {
  label: string;
  value: boolean;
  disabled: boolean;
  colors: ReturnType<typeof useColors>;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Text
        style={{
          flex: 1,
          color: colors.foreground,
          fontSize: 13,
          lineHeight: 18,
        }}
      >
        {label}
      </Text>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary + "A0" }}
        thumbColor={value ? colors.primary : "#f4f4f5"}
        accessibilityLabel={label}
      />
    </View>
  );
}
