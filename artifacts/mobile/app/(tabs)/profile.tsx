import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusinessCard } from "@/components/BusinessCard";
import { BUSINESSES } from "@/constants/data";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/lib/auth";

const SETTINGS = [
  { icon: "bell" as const, label: "Notifications", sub: "Manage alerts and updates" },
  { icon: "shield" as const, label: "Privacy & Safety", sub: "Control your data and visibility" },
  { icon: "star" as const, label: "My Reviews", sub: "View and manage your reviews" },
  { icon: "share-2" as const, label: "Referral Program", sub: "Invite friends, earn rewards" },
  { icon: "help-circle" as const, label: "Help & Support", sub: "Get help from our team" },
  { icon: "info" as const, label: "About Mapping with Melanin", sub: "Version 1.0.0" },
];

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
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const savedBusinesses = BUSINESSES.filter((b) => savedIds.includes(b.id));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.secondary }]}>
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
            Join the Community
          </Text>
          <Text style={[styles.signInSub, { color: colors.mutedForeground }]}>
            Sign in to save your favorite businesses, leave reviews, RSVP to events, and connect with the community.
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
            onPress={login}
            activeOpacity={0.85}
          >
            <Feather name="log-in" size={18} color="#FBF7F0" />
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
          <View style={styles.benefitsGrid}>
            {[
              { icon: "bookmark", label: "Save Favorites" },
              { icon: "star", label: "Leave Reviews" },
              { icon: "calendar", label: "RSVP Events" },
              { icon: "users", label: "Join Community" },
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
            {user?.profileImageUrl ? (
              <Image
                source={{ uri: user.profileImageUrl }}
                style={styles.avatarImg}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitials}>{getInitials(user?.firstName, user?.lastName)}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Community Member"}
              </Text>
              {user?.email ? (
                <Text style={[styles.email, { color: colors.mutedForeground }]}>{user.email}</Text>
              ) : null}
              <Text style={[styles.since, { color: colors.mutedForeground }]}>Member since 2024</Text>
            </View>
            <TouchableOpacity style={[styles.editBtn, { borderColor: colors.border }]}>
              <Feather name="edit-2" size={15} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            {[
              { label: "Reviews", value: "12" },
              { label: "Saved", value: String(savedIds.length) },
              { label: "Following", value: "28" },
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
        </>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Businesses</Text>
        </View>
        {savedBusinesses.length === 0 ? (
          <View style={[styles.emptyFavorites, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="bookmark" size={28} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No saved businesses yet</Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
              Tap the bookmark icon on any business to save it here.
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
            <Text style={styles.listBizSub}>Get listed on the Mapping with Melanin directory and reach thousands of community members.</Text>
          </View>
        </View>
        <View style={[styles.listBizCta, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={styles.listBizCtaText}>List Free</Text>
          <Feather name="arrow-right" size={14} color="#FFFFFF" />
        </View>
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
              activeOpacity={0.7}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name={item.icon} size={16} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
    color: "#FBF7F0",
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
});
