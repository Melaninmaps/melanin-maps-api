import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function getToken() { try { return Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null; } catch { return null; } }

type ListingType = "product" | "service" | "skill_trade" | "digital" | "free";
type PriceType = "fixed" | "negotiable" | "free" | "trade";
type Condition = "new" | "like_new" | "good" | "fair" | "trade_only";

interface Listing {
  id: string; userId: string; type: ListingType; title: string;
  description: string | null; price: string | null; priceType: PriceType;
  category: string | null; condition: Condition | null;
  city: string | null; state: string | null; isRemote: boolean;
  contactPreference: string; contactInfo: string | null;
  status: string; viewCount: number; createdAt: string;
}

const TYPE_CONFIG: Record<ListingType, { label: string; icon: string; color: string }> = {
  product:    { label: "Product",    icon: "package",    color: "#CA922B" },
  service:    { label: "Service",    icon: "tool",       color: "#2563EB" },
  skill_trade:{ label: "Skill Trade",icon: "repeat",     color: "#7C3AED" },
  digital:    { label: "Digital",    icon: "monitor",    color: "#0891B2" },
  free:       { label: "Free",       icon: "gift",       color: "#16A34A" },
};

const PRICE_TYPES: { key: PriceType; label: string }[] = [
  { key: "fixed", label: "Fixed Price" },
  { key: "negotiable", label: "Negotiable" },
  { key: "trade", label: "Trade / Barter" },
  { key: "free", label: "Free" },
];

const CATEGORIES = [
  "Clothing & Accessories","Electronics & Tech","Furniture & Home","Books & Education",
  "Baby & Kids","Sports & Fitness","Beauty & Personal Care","Food & Beverages",
  "Art & Crafts","Hair & Beauty Services","Tutoring & Education","Home Repair",
  "Childcare & Family","Photography & Media","Music & Entertainment",
  "Business Services","Digital Products","Other",
];

