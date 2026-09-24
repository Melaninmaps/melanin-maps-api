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
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";
import { CATEGORIES } from "@/constants/data";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { getBusinessExperiencePolicy } from "@workspace/constants";

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c !== "All");

interface Business {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
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

interface SearchClarification {
  kind: "possible_spelling";
  suggestedQuery: string;
  catalogTerm: string;
  prompt: string;
  source: "returned_catalog_term";
}

interface BusinessSearchResponse {
  businesses?: unknown;
  searchClarification?: SearchClarification | null;
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
  const searchRequestIdRef = useRef(0);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState("");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState<Mode>("search");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchClarification, setSearchClarification] = useState<SearchClarification | null>(null);

  const [inviteContact, setInviteContact] = useState("");
  const [inviteHandle, setInviteHandle] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const { history, add: addHistory, clear: clearHistory, remove: removeHistoryEntry } = useSearchHistory("business");

  useEffect(() => {
    if (history.length > 0 && !category) {
      const lastCat = history[0]?.categories?.[0];
      if (lastCat) queueMicrotask(() => { setCategory(lastCat); });
    }
  }, [history]);

  const getApiBase = () =>
    process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

  const handleSearch = useCallback(async (override?: Partial<{ name: string; city: string; state: string; handle: string; category: string }>) => {
    const searchName = override?.name ?? name;
    const searchCity = override?.city ?? city;
    const searchState = override?.state ?? state;
    const searchHandle = override?.handle ?? handle;
    const searchCategory = override?.category ?? category;
    const hasQuery = searchName.trim() || searchCity.trim() || searchState.trim() || searchHandle.trim() || searchCategory;
    if (!hasQuery) return;
    const requestId = ++searchRequestIdRef.current;
    Keyboard.dismiss();
    setLoading(true);
    setSearched(false);
    setSearchError(null);
    try {
      const nameParam = searchName.trim();
      const cityParam = searchCity.trim();
      const stateParam = searchState.trim();
      const handleParam = searchHandle.trim();

      const allParams = new URLSearchParams();
      if (nameParam) allParams.set("search", nameParam);
      if (cityParam) allParams.set("city", cityParam);
      if (stateParam) allParams.set("state", stateParam);
      if (handleParam) allParams.set("handle", handleParam);
      if (searchCategory) allParams.set("category", searchCategory);
      allParams.set("limit", "200");

      const token = await SecureStore.getItemAsync("auth_session_token");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      let data: BusinessSearchResponse;
      try {
        const res = await fetch(`${getApiBase()}/api/businesses?${allParams.toString()}`, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json() as BusinessSearchResponse;
        if (!Array.isArray(data.businesses)) throw new Error("Invalid businesses response");
      } finally {
        clearTimeout(timeout);
      }
      const list = data.businesses as Business[];

      if (requestId !== searchRequestIdRef.current) return;
      setResults(list);
      setSearchClarification(data.searchClarification?.kind === "possible_spelling"
        && data.searchClarification.source === "returned_catalog_term"
        ? data.searchClarification
        : null);
      setSearched(true);
      setMode(list.length > 0 ? "results" : "invite");

      const searchLabel = [nameParam, cityParam, stateParam].filter(Boolean).join(", ") || searchCategory;
      void addHistory(searchLabel, searchCategory ? [searchCategory] : []);
    } catch {
      if (requestId === searchRequestIdRef.current) {
        setResults([]);
        setSearchClarification(null);
        setSearched(true);
        setMode("search");
        setSearchError("Unable to search businesses right now. Check your connection and try again.");
      }
    } finally {
      if (requestId === searchRequestIdRef.current) setLoading(false);
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

  const renderBusiness = ({ item }: { item: Business }) => {
    const experiencePolicy = getBusinessExperiencePolicy(item.category, item.subcategory ?? null);
    const experienceLabel = experiencePolicy.experienceLayer === "real" ? "The Real" : "The Vibe";
    return (
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
        <View style={styles.cardCategoryRow}>
          <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>{item.category}</Text>
          <View style={[styles.experiencePill, { backgroundColor: primaryGold + "16" }]}>
            <Text style={[styles.experiencePillText, { color: primaryGold }]}>{experienceLabel}</Text>
          </View>
        </View>
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
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
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
              <Text style={{ flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.mutedForeground, letterSpacing: 0.5 }}>
                RECENT SEARCHES
              </Text>
              <TouchableOpacity onPress={() => void clearHistory()} accessibilityRole="button" accessibilityLabel="Clear all recent business searches">
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: primaryGold }}>Clear all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {history.slice(0, 6).map((h) => (
                <View key={`${h.type}:${h.query}`} style={{ flexDirection: "row", alignItems: "center", borderRadius: 20, borderWidth: 1, backgroundColor: primaryGold + "12", borderColor: primaryGold + "35" }}>
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingLeft: 12, paddingVertical: 7, maxWidth: 220 }}
                    onPress={() => {
                      const parts = h.query.split(", ");
                      const next = { name: parts[0] ?? "", city: parts[1] ?? "", state: parts[2] ?? "", category: h.categories?.[0] ?? "" };
                      setName(next.name);
                      setCity(next.city);
                      setState(next.state);
                      setCategory(next.category);
                      void handleSearch(next);
                    }}
                    activeOpacity={0.8}
                  >
                    <Feather name="rotate-ccw" size={11} color={primaryGold} />
                    <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: primaryGold }} numberOfLines={1}>
                      {h.query}{h.categories?.[0] ? ` · ${h.categories[0]}` : ""}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ paddingHorizontal: 9, paddingVertical: 7 }} onPress={() => void removeHistoryEntry(h)} accessibilityRole="button" accessibilityLabel={`Remove ${h.query} from recent searches`}>
                    <Feather name="x" size={13} color={primaryGold} />
                  </TouchableOpacity>
                </View>
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
              onSubmitEditing={() => void handleSearch()}
            />
            {handle.length > 0 && (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setHandle("")}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>CATEGORY</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setCategoryPickerOpen(true)}
            style={[styles.inputRow, { borderColor: colors.border, marginTop: 8 }]}
            accessibilityRole="button"
            accessibilityLabel="Choose a business category"
          >
            <Feather name="sliders" size={16} color={primaryGold} />
            <Text style={[styles.input, { color: category ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
              {category || "All categories"}
            </Text>
            <Feather name="chevron-down" size={17} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.searchBtn,
            { backgroundColor: hasQuery ? primaryGold : colors.secondary },
          ]}
          activeOpacity={0.85}
          onPress={() => void handleSearch()}
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

        {searched && searchError && (
          <View
            style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.inviteSent}>
              <Feather name="wifi-off" size={28} color={colors.mutedForeground} />
              <Text style={[styles.inviteSentTitle, { color: colors.foreground }]}>Search unavailable</Text>
              <Text style={[styles.inviteSentBody, { color: colors.mutedForeground }]}>{searchError}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.doneBtn, { borderColor: colors.border }]}
                onPress={() => { void handleSearch(); }}
              >
                <Text style={[styles.doneBtnText, { color: colors.foreground }]}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {searched && !searchError && mode === "results" && (
          <View style={styles.resultsSection}>
            <Text style={[styles.resultsHeader, { color: colors.foreground }]}>
              {results.length} {results.length === 1 ? "result" : "results"} found
            </Text>
            {searchClarification && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.clarificationChip, { backgroundColor: primaryGold + "12", borderColor: primaryGold + "45" }]}
                accessibilityRole="button"
                accessibilityLabel={searchClarification.prompt}
                onPress={() => {
                  setName(searchClarification.suggestedQuery);
                  void handleSearch({ name: searchClarification.suggestedQuery });
                }}
              >
                <Feather name="help-circle" size={14} color={primaryGold} />
                <Text style={[styles.clarificationText, { color: primaryGold }]}>{searchClarification.prompt}</Text>
              </TouchableOpacity>
            )}
            {results.map((item) => (
              <React.Fragment key={item.id}>{renderBusiness({ item })}</React.Fragment>
            ))}
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.notFoundRow, { borderColor: colors.border }]}
              onPress={() => setMode("invite")}
            >
              <Feather name="alert-circle" size={15} color={colors.mutedForeground} />
              <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
                Not the business you&apos;re looking for? Let us know →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {searched && !searchError && mode === "invite" && (
          <View style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {inviteSent ? (
              <View style={styles.inviteSent}>
                <View style={[styles.inviteSentIcon, { backgroundColor: primaryGold + "18" }]}>
                  <Feather name="send" size={28} color={primaryGold} />
                </View>
                <Text style={[styles.inviteSentTitle, { color: colors.foreground }]}>
                  We&apos;re on it!
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
                      We don&apos;t have them yet
                    </Text>
                    <Text style={[styles.inviteSubtitle, { color: colors.mutedForeground }]}>
                      We&apos;ll personally reach out and invite{" "}
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
                  We&apos;ll let you know when they join. Your name won&apos;t be shared with them.
                </Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
      <Modal visible={categoryPickerOpen} transparent animationType="fade" onRequestClose={() => setCategoryPickerOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setCategoryPickerOpen(false)} style={styles.pickerBackdrop}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Business category</Text>
            <Text style={[styles.pickerSubtitle, { color: colors.mutedForeground }]}>Optional — leave this open to search every category.</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 8 }}>
              {["", ...CATEGORY_OPTIONS].map((option) => {
                const selected = category === option;
                return (
                  <TouchableOpacity
                    key={option || "all"}
                    onPress={() => { setCategory(option); setCategoryPickerOpen(false); }}
                    style={[styles.pickerOption, { borderColor: colors.border, backgroundColor: selected ? primaryGold + "16" : "transparent" }]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.foreground }]}>{option || "All categories"}</Text>
                    {selected && <Feather name="check" size={17} color={primaryGold} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  pickerBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  pickerSheet: {
    maxHeight: "72%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pickerTitle: { fontFamily: "Inter_700Bold", fontSize: 19 },
  pickerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 14 },
  pickerOption: {
    minHeight: 50,
    borderBottomWidth: 1,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerOptionText: { fontFamily: "Inter_500Medium", fontSize: 15 },
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
  clarificationChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  clarificationText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
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
  cardCategoryRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" },
  cardCategory: { fontFamily: "Inter_400Regular", fontSize: 12 },
  experiencePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  experiencePillText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
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
