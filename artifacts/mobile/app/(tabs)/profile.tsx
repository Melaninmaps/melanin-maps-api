import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusinessCard } from "@/components/BusinessCard";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useAuth } from "@/lib/auth";
import { usePoints } from "@/hooks/usePoints";
import { useMembership } from "@/hooks/useMembership";
import { useCheckins } from "@/hooks/useCheckins";
import { useSpaceWarnings } from "@/hooks/useSpaceWarnings";
import { BadgeSection } from "@/components/BadgeSection";
import { MilestoneSection } from "@/components/MilestoneSection";
import { PointsRedemptionModal } from "@/components/PointsRedemptionModal";

const SETTINGS = [
  { icon: "map" as const, label: "Trip Planner", sub: "Chat with KinfolkAI™ for travel picks", route: "/travel" as const },
  { icon: "bookmark" as const, label: "Trips I'd Love", sub: "Your KinfolkAI™ saved spots", route: "/wishlist" as const },
  { icon: "grid" as const, label: "My Dashboard", sub: "Saved places, activity & stats", route: "/dashboard" as const },
  { icon: "settings" as const, label: "Settings", sub: "Account, notifications, privacy", route: "/settings" as const },
  { icon: "bell" as const, label: "Notifications", sub: "Manage alerts and updates", route: "/notifications-settings" as const },
  { icon: "shield" as const, label: "Privacy & Safety", sub: "Control your data and visibility", route: "/privacy" as const },
  { icon: "award" as const, label: "Membership", sub: "Explore (Free) — upgrade anytime", route: "/membership" as const },
  { icon: "bar-chart-2" as const, label: "Business Dashboard", sub: "Manage your listing", route: "/business-dashboard" as const },
  { icon: "share-2" as const, label: "Referral Program", sub: "Invite friends, earn rewards", route: "/referral" as const },
  { icon: "users" as const, label: "Mentorship Network", sub: "Connect with mentors & peers", route: "/mentorship" as const },
  { icon: "tag" as const, label: "Affiliate Partner Discounts", sub: "Hotels, flights & travel perks", route: "/affiliate" as const },
  { icon: "credit-card" as const, label: "Billing & Invoices", sub: "Manage subscription & history", route: "/billing" as const },
];

const INDUSTRIES = [
  "Technology & Software",
  "Healthcare & Wellness",
  "Finance & Banking",
  "Real Estate",
  "Food & Beverage",
  "Beauty & Grooming",
  "Fashion & Retail",
  "Entertainment & Media",
  "Education & Training",
  "Legal & Consulting",
  "Construction & Trades",
  "Transportation & Logistics",
  "Arts & Culture",
  "Nonprofit & Advocacy",
  "Sports & Fitness",
  "Travel & Hospitality",
  "Marketing & PR",
  "Music & Events",
  "Other",
];

