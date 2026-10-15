import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

const RELATIONSHIPS = [
  ["current_employee", "Current employee"],
  ["former_employee", "Former employee"],
  ["contractor", "Contractor"],
  ["job_applicant", "Job applicant"],
  ["customer", "Customer"],
  ["patient", "Patient"],
  ["caregiver", "Caregiver"],
] as const;
const EMPLOYER_THEMES = [
  ["management_respect", "Management & respect"],
  ["compensation_and_advancement", "Compensation & advancement"],
  ["discrimination_and_retaliation", "Discrimination & retaliation"],
  ["accommodations", "Accommodations"],
  ["scheduling_and_benefits", "Scheduling & benefits"],
  ["complaint_handling", "Complaint handling"],
  ["workplace_culture", "Workplace culture"],
] as const;
const HEALTHCARE_STAFF_THEMES = [
  ["staffing", "Staffing"],
  ["management", "Management"],
  ["safety_reporting", "Safety reporting"],
  ["scheduling", "Scheduling"],
  ["advancement", "Advancement"],
  ["discrimination_and_retaliation", "Discrimination & retaliation"],
] as const;
const CARE_THEMES = [
  ["communication", "Communication"],
  ["informed_consent", "Informed consent"],
  ["pain_management", "Pain management"],
  ["respect", "Respect"],
  ["accessibility", "Accessibility"],
  ["discharge_follow_up", "Discharge & follow-up"],
] as const;
const CUSTOMER_THEMES = [
  ["service_respect", "Service & respect"],
  ["accessibility", "Accessibility"],
  ["communication", "Communication"],
  ["complaint_handling", "Complaint handling"],
] as const;

