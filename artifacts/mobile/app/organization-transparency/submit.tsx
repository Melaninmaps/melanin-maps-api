import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { getApiBase } from "@/lib/api";

const ORGANIZATION_TYPES = [
  ["employer", "Employer"],
  ["healthcare_facility", "Healthcare facility"],
  ["school", "School"],
  ["professional_service", "Professional service"],
  ["retailer", "Retailer"],
  ["nonprofit", "Nonprofit"],
  ["other", "Other organization"],
] as const;

const RELATIONSHIPS = [
  ["current_employee", "Current employee"],
  ["former_employee", "Former employee"],
  ["contractor", "Contractor"],
  ["job_applicant", "Job applicant"],
  ["customer", "Customer"],
  ["patient", "Patient"],
  ["caregiver", "Caregiver"],
] as const;

const OWNERSHIP_OPTIONS = [
  ["unknown", "I don't know"],
  ["self_identified_minority_owned", "Self-identified by the organization"],
  ["non_minority_owned", "Not minority-owned"],
] as const;

type OrganizationType = (typeof ORGANIZATION_TYPES)[number][0];
type Relationship = (typeof RELATIONSHIPS)[number][0];
type OwnershipStatus = (typeof OWNERSHIP_OPTIONS)[number][0];

type DuplicateCandidate = {
  id: string;
  legalName: string;
  displayName: string | null;
  city: string;
  state: string | null;
};

function OptionGroup<T extends string>({
  label,
  options,
  selected,
  onSelect,
  colors,
  testID,
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  selected: T;
  onSelect: (value: T) => void;
  colors: any;
  testID: string;
}) {
  return (
    <View style={styles.group} testID={testID}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.chips}>
        {options.map(([value, optionLabel]) => {
          const active = selected === value;
          return (
            <TouchableOpacity
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                void Haptics.selectionAsync();
                onSelect(value);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: active
                      ? colors.primaryForeground
                      : colors.foreground,
                  },
                ]}
              >
                {optionLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  optional,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: any;
  optional?: boolean;
  testID: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>
        {label}
        {optional ? " (optional)" : " *"}
      </Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="words"
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
          },
        ]}
      />
    </View>
  );
}

/**
 * Source-only native intake. The corresponding API stays disabled until the
 * approval-required Organization Transparency migration and release review pass.
 */
export default function OrganizationTransparencySubmitScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { amend } = useLocalSearchParams<{ amend?: string }>();
  const [legalName, setLegalName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationType, setOrganizationType] =
    useState<OrganizationType>("employer");
  const [relationship, setRelationship] =
    useState<Relationship>("current_employee");
  const [ownershipStatus, setOwnershipStatus] =
    useState<OwnershipStatus>("unknown");
  const [note, setNote] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const requestId = useMemo(() => Crypto.randomUUID(), []);

  const canCheck = legalName.trim().length >= 2 && city.trim().length >= 2;
  const canSubmit =
    canCheck && !submitting && !checking && duplicates.length === 0;

  async function authorizedHeaders(): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync("auth_session_token");
    if (!token)
      throw new Error(
        "Sign in with your approved member account to submit an organization.",
      );
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async function checkDuplicates(): Promise<void> {
    if (!canCheck) return;
    setChecking(true);
    try {
      const response = await fetch(
        `${getApiBase()}/api/organizations/duplicate-candidates?${new URLSearchParams(
          {
            legalName: legalName.trim(),
            city: city.trim(),
            ...(state.trim() ? { state: state.trim() } : {}),
          },
        ).toString()}`,
        { headers: await authorizedHeaders() },
      );
      const body = (await response.json().catch(() => ({}))) as {
        candidates?: DuplicateCandidate[];
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          body.error ?? "We could not check existing organizations.",
        );
      setDuplicates(Array.isArray(body.candidates) ? body.candidates : []);
    } catch (error) {
      Alert.alert(
        "Duplicate check",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setChecking(false);
    }
  }

  async function submit(): Promise<void> {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const response = await fetch(
        amend
          ? `${getApiBase()}/api/community/organizations/${encodeURIComponent(amend)}`
          : `${getApiBase()}/api/community/organizations`,
        {
          method: amend ? "PATCH" : "POST",
          headers: {
            ...(await authorizedHeaders()),
            "Idempotency-Key": requestId,
          },
          body: JSON.stringify({
            legalName: legalName.trim(),
            organizationType,
            ownershipStatus,
            website: website.trim() || undefined,
            phone: phone.trim() || undefined,
            location: { city: city.trim(), state: state.trim() || undefined },
            relationshipToOrganization: relationship,
            submitterNote: note.trim() || undefined,
            clientRequestId: requestId,
          }),
        },
      );
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          body.error ?? "Your organization could not be submitted.",
        );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (error) {
      Alert.alert(
        "Submission",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top, 20),
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={21} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {amend ? "Resubmit correction" : "Add an organization"}
        </Text>
        <View style={styles.backButton} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 24) + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {submitted ? (
            <View
              testID="organization-submission-success"
              style={[
                styles.success,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="clock" size={34} color={colors.primary} />
              <Text style={[styles.successTitle, { color: colors.foreground }]}>
                Submitted for review
              </Text>
              <Text style={[styles.copy, { color: colors.mutedForeground }]}>
                {amend
                  ? "Your corrected organization and location are back in factual review. "
                  : "Your organization and location are pending factual and duplicate review. "}
                They are not searchable, pinnable, recommended by Kinfolk, or
                promoted until separately approved.
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.primaryText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.notice,
                  {
                    backgroundColor: `${colors.primary}12`,
                    borderColor: `${colors.primary}40`,
                  },
                ]}
              >
                <Feather name="shield" size={18} color={colors.primary} />
                <View style={styles.noticeCopy}>
                  <Text
                    style={[styles.noticeTitle, { color: colors.foreground }]}
                  >
                    Factual listing first
                  </Text>
                  <Text
                    style={[styles.copy, { color: colors.mutedForeground }]}
                  >
                    Searchability, map placement, Kinfolk use, promotion, and
                    member experience are separate decisions. Adding an
                    organization does not verify ownership.
                  </Text>
                </View>
              </View>
              <Field
                label="Organization name"
                value={legalName}
                onChangeText={(value) => {
                  setLegalName(value);
                  setDuplicates([]);
                }}
                placeholder="e.g. Example Community Health"
                colors={colors}
                testID="organization-name-input"
              />
              <Field
                label="City"
                value={city}
                onChangeText={(value) => {
                  setCity(value);
                  setDuplicates([]);
                }}
                placeholder="Philadelphia"
                colors={colors}
                testID="organization-city-input"
              />
              <Field
                label="State / province"
                value={state}
                onChangeText={(value) => {
                  setState(value);
                  setDuplicates([]);
                }}
                placeholder="PA"
                colors={colors}
                optional
                testID="organization-state-input"
              />
              <TouchableOpacity
                testID="organization-duplicate-check"
                disabled={!canCheck || checking}
                onPress={() => {
                  void checkDuplicates();
                }}
                style={[
                  styles.outlineButton,
                  {
                    borderColor: colors.primary,
                    opacity: !canCheck || checking ? 0.5 : 1,
                  },
                ]}
              >
                {checking ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Feather name="search" size={16} color={colors.primary} />
                )}
                <Text style={[styles.outlineText, { color: colors.primary }]}>
                  {checking ? "Checking…" : "Check existing organizations"}
                </Text>
              </TouchableOpacity>
              {duplicates.length > 0 ? (
                <View
                  testID="organization-duplicate-results"
                  style={[
                    styles.duplicateCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.noticeTitle, { color: colors.foreground }]}
                  >
                    Possible existing organization
                  </Text>
                  <Text
                    style={[styles.copy, { color: colors.mutedForeground }]}
                  >
                    Select the existing profile when it matches. Do not create a
                    duplicate.
                  </Text>
                  {duplicates.map((candidate) => (
                    <Text
                      key={candidate.id}
                      style={[
                        styles.duplicateName,
                        { color: colors.foreground },
                      ]}
                    >
                      {candidate.displayName || candidate.legalName} ·{" "}
                      {candidate.city}
                      {candidate.state ? `, ${candidate.state}` : ""}
                    </Text>
                  ))}
                </View>
              ) : null}
              <OptionGroup
                label="Organization type"
                options={ORGANIZATION_TYPES}
                selected={organizationType}
                onSelect={setOrganizationType}
                colors={colors}
                testID="organization-type-picker"
              />
              <OptionGroup
                label="Your relationship"
                options={RELATIONSHIPS}
                selected={relationship}
                onSelect={setRelationship}
                colors={colors}
                testID="organization-relationship-picker"
              />
              <OptionGroup
                label="Ownership information"
                options={OWNERSHIP_OPTIONS}
                selected={ownershipStatus}
                onSelect={setOwnershipStatus}
                colors={colors}
                testID="organization-ownership-picker"
              />
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                Only a separate evidence review can mark ownership as verified.
                Your selection does not change promotion or recommendation
                eligibility.
              </Text>
              <Field
                label="Official website"
                value={website}
                onChangeText={setWebsite}
                placeholder="https://example.org"
                colors={colors}
                optional
                testID="organization-website-input"
              />
              <Field
                label="Public phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="(215) 555-0142"
                colors={colors}
                optional
                testID="organization-phone-input"
              />
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Why should this be added? (optional)
                </Text>
                <TextInput
                  testID="organization-note-input"
                  value={note}
                  onChangeText={setNote}
                  placeholder="Share factual context only. Please do not include protected medical, employment, or legal details."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  maxLength={2000}
                  textAlignVertical="top"
                  style={[
                    styles.note,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                testID="organization-submit"
                disabled={!canSubmit}
                onPress={() => {
                  void submit();
                }}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: canSubmit ? 1 : 0.5,
                  },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.primaryText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      {amend
                        ? "Resubmit correction for review"
                        : "Submit for factual review"}
                    </Text>
                    <Feather
                      name="arrow-right"
                      size={16}
                      color={colors.primaryForeground}
                    />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    minHeight: 58,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  backButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 18, gap: 4 },
  notice: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  noticeCopy: { flex: 1, gap: 3 },
  noticeTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  copy: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  field: { gap: 6, marginBottom: 15 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  input: {
    borderWidth: 1,
    minHeight: 48,
    borderRadius: 11,
    paddingHorizontal: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  note: {
    borderWidth: 1,
    minHeight: 105,
    borderRadius: 11,
    padding: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  group: { gap: 8, marginBottom: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    marginTop: -8,
    marginBottom: 16,
  },
  outlineButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  outlineText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 14,
  },
  primaryText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  duplicateCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    gap: 7,
    marginBottom: 15,
  },
  duplicateName: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  success: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    gap: 12,
    marginTop: 30,
  },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
});