const ADMIN_EMAILS = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedIds, isSaved, toggleSave } = useFavorites();
  const { user, isLoading, isAuthenticated, login, logout, refreshUser } = useAuth();
  const isAdminUser = !!(user?.email && ADMIN_EMAILS.includes(user.email));
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [showRedemption, setShowRedemption] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const getApiBase = () =>
    process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

  const closeEditModal = () => {
    setShowEditModal(false);
    setShowIndustryPicker(false);
  };

  const openEditModal = () => {
    setEditFirstName(user?.firstName ?? "");
    setEditLastName(user?.lastName ?? "");
    setEditIndustry(user?.industry ?? "");
    setEditJobTitle(user?.jobTitle ?? "");
    setShowIndustryPicker(false);
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          industry: editIndustry,
          jobTitle: editJobTitle,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      closeEditModal();
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Couldn't save", "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalAvatarUri(result.assets[0].uri);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const { businesses } = useBusinesses();
  const savedBusinesses = businesses.filter((b) => savedIds.includes(b.id));
  const { isWarned } = useSpaceWarnings();
  const { total: pointsTotal, ledger } = usePoints();
  const reviewCount = ledger.filter((e) => e.action === "review").length;
  const { subscription } = useMembership();
  const { checkedInIds } = useCheckins();
  const checkInCount = checkedInIds.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.secondary }]} onPress={() => router.push("/settings")}>
          <Feather name="settings" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !isAuthenticated ? (
        <View style={[styles.signInCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image
            source={require("@/assets/images/logo-transparent.png")}
            style={styles.signInLogo}
            contentFit="contain"
          />
          <Text style={[styles.signInTitle, { color: colors.foreground }]}>
            Connect With a Global Community
          </Text>
          <Text style={[styles.signInSub, { color: colors.mutedForeground }]}>
            Mapping with Melanin™ connects people to trusted businesses, meaningful relationships, and thriving communities. Sign in to save favorites, leave reviews, and connect.
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
            onPress={login}
            activeOpacity={0.85}
          >
            <Feather name="log-in" size={18} color="#FFFFFF" />
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
          <View style={styles.benefitsGrid}>
            {[
              { icon: "bookmark", label: "Save Favorites" },
              { icon: "star", label: "Leave Reviews" },
              { icon: "map-pin", label: "Find Businesses" },
              { icon: "users", label: "Join Groups" },
            ].map((b) => (
              <View key={b.label} style={[styles.benefitItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name={b.icon as any} size={18} color={colors.primary} />
                <Text style={[styles.benefitLabel, { color: colors.foreground }]}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.profileCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
            <TouchableOpacity onPress={pickProfileImage} activeOpacity={0.8} style={styles.avatarWrap}>
              {localAvatarUri || user?.profileImageUrl ? (
                <Image
                  source={{ uri: localAvatarUri ?? user?.profileImageUrl ?? "" }}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarInitials}>{getInitials(user?.firstName, user?.lastName)}</Text>
                </View>
              )}
              <View style={[styles.avatarOverlay, { backgroundColor: colors.primary }]}>
                <Feather name="camera" size={10} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Community Member"}
              </Text>
              {user?.jobTitle || user?.industry ? (
                <Text style={[styles.industryLine, { color: colors.mutedForeground }]}>
                  {[user.jobTitle, user.industry].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
              {user?.email ? (
                <Text style={[styles.email, { color: colors.mutedForeground }]}>{user.email}</Text>
              ) : null}
              {subscription ? (
                <View style={[styles.memberBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
                  <Feather name="award" size={10} color={colors.primary} />
                  <Text style={[styles.memberBadgeText, { color: colors.primary }]}>
                    {subscription.productName || "Member"}
                  </Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity style={[styles.editBtn, { borderColor: colors.border }]} onPress={openEditModal}>
              <Feather name="edit-2" size={15} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Profession community + mentorship quick actions */}
          {user?.industry ? (
            <View style={[styles.profActionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.profActionsHeader]}>
                <Feather name="briefcase" size={16} color="#1D4ED8" />
                <Text style={[styles.profActionsTitle, { color: colors.foreground }]}>{user.industry}</Text>
              </View>
              <View style={styles.profActionsRow}>
                <TouchableOpacity
                  style={[styles.profActionBtn, { backgroundColor: "#1D4ED812", borderColor: "#1D4ED830" }]}
                  onPress={() => router.push("/my-community" as any)}
                  activeOpacity={0.8}
                >
                  <Feather name="users" size={14} color="#1D4ED8" />
                  <Text style={[styles.profActionBtnText, { color: "#1D4ED8" }]}>Join Community</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.profActionBtn, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}
                  onPress={() => router.push("/mentorship" as any)}
                  activeOpacity={0.8}
                >
                  <Feather name="award" size={14} color={colors.primary} />
                  <Text style={[styles.profActionBtnText, { color: colors.primary }]}>Offer Mentorship</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {reviewCount === 0 && savedIds.length === 0 && pointsTotal === 0 ? (
            <View style={[styles.newUserBanner, { backgroundColor: colors.card, shadowColor: colors.foreground, borderColor: colors.border }]}>
              <View style={[styles.newUserIconRow]}>
                {(["compass", "star", "award"] as const).map((icon) => (
                  <View key={icon} style={[styles.newUserIcon, { backgroundColor: colors.primary + "15" }]}>
                    <Feather name={icon} size={16} color={colors.primary} />
                  </View>
                ))}
              </View>
              <Text style={[styles.newUserTitle, { color: colors.foreground }]}>Built for Connection</Text>
              <Text style={[styles.newUserSub, { color: colors.mutedForeground }]}>
                Every feature on Mapping with Melanin is designed to bring people together — locally and globally.
              </Text>
            </View>
          ) : (
            <View style={styles.statsRow}>
              {[
                { label: "Reviews", value: String(reviewCount) },
                { label: "Saved", value: String(savedIds.length) },
                { label: "Points", value: String(pointsTotal) },
              ].map((stat, i) => (
                <View
                  key={stat.label}
                  style={[
                    styles.statBox,
                    {
                      backgroundColor: colors.card,
                      shadowColor: colors.foreground,
                      borderRightColor: i < 2 ? colors.border : "transparent",
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {isAuthenticated && (
        <BadgeSection savedCount={savedIds.length} isEarlyTester={false} />
      )}

      {isAuthenticated && (
        <View style={{ paddingHorizontal: 16 }}>
          <MilestoneSection
            reviewCount={reviewCount}
            savedCount={savedIds.length}
            pointsTotal={pointsTotal}
            checkInCount={checkInCount}
          />
        </View>
      )}

      {isAuthenticated && pointsTotal > 0 && (
        <TouchableOpacity
          style={[styles.redeemBanner, { backgroundColor: "#CA922B14", borderColor: "#CA922B30" }]}
          onPress={() => setShowRedemption(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.redeemIconWrap, { backgroundColor: "#CA922B22" }]}>
            <Feather name="zap" size={18} color="#CA922B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.redeemTitle, { color: "#CA922B" }]}>Redeem Your Points</Text>
            <Text style={[styles.redeemSub, { color: "#CA922B99" }]}>
              {pointsTotal} pts available — free months, badges & more
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="#CA922B" />
        </TouchableOpacity>
      )}

      <PointsRedemptionModal visible={showRedemption} onClose={() => setShowRedemption(false)} />

      <Modal visible={showEditModal} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={closeEditModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeEditModal} />
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => showIndustryPicker ? setShowIndustryPicker(false) : closeEditModal()}
                style={styles.modalCancel}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>
                  {showIndustryPicker ? "Back" : "Cancel"}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {showIndustryPicker ? "Select Industry" : "Edit Profile"}
              </Text>
              <TouchableOpacity onPress={saveProfile} disabled={isSaving || showIndustryPicker} style={styles.modalSave}>
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.modalSaveText, { color: colors.primary }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            {showIndustryPicker ? (
              <ScrollView style={styles.industryList} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={[styles.industryOption, { borderBottomColor: colors.border }]} onPress={() => { setEditIndustry(""); setShowIndustryPicker(false); }}>
                  <Text style={[styles.industryOptionText, { color: colors.mutedForeground }]}>No industry</Text>
                  {!editIndustry ? <Feather name="check" size={16} color={colors.primary} /> : null}
                </TouchableOpacity>
                {INDUSTRIES.map((ind) => (
                  <TouchableOpacity key={ind} style={[styles.industryOption, { borderBottomColor: colors.border }]} onPress={() => { setEditIndustry(ind); setShowIndustryPicker(false); }}>
                    <Text style={[styles.industryOptionText, { color: colors.foreground }]}>{ind}</Text>
                    {editIndustry === ind ? <Feather name="check" size={16} color={colors.primary} /> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>First Name</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="First name"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                />

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Last Name</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Last name"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                />

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Job Title <Text style={{ color: colors.mutedForeground + "88" }}>(optional)</Text></Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={editJobTitle}
                  onChangeText={setEditJobTitle}
                  placeholder="e.g. Founder, Software Engineer"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                />

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Industry <Text style={{ color: colors.mutedForeground + "88" }}>(optional)</Text></Text>
                <TouchableOpacity style={[styles.fieldInput, styles.fieldPicker, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowIndustryPicker(true)}>
                  <Text style={[styles.fieldPickerText, { color: editIndustry ? colors.foreground : colors.mutedForeground }]}>
                    {editIndustry || "Select your industry"}
                  </Text>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {isAuthenticated && reviewCount === 0 && savedIds.length === 0 && pointsTotal === 0 && (
        <View style={[styles.gettingStartedCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}>
          <Text style={[styles.gettingStartedTitle, { color: colors.foreground }]}>Get Connected</Text>
          <Text style={[styles.gettingStartedSub, { color: colors.mutedForeground }]}>Complete these steps to start connecting locally and globally</Text>
          {[
            { icon: "compass" as const, label: "Find a trusted business", route: "/(tabs)" as const },
            { icon: "star" as const, label: "Leave your first review", route: "/(tabs)" as const },
            { icon: "shield" as const, label: "Submit a safety report", route: "/report-safety" as const },
            { icon: "users" as const, label: "Join a community group", route: "/(tabs)/community" as const },
          ].map((step, i, arr) => (
            <TouchableOpacity
              key={step.label}
              style={[
                styles.gettingStartedStep,
                i < arr.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(step.route as any);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.gettingStartedIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name={step.icon} size={15} color={colors.primary} />
              </View>
              <Text style={[styles.gettingStartedLabel, { color: colors.foreground }]}>{step.label}</Text>
              <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Businesses</Text>
        </View>
        {savedBusinesses.length === 0 ? (
          <View style={[styles.emptyFavorites, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="bookmark" size={28} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Your saved places live here</Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
              Tap the bookmark on any business to build your personal guide to Black excellence.
            </Text>
          </View>
        ) : (
          savedBusinesses.map((b) => (
            <BusinessCard
              key={b.id}
              business={b}
              onPress={() => router.push({ pathname: "/business/[id]", params: { id: b.id } })}
              isSaved={isSaved(b.id)}
              onToggleSave={() => toggleSave(b.id)}
              warningCount={isWarned(b.name, b.city)}
            />
          ))
        )}
      </View>

      <TouchableOpacity
        style={[styles.listBizBanner, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/list-business")}
        activeOpacity={0.88}
      >
        <View style={styles.listBizLeft}>
          <View style={[styles.listBizIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="briefcase" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.listBizTitle}>Own a Business?</Text>
            <Text style={styles.listBizSub}>Get your business community-reviewed, authenticity-checked, and in front of thousands of locals and travelers.</Text>
          </View>
        </View>
        <View style={[styles.listBizCta, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={styles.listBizCtaText}>List Free</Text>
          <Feather name="arrow-right" size={14} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Premium trial countdown — shown while trial is active and user has no paid subscription */}
      {isAuthenticated && !!(user as any)?.trialEndsAt && (() => {
        const trialEnd = new Date((user as any).trialEndsAt as string);
        const msLeft = trialEnd.getTime() - Date.now();
        const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
        if (daysLeft <= 0) return null;
        return (
          <TouchableOpacity
            style={{ marginHorizontal: 16, marginBottom: 14, borderRadius: 14, backgroundColor: colors.primary + "12", borderWidth: 1, borderColor: colors.primary + "30", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}
            onPress={() => router.push("/membership")}
            activeOpacity={0.85}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
              <Feather name="zap" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.primary, marginBottom: 1 }}>
                Premium Trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, lineHeight: 15 }}>
                You're exploring all Premium features free. Tap to keep access after your trial.
              </Text>
            </View>
            <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        );
      })()}

      {/* Messages shortcut */}
      <TouchableOpacity
        style={[styles.messagesBanner, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}
        onPress={() => router.push("/messages")}
        activeOpacity={0.85}
      >
        <View style={[styles.messagesBannerIcon, { backgroundColor: colors.primary + "18" }]}>
          <Feather name="message-circle" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.messagesBannerTitle, { color: colors.foreground }]}>Messages</Text>
          <Text style={[styles.messagesBannerSub, { color: colors.mutedForeground }]}>Connect with your community</Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={[styles.settingsList, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
          {SETTINGS.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.settingItem,
                idx < SETTINGS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name={item.icon} size={16} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>
                  {item.label === "Membership"
                    ? subscription
                      ? `${subscription.productName || "Premium"} — Active`
                      : "Explore (Free) — upgrade anytime"
                    : item.sub}
                </Text>
              </View>
              {item.label === "Membership" && subscription ? (
                <View style={[styles.activeIndicator, { backgroundColor: "#22C55E18", borderColor: "#22C55E30" }]}>
                  <View style={[styles.activeDot, { backgroundColor: "#22C55E" }]} />
                </View>
              ) : null}
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Admin Panel access — only visible to admin users */}
      {isAdminUser && (
        <TouchableOpacity
          style={[styles.adminBanner, { backgroundColor: "#1A1A2E", borderColor: "#DC262630" }]}
          onPress={() => router.push("/admin")}
          activeOpacity={0.88}
        >
          <View style={styles.adminBannerLeft}>
            <View style={[styles.adminIcon, { backgroundColor: "#DC262620" }]}>
              <Feather name="shield" size={20} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminBannerTitle}>Admin Panel</Text>
              <Text style={styles.adminBannerSub}>Manage businesses, users, reports & analytics</Text>
            </View>
          </View>
          <View style={[styles.adminCta, { backgroundColor: "#DC262618", borderColor: "#DC262640" }]}>
            <Text style={styles.adminCtaText}>Open</Text>
            <Feather name="arrow-right" size={13} color="#DC2626" />
          </View>
        </TouchableOpacity>
      )}

      {isAuthenticated && (
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: colors.destructive + "40" }]}
          onPress={logout}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 60,
  },
  signInCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  signInLogo: {
    width: 100,
    height: 100,
    marginBottom: 4,
  },
  signInTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    textAlign: "center",
  },
  signInSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  signInBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
    justifyContent: "center",
  },
  benefitItem: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: "45%",
  },
  benefitLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  avatarWrap: {
    position: "relative",
    width: 60,
    height: 60,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  avatarInitials: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  email: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  since: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRightWidth: 1,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  emptyFavorites: {
    alignItems: "center",
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  emptyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  emptySubText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
  },
  settingsList: {
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  settingSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  messagesBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  messagesBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesBannerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginBottom: 2,
  },
  messagesBannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  unreadPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 22,
    alignItems: "center",
  },
  unreadPillText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#FFFFFF",
  },
  adminBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
  },
  adminBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  adminIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  adminBannerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 3,
  },
  adminBannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18,
  },
  adminCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  adminCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#DC2626",
  },
  newUserBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  newUserIconRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  newUserIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  newUserTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 17,
    textAlign: "center",
  },
  newUserSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  gettingStartedCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  gettingStartedTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    marginBottom: 2,
  },
  gettingStartedSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 12,
  },
  gettingStartedStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  gettingStartedIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gettingStartedLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    flex: 1,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  signOutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  listBizBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  listBizLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  listBizIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  listBizTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  listBizSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 19,
  },
  listBizCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  listBizCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  memberBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  activeIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  redeemBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  redeemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  redeemTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  redeemSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 1,
  },
  industryLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 1,
  },
  profActionsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  profActionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profActionsTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    flex: 1,
  },
  profActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  profActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  profActionBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    minWidth: 60,
  },
  modalCancelText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  modalSave: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  modalSaveText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginBottom: 6,
    marginTop: 16,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  fieldPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldPickerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  industryList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  industryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  industryOptionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
});
