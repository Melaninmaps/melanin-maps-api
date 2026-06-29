import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const Notifications = {
  getPermissionsAsync: async () => ({ status: "denied" as string }),
  requestPermissionsAsync: async () => ({ status: "denied" as string }),
  getExpoPushTokenAsync: async () => ({ data: null as string | null }),
};

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getAuthToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}

interface UserSettings {
  notifEvents: boolean;
  notifBusiness: boolean;
  notifMessages: boolean;
  notifReviews: boolean;
  notifCommunity: boolean;
  notifPromotions: boolean;
  notifDigest: boolean;
  notifTips: boolean;
  notifPostNudges: boolean;
  quietHoursEnabled: boolean;
  quietHoursFrom: string;
  quietHoursUntil: string;
}

const DEFAULTS: UserSettings = {
  notifEvents: true,
  notifBusiness: true,
  notifMessages: true,
  notifReviews: true,
  notifCommunity: false,
  notifPromotions: false,
  notifDigest: true,
  notifTips: false,
  notifPostNudges: true,
  quietHoursEnabled: true,
  quietHoursFrom: "10:00 PM",
  quietHoursUntil: "8:00 AM",
};

const QUIET_FROM_OPTIONS = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"];
const QUIET_UNTIL_OPTIONS = ["8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"];

