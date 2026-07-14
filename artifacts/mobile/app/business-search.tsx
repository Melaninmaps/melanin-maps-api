import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { CATEGORIES } from "@/constants/data";
import { useSearchHistory } from "@/hooks/useSearchHistory";

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c !== "All");

interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  imageUrl?: string | null;
  verified: boolean;
  rating?: string | null;
  reviewCount?: number;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  description?: string;
}

type Mode = "search" | "results" | "invite";

export default function BusinessSearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const nameRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const handleRef = useRef<TextInput>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState<Mode>("search");

  const [inviteContact, setInviteContact] = useState("");
  const [inviteHandle, setInviteHandle] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const { history, add: addHistory } = useSearchHistory("business");

  useEffect(() => {
    if (history.length > 0 && !category) {
      const lastCat = history[0]?.categories?.[0];
      if (lastCat) setCategory(lastCat);
    }
  }, [history]);

  const getApiBase = () =>
    process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

  const handleSearch = useCallback(async () => {
    const hasQuery = name.trim() || city.trim() || state.trim() || handle.trim() || category;
    if (!hasQuery) return;
    Keyboard.dismiss();
    setLoading(true);
    setSearched(false);
    try {
      const nameParam = name.trim();
      const cityParam = city.trim();
      const stateParam = state.trim();
      const handleParam = handle.trim();

      const allParams = new URLSearchParams();
      if (nameParam) allParams.set("search", nameParam);
      if (stateParam) allParams.set("state", stateParam);
      if (handleParam) allParams.set("handle", handleParam);
      if (category) allParams.set("category", category);

      const res = await fetch(`${getApiBase()}/api/businesses?${allParams.toString()}`);
      const data = await res.json();
      let list: Business[] = data.businesses ?? [];

      if (cityParam) {
        list = list.filter((b) =>
          b.city.toLowerCase().includes(cityParam.toLowerCase())
        );
      }

      setResults(list);
      setSearched(true);
      setMode(list.length > 0 ? "results" : "invite");

      const searchLabel = [nameParam, cityParam, stateParam].filter(Boolean).join(", ") || category;
      void addHistory(searchLabel, category ? [category] : []);
    } catch {
      setResults([]);
      setSearched(true);
      setMode("invite");
    } finally {
      setLoading(false);
    }
  }, [name, city, state, handle, category, addHistory]);

  const handleSendInquiry = useCallback(async () => {
    if (!name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInviteSubmitting(true);
    try {
      await fetch(`${getApiBase()}/api/businesses/search-inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: name.trim(),
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          handle: handle.trim() || undefined,
          category: category || undefined,
          contactEmail: inviteContact.includes("@") && !inviteContact.startsWith("@") ? inviteContact.trim() : undefined,
          contactHandle: inviteContact.startsWith("@") || (!inviteContact.includes("@")) ? inviteContact.trim() : undefined,
        }),
      });
      setInviteSent(true);
    } catch {
      setInviteSent(true);
    } finally {
      setInviteSubmitting(false);
    }
  }, [name, city, state, handle, category, inviteContact]);

  const hasQuery = name.trim() || city.trim() || state.trim() || handle.trim() || category;
  const primaryGold = "#CA922B";

  const renderBusiness = ({ item }: { item: Business }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: "/business/[id]", params: { id: item.id } })}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImg} />
      ) : (
        <View style={[styles.cardImgPlaceholder, { backgroundColor: primaryGold + "20" }]}>
          <Feather name="briefcase" size={20} color={primaryGold} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: primaryGold + "18" }]}>
              <Feather name="check-circle" size={11} color={primaryGold} />
              <Text style={[styles.verifiedText, { color: primaryGold }]}>Verified</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>{item.category}</Text>
        <Text style={[styles.cardLocation, { color: colors.mutedForeground }]}>
          <Feather name="map-pin" size={11} /> {item.city}, {item.state}
        </Text>
        {(item.instagram || item.tiktok || item.twitter) && (
          <View style={styles.socialRow}>
            {item.instagram && (
              <Text style={[styles.socialTag, { color: colors.mutedForeground }]}>
                @{item.instagram.replace(/.*instagram\.com\//, "").replace(/\/$/, "")}
              </Text>
            )}
            {item.tiktok && !item.instagram && (
              <Text style={[styles.socialTag, { color: colors.mutedForeground }]}>
                @{item.tiktok.replace(/.*tiktok\.com\/@/, "").replace(/\/$/, "")}
              </Text>
            )}
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={18} color={colors.muted} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Find a Business</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!searched && history.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 }}>
              <Feather name="clock" size={13} color={colors.mutedForeground} />
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.mutedForeground, letterSpacing: 0.5 }}>
                RECENT SEARCHES
              </Text>
            </View>
            <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {history.slice(0, 6).map((h, i) => (
                <TouchableOpacity
                  key={i}
                  style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, backgroundColor: primaryGold + "12", borderColor: primaryGold + "35" }}
                  onPress={() => {
                    if (h.categories?.[0]) setCategory(h.categories[0]);
                    const parts = h.query.split(", ");
                    if (parts[0]) setName(parts[0]);
                    if (parts[1]) setCity(parts[1]);
                    if (parts[2]) setState(parts[2]);
                    setTimeout(() => void handleSearch(), 50);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather name="rotate-ccw" size={11} color={primaryGold} />
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: primaryGold }} numberOfLines={1}>
                    {h.query}
                    {h.categories?.[0] ? ` · ${h.categories[0]}` : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.fieldsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>BUSINESS NAME</Text>
          <View style={[styles.inputRow, { borderColor: colors.border }]}>
            <Feather name="briefcase" size={16} color={colors.mutedForeground} />
            <TextInput
              ref={nameRef}
              value={name}
              onChangeText={setName}
              placeholder='e.g. "Mapping with Melanin"'
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              returnKeyType="next"
              onSubmitEditing={() => cityRef.current?.focus()}
              autoFocus
            />
            {name.length > 0 && (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setName("")}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>CITY & STATE</Text>
          <View style={styles.cityStateRow}>
            <View style={[styles.inputRow, { borderColor: colors.border, flex: 2, marginRight: 8 }]}>
              <Feather name="map-pin" size={16} color={colors.mutedForeground} />
              <TextInput
                ref={cityRef}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                returnKeyType="next"
                onSubmitEditing={() => stateRef.current?.focus()}
              />
            </View>
            <View style={[styles.inputRow, { borderColor: colors.border, flex: 1 }]}>
              <TextInput
                ref={stateRef}
                value={state}
                onChangeText={(t) => setState(t.toUpperCase().slice(0, 2))}
                placeholder="GA"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                returnKeyType="next"
                maxLength={2}
                autoCapitalize="characters"
                onSubmitEditing={() => handleRef.current?.focus()}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>SOCIAL MEDIA HANDLE</Text>
          <View style={[styles.inputRow, { borderColor: colors.border }]}>
            <Text style={[styles.atSign, { color: primaryGold }]}>@</Text>
            <TextInput
              ref={handleRef}
              value={handle}
              onChangeText={(t) => setHandle(t.replace(/^@/, ""))}
              placeholder="melaninmaps"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {handle.length > 0 && (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setHandle("")}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>CATEGORY</Text>
          <ScrollView
        keyboardDismissMode="on-drag"
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <TouchableOpacity activeOpacity={0.85}
                key={cat}
                style={[
                  styles.chip,
                  {
                    backgroundColor: category === cat ? primaryGold : colors.secondary,
                    borderColor: category === cat ? primaryGold : colors.border,
                  },
                ]}
                onPress={() => setCategory(category === cat ? "" : cat)}
              >
                <Text style={[styles.chipText, { color: category === cat ? "#fff" : colors.foreground }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[
            styles.searchBtn,
            { backgroundColor: hasQuery ? primaryGold : colors.secondary },
          ]}
          activeOpacity={0.85}
          onPress={handleSearch}
          disabled={!hasQuery || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="search" size={18} color={hasQuery ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.searchBtnText, { color: hasQuery ? "#fff" : colors.mutedForeground }]}>
                Search Directory
              </Text>
            </>
          )}
        </TouchableOpacity>

        {searched && mode === "results" && (
          <View style={styles.resultsSection}>
            <Text style={[styles.resultsHeader, { color: colors.foreground }]}>
              {results.length} {results.length === 1 ? "result" : "results"} found
            </Text>
            {results.map((item) => (
              <React.Fragment key={item.id}>{renderBusiness({ item })}</React.Fragment>
            ))}
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.notFoundRow, { borderColor: colors.border }]}
              onPress={() => setMode("invite")}
            >
              <Feather name="alert-circle" size={15} color={colors.mutedForeground} />
              <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
                Not the business you're looking for? Let us know →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {searched && mode === "invite" && (
          <View style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {inviteSent ? (
              <View style={styles.inviteSent}>
                <View style={[styles.inviteSentIcon, { backgroundColor: primaryGold + "18" }]}>
                  <Feather name="send" size={28} color={primaryGold} />
                </View>
                <Text style={[styles.inviteSentTitle, { color: colors.foreground }]}>
                  We're on it!
                </Text>
                <Text style={[styles.inviteSentBody, { color: colors.mutedForeground }]}>
                  Our team will reach out to{" "}
                  <Text style={{ fontFamily: "Inter_700Bold", color: colors.foreground }}>
                    {name}
                  </Text>{" "}
                  and invite them to join the Mapping With Melanin community.
                </Text>
                <TouchableOpacity activeOpacity={0.85}
                  style={[styles.doneBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    setMode("search");
                    setSearched(false);
                    setInviteSent(false);
                    setName("");
                    setCity("");
                    setState("");
                    setHandle("");
                    setCategory("");
                    setInviteContact("");
                  }}
                >
                  <Text style={[styles.doneBtnText, { color: colors.foreground }]}>Search Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={[styles.inviteHeader, { borderBottomColor: colors.border }]}>
                  <View style={[styles.inviteIconWrap, { backgroundColor: primaryGold + "15" }]}>
                    <Feather name="user-plus" size={20} color={primaryGold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inviteTitle, { color: colors.foreground }]}>
                      We don't have them yet
                    </Text>
                    <Text style={[styles.inviteSubtitle, { color: colors.mutedForeground }]}>
                      We'll personally reach out and invite{" "}
                      <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
                        {name || "this business"}
                      </Text>{" "}
                      to join our community.
                    </Text>
                  </View>
                </View>

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginBottom: 8 }]}>
                  BEST WAY TO REACH THEM (optional)
                </Text>
                <Text style={[styles.inviteHint, { color: colors.mutedForeground }]}>
                  Their email, social handle, or website — anything helps us find them.
                </Text>
                <View style={[styles.inputRow, { borderColor: colors.border, marginBottom: 16 }]}>
                  <Feather name="link" size={16} color={colors.mutedForeground} />
                  <TextInput
                    value={inviteContact}
                    onChangeText={setInviteContact}
                    placeholder="email, @handle, or website"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { color: colors.foreground }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.inviteBtn, { backgroundColor: primaryGold }]}
                  activeOpacity={0.85}
                  onPress={handleSendInquiry}
                  disabled={inviteSubmitting}
                >
                  {inviteSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Feather name="send" size={16} color="#fff" />
                      <Text style={styles.inviteBtnText}>Send Them an Invite</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={[styles.inviteFootnote, { color: colors.mutedForeground }]}>
                  We'll let you know when they join. Your name won't be shared with them.
                </Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  fieldsCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    padding: 0,
    margin: 0,
  },
  atSign: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  cityStateRow: {
    flexDirection: "row",
  },
  categoryScroll: {
    paddingBottom: 4,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
  },
  searchBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  resultsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  resultsHeader: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardImg: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  cardImgPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  cardName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  cardCategory: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  cardLocation: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  socialRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  socialTag: { fontFamily: "Inter_400Regular", fontSize: 11 },
  notFoundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 4,
  },
  notFoundText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  inviteCard: {
    margin: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  inviteHeader: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    paddingBottom: 18,
    marginBottom: 18,
    borderBottomWidth: 1,
  },
  inviteIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 4 },
  inviteSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  inviteHint: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 10 },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  inviteBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  inviteFootnote: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
  inviteSent: { alignItems: "center", paddingVertical: 8 },
  inviteSentIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  inviteSentTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 10 },
  inviteSentBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 24,
  },
  doneBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  doneBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
