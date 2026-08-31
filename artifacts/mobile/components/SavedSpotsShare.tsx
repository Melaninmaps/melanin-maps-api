import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface Business {
  id: string;
  name: string;
  category?: string;
  city?: string;
}

interface Props {
  savedBusinesses: Business[];
}

export function SavedSpotsShare({ savedBusinesses }: Props) {
  const colors = useColors();
  const [publicState, setPublicState] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPublicState = useCallback(async () => {
    await Promise.resolve();
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/saved-places/public-state`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { publicState: Record<string, boolean> };
        setPublicState(data.publicState ?? {});
      }
    } catch { /* non-critical */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadPublicState); }, [loadPublicState]);

  const handleToggle = async (businessId: string, businessName: string) => {
    if (toggling) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentlyPublic = publicState[businessId] ?? false;

    if (!currentlyPublic) {
      Alert.alert(
        "Share This Save?",
        `Make "${businessName}" visible on your public profile?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Share",
            onPress: () => void doToggle(businessId),
          },
        ],
      );
    } else {
      void doToggle(businessId);
    }
  };

  const doToggle = async (businessId: string) => {
    setToggling(businessId);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/saved-places/${businessId}/toggle-public`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) {
        Alert.alert("Error", "Could not update sharing. Try again.");
        return;
      }
      const data = await res.json() as { isPublic: boolean; requiresHealthConfirm: boolean; businessName: string | null };

      if (data.requiresHealthConfirm && data.isPublic) {
        Alert.alert(
          "Health Information — Confirm Again",
          `"${data.businessName ?? "This business"}" is in a health-related category.\n\nAre you sure you want to share this save publicly? Other community members will be able to see it on your profile.`,
          [
            {
              text: "Make Private Again",
              style: "destructive",
              onPress: () => {
                setPublicState((prev) => ({ ...prev, [businessId]: false }));
                void revertToggle(businessId);
              },
            },
            {
              text: "Yes, Share It",
              onPress: () => {
                setPublicState((prev) => ({ ...prev, [businessId]: true }));
                if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              },
            },
          ],
        );
        setPublicState((prev) => ({ ...prev, [businessId]: true }));
      } else {
        setPublicState((prev) => ({ ...prev, [businessId]: data.isPublic }));
        if (Platform.OS !== "web") {
          if (data.isPublic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch {
      Alert.alert("No connection", "Check your internet and try again.");
    } finally {
      setToggling(null);
    }
  };

  const revertToggle = async (businessId: string) => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/saved-places/${businessId}/toggle-public`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
    } catch { /* best effort */ }
  };

  if (savedBusinesses.length === 0) return null;

  return (
    <View style={[s.section, { borderTopColor: "transparent" }]}>
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Saved Spots</Text>
        <View style={[s.privacyBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="eye" size={10} color={colors.mutedForeground} />
          <Text style={[s.privacyText, { color: colors.mutedForeground }]}>Control sharing</Text>
        </View>
      </View>
      <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>
        Choose which saves to share publicly on your profile. Health-related saves require extra confirmation.
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : (
        <View style={[s.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {savedBusinesses.slice(0, 8).map((biz, idx) => {
            const isPublic = publicState[biz.id] ?? false;
            const isToggling = toggling === biz.id;
            return (
              <View
                key={biz.id}
                style={[
                  s.row,
                  idx < Math.min(savedBusinesses.length, 8) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={[s.bizDot, { backgroundColor: isPublic ? "#2D7A4F" : colors.muted }]} />
                <View style={s.bizInfo}>
                  <Text style={[s.bizName, { color: colors.foreground }]} numberOfLines={1}>{biz.name}</Text>
                  {biz.city ? (
                    <Text style={[s.bizCity, { color: colors.mutedForeground }]} numberOfLines={1}>{biz.city}</Text>
                  ) : null}
                </View>
                {isPublic && (
                  <View style={[s.publicBadge, { backgroundColor: "#2D7A4F15", borderColor: "#2D7A4F30" }]}>
                    <Feather name="globe" size={9} color="#2D7A4F" />
                    <Text style={s.publicBadgeText}>Public</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    s.shareBtn,
                    { borderColor: isPublic ? "#2D7A4F40" : colors.border, backgroundColor: isPublic ? "#2D7A4F10" : colors.secondary },
                  ]}
                  onPress={() => handleToggle(biz.id, biz.name)}
                  disabled={isToggling}
                  activeOpacity={0.7}
                >
                  {isToggling ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Feather
                      name={isPublic ? "eye" : "eye-off"}
                      size={14}
                      color={isPublic ? "#2D7A4F" : colors.mutedForeground}
                    />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
          {savedBusinesses.length > 8 && (
            <View style={[s.row, { justifyContent: "center" }]}>
              <Text style={[s.moreText, { color: colors.mutedForeground }]}>+{savedBusinesses.length - 8} more saves</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  privacyText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  sectionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  list: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  bizDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bizInfo: { flex: 1 },
  bizName: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  bizCity: { fontFamily: "Inter_400Regular", fontSize: 11 },
  publicBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  publicBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: "#2D7A4F" },
  shareBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    paddingVertical: 10,
  },
});