export default function NotificationsSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushLoading, setPushLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }: { status: string }) => {
      if (status !== "granted") setPushEnabled(false);
    }).catch(() => {});

    void loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = await getAuthToken();
      const base = getApiBase();
      if (!token || !base) { setLoading(false); return; }
      const res = await fetch(`${base}/api/users/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as UserSettings;
        setSettings({ ...DEFAULTS, ...data });
      }
    } catch {}
    finally { setLoading(false); }
  };

  const saveSettings = (next: UserSettings) => {
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

  const update = (patch: Partial<UserSettings>) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const handlePushToggle = async () => {
    if (pushLoading) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setPushLoading(true);
    try {
      const token = await getAuthToken();
      const apiBase = getApiBase();
      if (!pushEnabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission required", "Enable notifications in your device settings to receive alerts.");
          return;
        }
        const pushToken = await Notifications.getExpoPushTokenAsync().catch(() => null);
        if (pushToken?.data && token && apiBase) {
          await fetch(`${apiBase}/api/notifications/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ token: pushToken.data, platform: Platform.OS }),
          });
        }
        setPushEnabled(true);
      } else {
        if (token && apiBase) {
          await fetch(`${apiBase}/api/notifications/register`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        setPushEnabled(false);
      }
    } catch {}
    finally { setPushLoading(false); }
  };

  type ToggleDef = {
    id: keyof UserSettings;
    icon: React.ComponentProps<typeof Feather>["name"];
    label: string;
    sub: string;
    locked?: boolean;
  };

  const TOGGLES: ToggleDef[] = [
    { id: "notifEvents", icon: "calendar", label: "New Events Near You", sub: "Upcoming community events in your city" },
    { id: "notifBusiness", icon: "briefcase", label: "Business Updates", sub: "Hours changes, closures, new listings" },
    { id: "notifMessages", icon: "message-circle", label: "Direct Messages", sub: "Replies and new conversations" },
    { id: "notifReviews", icon: "star", label: "Review Replies", sub: "When businesses respond to your reviews" },
    { id: "notifCommunity", icon: "users", label: "Community Activity", sub: "Likes and comments on your posts" },
    { id: "notifPromotions", icon: "tag", label: "Promotions & Offers", sub: "Deals from verified businesses" },
    { id: "notifDigest", icon: "mail", label: "Weekly Digest Email", sub: "Top picks and community highlights" },
    { id: "notifTips", icon: "info", label: "Tips & Features", sub: "How to get the most from the app" },
    { id: "notifPostNudges", icon: "zap", label: "KinfolkAI™ Post Nudges", sub: "Smart prompts when your customers are active (business owners)" },
  ];

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/settings")}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
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
        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/settings")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoBox, { backgroundColor: colors.secondary }]}>
          <Feather name="shield" size={18} color={colors.primary} />
          <Text style={[styles.infoTxt, { color: colors.mutedForeground }]}>
            Community safety alerts are always on to keep you and the community protected.
          </Text>
        </View>

        {/* Device push master toggle */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DEVICE PUSH</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: pushEnabled ? colors.primary + "18" : colors.secondary }]}>
              <Feather name="smartphone" size={16} color={pushEnabled ? colors.primary : colors.mutedForeground} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Push Notifications</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {pushEnabled ? "Receiving alerts on this device" : "Notifications disabled on this device"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => void handlePushToggle()} activeOpacity={0.75} disabled={pushLoading}>
              <View style={[styles.toggle, { backgroundColor: pushEnabled ? colors.primary : colors.border, opacity: pushLoading ? 0.5 : 1 }]}>
                <View style={[styles.thumb, { transform: [{ translateX: pushEnabled ? 20 : 2 }] }]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety — always locked on */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PUSH NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="shield" size={16} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Community Safety Alerts</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Urgent reports near your location</Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: colors.primary, opacity: 0.5 }]}>
              <View style={[styles.thumb, { transform: [{ translateX: 20 }] }]} />
            </View>
          </View>

          {TOGGLES.map((t, i) => (
            <React.Fragment key={t.id}>
              <View style={[styles.sep, { backgroundColor: colors.border }]} />
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={t.icon} size={16} color={colors.mutedForeground} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t.label}</Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{t.sub}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => update({ [t.id]: !settings[t.id] })}
                  activeOpacity={0.75}
                >
                  <View style={[styles.toggle, { backgroundColor: settings[t.id] ? colors.primary : colors.border }]}>
                    <View style={[styles.thumb, { transform: [{ translateX: settings[t.id] ? 20 : 2 }] }]} />
                  </View>
                </TouchableOpacity>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Quiet hours */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>QUIET HOURS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="moon" size={16} color={colors.mutedForeground} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Enable Quiet Hours</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Silence non-urgent alerts at night</Text>
            </View>
            <TouchableOpacity onPress={() => update({ quietHoursEnabled: !settings.quietHoursEnabled })}>
              <View style={[styles.toggle, { backgroundColor: settings.quietHoursEnabled ? colors.primary : colors.border }]}>
                <View style={[styles.thumb, { transform: [{ translateX: settings.quietHoursEnabled ? 20 : 2 }] }]} />
              </View>
            </TouchableOpacity>
          </View>

          {settings.quietHoursEnabled && (
            <>
              <View style={[styles.sep, { backgroundColor: colors.border }]} />
              <View style={styles.timeSection}>
                <Text style={[styles.timeSectionLabel, { color: colors.mutedForeground }]}>From</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timePills}>
                  {QUIET_FROM_OPTIONS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timePill, { backgroundColor: settings.quietHoursFrom === t ? colors.primary : colors.secondary }]}
                      onPress={() => update({ quietHoursFrom: t })}
                    >
                      <Text style={[styles.timePillTxt, { color: settings.quietHoursFrom === t ? "#FFF" : colors.foreground }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={[styles.sep, { backgroundColor: colors.border }]} />
              <View style={styles.timeSection}>
                <Text style={[styles.timeSectionLabel, { color: colors.mutedForeground }]}>Until</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timePills}>
                  {QUIET_UNTIL_OPTIONS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timePill, { backgroundColor: settings.quietHoursUntil === t ? colors.primary : colors.secondary }]}
                      onPress={() => update({ quietHoursUntil: t })}
                    >
                      <Text style={[styles.timePillTxt, { color: settings.quietHoursUntil === t ? "#FFF" : colors.foreground }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.disableAllBtn, { borderColor: colors.border }]}
          onPress={() => update({
            notifEvents: false, notifBusiness: false, notifMessages: false,
            notifReviews: false, notifCommunity: false, notifPromotions: false,
            notifDigest: false, notifTips: false, notifPostNudges: false,
          })}
          activeOpacity={0.75}
        >
          <Text style={[styles.disableAllTxt, { color: colors.mutedForeground }]}>Disable all non-essential notifications</Text>
        </TouchableOpacity>
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
  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 14, borderRadius: 12, marginBottom: 24,
  },
  infoTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 24 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  toggle: { width: 46, height: 26, borderRadius: 13, justifyContent: "center" },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFF", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  sep: { height: 1, marginLeft: 60 },
  timeSection: { paddingVertical: 12, paddingLeft: 16, gap: 8 },
  timeSectionLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  timePills: { flexDirection: "row", gap: 8, paddingRight: 16 },
  timePill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  timePillTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  disableAllBtn: { alignItems: "center", paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  disableAllTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
