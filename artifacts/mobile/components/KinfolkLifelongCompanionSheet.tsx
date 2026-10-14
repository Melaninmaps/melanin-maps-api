import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export const KINFOLK_LIFELONG_COMPANION_COPY = {
  identity: "Kinfolk is your lifelong cultural companion.",
  platformQuestion: "Who do you hope to become?",
  definingSentence: "Mapping With Melanin™ doesn't ask people to prove where they come from. It gives them opportunities to discover where others come from — and, if they choose, reconnect with parts of their own story.",
  guidingPhrase: "Your story is still unfolding.",
  finalPromise: "Kinfolk will never rush your journey. It will simply remember where you left off, celebrate what you've discovered, and be ready whenever you're curious to take the next step.",
} as const;

/**
 * A reusable, read-only explanation of Kinfolk's founding promise. It has no
 * account, memory, analytics, location, or provider side effect.
 */
export function KinfolkLifelongCompanionSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#00000066" }}>
        <View
          testID="kinfolk-lifelong-companion-sheet"
          style={{
            maxHeight: "84%",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: colors.card,
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 22,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.1, textTransform: "uppercase" }}>
                Kinfolk's promise
              </Text>
              <Text style={{ color: colors.foreground, fontFamily: "PlayfairDisplay_700Bold", fontSize: 23, lineHeight: 30, marginTop: 5 }}>
                {KINFOLK_LIFELONG_COMPANION_COPY.identity}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close Kinfolk's lifelong companion promise"
              style={{ minHeight: 40, justifyContent: "center", paddingHorizontal: 5 }}
            >
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 18, paddingBottom: 4 }}>
            <Text style={{ color: colors.foreground, fontFamily: "PlayfairDisplay_700Bold", fontSize: 20, lineHeight: 27 }}>
              {KINFOLK_LIFELONG_COMPANION_COPY.platformQuestion}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, marginTop: 10 }}>
              {KINFOLK_LIFELONG_COMPANION_COPY.definingSentence}
            </Text>
            <View style={{ borderLeftWidth: 3, borderLeftColor: colors.primary, marginTop: 18, paddingLeft: 12 }}>
              <Text style={{ color: colors.foreground, fontFamily: "PlayfairDisplay_700Bold", fontSize: 19, lineHeight: 27 }}>
                {KINFOLK_LIFELONG_COMPANION_COPY.guidingPhrase}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, marginTop: 8 }}>
                {KINFOLK_LIFELONG_COMPANION_COPY.finalPromise}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
