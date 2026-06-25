import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Modal,
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
import { useAuth } from "@/lib/auth";

type ShareType = { id: string; emoji: string; label: string; sub: string };

const SHARE_TYPES: ShareType[] = [
  { id: "friends", emoji: "👥", label: "My Friends", sub: "Share with your circle" },
  { id: "family", emoji: "👨‍👩‍👧", label: "My Family", sub: "Pass it down the line" },
  { id: "group", emoji: "✈️", label: "My Travel Group", sub: "The crew needs to know" },
  { id: "community", emoji: "🤎", label: "The Community", sub: "Post it for everyone" },
];

type Props = {
  visible: boolean;
  businessId: string;
  businessName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function PassThePlateModal({ visible, businessId, businessName, onClose, onSuccess }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (id: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "You need to be signed in to pass the plate.");
      return;
    }
    if (selected.length === 0) {
      Alert.alert("Choose who to share with", "Select at least one group.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      await Promise.all(
        selected.map((shareType) =>
          fetch("/api/plate-passes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId, shareType, message: message.trim() || null }),
          })
        )
      );
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
      onSuccess();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelected([]);
    setMessage("");
    setDone(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.root, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ width: 40 }} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Pass the Plate 🍽️</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {done ? (
            <View style={styles.successWrap}>
              <View style={[styles.successCircle, { backgroundColor: "#C9922B20" }]}>
                <Text style={styles.successEmoji}>🍽️</Text>
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>You passed the plate!</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                You just told{" "}
                {selected.length === 1
                  ? SHARE_TYPES.find(s => s.id === selected[0])?.label
                  : `${selected.length} groups`}{" "}
                about {businessName}. That's how community grows. 🤎
              </Text>
              <View style={[styles.successCard, { backgroundColor: "#C9922B10", borderColor: "#C9922B30" }]}>
                <Feather name="trending-up" size={16} color="#C9922B" />
                <Text style={[styles.successCardTxt, { color: "#C9922B" }]}>
                  {businessName} will see this in their weekly community stats
                </Text>
              </View>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={handleClose}>
                <Text style={styles.doneBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.bizChip, { backgroundColor: colors.secondary }]}>
                <Feather name="map-pin" size={13} color={colors.primary} />
                <Text style={[styles.bizChipTxt, { color: colors.primary }]}>{businessName}</Text>
              </View>

              <Text style={[styles.question, { color: colors.foreground }]}>
                Who should experience this next?
              </Text>
              <Text style={[styles.questionSub, { color: colors.mutedForeground }]}>
                Select everyone you want to pass the plate to
              </Text>

              <View style={styles.shareGrid}>
                {SHARE_TYPES.map((s) => {
                  const sel = selected.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.shareCard,
                        {
                          backgroundColor: sel ? "#C9922B18" : colors.card,
                          borderColor: sel ? "#C9922B" : colors.border,
                          borderWidth: sel ? 2 : 1,
                        },
                      ]}
                      onPress={() => toggle(s.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.shareEmoji}>{s.emoji}</Text>
                      <Text style={[styles.shareLabel, { color: colors.foreground }]}>{s.label}</Text>
                      <Text style={[styles.shareSub, { color: colors.mutedForeground }]}>{s.sub}</Text>
                      {sel && (
                        <View style={[styles.checkBadge, { backgroundColor: "#C9922B" }]}>
                          <Feather name="check" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.messageSection}>
                <Text style={[styles.messageLabel, { color: colors.foreground }]}>
                  Add a note{" "}
                  <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text>
                </Text>
                <TextInput
                  style={[styles.messageInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="You HAVE to try the jerk chicken here…"
                  placeholderTextColor={colors.mutedForeground}
                  value={message}
                  onChangeText={(t) => t.length <= 200 && setMessage(t)}
                  multiline
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{message.length}/200</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: selected.length > 0 ? "#C9922B" : colors.muted },
                ]}
                onPress={handleSubmit}
                disabled={selected.length === 0 || saving}
                activeOpacity={0.85}
              >
                <Text style={styles.submitEmoji}>🍽️</Text>
                <Text style={[styles.submitTxt, { color: selected.length > 0 ? "#FFFFFF" : colors.mutedForeground }]}>
                  {saving ? "Passing…" : "Pass the Plate"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  closeBtn: { width: 40, height: 40, alignItems: "flex-end", justifyContent: "center" },
  scroll: { padding: 20, gap: 16 },
  bizChip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  bizChipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  question: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30 },
  questionSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: -8 },
  shareGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  shareCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  shareEmoji: { fontSize: 28 },
  shareLabel: { fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "center" },
  shareSub: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15 },
  checkBadge: { position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  messageSection: { gap: 8 },
  messageLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  messageInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80 },
  charCount: { fontSize: 11, textAlign: "right", fontFamily: "Inter_400Regular" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16 },
  submitEmoji: { fontSize: 18 },
  submitTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  successWrap: { alignItems: "center", paddingTop: 40, gap: 16 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successEmoji: { fontSize: 44 },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  successCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, width: "100%" },
  successCardTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  doneBtn: { paddingVertical: 14, paddingHorizontal: 48, borderRadius: 14, marginTop: 8 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
});