type Profile = {
  id: string;
  legalName: string;
  displayName: string | null;
  organizationType: string;
  website: string | null;
  city: string;
  state: string | null;
  country: string | null;
  mapPinStatus: string;
  kinfolkStatus: string;
  promotionStatus: string;
  experienceStatus: string;
};
type Location = {
  id: string;
  name: string | null;
  city: string;
  state: string | null;
  country: string | null;
  isPrimary: boolean;
};
type Experience = {
  id: string;
  relationshipLabel: string;
  categoryCodes: string[];
  narrative: string | null;
  city: string | null;
  state: string | null;
  submittedAt: string;
};
function pretty(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function themesFor(profile: Profile, relationship: string) {
  if (relationship === "patient" || relationship === "caregiver")
    return CARE_THEMES;
  if (
    [
      "current_employee",
      "former_employee",
      "contractor",
      "job_applicant",
    ].includes(relationship)
  )
    return ["healthcare_facility", "hospital"].includes(
      profile.organizationType,
    )
      ? HEALTHCARE_STAFF_THEMES
      : EMPLOYER_THEMES;
  return CUSTOMER_THEMES;
}

export default function OrganizationTransparencyProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [relationship, setRelationship] =
    useState<(typeof RELATIONSHIPS)[number][0]>("customer");
  const [categories, setCategories] = useState<string[]>([]);
  const [locationId, setLocationId] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState<
    "pseudonymous_public" | "private_to_moderators"
  >("pseudonymous_public");
  const [narrative, setNarrative] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const requestId = useRef(Crypto.randomUUID());

  const load = useMemo(
    () => async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await fetch(
          `${getApiBase()}/api/organizations/${encodeURIComponent(id)}`,
          { headers: await getMemberApiHeaders() },
        );
        const data = (await response.json().catch(() => ({}))) as {
          profile?: Profile;
          locations?: Location[];
          experiences?: Experience[];
          experienceSummary?: { totalPublished?: number };
          error?: string;
        };
        if (!response.ok || !data.profile)
          throw new Error(data.error ?? "Organization unavailable.");
        setProfile(data.profile);
        const nextLocations = Array.isArray(data.locations)
          ? data.locations
          : [];
        setLocations(nextLocations);
        setLocationId((current) => current || nextLocations[0]?.id || "");
        setExperiences(Array.isArray(data.experiences) ? data.experiences : []);
        setTotal(data.experienceSummary?.totalPublished ?? 0);
      } catch (error) {
        Alert.alert(
          "Organization profile",
          error instanceof Error ? error.message : "Unable to load profile.",
        );
        setProfile(null);
      } finally {
        setLoading(false);
      }
    },
    [id],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const themes = profile ? themesFor(profile, relationship) : CUSTOMER_THEMES;
  useEffect(
    () =>
      setCategories((current) =>
        current.filter((value) => themes.some(([key]) => key === value)),
      ),
    [relationship, profile?.organizationType],
  );
  function toggleTheme(value: string) {
    setCategories((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length < 3
          ? [...current, value]
          : current,
    );
  }
  async function submitExperience() {
    if (!profile || !locationId || categories.length === 0 || submitting)
      return;
    setSubmitting(true);
    try {
      const response = await fetch(
        `${getApiBase()}/api/organizations/${encodeURIComponent(profile.id)}/experiences`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await getMemberApiHeaders()),
            "Idempotency-Key": requestId.current,
          },
          body: JSON.stringify({
            relationship,
            categoryCodes: categories,
            privacyLevel,
            organizationLocationId: locationId,
            narrative: narrative.trim() || undefined,
            clientRequestId: requestId.current,
          }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(
          data.error ?? "Your experience could not be submitted.",
        );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNarrative("");
      setCategories([]);
      requestId.current = Crypto.randomUUID();
      Alert.alert(
        "Submitted for moderation",
        data.message ??
          "Your experience is private until a reviewer makes a decision.",
      );
    } catch (error) {
      Alert.alert(
        "Experience",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  if (!profile)
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          This organization profile is not available.
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.link, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  const submitAllowed =
    profile.experienceStatus === "eligible" && locations.length > 0;
  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top, 18),
        },
      ]}
      testID="organization-transparency-profile"
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Feather name="arrow-left" size={21} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Organization profile
        </Text>
        <View style={styles.back} />
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 28 },
        ]}
      >
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}
          >
            <Feather name="briefcase" size={27} color={colors.primary} />
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {profile.displayName || profile.legalName}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {pretty(profile.organizationType)} ·{" "}
            {[profile.city, profile.state, profile.country]
              .filter(Boolean)
              .join(", ")}
          </Text>
          {profile.website ? (
            <Text style={[styles.link, { color: colors.primary }]}>
              {profile.website}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.notice,
            {
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}38`,
            },
          ]}
        >
          <Feather name="shield" size={18} color={colors.primary} />
          <View style={styles.flex}>
            <Text style={[styles.noticeTitle, { color: colors.foreground }]}>
              Separate decisions, no composite score
            </Text>
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              This is a factual member profile. Map placement:{" "}
              {profile.mapPinStatus === "eligible"
                ? "separately eligible"
                : "not represented"}
              . Kinfolk use:{" "}
              {profile.kinfolkStatus === "eligible"
                ? "separately eligible"
                : "not represented"}
              . Promotion:{" "}
              {profile.promotionStatus === "eligible"
                ? "separately eligible"
                : "not represented"}
              . Experiences are contextual, not a rating or quality claim.
            </Text>
          </View>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Member experiences
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {total} published pseudonymous experience{total === 1 ? "" : "s"}.
          Pending, private, held, rejected, and withdrawn experiences are never
          shown here.
        </Text>
        <View style={styles.stack}>
          {experiences.length === 0 ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.copy, { color: colors.mutedForeground }]}>
                No published experiences yet.
              </Text>
            </View>
          ) : (
            experiences.map((experience) => (
              <View
                key={experience.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {experience.relationshipLabel}
                </Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  {[experience.city, experience.state]
                    .filter(Boolean)
                    .join(", ")}{" "}
                  · {new Date(experience.submittedAt).toLocaleDateString()}
                </Text>
                <View style={styles.chips}>
                  {experience.categoryCodes.map((category) => (
                    <View
                      key={category}
                      style={[
                        styles.tag,
                        { backgroundColor: `${colors.primary}18` },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: colors.primary }]}>
                        {pretty(category)}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.copy, { color: colors.foreground }]}>
                  {experience.narrative ||
                    "This member selected structured themes without a public narrative."}
                </Text>
              </View>
            ))
          )}
        </View>
        {submitAllowed ? (
          <View
            style={[
              styles.form,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            testID="organization-experience-form"
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Share a structured experience
            </Text>
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              Your name is never shown. No stars or universal score. Every
              experience starts in moderation.
            </Text>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Relationship
            </Text>
            <View style={styles.chips}>
              {RELATIONSHIPS.map(([value, text]) => (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: relationship === value }}
                  onPress={() => setRelationship(value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        relationship === value
                          ? colors.primary
                          : colors.background,
                      borderColor:
                        relationship === value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          relationship === value
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Location
            </Text>
            <View style={styles.chips}>
              {locations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: locationId === location.id }}
                  onPress={() => setLocationId(location.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        locationId === location.id
                          ? colors.primary
                          : colors.background,
                      borderColor:
                        locationId === location.id
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          locationId === location.id
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {location.name ? `${location.name} · ` : ""}
                    {location.city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Themes (choose 1–3)
            </Text>
            <View style={styles.chips}>
              {themes.map(([value, text]) => (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: categories.includes(value) }}
                  onPress={() => toggleTheme(value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: categories.includes(value)
                        ? colors.primary
                        : colors.background,
                      borderColor: categories.includes(value)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: categories.includes(value)
                          ? colors.primaryForeground
                          : colors.foreground,
                      },
                    ]}
                  >
                    {text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Privacy
            </Text>
            <View style={styles.stack}>
              {(
                [
                  [
                    "pseudonymous_public",
                    "Pseudonymous if approved",
                    "Approved text uses your relationship and location only.",
                  ],
                  [
                    "private_to_moderators",
                    "Private to moderators",
                    "Never visible to other members.",
                  ],
                ] as const
              ).map(([value, title, copy]) => (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: privacyLevel === value }}
                  onPress={() => setPrivacyLevel(value)}
                  style={[
                    styles.privacy,
                    {
                      borderColor:
                        privacyLevel === value ? colors.primary : colors.border,
                      backgroundColor:
                        privacyLevel === value
                          ? `${colors.primary}10`
                          : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                  >
                    {title}
                  </Text>
                  <Text
                    style={[styles.copy, { color: colors.mutedForeground }]}
                  >
                    {copy}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Context (optional)
            </Text>
            <TextInput
              testID="organization-experience-narrative"
              value={narrative}
              onChangeText={setNarrative}
              multiline
              maxLength={4000}
              textAlignVertical="top"
              placeholder="Share your experience without contact details, personal addresses, medical or personnel records, dates of birth, or names of individual clinicians or workers."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.note,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              A reviewer may hold or reject an experience. You can see your
              truthful status and submit one appeal in My organization activity.
            </Text>
            <TouchableOpacity
              testID="organization-experience-submit"
              disabled={submitting || categories.length === 0 || !locationId}
              onPress={() => void submitExperience()}
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity:
                    submitting || categories.length === 0 || !locationId
                      ? 0.5
                      : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Text
                    style={[
                      styles.buttonText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Submit for moderation
                  </Text>
                  <Feather
                    name="shield"
                    size={16}
                    color={colors.primaryForeground}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Experiences are not open here
            </Text>
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              That does not change this factual profile or indicate a score.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  back: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  content: { padding: 18, gap: 13 },
  hero: { borderRadius: 17, borderWidth: 1, padding: 18, gap: 7 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  name: { fontFamily: "Inter_700Bold", fontSize: 24, lineHeight: 30 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  link: { fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 4 },
  notice: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 13,
  },
  flex: { flex: 1 },
  noticeTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 3 },
  copy: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginTop: 7 },
  stack: { gap: 9 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 7,
    marginBottom: 11,
  },
  tag: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  tagText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  form: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 15,
    gap: 4,
    marginTop: 10,
  },
  label: { fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 11 },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  privacy: { borderRadius: 11, borderWidth: 1, padding: 11, gap: 3 },
  note: {
    borderWidth: 1,
    borderRadius: 11,
    minHeight: 110,
    padding: 11,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 7,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 9,
  },
  button: {
    minHeight: 48,
    marginTop: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: { fontFamily: "Inter_700Bold", fontSize: 14 },
});
