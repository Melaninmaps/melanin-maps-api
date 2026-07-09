import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from "@/lib/auth";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function authFetch(path: string, opts?: RequestInit): Promise<Response> {
  const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts?.headers as Record<string, string> ?? {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${getApiBase()}${path}`, { ...opts, headers, credentials: Platform.OS === "web" ? "include" : "omit" });
}

interface Transfer {
  id: number;
  fromCity: string | null;
  fromState: string | null;
  fromDepartment: string | null;
  toDepartment: string;
  toCity: string;
  toState: string;
  transferDate: string | null;
  sourceUrl: string | null;
  status: "pending" | "verified";
  createdAt: string;
}

interface Officer {
  id: number;
  officerName: string;
  badgeNumber: string | null;
  department: string | null;
  city: string | null;
  state: string | null;
  offenseType: string | null;
  offenseDescription: string;
  offenseDate: string | null;
  sourceUrl: string | null;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  transfers: Transfer[];
}

const OFFENSE_TYPES = [
  "Excessive Force",
  "Racial Profiling",
  "Wrongful Shooting",
  "Harassment",
  "False Arrest",
  "Misconduct",
  "Other",
];

export default function OfficerWatchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [tab, setTab] = useState<"watch" | "report">("watch");
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Report form
  const [officerName, setOfficerName] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [offenseType, setOffenseType] = useState("");
  const [offenseDescription, setOffenseDescription] = useState("");
  const [offenseDate, setOffenseDate] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/safety/officer-watch");
      if (res.ok) {
        const data = await res.json() as { officers: Officer[] };
        setOfficers(data.officers ?? []);
      }
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submitReport = async () => {
    if (!officerName.trim() || !offenseDescription.trim()) {
      Alert.alert("Required fields", "Officer name and description of offense are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch("/api/safety/officer-watch", {
        method: "POST",
        body: JSON.stringify({
          officerName: officerName.trim(),
          badgeNumber: badgeNumber.trim() || undefined,
          department: department.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          offenseType: offenseType || undefined,
          offenseDescription: offenseDescription.trim(),
          offenseDate: offenseDate.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
        }),
      });
      const data = await res.json() as { message?: string; error?: string };
      if (!res.ok) { Alert.alert("Error", data.error ?? "Could not submit"); setSubmitting(false); return; }
      Alert.alert("Submitted", data.message ?? "Thank you. Our team will review your tip.");
      setOfficerName(""); setBadgeNumber(""); setDepartment(""); setCity(""); setState("");
      setOffenseType(""); setOffenseDescription(""); setOffenseDate(""); setSourceUrl("");
      setTab("watch");
    } catch { Alert.alert("Error", "Something went wrong. Please try again."); }
    setSubmitting(false);
  };

  const openSource = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert("Cannot open", url));
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={s.back}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Officer Watch</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Track verified officer misconduct records & department transfers</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[s.tabs, { borderBottomColor: colors.border }]}>
        {(["watch", "report"] as const).map((t) => (
          <TouchableOpacity activeOpacity={0.85} key={t} style={[s.tab, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
              {t === "watch" ? "Watch List" : "Submit a Tip"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "watch" ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 12 }}>
          {/* Disclaimer */}
          <View style={[s.disclaimerCard, { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }]}>
            <Feather name="info" size={16} color="#92400E" />
            <Text style={[s.disclaimerText, { color: "#92400E" }]}>
              Records published in Officer Watch are reviewed by our team and supported by publicly available sources such as court documents, public records, investigative journalism, or official reports whenever available. This feature is intended to promote transparency through verified information and is not a criminal database.
            </Text>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : officers.length === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="shield" size={32} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No verified records yet</Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                Know about an officer with a misconduct record transferred to your area? Submit a tip — our team will verify and publish it.
              </Text>
              <TouchableOpacity activeOpacity={0.85} style={[s.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setTab("report")}>
                <Text style={s.emptyBtnText}>Submit a Tip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            officers.map((o) => (
              <View key={o.id} style={[s.officerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Officer header */}
                <TouchableOpacity style={s.officerHeader} onPress={() => setExpanded(expanded === o.id ? null : o.id)} activeOpacity={0.75}>
                  <View style={[s.officerAvatar, { backgroundColor: "#DC262618" }]}>
                    <Feather name="user" size={18} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.officerName, { color: colors.foreground }]}>{o.officerName}</Text>
                    <Text style={[s.officerMeta, { color: colors.mutedForeground }]}>
                      {[o.offenseType, o.department, o.city && o.state ? `${o.city}, ${o.state}` : o.city ?? o.state].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {o.transfers.length > 0 && (
                      <View style={[s.transferBadge, { backgroundColor: "#DC262620" }]}>
                        <Text style={[s.transferBadgeText, { color: "#DC2626" }]}>{o.transfers.length} transfer{o.transfers.length > 1 ? "s" : ""}</Text>
                      </View>
                    )}
                    <Feather name={expanded === o.id ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                  </View>
                </TouchableOpacity>

                {expanded === o.id && (
                  <View style={[s.officerDetail, { borderTopColor: colors.border }]}>
                    {/* Offense */}
                    <Text style={[s.detailLabel, { color: colors.mutedForeground }]}>OFFENSE</Text>
                    <Text style={[s.detailValue, { color: colors.foreground }]}>{o.offenseDescription}</Text>
                    {o.offenseDate && <Text style={[s.detailMeta, { color: colors.mutedForeground }]}>{o.offenseDate}</Text>}

                    {/* Source */}
                    {o.sourceUrl && (
                      <TouchableOpacity activeOpacity={0.85} style={[s.sourceLink, { borderColor: colors.border }]} onPress={() => openSource(o.sourceUrl!)}>
                        <Feather name="external-link" size={13} color={colors.primary} />
                        <Text style={[s.sourceLinkText, { color: colors.primary }]}>View Source</Text>
                      </TouchableOpacity>
                    )}

                    {/* Transfers */}
                    {o.transfers.length > 0 && (
                      <>
                        <Text style={[s.detailLabel, { color: colors.mutedForeground, marginTop: 14 }]}>KNOWN TRANSFERS</Text>
                        {o.transfers.filter((t) => t.status === "verified").map((t) => (
                          <View key={t.id} style={[s.transferRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <View style={{ flex: 1 }}>
                              <Text style={[s.transferDept, { color: colors.foreground }]}>{t.toDepartment}</Text>
                              <Text style={[s.transferLocation, { color: colors.mutedForeground }]}>
                                {t.toCity}, {t.toState}
                                {t.fromCity ? ` · from ${t.fromCity}${t.fromState ? `, ${t.fromState}` : ""}` : ""}
                              </Text>
                              {t.transferDate && <Text style={[s.transferDate, { color: colors.mutedForeground }]}>{t.transferDate}</Text>}
                            </View>
                            {t.sourceUrl && (
                              <TouchableOpacity activeOpacity={0.85} onPress={() => openSource(t.sourceUrl!)}>
                                <Feather name="external-link" size={15} color={colors.primary} />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                )}
              </View>
            ))
          )}

          {/* Submit a tip prompt */}
          {officers.length > 0 && (
            <TouchableOpacity activeOpacity={0.85} style={[s.tipPrompt, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setTab("report")}>
              <Feather name="alert-circle" size={16} color={colors.primary} />
              <Text style={[s.tipPromptText, { color: colors.foreground }]}>Know about a transfer not listed here? Submit a tip.</Text>
              <Feather name="arrow-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        /* ── Submit a Tip ── */
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 14 }} keyboardShouldPersistTaps="handled">
          {!isAuthenticated && (
            <View style={[s.disclaimerCard, { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }]}>
              <Feather name="lock" size={15} color="#92400E" />
              <Text style={[s.disclaimerText, { color: "#92400E" }]}>Sign in to submit a tip.</Text>
            </View>
          )}

          <View style={[s.disclaimerCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
            <Feather name="info" size={15} color="#1D4ED8" />
            <Text style={[s.disclaimerText, { color: "#1D4ED8" }]}>
              All submissions are reviewed by our team before publishing. Include a source link (news article, public record, or court document) to speed up verification.
            </Text>
          </View>

          <Field label="Officer Name *" value={officerName} onChange={setOfficerName} placeholder="Full name" colors={colors} />
          <Field label="Badge Number" value={badgeNumber} onChange={setBadgeNumber} placeholder="Optional" colors={colors} />
          <Field label="Department / Agency" value={department} onChange={setDepartment} placeholder="e.g. Minneapolis PD" colors={colors} />
          <Field label="City" value={city} onChange={setCity} placeholder="City of the incident" colors={colors} />
          <Field label="State" value={state} onChange={setState} placeholder="State" colors={colors} />

          <View style={{ gap: 6 }}>
            <Text style={[s.fieldLabel, { color: colors.foreground }]}>Type of Offense</Text>
            <View style={s.offenseTypes}>
              {OFFENSE_TYPES.map((ot) => (
                <TouchableOpacity activeOpacity={0.85}
                  key={ot}
                  style={[s.offensePill, { borderColor: offenseType === ot ? colors.primary : colors.border, backgroundColor: offenseType === ot ? colors.primary + "18" : colors.card }]}
                  onPress={() => setOffenseType(offenseType === ot ? "" : ot)}
                >
                  <Text style={[s.offensePillText, { color: offenseType === ot ? colors.primary : colors.mutedForeground }]}>{ot}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={[s.fieldLabel, { color: colors.foreground }]}>Description of Offense *</Text>
            <TextInput
              style={[s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={offenseDescription}
              onChangeText={setOffenseDescription}
              placeholder="Describe what happened — be factual and specific. Include outcome if known."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <Field label="Date of Offense" value={offenseDate} onChange={setOffenseDate} placeholder="e.g. March 2022" colors={colors} />
          <Field label="Source URL" value={sourceUrl} onChange={setSourceUrl} placeholder="News article, court record, or public document" colors={colors} keyboardType="url" autoCapitalize="none" />

          <TouchableOpacity activeOpacity={0.85}
            style={[s.submitBtn, { backgroundColor: colors.primary, opacity: (!isAuthenticated || submitting) ? 0.5 : 1 }]}
            onPress={submitReport}
            disabled={!isAuthenticated || submitting}
          >
            {submitting ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Feather name="send" size={16} color="#fff" />
                <Text style={s.submitBtnText}>Submit for Review</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

function Field({ label, value, onChange, placeholder, colors, keyboardType, autoCapitalize }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  keyboardType?: "default" | "url" | "email-address" | "numeric";
  autoCapitalize?: "none" | "words" | "sentences";
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[s.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "words"}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  back: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 13 },
  tabText: { fontSize: 14, fontWeight: "600" },
  disclaimerCard: { flexDirection: "row", gap: 10, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "flex-start" },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 18 },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, marginTop: 4 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  officerCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  officerHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  officerAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  officerName: { fontSize: 15, fontWeight: "700" },
  officerMeta: { fontSize: 12, marginTop: 2 },
  transferBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  transferBadgeText: { fontSize: 11, fontWeight: "700" },
  officerDetail: { padding: 14, borderTopWidth: 1, gap: 6 },
  detailLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginTop: 4 },
  detailValue: { fontSize: 13, lineHeight: 20 },
  detailMeta: { fontSize: 11 },
  sourceLink: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, alignSelf: "flex-start", marginTop: 6 },
  sourceLinkText: { fontSize: 12, fontWeight: "600" },
  transferRow: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  transferDept: { fontSize: 13, fontWeight: "700" },
  transferLocation: { fontSize: 12, marginTop: 2 },
  transferDate: { fontSize: 11, marginTop: 2 },
  tipPrompt: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  tipPromptText: { flex: 1, fontSize: 13, fontWeight: "500" },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 100 },
  offenseTypes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  offensePill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  offensePillText: { fontSize: 12, fontWeight: "600" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 15 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
