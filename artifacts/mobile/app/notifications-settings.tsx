import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type Toggle = { id: string; icon: React.ComponentProps<typeof Feather>["name"]; label: string; sub: string; on: boolean; important?: boolean };

const INITIAL_TOGGLES: Toggle[] = [
  { id: "safety", icon: "shield", label: "Community Safety Alerts", sub: "Urgent reports near your location", on: true, important: true },
  { id: "events", icon: "calendar", label: "New Events Near You", sub: "Upcoming community events in your city", on: true },
  { id: "business", icon: "briefcase", label: "Business Updates", sub: "Hours changes, closures, new listings", on: true },
  { id: "messages", icon: "message-circle", label: "Direct Messages", sub: "Replies and new conversations", on: true },
  { id: "reviews", icon: "star", label: "Review Replies", sub: "When businesses respond to your reviews", on: true },
  { id: "community", icon: "users", label: "Community Activity", sub: "Likes and comments on your posts", on: false },
  { id: "promotions", icon: "tag", label: "Promotions & Offers", sub: "Deals from verified businesses", on: false },
  { id: "digest", icon: "mail", label: "Weekly Digest Email", sub: "Top picks and community highlights", on: true },
  { id: "tips", icon: "info", label: "Tips & Features", sub: "How to get the most from the app", on: false },
];

const HOURS = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"];
const QUIET_END = ["8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"];

export default function NotificationsSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [toggles, setToggles] = useState<Toggle[]>(INITIAL_TOGGLES);
  const [quietFrom, setQuietFrom] = useState("10:00 PM");
  const [quietTo, setQuietTo] = useState("8:00 AM");
  const [quietHoursOn, setQuietHoursOn] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const flip = (id: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setToggles((prev) => prev.map((t) => t.id === id ? { ...t, on: !t.on } : t));
  };

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
          <Feather name="bell" size={18} color={colors.primary} />
          <Text style={[styles.infoTxt, { color: colors.mutedForeground }]}>
            Safety alerts are always on to keep you and the community safe.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PUSH NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {toggles.map((t, i) => (
            <React.Fragment key={t.id}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: t.important ? colors.primary + "18" : colors.secondary }]}>
                  <Feather name={t.icon} size={16} color={t.important ? colors.primary : colors.mutedForeground} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t.label}</Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{t.sub}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => t.important ? null : flip(t.id)}
                  activeOpacity={t.important ? 1 : 0.75}
                >
                  <View
                    style={[
                      styles.toggle,
                      { backgroundColor: t.on ? colors.primary : colors.border, opacity: t.important ? 0.6 : 1 },
                    ]}
                  >
                    <View style={[styles.thumb, { transform: [{ translateX: t.on ? 20 : 2 }] }]} />
                  </View>
                </TouchableOpacity>
              </View>
              {i < toggles.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
            </React.Fragment>
          ))}
        </View>

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
            <TouchableOpacity onPress={() => { setQuietHoursOn((v) => !v); if (Platform.OS !== "web") Haptics.selectionAsync(); }}>
              <View style={[styles.toggle, { backgroundColor: quietHoursOn ? colors.primary : colors.border }]}>
                <View style={[styles.thumb, { transform: [{ translateX: quietHoursOn ? 20 : 2 }] }]} />
              </View>
            </TouchableOpacity>
          </View>

          {quietHoursOn && (
            <>
              <View style={[styles.sep, { backgroundColor: colors.border }]} />
              <View style={[styles.timeRow, { opacity: 0.95 }]}>
                <View style={styles.timePicker}>
                  <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>From</Text>
                  <View style={[styles.timeChip, { backgroundColor: colors.secondary }]}>
                    <Feather name="clock" size={14} color={colors.primary} />
                    <Text style={[styles.timeTxt, { color: colors.foreground }]}>{quietFrom}</Text>
                  </View>
                </View>
                <Feather name="arrow-right" size={16} color={colors.border} />
                <View style={styles.timePicker}>
                  <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Until</Text>
                  <View style={[styles.timeChip, { backgroundColor: colors.secondary }]}>
                    <Feather name="clock" size={14} color={colors.primary} />
                    <Text style={[styles.timeTxt, { color: colors.foreground }]}>{quietTo}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.disableAllBtn, { borderColor: colors.border }]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.selectionAsync();
            setToggles((prev) => prev.map((t) => t.important ? t : { ...t, on: false }));
          }}
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
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 14, paddingHorizontal: 16 },
  timePicker: { alignItems: "center", gap: 6 },
  timeLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  timeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  timeTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  disableAllBtn: { alignItems: "center", paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  disableAllTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
