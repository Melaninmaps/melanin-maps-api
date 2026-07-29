import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, TextInput, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useWishlist, type WishlistItem } from "@/hooks/useWishlist";
import { useSpaceWarnings } from "@/hooks/useSpaceWarnings";
import { useThumbsUpAlerts } from "@/hooks/useThumbsUpAlerts";
import { Feather } from "@expo/vector-icons";

const GOLD = "#C9922B";

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Drink": "#DC2626", "Music & Live Events": "#7C3AED",
  "Culture & Art": "#0891B2", "Beauty & Wellness": "#DB2777",
  "History": "#92400E", "Nightlife": "#1D4ED8",
  "Outdoors": "#15803D", "Family-Friendly": "#F59E0B",
  "Shopping": "#9333EA", "Coffee": "#78350F",
};

function getCategoryColor(cat: string | null): string {
  if (!cat) return GOLD;
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (cat.toLowerCase().includes(key.toLowerCase().split(" ")[0])) return color;
  }
  return GOLD;
}

type GroupIcon = "location" | "globe-outline" | "briefcase-outline";

function groupItems(items: WishlistItem[]): Array<{ label: string; icon: GroupIcon; items: WishlistItem[] }> {
  const map = new Map<string, WishlistItem[]>();
  for (const item of items) {
    let key: string;
    if (item.destinationType === "destination") {
      key = item.country ? `🌍 ${item.country}` : item.city ? `🌍 ${item.city}` : "🌍 Destinations";
    } else if (item.destinationType === "employer") {
      key = "💼 Companies";
    } else {
      key = item.city ?? "Unknown City";
    }
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }
  return Array.from(map.entries()).map(([label, grpItems]) => ({
    label,
    icon: (label.startsWith("🌍") ? "globe-outline" : label.startsWith("💼") ? "briefcase-outline" : "location") as GroupIcon,
    items: grpItems,
  }));
}

