import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/ThemeContext";
import { useFamilyPlan } from "@/hooks/useFamilyPlan";
import * as SecureStore from "expo-secure-store";

const apiBase = process.env.EXPO_PUBLIC_API_URL ?? "";

// ── AI Pool Bar ─────────────────────────────────────────────────────────────
function AiPoolBar({
  used,
  limit,
  color,
  isHighlight,
}: {
  used: number;
  limit: number;
  color: string;
  isHighlight: boolean;
}) {
  const colors = useColors();
  const pct = limit <= 0 ? 0 : Math.min(100, (used / limit) * 100);
  const isUnlimited = limit === -1;
  const isExhausted = !isUnlimited && used >= limit && limit > 0;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: isHighlight ? "rgba(255,255,255,0.65)" : colors.mutedForeground, letterSpacing: 0.3 }}>
          KINFOLK AI THIS MONTH
        </Text>
        <Text style={{ fontSize: 14, fontFamily: "Inter_800ExtraBold", color: isHighlight ? "#FFF" : colors.foreground }}>
          {isUnlimited ? "Unlimited" : `${used} / ${limit}`}
        </Text>
      </View>
      {!isUnlimited && (
        <>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: isHighlight ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <View
              style={{
                height: "100%",
                width: `${pct}%`,
                borderRadius: 3,
                backgroundColor: isExhausted ? "#E57373" : color,
              }}
            />
          </View>
          <Text style={{ fontSize: 11, color: isHighlight ? "rgba(255,255,255,0.5)" : colors.mutedForeground }}>
            {isExhausted
              ? "Pool exhausted — resets next month"
              : `${Math.max(0, limit - used)} requests remaining this month`}
          </Text>
        </>
      )}
    </View>
  );
}