function ListingCard({ item, colors, onContact, onReport }: {
  item: Listing; colors: any;
  onContact: (listing: Listing) => void;
  onReport: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[item.type];
  const location = item.isRemote ? "Remote" : [item.city, item.state].filter(Boolean).join(", ") || "";

  return (
    <TouchableOpacity
      style={[ls.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setExpanded(p => !p)}
      activeOpacity={0.88}
    >
      <View style={ls.cardRow}>
        <View style={[ls.typeIcon, { backgroundColor: cfg.color + "18", borderColor: cfg.color + "30" }]}>
          <Feather name={cfg.icon as any} size={16} color={cfg.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[ls.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
          {item.category && <Text style={[ls.cardMeta, { color: colors.mutedForeground }]}>{item.category}</Text>}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={[ls.price, { color: item.type === "free" ? "#16A34A" : colors.foreground }]}>
            {item.type === "free" ? "FREE" : item.price ? `$${item.price}` : item.priceType === "trade" ? "TRADE" : "Inquire"}
          </Text>
          <View style={[ls.typePill, { backgroundColor: cfg.color + "18" }]}>
            <Text style={[ls.typePillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
      </View>

      {location ? (
        <View style={ls.locRow}>
          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
          <Text style={[ls.locText, { color: colors.mutedForeground }]}>{location}</Text>
        </View>
      ) : null}

      {expanded && (
        <>
          {item.description ? (
            <Text style={[ls.desc, { color: colors.mutedForeground }]}>{item.description}</Text>
          ) : null}
          {item.condition && item.condition !== "trade_only" && (
            <Text style={[ls.condText, { color: colors.mutedForeground }]}>
              Condition: <Text style={{ fontFamily: "Inter_600SemiBold" }}>{item.condition.replace("_", " ")}</Text>
            </Text>
          )}
          <View style={ls.actions}>
            <TouchableOpacity
              style={[ls.contactBtn, { backgroundColor: "#CA922B" }]}
              onPress={() => onContact(item)}
              activeOpacity={0.85}
            >
              <Feather name="message-circle" size={14} color="#1C0E06" />
              <Text style={ls.contactBtnText}>Contact Seller</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => onReport(item.id)} style={ls.reportLink}>
            <Text style={[ls.reportLinkText, { color: colors.mutedForeground }]}>Report listing</Text>
          </TouchableOpacity>
        </>
      )}
    </TouchableOpacity>
  );
}

function PostListingModal({ visible, onClose, colors, onPosted }: {
  visible: boolean; onClose: () => void; colors: any; onPosted: () => void;
}) {
  const [step, setStep] = useState<"type" | "details" | "contact">("type");
  const [type, setType] = useState<ListingType>("product");
  const [priceType, setPriceType] = useState<PriceType>("fixed");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "",
    condition: "" as Condition | "", city: "", state: "",
    isRemote: false, contactPreference: "app_message", contactInfo: "",
  });

  const reset = () => {
    setStep("type");
    setForm({ title: "", description: "", price: "", category: "", condition: "", city: "", state: "", isRemote: false, contactPreference: "app_message", contactInfo: "" });
    setPriceType("fixed");
  };

  const handleClose = () => { reset(); onClose(); };

  const handlePost = async () => {
    if (!form.title.trim()) { Alert.alert("Required", "Please enter a title."); return; }
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${getApiBase()}/api/marketplace`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          type, priceType, ...form,
          price: priceType === "fixed" || priceType === "negotiable" ? form.price : null,
          condition: type === "product" ? form.condition || null : null,
        }),
      });
      if (res.ok) {
        Alert.alert("Posted!", "Your listing is live in the Community Market.");
        handleClose();
        onPosted();
      } else {
        const d = await res.json() as { error?: string };
        Alert.alert("Error", d.error ?? "Failed to post. Please try again.");
      }
    } catch { Alert.alert("Error", "Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[pm.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name={step === "type" ? "x" : "arrow-left"} size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[pm.title, { color: colors.foreground }]}>
            {step === "type" ? "What are you posting?" : step === "details" ? "Add Details" : "Contact Info"}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={pm.body} keyboardShouldPersistTaps="handled">
          {step === "type" && (
            <>
              <Text style={[pm.hint, { color: colors.mutedForeground }]}>Choose what you&apos;re sharing with the community.</Text>
              {(Object.entries(TYPE_CONFIG) as [ListingType, typeof TYPE_CONFIG[ListingType]][]).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[pm.typeRow, { borderColor: type === key ? cfg.color : colors.border, backgroundColor: type === key ? cfg.color + "10" : colors.card }]}
                  onPress={() => setType(key)}
                  activeOpacity={0.8}
                >
                  <View style={[pm.typeIcon, { backgroundColor: cfg.color + "20" }]}>
                    <Feather name={cfg.icon as any} size={18} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[pm.typeLabel, { color: colors.foreground }]}>{cfg.label}</Text>
                    <Text style={[pm.typeSub, { color: colors.mutedForeground }]}>
                      {key === "product" ? "Physical items — clothes, furniture, electronics" :
                       key === "service" ? "Offer your time — repairs, cleaning, design" :
                       key === "skill_trade" ? "Trade skills with another community member" :
                       key === "digital" ? "Digital downloads, templates, online content" :
                       "Giving it away for free or to a good home"}
                    </Text>
                  </View>
                  {type === key && <Feather name="check-circle" size={20} color={cfg.color} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={pm.nextBtn} onPress={() => setStep("details")} activeOpacity={0.85}>
                <Text style={pm.nextBtnText}>Continue</Text>
                <Feather name="arrow-right" size={16} color="#1C0E06" />
              </TouchableOpacity>
            </>
          )}

          {step === "details" && (
            <>
              <Text style={[pm.fieldLabel, { color: colors.foreground }]}>Title*</Text>
              <TextInput
                style={[pm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder={type === "product" ? "e.g. Nike Air Force 1 Size 10" : type === "service" ? "e.g. Hair Braiding — Knotless Box Braids" : "e.g. Web Design for Social Media Content"}
                placeholderTextColor={colors.mutedForeground}
                value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))}
              />

              <Text style={[pm.fieldLabel, { color: colors.foreground }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[pm.catChip, { borderColor: form.category === c ? "#CA922B" : colors.border, backgroundColor: form.category === c ? "#CA922B15" : colors.card }]}
                      onPress={() => setForm(f => ({ ...f, category: f.category === c ? "" : c }))}
                      activeOpacity={0.8}
                    >
                      <Text style={[pm.catChipText, { color: form.category === c ? "#CA922B" : colors.mutedForeground }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={[pm.fieldLabel, { color: colors.foreground }]}>Description</Text>
              <TextInput
                style={[pm.input, pm.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="Describe what you're offering — size, condition, what's included..."
                placeholderTextColor={colors.mutedForeground}
                value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))}
                multiline numberOfLines={4}
              />

              {type !== "free" && type !== "skill_trade" && (
                <>
                  <Text style={[pm.fieldLabel, { color: colors.foreground }]}>Pricing</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {PRICE_TYPES.map(pt => (
                      <TouchableOpacity
                        key={pt.key}
                        style={[pm.priceChip, { borderColor: priceType === pt.key ? "#CA922B" : colors.border, backgroundColor: priceType === pt.key ? "#CA922B15" : colors.card }]}
                        onPress={() => setPriceType(pt.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={[pm.priceChipText, { color: priceType === pt.key ? "#CA922B" : colors.mutedForeground }]}>{pt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {(priceType === "fixed" || priceType === "negotiable") && (
                    <TextInput
                      style={[pm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                      placeholder="Price (e.g. 25 or 25-50)"
                      placeholderTextColor={colors.mutedForeground}
                      value={form.price} onChangeText={v => setForm(f => ({ ...f, price: v }))}
                      keyboardType="decimal-pad"
                    />
                  )}
                </>
              )}

              {type === "product" && (
                <>
                  <Text style={[pm.fieldLabel, { color: colors.foreground }]}>Condition</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    {(["new", "like_new", "good", "fair"] as Condition[]).map(c => (
                      <TouchableOpacity
                        key={c}
                        style={[pm.priceChip, { borderColor: form.condition === c ? "#CA922B" : colors.border, backgroundColor: form.condition === c ? "#CA922B15" : colors.card }]}
                        onPress={() => setForm(f => ({ ...f, condition: c }))}
                        activeOpacity={0.8}
                      >
                        <Text style={[pm.priceChipText, { color: form.condition === c ? "#CA922B" : colors.mutedForeground }]}>{c.replace("_", " ")}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[pm.toggle, { borderColor: form.isRemote ? "#CA922B" : colors.border }]}
                onPress={() => setForm(f => ({ ...f, isRemote: !f.isRemote }))}
                activeOpacity={0.8}
              >
                <Feather name={form.isRemote ? "check-square" : "square"} size={18} color={form.isRemote ? "#CA922B" : colors.mutedForeground} />
                <Text style={[pm.toggleText, { color: colors.foreground }]}>Available remotely / can ship</Text>
              </TouchableOpacity>

              {!form.isRemote && (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[pm.fieldLabel, { color: colors.foreground }]}>City</Text>
                    <TextInput
                      style={[pm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                      placeholder="City"
                      placeholderTextColor={colors.mutedForeground}
                      value={form.city} onChangeText={v => setForm(f => ({ ...f, city: v }))}
                    />
                  </View>
                  <View style={{ flex: 0.55 }}>
                    <Text style={[pm.fieldLabel, { color: colors.foreground }]}>State</Text>
                    <TextInput
                      style={[pm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                      placeholder="PA"
                      placeholderTextColor={colors.mutedForeground}
                      value={form.state} onChangeText={v => setForm(f => ({ ...f, state: v }))}
                      maxLength={2} autoCapitalize="characters"
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity style={pm.nextBtn} onPress={() => setStep("contact")} activeOpacity={0.85}>
                <Text style={pm.nextBtnText}>Continue</Text>
                <Feather name="arrow-right" size={16} color="#1C0E06" />
              </TouchableOpacity>
            </>
          )}

          {step === "contact" && (
            <>
              <Text style={[pm.hint, { color: colors.mutedForeground }]}>How should interested buyers reach you?</Text>
              {[
                { key: "app_message", label: "In-App Message", sub: "Buyers message you through the app (recommended)" },
                { key: "phone", label: "Phone / Text", sub: "Share your phone number" },
                { key: "email", label: "Email", sub: "Share your email address" },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[pm.typeRow, { borderColor: form.contactPreference === opt.key ? "#CA922B" : colors.border, backgroundColor: form.contactPreference === opt.key ? "#CA922B10" : colors.card }]}
                  onPress={() => setForm(f => ({ ...f, contactPreference: opt.key }))}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[pm.typeLabel, { color: colors.foreground }]}>{opt.label}</Text>
                    <Text style={[pm.typeSub, { color: colors.mutedForeground }]}>{opt.sub}</Text>
                  </View>
                  {form.contactPreference === opt.key && <Feather name="check-circle" size={20} color="#CA922B" />}
                </TouchableOpacity>
              ))}

              {form.contactPreference !== "app_message" && (
                <TextInput
                  style={[pm.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, marginTop: 8 }]}
                  placeholder={form.contactPreference === "phone" ? "Phone number" : "Email address"}
                  placeholderTextColor={colors.mutedForeground}
                  value={form.contactInfo} onChangeText={v => setForm(f => ({ ...f, contactInfo: v }))}
                  keyboardType={form.contactPreference === "phone" ? "phone-pad" : "email-address"}
                  autoCapitalize="none"
                />
              )}

              <View style={[pm.safetyNote, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="shield" size={13} color="#CA922B" />
                <Text style={[pm.safetyText, { color: colors.mutedForeground }]}>
                  Always meet in public places for in-person exchanges. Mapping with Melanin™ is not liable for transactions between members.
                </Text>
              </View>

              <TouchableOpacity
                style={[pm.nextBtn, submitting && { opacity: 0.6 }]}
                onPress={() => { void handlePost(); }}
                activeOpacity={0.85}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#1C0E06" size="small" /> : (
                  <>
                    <Feather name="send" size={16} color="#1C0E06" />
                    <Text style={pm.nextBtnText}>Post Listing</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function MarketplaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeType, setActiveType] = useState<ListingType | "all">("all");
  const [search, setSearch] = useState("");
  const [postOpen, setPostOpen] = useState(false);
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const fetch_ = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (activeType !== "all") params.set("type", activeType);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`${getApiBase()}/api/marketplace?${params}`);
      if (res.ok) { const d = await res.json() as { listings: Listing[] }; setListings(d.listings ?? []); }
    } catch {}
  }, [activeType, search]);

  useEffect(() => { queueMicrotask(() => { setLoading(true); }); queueMicrotask(() => { fetch_().finally(() => setLoading(false)); }); }, [fetch_]);

  const handleReport = async (id: string) => {
    const token = await getToken();
    await fetch(`${getApiBase()}/api/marketplace/${id}/report`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    Alert.alert("Reported", "Thank you. Our team will review this listing.");
  };

  const handleContact = (listing: Listing) => {
    if (listing.contactPreference === "app_message") {
      Alert.alert("Coming Soon", "In-app messaging will be available soon. Check back!");
    } else if (listing.contactPreference === "phone" && listing.contactInfo) {
      void (async () => { const { Linking } = await import("react-native"); Linking.openURL(`tel:${listing.contactInfo}`).catch(() => {}); })();
    } else if (listing.contactPreference === "email" && listing.contactInfo) {
      void (async () => { const { Linking } = await import("react-native"); Linking.openURL(`mailto:${listing.contactInfo}`).catch(() => {}); })();
    } else {
      Alert.alert("Contact", "The seller hasn't provided contact details yet.");
    }
  };

  const typeFilters: { key: ListingType | "all"; label: string }[] = [
    { key: "all", label: "All" },
    ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ key: k as ListingType, label: v.label })),
  ];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Community Market</Text>
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Buy, sell, trade & offer services</Text>
          </View>
          <TouchableOpacity style={s.postBtn} onPress={() => setPostOpen(true)} activeOpacity={0.85}>
            <Feather name="plus" size={16} color="#1C0E06" />
            <Text style={s.postBtnText}>Post</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.searchRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[s.searchInput, { color: colors.foreground }]}
            placeholder="Search listings..."
            placeholderTextColor={colors.mutedForeground}
            value={search} onChangeText={setSearch} returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={s.chipScroll}>
          {typeFilters.map(tf => (
            <TouchableOpacity
              key={tf.key}
              style={[s.chip, { borderColor: activeType === tf.key ? "#CA922B" : colors.border, backgroundColor: activeType === tf.key ? "#CA922B15" : colors.card }]}
              onPress={() => setActiveType(tf.key)}
              activeOpacity={0.8}
            >
              {tf.key !== "all" && <Feather name={TYPE_CONFIG[tf.key as ListingType].icon as any} size={11} color={activeType === tf.key ? "#CA922B" : colors.mutedForeground} />}
              <Text style={[s.chipText, { color: activeType === tf.key ? "#CA922B" : colors.mutedForeground }]}>{tf.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#CA922B" /></View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetch_(); setRefreshing(false); }} tintColor="#CA922B" />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="shopping-bag" size={40} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No listings yet</Text>
              <Text style={[s.emptyBody, { color: colors.mutedForeground }]}>Be the first to post something in the Community Market.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => setPostOpen(true)} activeOpacity={0.85}>
                <Feather name="plus" size={15} color="#1C0E06" />
                <Text style={s.emptyBtnText}>Post a Listing</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <ListingCard item={item} colors={colors} onContact={handleContact} onReport={id => { void handleReport(id); }} />
          )}
        />
      )}

      <TouchableOpacity style={[s.fab, { bottom: insets.bottom + 24 }]} onPress={() => setPostOpen(true)} activeOpacity={0.85}>
        <Feather name="plus" size={20} color="#1C0E06" />
        <Text style={s.fabText}>Post Listing</Text>
      </TouchableOpacity>

      <PostListingModal visible={postOpen} onClose={() => setPostOpen(false)} colors={colors} onPosted={() => { void fetch_(); }} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingBottom: 0, gap: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 22 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  postBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#CA922B", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  postBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#1C0E06" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  chipScroll: { maxHeight: 46 },
  chips: { gap: 8, paddingVertical: 8, paddingBottom: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  list: { padding: 16, gap: 10, paddingBottom: 120 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: 12, paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  emptyBody: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 21 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#CA922B", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#1C0E06" },
  fab: { position: "absolute", right: 20, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#CA922B", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  fabText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#1C0E06" },
});

const ls = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, flexShrink: 0 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 21 },
  cardMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  price: { fontFamily: "Inter_700Bold", fontSize: 15 },
  typePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  typePillText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  condText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  actions: { flexDirection: "row", gap: 8 },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  contactBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#1C0E06" },
  reportLink: { paddingVertical: 2 },
  reportLinkText: { fontFamily: "Inter_400Regular", fontSize: 11, textDecorationLine: "underline" },
});

const pm = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontFamily: "Inter_700Bold", fontSize: 17 },
  body: { padding: 20, gap: 4, paddingBottom: 48 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, marginBottom: 12 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15 },
  textarea: { height: 100, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 8 },
  typeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  typeSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 2 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  priceChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  priceChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8 },
  toggleText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 },
  safetyNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 8 },
  safetyText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, flex: 1 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#CA922B", borderRadius: 14, paddingVertical: 16, marginTop: 20 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#1C0E06" },
});
