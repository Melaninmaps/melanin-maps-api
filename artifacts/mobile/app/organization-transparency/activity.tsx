import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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

type OrganizationStatus = {
  organizationId: string;
  legalName: string;
  city: string;
  state: string | null;
  factualStatus: string;
  submittedAt: string;
  recoveryMessage: string;
};
type ExperienceStatus = {
  experienceId: string;
  organizationName: string;
  relationship: string;
  categoryCodes: string[];
  privacyLevel: string;
  moderationStatus: string;
  reviewerNote: string | null;
  submittedAt: string;
  recovery: { label: string; memberMessage: string; appealAvailable: boolean };
};
type OwnerClaimStatus = {
  claimId: string;
  organizationId: string;
  organizationName: string;
  status: string;
  reviewerNote: string | null;
  submittedAt: string;
};
function pretty(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ExperienceActivityCard({
  item,
  onAppealDone,
}: {
  item: ExperienceStatus;
  onAppealDone: () => void;
}) {
  const colors = useColors();
  const [appeal, setAppeal] = useState("");
  const [showAppeal, setShowAppeal] = useState(false);
  const [saving, setSaving] = useState(false);
  const requestId = useRef(Crypto.randomUUID());
  async function submitAppeal() {
    if (!appeal.trim() || saving) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${getApiBase()}/api/organization-experiences/${encodeURIComponent(item.experienceId)}/appeals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await getMemberApiHeaders()),
            "Idempotency-Key": requestId.current,
          },
          body: JSON.stringify({
            body: appeal.trim(),
            clientRequestId: requestId.current,
          }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Unable to send appeal.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAppeal("");
      setShowAppeal(false);
      Alert.alert(
        "Appeal sent",
        data.message ?? "Your appeal is with a reviewer.",
      );
      onAppealDone();
    } catch (error) {
      Alert.alert(
        "Appeal",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {item.organizationName}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {pretty(item.relationship)} ·{" "}
            {item.categoryCodes.map(pretty).join(", ")}
          </Text>
        </View>
        <View
          style={[styles.badge, { backgroundColor: `${colors.primary}18` }]}
        >
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {item.recovery.label}
          </Text>
        </View>
      </View>
      <Text style={[styles.copy, { color: colors.foreground }]}>
        {item.recovery.memberMessage}
      </Text>
      {item.reviewerNote ? (
        <View
          style={[
            styles.note,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Reviewer note
          </Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            {item.reviewerNote}
          </Text>
        </View>
      ) : null}
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        Submitted {new Date(item.submittedAt).toLocaleDateString()} ·{" "}
        {item.privacyLevel === "private_to_moderators"
          ? "Private to moderators"
          : "Pseudonymous if approved"}
      </Text>
      {item.recovery.appealAvailable ? (
        <>
          {showAppeal ? (
            <View
              style={[
                styles.appeal,
                {
                  backgroundColor: `${colors.primary}10`,
                  borderColor: `${colors.primary}38`,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Appeal or factual clarification
              </Text>
              <TextInput
                testID={`organization-experience-appeal-${item.experienceId}`}
                multiline
                maxLength={2000}
                textAlignVertical="top"
                value={appeal}
                onChangeText={setAppeal}
                placeholder="Share a concise, safe factual clarification. This does not publish or alter the original experience by itself."
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
              />
              <View style={styles.row}>
                <TouchableOpacity onPress={() => setShowAppeal(false)}>
                  <Text
                    style={[styles.cancel, { color: colors.mutedForeground }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={saving || !appeal.trim()}
                  onPress={() => void submitAppeal()}
                  style={[
                    styles.smallButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: saving || !appeal.trim() ? 0.5 : 1,
                    },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.primaryForeground} />
                  ) : (
                    <Text
                      style={[
                        styles.smallButtonText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      Send appeal
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              testID={`organization-experience-appeal-open-${item.experienceId}`}
              onPress={() => setShowAppeal(true)}
              style={[styles.outline, { borderColor: colors.primary }]}
            >
              <Text style={[styles.outlineText, { color: colors.primary }]}>
                Appeal for reviewer consideration
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}
    </View>
  );
}

export default function OrganizationTransparencyActivityScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [organizations, setOrganizations] = useState<OrganizationStatus[]>([]);
  const [experiences, setExperiences] = useState<ExperienceStatus[]>([]);
  const [ownerClaims, setOwnerClaims] = useState<OwnerClaimStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${getApiBase()}/api/community/organizations/mine`,
        { headers: await getMemberApiHeaders() },
      );
      const data = (await response.json().catch(() => ({}))) as {
        organizations?: OrganizationStatus[];
        experiences?: ExperienceStatus[];
        ownerClaims?: OwnerClaimStatus[];
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error ?? "Unable to load your activity.");
      setOrganizations(
        Array.isArray(data.organizations) ? data.organizations : [],
      );
      setExperiences(Array.isArray(data.experiences) ? data.experiences : []);
      setOwnerClaims(Array.isArray(data.ownerClaims) ? data.ownerClaims : []);
    } catch (error) {
      Alert.alert(
        "My organization activity",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top, 18),
        },
      ]}
      testID="organization-transparency-activity"
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
          My organization activity
        </Text>
        <View style={styles.back} />
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void load()}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 28 },
        ]}
      >
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
              Private status recovery
            </Text>
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              Your submission status is for you and reviewers. It does not make
              a factual profile public or an experience visible automatically.
            </Text>
          </View>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Organization submissions
        </Text>
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginVertical: 18 }}
          />
        ) : organizations.length === 0 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              You have not submitted an organization.
            </Text>
          </View>
        ) : (
          <View style={styles.stack}>
            {organizations.map((item) => (
              <View
                key={item.organizationId}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text
                      style={[styles.cardTitle, { color: colors.foreground }]}
                    >
                      {item.legalName}
                    </Text>
                    <Text
                      style={[styles.meta, { color: colors.mutedForeground }]}
                    >
                      {item.city}
                      {item.state ? `, ${item.state}` : ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: `${colors.primary}18` },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {pretty(item.factualStatus)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.copy, { color: colors.foreground }]}>
                  {item.recoveryMessage}
                </Text>
                {["correction_requested", "rejected"].includes(
                  item.factualStatus,
                ) ? (
                  <TouchableOpacity
                    testID={`organization-correction-${item.organizationId}`}
                    onPress={() =>
                      router.push(
                        `/organization-transparency/submit?amend=${encodeURIComponent(item.organizationId)}` as never,
                      )
                    }
                    style={[styles.outline, { borderColor: colors.primary }]}
                  >
                    <Text
                      style={[styles.outlineText, { color: colors.primary }]}
                    >
                      Resubmit factual correction
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  Submitted {new Date(item.submittedAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.foreground, marginTop: 16 },
          ]}
        >
          Owner verification requests
        </Text>
        {!loading && ownerClaims.length === 0 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              You have no owner verification requests.
            </Text>
          </View>
        ) : (
          <View style={styles.stack}>
            {ownerClaims.map((claim) => (
              <View
                key={claim.claimId}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.row}>
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                  >
                    {claim.organizationName}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: `${colors.primary}18` },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {pretty(claim.status)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.copy, { color: colors.mutedForeground }]}>
                  {claim.status === "approved"
                    ? "Limited owner workflow is active. It permits moderated requests only and cannot remove or suppress member experiences."
                    : "No organization-owner authority is active while this request is pending or rejected."}
                </Text>
                {claim.reviewerNote ? (
                  <Text
                    style={[styles.meta, { color: colors.mutedForeground }]}
                  >
                    Reviewer note: {claim.reviewerNote}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.foreground, marginTop: 16 },
          ]}
        >
          Experience submissions
        </Text>
        {!loading && experiences.length === 0 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              You have not submitted an organization experience.
            </Text>
          </View>
        ) : (
          <View style={styles.stack}>
            {experiences.map((item) => (
              <ExperienceActivityCard
                key={item.experienceId}
                item={item}
                onAppealDone={() => void load()}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  content: { padding: 18, gap: 12 },
  flex: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  notice: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 13,
  },
  noticeTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 3 },
  copy: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginTop: 5 },
  stack: { gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 9 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: "50%",
  },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  note: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 4 },
  appeal: { borderRadius: 11, borderWidth: 1, padding: 11, gap: 8 },
  input: {
    borderRadius: 9,
    borderWidth: 1,
    minHeight: 95,
    padding: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  cancel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    paddingVertical: 10,
  },
  smallButton: {
    borderRadius: 9,
    minHeight: 38,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  smallButtonText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  outline: {
    borderRadius: 9,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  outlineText: { fontFamily: "Inter_700Bold", fontSize: 12 },
});