// ── Family Member Row ────────────────────────────────────────────────────────
function MemberRow({
  member,
  onRemove,
  isOwner,
  colors,
  isDark,
}: {
  member: {
    id: string;
    userId: string | null;
    status: string;
    inviteEmail: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  onRemove: (id: string) => void;
  isOwner: boolean;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
}) {
  const initials =
    member.firstName && member.lastName
      ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
      : member.inviteEmail
      ? member.inviteEmail[0].toUpperCase()
      : "?";

  const name =
    member.firstName
      ? `${member.firstName} ${member.lastName ?? ""}`.trim()
      : member.inviteEmail ?? "Invited member";

  const isPending = member.status === "invited" || member.status === "pending";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: isDark ? "rgba(202,146,43,0.2)" : "rgba(202,146,43,0.12)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#CA922B" }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{name}</Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>
          {isPending ? "Invite pending" : "Active member"}
        </Text>
      </View>
      {isPending && (
        <View style={{ backgroundColor: "rgba(202,146,43,0.15)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#CA922B" }}>Pending</Text>
        </View>
      )}
      {isOwner && (
        <TouchableOpacity onPress={() => onRemove(member.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function FamilyPlanScreen() {
  const colors = useColors();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { plan, isLoading, refetch, addFamilySeat } = useFamilyPlan();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [addSeatLoading, setAddSeatLoading] = useState(false);

  const tierColors: Record<string, string> = {
    free: "#A87A40",
    navigator: "#CA922B",
    trailblazer: "#1A5C35",
    community_builder: "#5C3D9E",
    legacy_member: "#1A0A00",
  };
  const planColor = plan ? (tierColors[plan.tier] ?? "#CA922B") : "#CA922B";
  const isHighlight = plan ? plan.tier !== "free" : false;

  const totalCapacity = plan?.family.totalCapacity ?? 0;
  const seatsUsed = plan?.family.seatsUsed ?? 0;
  const canAddFreeSeat = totalCapacity > seatsUsed;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const token = await SecureStore.getItemAsync("auth_session_token");
    if (!token) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      const res = await fetch(`${apiBase}/api/family/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteEmail: inviteEmail.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setInviteError(data.error ?? "Failed to send invite");
        return;
      }
      setInviteSuccess(true);
      setInviteEmail("");
      void refetch();
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess(false);
      }, 2000);
    } catch {
      setInviteError("Network error — please try again");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const token = await SecureStore.getItemAsync("auth_session_token");
    if (!token) return;
    setRemoveLoading(memberId);
    try {
      await fetch(`${apiBase}/api/family/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      void refetch();
    } finally {
      setRemoveLoading(null);
    }
  };

  const handleAddSeat = async () => {
    setAddSeatLoading(true);
    try {
      const url = await addFamilySeat();
      if (url?.startsWith("http")) {
        void Linking.openURL(url);
      } else if (url?.startsWith("/")) {
        router.push(url as Parameters<typeof router.push>[0]);
      }
    } finally {
      setAddSeatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 14,
          paddingHorizontal: 18,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontFamily: "Inter_800ExtraBold", color: colors.foreground, letterSpacing: -0.4 }}>
            Family Plan
          </Text>
          {plan && (
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>
              {plan.tierDisplay} · {seatsUsed} of {totalCapacity} seat{totalCapacity !== 1 ? "s" : ""} used
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => void refetch()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {!plan || plan.tier === "free" ? (
          /* ── Upgrade CTA ─────────────────────────────── */
          <View
            style={{
              backgroundColor: isDark ? "#1A120A" : "#FFF9F0",
              borderRadius: 16,
              padding: 22,
              borderWidth: 1,
              borderColor: "#CA922B",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(202,146,43,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Feather name="users" size={24} color="#CA922B" />
            </View>
            <Text style={{ fontSize: 18, fontFamily: "Inter_800ExtraBold", color: colors.foreground, textAlign: "center" }}>
              Family Plans Start at Navigator
            </Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 }}>
              Upgrade to Navigator ($7.99/mo) to unlock 1 free family seat and KinfolkAI trip planning — with add-on seats available from $2.99/mo.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: "#CA922B", borderRadius: 10, paddingVertical: 13, paddingHorizontal: 28, marginTop: 4 }}
              onPress={() => router.push("/membership")}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFF" }}>View Plans</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Plan header card ────────────────────── */}
            <View
              style={{
                backgroundColor: isHighlight ? planColor : colors.card,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: isHighlight ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: isHighlight ? "rgba(255,255,255,0.65)" : colors.mutedForeground, letterSpacing: 0.4 }}>
                    CURRENT PLAN
                  </Text>
                  <Text style={{ fontSize: 22, fontFamily: "Inter_800ExtraBold", color: isHighlight ? "#FFF" : colors.foreground, letterSpacing: -0.5, marginTop: 2 }}>
                    {plan.tierDisplay}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: isHighlight ? "rgba(255,255,255,0.2)" : "rgba(202,146,43,0.12)",
                    borderRadius: 8,
                    paddingVertical: 7,
                    paddingHorizontal: 13,
                  }}
                  onPress={() => router.push("/membership")}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: isHighlight ? "#FFF" : "#CA922B" }}>Upgrade</Text>
                </TouchableOpacity>
              </View>

              <AiPoolBar
                used={plan.aiUsage.used}
                limit={plan.aiUsage.limit}
                color={isHighlight ? "#FFF" : planColor}
                isHighlight={isHighlight}
              />
            </View>

            {/* ── Feature limits grid ──────────────────── */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 16,
                overflow: "hidden",
              }}
            >
              {[
                { label: "Saved Places", value: plan.limits.savedPlacesDisplay },
                { label: "Followed Topics", value: plan.limits.savedTopicsDisplay },
                { label: "Kinfolk Circles", value: plan.limits.circlesCreateDisplay },
                { label: "Show Love / mo", value: plan.limits.showLoveDisplay },
                { label: "Digest Frequency", value: plan.limits.digestFrequencies.join(" · ") },
              ].map((item, i, arr) => (
                <View
                  key={item.label}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{item.label}</Text>
                  <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* ── Family Members ──────────────────────── */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 16,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <Text style={{ fontSize: 16, fontFamily: "Inter_800ExtraBold", color: colors.foreground, letterSpacing: -0.3 }}>
                  Family Members
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                  {seatsUsed} / {totalCapacity} seats
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 14 }}>
                {plan.limits.familyMemberAccess}
              </Text>

              {/* Seat capacity bar */}
              <View style={{ height: 4, borderRadius: 2, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#EDEDED", overflow: "hidden", marginBottom: 14 }}>
                <View
                  style={{
                    height: "100%",
                    width: `${totalCapacity > 0 ? (seatsUsed / totalCapacity) * 100 : 0}%`,
                    backgroundColor: planColor,
                    borderRadius: 2,
                  }}
                />
              </View>

              {plan.family.members.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 20, gap: 6 }}>
                  <Feather name="user-plus" size={28} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: "center" }}>
                    No family members yet.{"\n"}Invite someone to share your plan.
                  </Text>
                </View>
              ) : (
                plan.family.members.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    onRemove={(id) => void handleRemoveMember(id)}
                    isOwner
                    colors={colors}
                    isDark={isDark}
                  />
                ))
              )}

              {/* Add seat actions */}
              <View style={{ marginTop: 14, gap: 8 }}>
                {canAddFreeSeat ? (
                  <TouchableOpacity
                    style={{
                      backgroundColor: planColor,
                      borderRadius: 10,
                      paddingVertical: 13,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                    onPress={() => setShowInviteModal(true)}
                    activeOpacity={0.85}
                  >
                    <Feather name="user-plus" size={16} color="#FFF" />
                    <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFF" }}>
                      Invite Family Member
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "center" }}>
                      All {totalCapacity} seat{totalCapacity !== 1 ? "s" : ""} are used. Add another for {plan.limits.addOnSeatPriceDisplay}.
                    </Text>
                    <TouchableOpacity
                      style={{
                        borderWidth: 1.5,
                        borderColor: planColor,
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                        opacity: addSeatLoading ? 0.6 : 1,
                      }}
                      onPress={() => void handleAddSeat()}
                      disabled={addSeatLoading}
                      activeOpacity={0.8}
                    >
                      {addSeatLoading ? (
                        <ActivityIndicator size="small" color={planColor} />
                      ) : (
                        <>
                          <Feather name="plus" size={15} color={planColor} />
                          <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: planColor }}>
                            Add Seat — {plan.limits.addOnSeatPriceDisplay}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* ── What family members can access ──── */}
            <View
              style={{
                backgroundColor: isDark ? "rgba(26,107,74,0.12)" : "rgba(26,107,74,0.06)",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: isDark ? "rgba(26,107,74,0.25)" : "rgba(26,107,74,0.15)",
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                <Feather name="shield" size={15} color="#1A6B4A" style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1A6B4A", marginBottom: 4 }}>
                    Safety features are always included
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, lineHeight: 18 }}>
                    Officer Watch, Unsafe Space reports, safety surveys, and neighborhood scores are available to everyone — no plan required.
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Invite Modal ──────────────────────────────────────────────────── */}
      <Modal visible={showInviteModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 22,
              paddingBottom: insets.bottom + 22,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontFamily: "Inter_800ExtraBold", color: colors.foreground }}>
                Invite a Family Member
              </Text>
              <TouchableOpacity onPress={() => { setShowInviteModal(false); setInviteEmail(""); setInviteError(null); setInviteSuccess(false); }}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, lineHeight: 19 }}>
              They'll receive an email with a link to join your family circle. Once they accept, they'll share your plan's features and AI pool.
            </Text>

            <TextInput
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="their@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: colors.foreground,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8F5F0",
              }}
            />

            {inviteError && (
              <Text style={{ fontSize: 13, color: "#E57373" }}>{inviteError}</Text>
            )}
            {inviteSuccess && (
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Feather name="check-circle" size={15} color="#4CAF50" />
                <Text style={{ fontSize: 13, color: "#4CAF50" }}>Invite sent!</Text>
              </View>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: planColor,
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: "center",
                opacity: inviteLoading || !inviteEmail.trim() ? 0.6 : 1,
              }}
              onPress={() => void handleInvite()}
              disabled={inviteLoading || !inviteEmail.trim()}
              activeOpacity={0.85}
            >
              {inviteLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFF" }}>Send Invite</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