function AddDestinationModal({
  visible, onClose, onSave, colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, city: string, country: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(""); setCity(""); setCountry(""); setSaving(false); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), city.trim(), country.trim());
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={modalStyles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
          <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>Add a Destination</Text>
            <Text style={[modalStyles.sub, { color: colors.mutedForeground }]}>
              Save a city, state, region, or country you'd love to visit
            </Text>

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              Destination name <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Lagos, Accra, New Orleans, Tokyo"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              City & State <Text style={[modalStyles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Atlanta, GA"
              placeholderTextColor={colors.mutedForeground}
              value={city}
              onChangeText={setCity}
            />

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              Country <Text style={[modalStyles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Ghana, Nigeria, Japan, USA"
              placeholderTextColor={colors.mutedForeground}
              value={country}
              onChangeText={setCountry}
            />

            <View style={[modalStyles.hint, { backgroundColor: colors.secondary }]}>
              <Ionicons name="globe-outline" size={14} color={colors.mutedForeground} />
              <Text style={[modalStyles.hintText, { color: colors.mutedForeground }]}>
                Destinations are grouped separately from businesses in your list
              </Text>
            </View>

            <TouchableOpacity
              style={[modalStyles.saveBtn, { backgroundColor: name.trim() ? colors.primary : colors.muted }]}
              onPress={handleSave}
              disabled={!name.trim() || saving}
              activeOpacity={0.85}
            >
              <Ionicons name="bookmark" size={16} color={name.trim() ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[modalStyles.saveBtnText, { color: name.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                {saving ? "Saving…" : "Save Destination"}
              </Text>
            </TouchableOpacity>
            <View style={{ height: 16 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const EMPLOYER_GREEN = "#2D7A4F";

function AddEmployerModal({
  visible, onClose, onSave, colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, industry: string, city: string, country: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(""); setIndustry(""); setCity(""); setCountry(""); setSaving(false); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), industry.trim(), city.trim(), country.trim());
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={modalStyles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
          <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>Save an Employer</Text>
            <Text style={[modalStyles.sub, { color: colors.mutedForeground }]}>
              Track companies and organizations you'd love to work for
            </Text>

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              Company / Organization <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Essence Communications, Howard University, BET"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              Industry / Role of Interest <Text style={[modalStyles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Marketing, Engineering, Creative Director"
              placeholderTextColor={colors.mutedForeground}
              value={industry}
              onChangeText={setIndustry}
            />

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              City & State <Text style={[modalStyles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Atlanta, GA"
              placeholderTextColor={colors.mutedForeground}
              value={city}
              onChangeText={setCity}
            />

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              Country <Text style={[modalStyles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. USA, Nigeria, UK"
              placeholderTextColor={colors.mutedForeground}
              value={country}
              onChangeText={setCountry}
            />

            <View style={[modalStyles.hint, { backgroundColor: colors.secondary }]}>
              <Ionicons name="briefcase-outline" size={14} color={colors.mutedForeground} />
              <Text style={[modalStyles.hintText, { color: colors.mutedForeground }]}>
                Employers are grouped separately in your list. Add notes to track your thoughts.
              </Text>
            </View>

            <TouchableOpacity
              style={[modalStyles.saveBtn, { backgroundColor: name.trim() ? EMPLOYER_GREEN : colors.muted }]}
              onPress={handleSave}
              disabled={!name.trim() || saving}
              activeOpacity={0.85}
            >
              <Ionicons name="briefcase-outline" size={16} color={name.trim() ? "#fff" : colors.mutedForeground} />
              <Text style={[modalStyles.saveBtnText, { color: name.trim() ? "#fff" : colors.mutedForeground }]}>
                {saving ? "Saving…" : "Save Employer"}
              </Text>
            </TouchableOpacity>
            <View style={{ height: 16 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const BUSINESS_AMBER = "#C9922B";

function AddBusinessModal({
  visible, onClose, onSave, colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, city: string, country: string, nonMinorityOwned: boolean, website: string, location: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [nonMinorityOwned, setNonMinorityOwned] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(""); setCity(""); setCountry(""); setWebsite(""); setLocation(""); setNonMinorityOwned(false); setSaving(false); };
  const handleClose = () => { reset(); onClose(); };
  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), city.trim(), country.trim(), nonMinorityOwned, website.trim(), location.trim());
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={modalStyles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
          <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>Save a Business</Text>
            <Text style={[modalStyles.sub, { color: colors.mutedForeground }]}>
              Track a business you've visited or want to remember
            </Text>

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              Business Name <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Busboys and Poets, Slutty Vegan"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              City <Text style={[modalStyles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Washington, DC"
              placeholderTextColor={colors.mutedForeground}
              value={city}
              onChangeText={setCity}
            />

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              Country <Text style={[modalStyles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. USA, Ghana, Jamaica"
              placeholderTextColor={colors.mutedForeground}
              value={country}
              onChangeText={setCountry}
            />

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              Website <Text style={[modalStyles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. https://mybusiness.com"
              placeholderTextColor={colors.mutedForeground}
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={[modalStyles.label, { color: colors.foreground }]}>
              Address / Location <Text style={[modalStyles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. 123 Main St, Atlanta, GA"
              placeholderTextColor={colors.mutedForeground}
              value={location}
              onChangeText={setLocation}
            />

            <TouchableOpacity
              style={[bizModalStyles.nmoRow, { borderColor: nonMinorityOwned ? BUSINESS_AMBER : colors.border, backgroundColor: nonMinorityOwned ? BUSINESS_AMBER + "12" : colors.card }]}
              onPress={() => setNonMinorityOwned((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={[bizModalStyles.nmoCheck, { borderColor: nonMinorityOwned ? BUSINESS_AMBER : colors.border, backgroundColor: nonMinorityOwned ? BUSINESS_AMBER : "transparent" }]}>
                {nonMinorityOwned && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={[bizModalStyles.nmoText, { color: nonMinorityOwned ? BUSINESS_AMBER : colors.mutedForeground }]}>
                This is not a Black-owned business
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[modalStyles.saveBtn, { backgroundColor: name.trim() ? colors.primary : colors.muted }]}
              onPress={handleSave}
              disabled={!name.trim() || saving}
              activeOpacity={0.85}
            >
              <Ionicons name="storefront-outline" size={16} color={name.trim() ? "#fff" : colors.mutedForeground} />
              <Text style={[modalStyles.saveBtnText, { color: name.trim() ? "#fff" : colors.mutedForeground }]}>
                {saving ? "Saving…" : "Save Business"}
              </Text>
            </TouchableOpacity>
            <View style={{ height: 16 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TypePickerModal({
  visible, onClose, onPickDestination, onPickEmployer, onPickBusiness, colors,
}: {
  visible: boolean;
  onClose: () => void;
  onPickDestination: () => void;
  onPickEmployer: () => void;
  onPickBusiness: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[typePickerStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
          <Text style={[typePickerStyles.title, { color: colors.foreground }]}>What would you like to save?</Text>
          <TouchableOpacity
            style={[typePickerStyles.option, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}
            onPress={() => { onClose(); onPickDestination(); }}
            activeOpacity={0.85}
          >
            <View style={[typePickerStyles.optionIcon, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="globe-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typePickerStyles.optionTitle, { color: colors.foreground }]}>Destination</Text>
              <Text style={[typePickerStyles.optionSub, { color: colors.mutedForeground }]}>
                A city, region, or country you'd love to visit
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[typePickerStyles.option, { backgroundColor: colors.card, borderColor: EMPLOYER_GREEN + "40" }]}
            onPress={() => { onClose(); onPickEmployer(); }}
            activeOpacity={0.85}
          >
            <View style={[typePickerStyles.optionIcon, { backgroundColor: EMPLOYER_GREEN + "18" }]}>
              <Ionicons name="briefcase-outline" size={24} color={EMPLOYER_GREEN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typePickerStyles.optionTitle, { color: colors.foreground }]}>Employer</Text>
              <Text style={[typePickerStyles.optionSub, { color: colors.mutedForeground }]}>
                A company or organization you want to work for
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[typePickerStyles.option, { backgroundColor: colors.card, borderColor: BUSINESS_AMBER + "40" }]}
            onPress={() => { onClose(); onPickBusiness(); }}
            activeOpacity={0.85}
          >
            <View style={[typePickerStyles.optionIcon, { backgroundColor: BUSINESS_AMBER + "18" }]}>
              <Ionicons name="storefront-outline" size={24} color={BUSINESS_AMBER} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typePickerStyles.optionTitle, { color: colors.foreground }]}>Business</Text>
              <Text style={[typePickerStyles.optionSub, { color: colors.mutedForeground }]}>
                A spot you've visited or want to remember
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={{ height: 16 }} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function WishlistCard({
  item, onDelete, onNotesSave, colors, warningCount = 0, thumbsUpCount = 0,
}: {
  item: WishlistItem;
  onDelete: (id: string) => void;
  onNotesSave: (id: string, notes: string) => void;
  colors: ReturnType<typeof useColors>;
  warningCount?: number;
  thumbsUpCount?: number;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(item.notes ?? "");
  const isDestination = item.destinationType === "destination";
  const isEmployer = item.destinationType === "employer";
  const catColor = isDestination ? colors.primary : isEmployer ? EMPLOYER_GREEN : getCategoryColor(item.category);

  const borderColor = warningCount >= 3
    ? "#7C2D1240"
    : isDestination
    ? colors.primary + "40"
    : isEmployer
    ? EMPLOYER_GREEN + "40"
    : colors.border;

  return (
    <View style={[cardStyles.card, { backgroundColor: colors.card, borderColor }]}>
      {thumbsUpCount >= 3 && !warningCount && (
        <View style={cardStyles.thumbsUpBanner}>
          <Ionicons name="thumbs-up" size={12} color="#2D7A4F" />
          <Text style={cardStyles.thumbsUpText}>{thumbsUpCount} community members would return here alone</Text>
        </View>
      )}
      {warningCount >= 3 && (
        <View style={cardStyles.warningBanner}>
          <Feather name="alert-octagon" size={12} color="#7C2D12" />
          <Text style={cardStyles.warningText}>{warningCount} community reports filed for this space</Text>
        </View>
      )}
      <View style={cardStyles.cardTop}>
        {isDestination ? (
          <View style={[cardStyles.badge, { backgroundColor: colors.primary + "18" }]}>
            <Ionicons name="globe-outline" size={11} color={colors.primary} />
            <Text style={[cardStyles.badgeText, { color: colors.primary }]}>Destination</Text>
          </View>
        ) : isEmployer ? (
          <View style={[cardStyles.badge, { backgroundColor: EMPLOYER_GREEN + "18" }]}>
            <Ionicons name="briefcase-outline" size={11} color={EMPLOYER_GREEN} />
            <Text style={[cardStyles.badgeText, { color: EMPLOYER_GREEN }]}>Employer</Text>
          </View>
        ) : item.category ? (
          <View style={[cardStyles.badge, { backgroundColor: catColor + "18" }]}>
            <Text style={[cardStyles.badgeText, { color: catColor }]}>{item.category}</Text>
          </View>
        ) : null}
        {!isDestination && !isEmployer && item.neighborhood && (
          <Text style={[cardStyles.hood, { color: colors.mutedForeground }]}>
            <Ionicons name="location-outline" size={11} /> {item.neighborhood}
          </Text>
        )}
        <TouchableOpacity activeOpacity={0.85}
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={cardStyles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <Text style={[cardStyles.name, { color: colors.text }]}>{item.businessName}</Text>

      {(isDestination || isEmployer) && (item.city || item.country) && (
        <View style={cardStyles.locationRow}>
          <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
          <Text style={[cardStyles.locationText, { color: colors.mutedForeground }]}>
            {[item.city, item.country].filter(Boolean).join(" · ")}
          </Text>
        </View>
      )}

      {isEmployer && item.category && (
        <View style={cardStyles.locationRow}>
          <Ionicons name="briefcase-outline" size={13} color={EMPLOYER_GREEN} />
          <Text style={[cardStyles.locationText, { color: EMPLOYER_GREEN }]}>{item.category}</Text>
        </View>
      )}

      {!isDestination && !isEmployer && item.mustTry && (
        <View style={[cardStyles.mustTry, { backgroundColor: GOLD + "12", borderColor: GOLD + "30" }]}>
          <Ionicons name="star" size={12} color={GOLD} />
          <Text style={[cardStyles.mustTryText, { color: colors.text }]}>
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>Must try: </Text>{item.mustTry}
          </Text>
        </View>
      )}

      {item.description && (
        <Text style={[cardStyles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {editingNotes ? (
        <View style={cardStyles.notesEdit}>
          <TextInput
            style={[cardStyles.notesInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            value={notesText}
            onChangeText={setNotesText}
            placeholder="Add your notes..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            autoFocus
          />
          <View style={cardStyles.notesBtns}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => { setEditingNotes(false); setNotesText(item.notes ?? ""); }}>
              <Text style={[cardStyles.notesCancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85}
              style={[cardStyles.notesSave, { backgroundColor: colors.primary }]}
              onPress={() => { onNotesSave(item.id, notesText); setEditingNotes(false); }}
            >
              <Text style={cardStyles.notesSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.85} onPress={() => setEditingNotes(true)} style={cardStyles.notesRow}>
          <Ionicons name={item.notes ? "create-outline" : "add-circle-outline"} size={14} color={colors.primary} />
          <Text style={[cardStyles.notesText, { color: item.notes ? colors.text : colors.mutedForeground }]}>
            {item.notes ?? "Add notes..."}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  hood: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  deleteBtn: { padding: 2, marginLeft: "auto" },
  name: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 6 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  locationText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  mustTry: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, borderWidth: 1, padding: 8, marginBottom: 8 },
  mustTryText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginBottom: 8 },
  notesRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 4 },
  notesText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  notesEdit: { marginTop: 8 },
  notesInput: { borderRadius: 8, borderWidth: 1, padding: 10, fontFamily: "Inter_400Regular", fontSize: 13, minHeight: 72, textAlignVertical: "top" },
  notesBtns: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  notesCancel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  notesSave: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  notesSaveText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  thumbsUpBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#2D7A4F15", borderColor: "#2D7A4F40",
    borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 10,
  },
  thumbsUpText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#2D7A4F", flex: 1 },
  warningBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#7C2D1215", borderColor: "#7C2D1240",
    borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 10,
  },
  warningText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#7C2D12", flex: 1 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 4 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 8 },
  optional: { fontFamily: "Inter_400Regular", fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 20 },
  hint: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, padding: 12, marginBottom: 24 },
  hintText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, flex: 1 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
});

export default function WishlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const { items, isLoading, load, addItem, removeItem, updateNotes } = useWishlist();
  const { isWarned } = useSpaceWarnings();
  const { getThumbsUpCount } = useThumbsUpAlerts();
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [addDestModalOpen, setAddDestModalOpen] = useState(false);
  const [addEmployerModalOpen, setAddEmployerModalOpen] = useState(false);
  const [addBusinessModalOpen, setAddBusinessModalOpen] = useState(false);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Remove from list?", "This will be removed from your saved spaces.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => { void removeItem(id); } },
    ]);
  }, [removeItem]);

  const handleNotesSave = useCallback((id: string, notes: string) => {
    void updateNotes(id, notes);
  }, [updateNotes]);

  const handleAddDestination = useCallback(async (name: string, city: string, country: string) => {
    await addItem({ businessName: name, city: city || null, country: country || null, destinationType: "destination" });
  }, [addItem]);

  const handleAddEmployer = useCallback(async (name: string, industry: string, city: string, country: string) => {
    await addItem({
      businessName: name,
      category: industry || null,
      city: city || null,
      country: country || null,
      destinationType: "employer",
    });
  }, [addItem]);

  const handleAddBusiness = useCallback(async (name: string, city: string, country: string, nonMinorityOwned: boolean, website: string, location: string) => {
    await addItem({
      businessName: name,
      city: city || null,
      country: country || null,
      destinationType: "business",
      nonMinorityOwned,
      website: website || null,
      location: location || null,
    });
  }, [addItem]);

  const groups = groupItems(items);
  const businessCount = items.filter((i) => !i.destinationType || i.destinationType === "business").length;
  const destCount = items.filter((i) => i.destinationType === "destination").length;
  const employerCount = items.filter((i) => i.destinationType === "employer").length;

  const subtitle = [
    businessCount > 0 && `${businessCount} spot${businessCount !== 1 ? "s" : ""}`,
    destCount > 0 && `${destCount} destination${destCount !== 1 ? "s" : ""}`,
    employerCount > 0 && `${employerCount} employer${employerCount !== 1 ? "s" : ""}`,
  ].filter(Boolean).join(" · ") || "Nothing saved yet";

  const groupIconColor = (icon: GroupIcon) =>
    icon === "globe-outline" ? colors.primary : icon === "briefcase-outline" ? EMPLOYER_GREEN : colors.primary;

  const groupSuffix = (icon: GroupIcon, count: number) => {
    const word = icon === "globe-outline" ? "destination" : icon === "briefcase-outline" ? "company" : "spot";
    return `${count} ${word}${count !== 1 ? "s" : ""}`;
  };

  const stripEmoji = (label: string) => label.replace(/^[🌍💼📍]\s*/, "");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.primary }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Trips I'd Love</Text>
          <Text style={styles.headerSub}>{subtitle}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.85}
          onPress={() => setTypePickerOpen(true)}
          style={[styles.headerBtn, { backgroundColor: "#ffffff22" }]}
        >
          <Ionicons name="add-circle-outline" size={15} color="#fff" />
          <Text style={styles.headerBtnText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85}
          onPress={() => router.push("/travel" as any)}
          style={[styles.headerBtn, { backgroundColor: "#ffffff22" }]}
        >
          <Ionicons name="sparkles" size={15} color="#fff" />
          <Text style={styles.headerBtnText}>KinfolkAI</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "14" }]}>
            <Ionicons name="bookmark-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing saved yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Save businesses, destinations, and employers you'd love to explore or work for.
          </Text>
          <View style={styles.emptyBtns}>
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => setTypePickerOpen(true)}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Add a Space</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.emptyBtn, { backgroundColor: colors.secondary }]}
              onPress={() => router.push("/travel" as any)}
            >
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={[styles.emptyBtnText, { color: colors.primary }]}>Ask KinfolkAI™</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
        keyboardDismissMode="on-drag"
          data={groups}
          keyExtractor={(g) => g.label}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <View>
              <View style={styles.cityHeader}>
                <Ionicons name={group.icon} size={15} color={groupIconColor(group.icon)} />
                <Text style={[styles.cityName, { color: colors.text }]}>{stripEmoji(group.label)}</Text>
                <Text style={[styles.cityCount, { color: colors.mutedForeground }]}>
                  {groupSuffix(group.icon, group.items.length)}
                </Text>
              </View>
              {group.items.map((item) => (
                <WishlistCard
                  key={item.id} item={item} colors={colors}
                  onDelete={handleDelete} onNotesSave={handleNotesSave}
                  warningCount={isWarned(item.businessName, item.city ?? "")}
                  thumbsUpCount={getThumbsUpCount(item.businessName)}
                />
              ))}
            </View>
          )}
          ListFooterComponent={() => (
            <TouchableOpacity
              style={[styles.addDestBtn, { borderColor: colors.primary + "40", backgroundColor: colors.primary + "08" }]}
              onPress={() => setTypePickerOpen(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.addDestBtnText, { color: colors.primary }]}>Add a space</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TypePickerModal
        visible={typePickerOpen}
        onClose={() => setTypePickerOpen(false)}
        onPickDestination={() => setAddDestModalOpen(true)}
        onPickEmployer={() => setAddEmployerModalOpen(true)}
        onPickBusiness={() => setAddBusinessModalOpen(true)}
        colors={colors}
      />
      <AddDestinationModal
        visible={addDestModalOpen}
        onClose={() => setAddDestModalOpen(false)}
        onSave={handleAddDestination}
        colors={colors}
      />
      <AddEmployerModal
        visible={addEmployerModalOpen}
        onClose={() => setAddEmployerModalOpen(false)}
        onSave={handleAddEmployer}
        colors={colors}
      />
      <AddBusinessModal
        visible={addBusinessModalOpen}
        onClose={() => setAddBusinessModalOpen(false)}
        onSave={handleAddBusiness}
        colors={colors}
      />
    </View>
  );
}

const bizModalStyles = StyleSheet.create({
  nmoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  nmoCheck: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  nmoText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
  },
});

const typePickerStyles = StyleSheet.create({
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, marginTop: "auto" },
  title: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 20, textAlign: "center" },
  option: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  optionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  optionTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 2 },
  optionSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#fff" },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#ffffff99" },
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  headerBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 10, textAlign: "center" },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 28 },
  emptyBtns: { flexDirection: "row", gap: 12 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14 },
  emptyBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  cityHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 4 },
  cityName: { fontFamily: "Inter_700Bold", fontSize: 16, flex: 1 },
  cityCount: { fontFamily: "Inter_400Regular", fontSize: 12 },
  addDestBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderStyle: "dashed", borderRadius: 14, paddingVertical: 14, marginTop: 8 },
  addDestBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
