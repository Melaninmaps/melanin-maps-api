/**
 * ProgressiveForm — renders only minimumContent on first paint.
 *
 * Rules (from brief):
 *  - HARD RULE: never more than 3 fields visible initially
 *  - Primary [Submit] enabled as soon as minimum is valid
 *  - Secondary text link: "Want to add more?"
 *  - Each expansion group has its OWN Submit
 *  - Each expansion group reveals max 3 fields
 *  - FORBIDDEN: progress bars, step counters, red asterisks,
 *               "please complete all required fields"
 *  - At most ONE required element per form
 */
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export interface ExpansionGroup {
  /** Content to show when this group is expanded (max 3 fields) */
  content: React.ReactNode;
  /** Label for this group's submit button; defaults to "Add this" */
  submitLabel?: string;
  onSubmit?: () => Promise<void> | void;
}

interface ProgressiveFormProps {
  /** The minimum required content — shown on first paint, max 3 fields */
  minimumContent: React.ReactNode;
  /** True when the minimum content constitutes a valid, submittable record */
  isValid: boolean;
  /** Label for the primary submit button; defaults to "Submit" */
  submitLabel?: string;
  onSubmit: () => Promise<void> | void;
  /** Groups shown behind "Want to add more?" — each group expands in sequence */
  expansionGroups?: ExpansionGroup[];
  style?: ViewStyle;
  /** True while an async submit is in flight */
  submitting?: boolean;
}

export function ProgressiveForm({
  minimumContent,
  isValid,
  submitLabel = "Submit",
  onSubmit,
  expansionGroups = [],
  style,
  submitting = false,
}: ProgressiveFormProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(0);
  const [groupSubmitting, setGroupSubmitting] = useState(false);

  async function handlePrimarySubmit() {
    if (!isValid || submitting) return;
    await onSubmit();
  }

  async function handleGroupSubmit(group: ExpansionGroup) {
    if (!group.onSubmit) return;
    setGroupSubmitting(true);
    try {
      await group.onSubmit();
      // Advance to next group if available
      if (currentGroup < expansionGroups.length - 1) {
        setCurrentGroup((g) => g + 1);
      }
    } finally {
      setGroupSubmitting(false);
    }
  }

  const activeGroup = expanded ? expansionGroups[currentGroup] : null;

  return (
    <View style={[styles.container, style]}>
      {/* ── Minimum required content ── */}
      {minimumContent}

      {/* ── Primary submit ── */}
      <TouchableOpacity
        onPress={handlePrimarySubmit}
        disabled={!isValid || submitting}
        style={[
          styles.primaryButton,
          {
            backgroundColor: isValid ? colors.primary : colors.muted,
            opacity: submitting ? 0.7 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        accessibilityState={{ disabled: !isValid || submitting }}
      >
        {submitting ? (
          <ActivityIndicator color="#1A1A1A" size="small" />
        ) : (
          <Text style={[styles.primaryButtonLabel, { color: isValid ? colors.primaryForeground : colors.mutedForeground }]}>{submitLabel}</Text>
        )}
      </TouchableOpacity>

      {/* ── "Want to add more?" — only if expansion groups exist ── */}
      {expansionGroups.length > 0 && !expanded && (
        <TouchableOpacity
          onPress={() => setExpanded(true)}
          style={styles.expandLink}
          accessibilityRole="button"
          accessibilityLabel="Want to add more?"
        >
          <Text style={[styles.expandLinkText, { color: colors.primary }]}>
            Want to add more?
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Active expansion group ── */}
      {expanded && activeGroup && (
        <View style={[styles.expansionGroup, { borderColor: colors.border }]}>
          {activeGroup.content}

          <TouchableOpacity
            onPress={() => handleGroupSubmit(activeGroup)}
            disabled={groupSubmitting}
            style={[
              styles.groupButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
                opacity: groupSubmitting ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
          >
            {groupSubmitting ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={[styles.groupButtonLabel, { color: colors.primary }]}>
                {activeGroup.submitLabel ?? "Add this"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Advance link to next group */}
          {currentGroup < expansionGroups.length - 1 && (
            <TouchableOpacity
              onPress={() => setCurrentGroup((g) => g + 1)}
              style={styles.expandLink}
              accessibilityRole="button"
            >
              <Text style={[styles.expandLinkText, { color: colors.mutedForeground }]}>
                Want to add more?
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primaryButtonLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 0.3,
  },
  expandLink: {
    alignItems: "center",
    paddingVertical: 6,
  },
  expandLinkText: {
    fontSize: 15,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  expansionGroup: {
    borderTopWidth: 1,
    paddingTop: 20,
    gap: 14,
  },
  groupButton: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  groupButtonLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});
