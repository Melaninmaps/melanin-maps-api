import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

type Category = "travel" | "health" | "finance" | "everyday";
type App = {
  key: string;
  category: Category;
  label: string;
  availability: string;
  dataTypes: string[];
  description: string;
  boundary: string;
  sensitive: boolean;
  permission: { status: string; purpose: string } | null;
};
const groups: Array<{ id: Category; title: string; detail: string }> = [
  {
    id: "travel",
    title: "Travel & plans",
    detail:
      "Calendars, selected confirmations, events, files, and flight-monitor setup.",
  },
  {
    id: "health",
    title: "Health",
    detail:
      "Separate purpose-specific consent and a compatible provider are required.",
  },
  {
    id: "finance",
    title: "Finance",
    detail:
      "Read-only budgeting only—never payments, transfers, or financial actions.",
  },
  {
    id: "everyday",
    title: "Everyday life",
    detail:
      "Member-selected documents, storage, and school or family calendar options.",
  },
];
function availabilityLabel(value: string) {
  if (value === "member_selected_import") return "Select an item in Journeys";
  if (value === "native_permission_required")
    return "Needs device permission and a compatible build";
  if (value === "provider_contract_required")
    return "Requires provider authorization";
  if (value === "unsupported") return "Not a supported data connection";
  return "Designed, but not configured";
}
async function request(path: string, init: RequestInit = {}) {
  const base = getApiBase();
  const headers = await getMemberApiHeaders();
  if (!base || !headers.Authorization)
    throw new Error("Please sign in again to manage Connected Apps.");
  const response = await fetch(`${base}/api${path}`, {
    ...init,
    headers: {
      ...headers,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  };
  if (!response.ok)
    throw new Error(
      body.error ?? body.message ?? "Connected Apps is unavailable right now.",
    );
  return body;
}
export default function KinfolkConnectedApps() {
  const colors = useColors();
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<App | null>(null);
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const body = (await request("/kinfolk-connected-apps")) as {
        apps?: App[];
      };
      setApps(Array.isArray(body.apps) ? body.apps : []);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Connected Apps could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const grouped = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        apps: apps.filter((app) => app.category === group.id),
      })),
    [apps],
  );
  const open = (app: App) => {
    if (app.availability === "member_selected_import") {
      router.push("/kinfolk-journeys" as never);
      return;
    }
    setPurpose("");
    setSelected(app);
  };
  const record = async () => {
    if (
      !selected ||
      !purpose.trim() ||
      saving ||
      selected.availability === "unsupported"
    )
      return;
    setSaving(true);
    try {
      await request(
        `/kinfolk-connected-apps/${encodeURIComponent(selected.key)}/permissions`,
        {
          method: "POST",
          body: JSON.stringify({
            explicitConsent: true,
            sensitiveDataAcknowledged: selected.sensitive,
            purpose: purpose.trim(),
            dataTypes: selected.dataTypes,
            scopes: selected.dataTypes,
          }),
        },
      );
      setSelected(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The permission could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };
  const change = async (app: App, action: "revoke" | "delete") => {
    try {
      await request(
        `/kinfolk-connected-apps/${encodeURIComponent(app.key)}${action === "revoke" ? "/revoke" : ""}`,
        { method: action === "revoke" ? "POST" : "DELETE" },
      );
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The connection setting could not be updated.",
      );
    }
  };
  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityLabel="Back from Connected Apps"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Connected Apps
        </Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.notice,
            {
              borderColor: colors.primary + "45",
              backgroundColor: colors.primary + "12",
            },
          ]}
        >
          <Feather name="shield" color={colors.primary} size={17} />
          <Text style={[styles.noticeText, { color: colors.foreground }]}>
            Kinfolk offers a connection only when it helps a specific task.
            Nothing scans an inbox, calendar, document library, health record,
            or financial account on its own.
          </Text>
        </View>
        {error ? (
          <View accessibilityRole="alert" style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => void load()}>
              <Text style={styles.errorRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          grouped.map((group) => (
            <View key={group.id} style={styles.group}>
              <Text style={[styles.groupTitle, { color: colors.foreground }]}>
                {group.title}
              </Text>
              <Text
                style={[styles.groupDetail, { color: colors.mutedForeground }]}
              >
                {group.detail}
              </Text>
              {group.apps.map((app) => (
                <View
                  key={app.key}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.icon,
                        { backgroundColor: colors.primary + "18" },
                      ]}
                    >
                      <Feather name="link-2" color={colors.primary} size={16} />
                    </View>
                    <View style={styles.grow}>
                      <Text
                        style={[styles.appTitle, { color: colors.foreground }]}
                      >
                        {app.label}
                      </Text>
                      <Text style={[styles.status, { color: colors.primary }]}>
                        {app.permission?.status ?? "not connected"}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.appDetail,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {app.description}
                  </Text>
                  <Text
                    style={[styles.availability, { color: colors.primary }]}
                  >
                    {availabilityLabel(app.availability)}
                  </Text>
                  <Text
                    style={[styles.boundary, { color: colors.mutedForeground }]}
                  >
                    {app.boundary}
                  </Text>
                  {app.permission ? (
                    <Text
                      style={[
                        styles.purpose,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Purpose: {app.permission.purpose}
                    </Text>
                  ) : null}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => open(app)}
                      style={[
                        styles.primary,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text style={styles.primaryText}>
                        {app.availability === "member_selected_import"
                          ? "Open Journeys"
                          : app.availability === "unsupported"
                            ? "Learn why"
                            : "Review setup"}
                      </Text>
                    </TouchableOpacity>
                    {app.permission ? (
                      <>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              "Revoke permission?",
                              "This removes authorization and any stored provider token envelope. Journey plans stay until you delete them.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Revoke",
                                  style: "destructive",
                                  onPress: () => void change(app, "revoke"),
                                },
                              ],
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.actionText,
                              { color: colors.primary },
                            ]}
                          >
                            Revoke
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              "Delete permission setting?",
                              "This deletes the Connected Apps permission record. Journey plans stay until you delete them.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => void change(app, "delete"),
                                },
                              ],
                            )
                          }
                        >
                          <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
      {selected ? (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => setSelected(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {selected.label}
              </Text>
              <Text
                style={[styles.appDetail, { color: colors.mutedForeground }]}
              >
                {selected.description}
              </Text>
              <Text
                style={[
                  styles.modalBoundary,
                  { color: colors.mutedForeground },
                ]}
              >
                {selected.boundary}
              </Text>
              {selected.availability === "unsupported" ? (
                <TouchableOpacity
                  onPress={() => setSelected(null)}
                  style={[
                    styles.primary,
                    { backgroundColor: colors.primary, marginTop: 18 },
                  ]}
                >
                  <Text style={styles.primaryText}>Close</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    What should this help with?
                  </Text>
                  <TextInput
                    value={purpose}
                    onChangeText={setPurpose}
                    maxLength={160}
                    placeholder="For example, review a member-selected trip"
                    placeholderTextColor={colors.mutedForeground}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.foreground },
                    ]}
                    accessibilityLabel="Connection purpose"
                  />
                  {selected.sensitive ? (
                    <Text
                      style={[
                        styles.boundary,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      This records sensitive-data purpose consent only. It does
                      not connect to, fetch, or share health or financial data.
                    </Text>
                  ) : null}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      disabled={!purpose.trim() || saving}
                      onPress={() => void record()}
                      style={[
                        styles.primary,
                        {
                          backgroundColor: colors.primary,
                          opacity: !purpose.trim() || saving ? 0.55 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.primaryText}>
                        {saving ? "Saving…" : "Record consent"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelected(null)}>
                      <Text
                        style={[styles.actionText, { color: colors.primary }]}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 44 },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  scroll: { padding: 18, paddingBottom: 42 },
  notice: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
  },
  noticeText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  error: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
    padding: 12,
    backgroundColor: "#FFF1F2",
    borderColor: "#FCA5A5",
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: { color: "#8A1C12", flex: 1, fontSize: 12, lineHeight: 17 },
  errorRetry: { color: "#8A1C12", fontSize: 12, fontFamily: "Inter_700Bold" },
  loading: { paddingTop: 60 },
  group: { marginTop: 24 },
  groupTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  groupDetail: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  card: { marginTop: 10, borderWidth: 1, borderRadius: 16, padding: 14 },
  cardHeader: { flexDirection: "row", gap: 10 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  grow: { flex: 1 },
  appTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  status: {
    marginTop: 2,
    fontSize: 10,
    textTransform: "uppercase",
    fontFamily: "Inter_700Bold",
  },
  appDetail: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  availability: { marginTop: 10, fontSize: 12, fontFamily: "Inter_700Bold" },
  boundary: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "Inter_400Regular",
  },
  purpose: { marginTop: 8, fontSize: 11, fontFamily: "Inter_500Medium" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 14,
  },
  primary: { borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10 },
  primaryText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  actionText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  deleteText: { color: "#B42318", fontSize: 12, fontFamily: "Inter_700Bold" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(28,14,6,0.5)",
  },
  modal: { borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontFamily: "PlayfairDisplay_700Bold" },
  modalBoundary: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  label: { marginTop: 18, fontSize: 13, fontFamily: "Inter_700Bold" },
  input: {
    marginTop: 8,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
