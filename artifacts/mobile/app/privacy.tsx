import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getAuthToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}

type Visibility = "public" | "community" | "private";
type LocationPrecision = "neighborhood" | "exact";

interface PrivacySettings {
  profileVisibility: Visibility;
  showLocation: boolean;
  locationPrecision: LocationPrecision;
  activityStatus: boolean;
  usageAnalytics: boolean;
  personalisedSuggestions: boolean;
  kinfolkMemoryEnabled: boolean;
  profileViewTrackingEnabled: boolean;
}

const DEFAULTS: PrivacySettings = {
  profileVisibility: "community",
  showLocation: true,
  locationPrecision: "neighborhood",
  activityStatus: true,
  usageAnalytics: true,
  personalisedSuggestions: true,
  kinfolkMemoryEnabled: true,
  profileViewTrackingEnabled: true,
};

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => { void loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const token = await getAuthToken();
      const base = getApiBase();
      if (!token || !base) { setLoading(false); return; }
      const res = await fetch(`${base}/api/users/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as PrivacySettings;
        setSettings({ ...DEFAULTS, ...data });
      }
    } catch {}
    finally { setLoading(false); }
  };

  const saveSettings = (next: PrivacySettings) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const token = await getAuthToken();
        const base = getApiBase();
        if (!token || !base) return;
        await fetch(`${base}/api/users/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(next),
        });
      } catch {}
    }, 600);
  };

  const update = (patch: Partial<PrivacySettings>) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/settings")}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Privacy & Safety</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/settings")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy & Safety</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Visibility */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PROFILE VISIBILITY</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.descRow}>
            <Feather name="eye" size={18} color={colors.primary} />
            <Text style={[styles.descTxt, { color: colors.mutedForeground }]}>
              Who can see your profile, saved businesses, and activity.
            </Text>
          </View>
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          {(["public", "community", "private"] as Visibility[]).map((v) => (
            <TouchableOpacity
              key={v}
              style={styles.visRow}
              onPress={() => update({ profileVisibility: v })}
              activeOpacity={0.75}
            >
              <View style={styles.visLeft}>
                <View style={[styles.radio, { borderColor: settings.profileVisibility === v ? colors.primary : colors.border }]}>
                  {settings.profileVisibility === v && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                </View>
                <View>
                  <Text style={[styles.visLabel, { color: colors.foreground }]}>
                    {v === "public" ? "Public" : v === "community" ? "Community Members" : "Only Me"}
                  </Text>
                  <Text style={[styles.visSub, { color: colors.mutedForeground }]}>
                    {v === "public" ? "Anyone can see your profile"
                      : v === "community" ? "Only registered members"
                      : "Completely private"}
                  </Text>
                </View>
              </View>
              {settings.profileVisibility === v && <Feather name="check" size={16} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>LOCATION</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="map-pin" size={16} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Show My Location</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Allow location-based discovery</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={() => update({ showLocation: !settings.showLocation })}>
              <View style={[styles.sw, { backgroundColor: settings.showLocation ? colors.primary : colors.border }]}>
                <View style={[styles.swThumb, { transform: [{ translateX: settings.showLocation ? 20 : 2 }] }]} />
              </View>
            </TouchableOpacity>
          </View>

          {settings.showLocation && (
            <>
              <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />
              <View style={styles.precisionBlock}>
                <Text style={[styles.precisionTitle, { color: colors.foreground }]}>Location Precision</Text>
                <View style={styles.precisionPills}>
                  {(["neighborhood", "exact"] as LocationPrecision[]).map((p) => (
                    <TouchableOpacity activeOpacity={0.85}
                      key={p}
                      style={[styles.precisionPill, {
                        backgroundColor: settings.locationPrecision === p ? colors.primary : colors.secondary,
                        borderColor: settings.locationPrecision === p ? colors.primary : "transparent",
                      }]}
                      onPress={() => update({ locationPrecision: p })}
                    >
                      <Text style={[styles.precisionPillTxt, { color: settings.locationPrecision === p ? "#FFF" : colors.foreground }]}>
                        {p === "neighborhood" ? "Neighborhood" : "Exact Address"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.precisionNote, { color: colors.mutedForeground }]}>
                  {settings.locationPrecision === "neighborhood"
                    ? "Your exact address is never shared — only your general area."
                    : "Your precise location is used to show you relevant nearby businesses."}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Activity & Data */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACTIVITY & DATA</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {([
            { key: "activityStatus" as const, icon: "activity" as const, label: "Activity Status", sub: "Show when you're active in the app" },
            { key: "usageAnalytics" as const, icon: "bar-chart" as const, label: "Usage Analytics", sub: "Help us improve the app with anonymous data" },
            { key: "personalisedSuggestions" as const, icon: "cpu" as const, label: "Personalised Suggestions", sub: "Tailor app content and recommendations to your activity" },
            { key: "profileViewTrackingEnabled" as const, icon: "eye-off" as const, label: "Profile View Contribution", sub: "Count your views in business owner analytics" },
          ]).map((item, i, arr) => (
            <React.Fragment key={item.key}>
              <View style={styles.toggleRow}>
                <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={item.icon} size={16} color={colors.mutedForeground} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                </View>
                <TouchableOpacity activeOpacity={0.85} onPress={() => update({ [item.key]: !settings[item.key] })}>
                  <View style={[styles.sw, { backgroundColor: settings[item.key] ? colors.primary : colors.border }]}>
                    <View style={[styles.swThumb, { transform: [{ translateX: settings[item.key] ? 20 : 2 }] }]} />
                  </View>
                </TouchableOpacity>
              </View>
              {i < arr.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* KinfolkAI — link to dedicated screen */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>KINFOLKAI™</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.toggleRow} onPress={() => router.push("/kinfolk-settings" as never)} activeOpacity={0.75}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="zap" size={16} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>KinfolkAI™ Settings</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>AI chat memory, personalisation and data</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.border} />
          </TouchableOpacity>
        </View>

        {/* Manage */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>MANAGE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {([
            { icon: "slash" as const, label: "Block List", sub: "Manage blocked accounts", hasArrow: true },
            { icon: "download" as const, label: "Download My Data", sub: "Get a copy of all your data", hasArrow: false },
          ]).map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.toggleRow} activeOpacity={0.75}>
                <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={item.icon} size={16} color={colors.mutedForeground} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                </View>
                {item.hasArrow
                  ? <Feather name="chevron-right" size={16} color={colors.border} />
                  : (
                    <View style={[styles.downloadBtn, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.downloadTxt, { color: colors.primary }]}>Request</Text>
                    </View>
                  )
                }
              </TouchableOpacity>
              {i === 0 && <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 24 },
  descRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  descTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  sep: { height: 1 },
  visRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  visLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  visLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  visSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sw: { width: 46, height: 26, borderRadius: 13, justifyContent: "center" },
  swThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFF", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  precisionBlock: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  precisionTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  precisionPills: { flexDirection: "row", gap: 8 },
  precisionPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  precisionPillTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  precisionNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  downloadBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  downloadTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
