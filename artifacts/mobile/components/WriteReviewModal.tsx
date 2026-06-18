import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  businessName: string;
  onClose: () => void;
  onSubmit: (rating: number, text: string, wouldReturn: boolean) => void;
}

export function WriteReviewModal({ visible, businessName, onClose, onSubmit }: Props) {
  const colors = useColors();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setRating(0);
    setText("");
    setWouldReturn(null);
    setSubmitted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (rating === 0 || wouldReturn === null) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
    onSubmit(rating, text, wouldReturn);
    setTimeout(() => {
      reset();
      onClose();
    }, 1800);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {submitted ? (
            <View style={styles.successWrap}>
              <View style={[styles.successIcon, { backgroundColor: "#2D7A4F18" }]}>
                <Feather name="check-circle" size={40} color="#2D7A4F" />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Review Submitted!</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                Thank you for helping the community.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.title, { color: colors.foreground }]}>Write a Review</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>{businessName}</Text>

              <Text style={[styles.label, { color: colors.foreground }]}>Your Rating</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRating(s);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather
                      name="star"
                      size={34}
                      color={s <= rating ? "#D4873A" : colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.foreground }]}>Would you return alone?</Text>
              <View style={styles.yesNo}>
                <TouchableOpacity
                  style={[
                    styles.yesNoBtn,
                    {
                      borderColor: wouldReturn === true ? "#2D7A4F" : colors.border,
                      backgroundColor: wouldReturn === true ? "#2D7A4F18" : colors.card,
                    },
                  ]}
                  onPress={() => setWouldReturn(true)}
                >
                  <Feather name="thumbs-up" size={18} color={wouldReturn === true ? "#2D7A4F" : colors.mutedForeground} />
                  <Text style={[styles.yesNoText, { color: wouldReturn === true ? "#2D7A4F" : colors.foreground }]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.yesNoBtn,
                    {
                      borderColor: wouldReturn === false ? "#DC2626" : colors.border,
                      backgroundColor: wouldReturn === false ? "#DC262618" : colors.card,
                    },
                  ]}
                  onPress={() => setWouldReturn(false)}
                >
                  <Feather name="thumbs-down" size={18} color={wouldReturn === false ? "#DC2626" : colors.mutedForeground} />
                  <Text style={[styles.yesNoText, { color: wouldReturn === false ? "#DC2626" : colors.foreground }]}>No</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.foreground }]}>Your Experience <Text style={{ color: colors.mutedForeground }}>(optional)</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Share what made your visit memorable..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                value={text}
                onChangeText={setText}
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: rating > 0 && wouldReturn !== null ? colors.primary : colors.muted,
                  },
                ]}
                onPress={handleSubmit}
                disabled={rating === 0 || wouldReturn === null}
                activeOpacity={0.85}
              >
                <Text style={styles.submitText}>Submit Review</Text>
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    marginBottom: 4,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginBottom: 24,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 10,
  },
  stars: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  yesNo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  yesNoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  yesNoText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FBF7F0",
  },
  successWrap: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  successSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
});
