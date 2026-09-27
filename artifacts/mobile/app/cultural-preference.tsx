import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SupportLensDropdowns } from "@/components/SupportLensDropdowns";
import { ownershipDesignationFilterId } from "@workspace/constants";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN)
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function splitPreferenceList(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2 && item.length <= 100),
    ),
  ].slice(0, 25);
}

export default function CulturalPreferenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selected, setSelected] = useState<string[]>([]);
  const [communities, setCommunities] = useState("");
  const [cultures, setCultures] = useState("");
  const [preferredLanguages, setPreferredLanguages] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const loadPreference = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/kinfolk/preferences`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = (await res.json()) as {
          preferences?: {
            preferredOwnershipTypes?: string[];
            supportLensMode?: "all_businesses" | "strict_documented_designations";
            communities?: string[];
            cultures?: string[];
            preferredLanguages?: string[];
          };
        };
        setSelected(
          (
            data.preferences?.preferredOwnershipTypes ?? []
          ).map(ownershipDesignationFilterId),
        );
        setCommunities((data.preferences?.communities ?? []).join(", "));
        setCultures((data.preferences?.cultures ?? []).join(", "));
        setPreferredLanguages(
          (data.preferences?.preferredLanguages ?? []).join(", "),
        );
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPreference();
    });
  }, [loadPreference]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/kinfolk/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          preferredOwnershipTypes: selected,
          supportLensMode: selected.length > 0
            ? "strict_documented_designations"
            : "all_businesses",
          communities: splitPreferenceList(communities),
          cultures: splitPreferenceList(cultures),
          preferredLanguages: splitPreferenceList(preferredLanguages),
        }),
      });
      if (res.ok) {
        if (Platform.OS !== "web")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          s.header,
          { paddingTop: topPad + 12, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={s.backBtn}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/profile" as never)
          }
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>
          Personalize Kinfolk
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: bottomPad + 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              s.explainer,
              {
                backgroundColor: colors.primary + "0C",
                borderColor: colors.primary + "25",
              },
            ]}
          >
            <Text style={{ fontSize: 28, textAlign: "center" }}>🌍</Text>
            <Text style={[s.explainerTitle, { color: colors.foreground }]}>
              Make it feel like it was built with you in mind
            </Text>
            <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
              Tell KinfolkAI and the Library about communities, cultures, or
              languages you want considered. Every answer still starts useful,
              and you can skip or edit this anytime.
            </Text>
            <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
              Kinfolk never guesses your identity. These are private, voluntary
              preferences that improve ranking; they do not silently hide care,
              safety, or resource options.
            </Text>
          </View>

          <View style={s.contextSection}>
            <Text style={[s.contextTitle, { color: colors.foreground }]}>
              About your community (optional)
            </Text>
            <Text style={[s.contextHelp, { color: colors.mutedForeground }]}>
              For example: Black woman, foundationally Black American, military
              family, disabled parent
            </Text>
            <TextInput
              value={communities}
              onChangeText={setCommunities}
              placeholder="Add communities that matter to you"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[
                s.contextInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            />
          </View>

          <View style={s.contextSection}>
            <Text style={[s.contextTitle, { color: colors.foreground }]}>
              Cultures you want reflected (optional)
            </Text>
            <Text style={[s.contextHelp, { color: colors.mutedForeground }]}>
              For example: Haitian, Dominican, Gullah Geechee, Caribbean
            </Text>
            <TextInput
              value={cultures}
              onChangeText={setCultures}
              placeholder="Add cultures or traditions"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[
                s.contextInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            />
          </View>

          <View style={s.contextSection}>
            <Text style={[s.contextTitle, { color: colors.foreground }]}>
              Languages (optional)
            </Text>
            <Text style={[s.contextHelp, { color: colors.mutedForeground }]}>
              For example: English, Spanish, Haitian Creole, ASL
            </Text>
            <TextInput
              value={preferredLanguages}
              onChangeText={setPreferredLanguages}
              placeholder="Add languages you prefer"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[
                s.contextInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            />
          </View>

          <View style={[s.supportHeading, { borderTopColor: colors.border }]}>
            <Text style={[s.contextTitle, { color: colors.foreground }]}>
              Businesses you want to support (optional)
            </Text>
            <Text style={[s.contextHelp, { color: colors.mutedForeground }]}>
              Select owner-provided identities to prioritize. The full directory
              stays available.
            </Text>
          </View>

          <View style={s.supportSelectors}>
            <SupportLensDropdowns
              selected={selected}
              onChange={(next) => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelected(next);
              }}
              disabled={saving}
            />
          </View>

          <View
            style={[
              s.noteCard,
              { backgroundColor: "#2D7A4F0C", borderColor: "#2D7A4F25" },
            ]}
          >
            <Feather name="info" size={15} color="#2D7A4F" />
            <Text style={[s.noteText, { color: "#2D7A4F" }]}>
              Primary and secondary choices prioritize documented matches. They
              never hide the rest of the directory.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              s.saveBtn,
              { backgroundColor: colors.primary, marginHorizontal: 20 },
            ]}
            onPress={() => void handleSave()}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={s.saveBtnText}>Save Preference</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={{ alignItems: "center", paddingVertical: 14 }}
            onPress={() => {
              setSelected([]);
            }}
          >
            <Text
              style={[
                { fontFamily: "Inter_400Regular", fontSize: 14 },
                { color: colors.mutedForeground },
              ]}
            >
              Clear preference (show all equally)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  explainer: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    alignItems: "center",
  },
  explainerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    textAlign: "center",
  },
  explainerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },
  contextSection: { paddingHorizontal: 16, marginBottom: 16, gap: 6 },
  contextTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  contextHelp: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  contextInput: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlignVertical: "top",
  },
  supportHeading: {
    marginTop: 2,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingTop: 18,
    borderTopWidth: 1,
    gap: 4,
  },
  supportSelectors: { paddingHorizontal: 16, marginBottom: 16 },
  noteCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  noteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  saveBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
});
