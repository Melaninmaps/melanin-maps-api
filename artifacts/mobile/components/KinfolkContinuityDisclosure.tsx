import React, { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export const KINFOLK_CONTINUITY_DISCLOSURE_COPY = "Kinfolk works better when it can remember the things you share—your preferences, plans, and ongoing goals—so you do not have to start over every time. You can review, edit, turn this off, or delete it anytime.";

export function KinfolkContinuityDisclosure({
  visible,
  onChoose,
}: {
  visible: boolean;
  onChoose: (decision: "accepted" | "declined") => Promise<boolean>;
}) {
  const colors = useColors();
  const [saving, setSaving] = useState<"accepted" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (decision: "accepted" | "declined") => {
    if (saving) return;
    setSaving(decision);
    setError(null);
    const saved = await onChoose(decision);
    if (!saved) setError("Kinfolk could not save your choice. Please try again.");
    setSaving(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR CONTINUITY, YOUR CONTROL</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Let Kinfolk remember?</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>{KINFOLK_CONTINUITY_DISCLOSURE_COPY}</Text>
          <Text style={[styles.note, { color: colors.mutedForeground }]}>Sensitive details—including health, exact location, identity, finances, religion, sexuality, and children—always need a separate confirmation before Kinfolk saves them.</Text>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            activeOpacity={0.84}
            disabled={saving !== null}
            onPress={() => void choose("accepted")}
            accessibilityLabel="Let Kinfolk remember"
            style={[styles.primary, { backgroundColor: colors.primary, opacity: saving && saving !== "accepted" ? 0.6 : 1 }]}
          >
            {saving === "accepted" ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Let Kinfolk remember</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={saving !== null}
            onPress={() => void choose("declined")}
            accessibilityLabel="Keep memory off"
            style={[styles.secondary, { borderColor: colors.border, opacity: saving && saving !== "declined" ? 0.6 : 1 }]}
          >
            {saving === "declined" ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.secondaryText, { color: colors.foreground }]}>Keep memory off</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#1D120CCC" },
  card: { borderRadius: 22, padding: 22, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.1, marginBottom: 10 },
  title: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 25, marginBottom: 12 },
  copy: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  note: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 14 },
  error: { color: "#B42318", fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 12 },
  primary: { marginTop: 20, minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  primaryText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  secondary: { minHeight: 46, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, marginTop: 10 },
  secondaryText: { fontFamily: "Inter_700Bold", fontSize: 14 },
});
