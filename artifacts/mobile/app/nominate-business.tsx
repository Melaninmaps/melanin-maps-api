import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { CATEGORY_GROUPS } from "@/constants/categories";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

type ResultState =
  | { isDuplicate: false; nominationId: string; businessId: string; isBlackOwned: boolean }
  | { isDuplicate: true; type: "already_listed"; businessId: string; message: string }
  | { isDuplicate: true; type: "already_nominated"; message: string };

type Form = {
  isBlackOwned: boolean | null;
  businessName: string;
  category: string;
  city: string;
  state: string;
  phone: string;
  website: string;
  ownerName: string;
  ownerContact: string;
  notes: string;
  nominatorEmail: string;
};

const INITIAL: Form = {
  isBlackOwned: null,
  businessName: "", category: "", city: "", state: "",
  phone: "", website: "", ownerName: "", ownerContact: "",
  notes: "", nominatorEmail: "",
};

const ALL_CATEGORY_NAMES = CATEGORY_GROUPS.map((g) => g.name);

export default function NominateBusinessScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ ownership?: string }>();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const preselected = params.ownership === "general" ? false : params.ownership === "minority" ? true : null;

  const [form, setForm] = useState<Form>({ ...INITIAL, isBlackOwned: preselected });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [showCatPicker, setShowCatPicker] = useState(false);

  const update = (key: keyof Form) => (val: string | boolean | null) =>
    setForm((f) => ({ ...f, [key]: val }));

  const canSubmit =
    form.isBlackOwned !== null &&
    form.businessName.trim().length > 0 &&
    form.city.trim().length > 0 &&
    form.state.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting || form.isBlackOwned === null) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/business-nominations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          category: form.category || undefined,
          city: form.city.trim(),
          state: form.state.trim(),
          phone: form.phone.trim() || undefined,
          website: form.website.trim() || undefined,
          ownerName: form.isBlackOwned ? (form.ownerName.trim() || undefined) : undefined,
          ownerContact: form.isBlackOwned ? (form.ownerContact.trim() || undefined) : undefined,
          notes: form.notes.trim() || undefined,
          nominatorEmail: !isAuthenticated ? form.nominatorEmail.trim() || undefined : undefined,
          blackOwned: form.isBlackOwned,
        }),
      });
      const data = await res.json() as ResultState & { error?: string; code?: string; nomination?: { id: string }; businessId?: string };
      if (!res.ok) {
        if (data.code === "TIER_LIMIT_REACHED") {
          Alert.alert(
            "Membership Required",
            data.error ?? "Upgrade to Explorer+ to nominate businesses.",
            [
              { text: "Maybe Later", style: "cancel" },
              { text: "View Plans", onPress: () => router.push("/membership") },
            ],
          );
          return;
        }
        Alert.alert("Error", data.error ?? "Could not submit. Please try again.");
        return;
      }
      if (data.isDuplicate) {
        setResult(data as ResultState);
      } else {
        setResult({
          isDuplicate: false,
          nominationId: (data as any).nomination?.id ?? "",
          businessId: (data as any).businessId ?? "",
          isBlackOwned: form.isBlackOwned ?? true,
        });
      }
    } catch {
      Alert.alert("Error", "Could not submit. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({
    label, value, onChangeText, placeholder, hint, multiline, keyboardType, autoCapitalize,
  }: {
    label: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
    hint?: string; multiline?: boolean; keyboardType?: any; autoCapitalize?: any;
  }) => (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.fieldInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }, multiline && styles.multiline]}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={false}
      />
      {hint && <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>{hint}</Text>}
    </View>
  );

  if (result) {
    if (!result.isDuplicate) {
      const isBlackOwned = result.isBlackOwned;
      return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never)}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add a Business</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={styles.successWrap}>
            <Text style={styles.successEmoji}>{isBlackOwned ? "🙌🏾" : "✅"}</Text>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              {isBlackOwned ? "Thank you for the nomination!" : "Added to the directory!"}
            </Text>
            <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
              {isBlackOwned
                ? `We'll reach out to ${form.businessName} about joining our community.`
                : `${form.businessName} has been added to the Mapping With Melanin directory as a non-minority-owned business. The community can now find and save it.`}
            </Text>

            {isBlackOwned && !isAuthenticated && (
              <View style={[styles.referralCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="gift" size={20} color="#C9922B" />
                <Text style={[styles.referralTitle, { color: colors.foreground }]}>You'll earn referral credit</Text>
                <Text style={[styles.referralBody, { color: colors.mutedForeground }]}>
                  If this business joins through your nomination, you'll automatically be credited as their referrer — and earn rewards when they list.
                </Text>
              </View>
            )}

            {!isBlackOwned && (
              <View style={[styles.designationBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="info" size={14} color={colors.mutedForeground} />
                <Text style={[styles.designationTxt, { color: colors.mutedForeground }]}>
                  Designated as Non-Minority Owned — this business will never be promoted or contacted by Mapping With Melanin.
                </Text>
              </View>
            )}

            {result.businessId ? (
              <TouchableOpacity activeOpacity={0.85}
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push({ pathname: "/business/[id]", params: { id: result.businessId } } as never)}
              >
                <Text style={styles.doneBtnTxt}>View the Listing</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.doneBtn, { backgroundColor: result.businessId ? "transparent" : colors.primary, borderWidth: result.businessId ? 1 : 0, borderColor: colors.border }]}
              onPress={() => { setForm(INITIAL); setResult(null); }}
            >
              <Text style={[styles.doneBtnTxt, result.businessId ? { color: colors.foreground } : {}]}>Add Another</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.homeBtn, { borderColor: colors.border }]}
              onPress={() => router.replace("/(tabs)" as never)}
            >
              <Text style={[styles.homeBtnTxt, { color: colors.foreground }]}>Back to Discover</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (result.type === "already_listed") {
      return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never)}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add a Business</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={styles.successWrap}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Already in the directory!</Text>
            <Text style={[styles.successBody, { color: colors.mutedForeground }]}>{result.message}</Text>
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push({ pathname: "/business/[id]", params: { id: result.businessId } } as never)}
            >
              <Text style={styles.doneBtnTxt}>View Their Listing</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.homeBtn, { borderColor: colors.border }]}
              onPress={() => { setForm(INITIAL); setResult(null); }}
            >
              <Text style={[styles.homeBtnTxt, { color: colors.foreground }]}>Add a Different Business</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add a Business</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.successWrap}>
          <Text style={styles.successEmoji}>🤝🏾</Text>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Already on our radar!</Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>{result.message}</Text>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => { setForm(INITIAL); setResult(null); }}
          >
            <Text style={styles.doneBtnTxt}>Add Another Business</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add a Business</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Ownership type selector ──────────────────────────── */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 4 }]}>Ownership Type</Text>
          <View style={styles.ownershipRow}>
            <TouchableOpacity
              style={[
                styles.ownershipCard,
                { borderColor: form.isBlackOwned === true ? colors.primary : colors.border, backgroundColor: form.isBlackOwned === true ? colors.primary + "12" : colors.card },
              ]}
              onPress={() => update("isBlackOwned")(true)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>✊🏾</Text>
              <Text style={[styles.ownershipLabel, { color: form.isBlackOwned === true ? colors.primary : colors.foreground }]}>
                Black / Minority Owned
              </Text>
              <Text style={[styles.ownershipSub, { color: colors.mutedForeground }]}>
                Owner will be invited to join the community
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.ownershipCard,
                { borderColor: form.isBlackOwned === false ? colors.foreground : colors.border, backgroundColor: form.isBlackOwned === false ? colors.secondary : colors.card },
              ]}
              onPress={() => update("isBlackOwned")(false)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🏢</Text>
              <Text style={[styles.ownershipLabel, { color: colors.foreground }]}>
                Non-Minority Owned
              </Text>
              <Text style={[styles.ownershipSub, { color: colors.mutedForeground }]}>
                Added for community reference only — never promoted or contacted
              </Text>
            </TouchableOpacity>
          </View>

          {form.isBlackOwned === false && (
            <View style={[styles.nonMinorityNotice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="info" size={14} color={colors.mutedForeground} />
              <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
                Non-minority-owned businesses are clearly designated in the directory. They will never receive promotional placement, outreach, or contact from Mapping With Melanin.
              </Text>
            </View>
          )}

          <View style={[styles.section, { marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Business Details</Text>

            <Field
              label="Business Name *"
              value={form.businessName}
              onChangeText={update("businessName")}
              placeholder="e.g. Corner Grocery ATL"
            />

            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category</Text>
              <TouchableOpacity
                style={[styles.catBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() => setShowCatPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.catBtnTxt, { color: form.category ? colors.foreground : colors.mutedForeground }]}>
                  {form.category || "Select a category (optional)"}
                </Text>
                <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field
                  label="City *"
                  value={form.city}
                  onChangeText={update("city")}
                  placeholder="Atlanta"
                />
              </View>
              <View style={{ flex: 0.45 }}>
                <Field
                  label="State *"
                  value={form.state}
                  onChangeText={update("state")}
                  placeholder="GA"
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Contact Info (optional)</Text>

            <Field
              label="Business Phone"
              value={form.phone}
              onChangeText={update("phone")}
              placeholder="+1 (404) 555-0100"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <Field
              label="Website or Social Handle"
              value={form.website}
              onChangeText={update("website")}
              placeholder="@businesshandle or business.com"
              autoCapitalize="none"
            />

            {form.isBlackOwned === true && (
              <>
                <Field
                  label="Owner's Name"
                  value={form.ownerName}
                  onChangeText={update("ownerName")}
                  placeholder="Jasmine Brown"
                />
                <Field
                  label="Best way to reach the owner"
                  value={form.ownerContact}
                  onChangeText={update("ownerContact")}
                  placeholder="Email, Instagram, phone..."
                  autoCapitalize="none"
                />
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              {form.isBlackOwned === false ? "Community Note (optional)" : "Why should they be listed?"}
            </Text>
            <Field
              label={form.isBlackOwned === false ? "Your note" : "Your note (optional)"}
              value={form.notes}
              onChangeText={update("notes")}
              placeholder={
                form.isBlackOwned === false
                  ? "Share context about this location for the community..."
                  : "Tell us what makes this business special..."
              }
              multiline
            />
          </View>

          {!isAuthenticated && form.isBlackOwned === true && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Your Info (for referral credit)</Text>
              <Field
                label="Your Email"
                value={form.nominatorEmail}
                onChangeText={update("nominatorEmail")}
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={[styles.authNudge, { color: colors.mutedForeground }]}>
                <Text style={{ color: "#C9922B" }}>Sign in</Text> to automatically track your nominations and earn referral rewards.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: canSubmit ? colors.primary : colors.muted }]}
            onPress={() => { void handleSubmit(); }}
            activeOpacity={0.85}
            disabled={!canSubmit || submitting}
          >
            <Feather name={submitting ? "loader" : "send"} size={16} color={canSubmit ? "#FFF" : colors.mutedForeground} />
            <Text style={[styles.submitBtnTxt, { color: canSubmit ? "#FFF" : colors.mutedForeground }]}>
              {submitting ? "Submitting…" : form.isBlackOwned === false ? "Add to Directory" : "Submit Nomination"}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCatPicker} transparent animationType="slide" onRequestClose={() => setShowCatPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCatPicker(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Category</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => { setForm((f) => ({ ...f, category: "" })); setShowCatPicker(false); }}>
                <Text style={{ color: "#C9922B", fontFamily: "Inter_600SemiBold" }}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {ALL_CATEGORY_NAMES.map((name) => (
                <TouchableOpacity activeOpacity={0.85}
                  key={name}
                  style={[styles.catOption, { borderBottomColor: colors.border }, form.category === name && { backgroundColor: colors.primary + "18" }]}
                  onPress={() => { setForm((f) => ({ ...f, category: name })); setShowCatPicker(false); }}
                >
                  <Text style={[styles.catOptionTxt, { color: colors.foreground }, form.category === name && { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    {CATEGORY_GROUPS.find((g) => g.name === name)?.emoji ?? "🏷️"} {name}
                  </Text>
                  {form.category === name && <Feather name="check" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },
  ownershipRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  ownershipCard: { flex: 1, borderRadius: 14, borderWidth: 2, padding: 14, alignItems: "center", gap: 2 },
  ownershipLabel: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center" },
  ownershipSub: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
  nonMinorityNotice: { borderRadius: 10, borderWidth: 1, padding: 12, flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 4 },
  noticeText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  section: { gap: 4, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4, marginTop: 8 },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  fieldInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  multiline: { height: 80, textAlignVertical: "top", paddingTop: 10 },
  fieldHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  row: { flexDirection: "row", gap: 10 },
  catBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  catBtnTxt: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  authNudge: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  submitBtn: { borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  submitBtnTxt: { fontSize: 15, fontFamily: "Inter_700Bold" },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  successEmoji: { fontSize: 56, marginBottom: 4 },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  successBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  designationBadge: { borderRadius: 10, borderWidth: 1, padding: 12, flexDirection: "row", gap: 8, alignItems: "flex-start", width: "100%" },
  designationTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  referralCard: { borderRadius: 16, borderWidth: 1, padding: 16, width: "100%", alignItems: "center", gap: 8, marginTop: 8 },
  referralTitle: { fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "center" },
  referralBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  doneBtn: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 28, marginTop: 8 },
  doneBtnTxt: { color: "#FFF", fontSize: 15, fontFamily: "Inter_700Bold" },
  homeBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, borderWidth: 1 },
  homeBtnTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingBottom: 32 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  catOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  catOptionTxt: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
