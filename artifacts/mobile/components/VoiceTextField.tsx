/**
 * VoiceTextField — textarea with microphone button.
 *
 * Rules (from brief):
 *  - Mic button inside the field, 44pt touch target, equal visual weight
 *  - Auto-saves draft text to AsyncStorage every 2 seconds
 *  - Full screen reader labels
 *  - Haptic feedback on mic press
 *
 * Voice recording: expo-av is not yet in the binary, so the mic button
 * currently shows a brief message and accepts typed input. Full on-device
 * STT is scheduled for the next EAS build.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface VoiceTextFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** AsyncStorage key for auto-saving draft — omit to disable */
  draftKey?: string;
  style?: ViewStyle;
  /** Max height before scrolling; default 160 */
  maxHeight?: number;
  accessibilityLabel?: string;
  onClearDraftReady?: (clearDraft: () => void) => void;
}

export function VoiceTextField({
  value,
  onChangeText,
  placeholder = "Only if you want to. Even a few words help.",
  draftKey,
  style,
  maxHeight = 160,
  accessibilityLabel = "Text field with voice option",
  onClearDraftReady,
}: VoiceTextFieldProps) {
  const colors = useColors();
  const [showVoiceHint, setShowVoiceHint] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestValue = useRef(value);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  // ── Restore draft on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!draftKey) return;
    AsyncStorage.getItem(draftKey).then((saved) => {
      if (saved && !value) onChangeText(saved);
    });
  }, [draftKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save draft every 2 s ─────────────────────────────────────────────
  useEffect(() => {
    if (!draftKey) return;
    autoSaveTimer.current = setInterval(() => {
      if (latestValue.current) {
        AsyncStorage.setItem(draftKey, latestValue.current).catch(() => {});
      }
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [draftKey]);

  const handleMicPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowVoiceHint(true);
    setTimeout(() => setShowVoiceHint(false), 3500);
  }, []);

  const clearDraft = useCallback(() => {
    if (draftKey) AsyncStorage.removeItem(draftKey).catch(() => {});
  }, [draftKey]);

  useEffect(() => {
    onClearDraftReady?.(clearDraft);
  }, [clearDraft, onClearDraftReady]);

  return (
    <View style={[styles.wrapper, { borderColor: colors.border, backgroundColor: colors.card }, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline
        style={[
          styles.input,
          {
            color: colors.foreground,
            maxHeight,
            // Reserve 44pt on the right for the mic button
            paddingRight: 52,
          },
        ]}
        textAlignVertical="top"
        accessibilityLabel={accessibilityLabel}
        returnKeyType="default"
      />

      {/* ── Mic button ── */}
      <TouchableOpacity
        onPress={handleMicPress}
        style={styles.micButton}
        accessibilityRole="button"
        accessibilityLabel="Prefer to talk? Tap the mic."
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="mic" size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* ── Voice hint overlay ── */}
      {showVoiceHint && (
        <View style={[styles.hint, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.hintText, { color: colors.foreground }]}>
            Prefer to talk? Tap the mic.{"\n"}
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              Voice recording coming soon — type for now.
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1.5,
    borderRadius: 12,
    minHeight: 100,
    position: "relative",
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    padding: 14,
    paddingTop: Platform.OS === "ios" ? 14 : 10,
  },
  micButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    position: "absolute",
    bottom: 52,
    right: 8,
    left: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    zIndex: 10,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
