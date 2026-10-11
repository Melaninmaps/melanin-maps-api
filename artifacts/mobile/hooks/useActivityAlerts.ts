import { useCallback, useState } from "react";

/**
 * Legacy coordinate activity alerts are retired. The public type is retained
 * temporarily so navigation and disabled map surfaces fail closed rather than
 * re-enabling a location collection path.
 */
export type AlertType = "police" | "ice" | "checkpoint" | "traffic" | "other";

export interface ActivityAlert {
  id: string;
  type: AlertType;
  description: string | null;
  confirmedCount: number;
  clearedCount: number;
  distanceMeters: number;
  createdAt: string;
  expiresAt: string;
}

export const ALERT_META: Record<AlertType, { label: string; icon: string; color: string; bgColor: string }> = {
  police: { label: "Police Activity", icon: "🚔", color: "#2563EB", bgColor: "#1E3A8A" },
  ice: { label: "ICE Activity", icon: "⚠️", color: "#DC2626", bgColor: "#7F1D1D" },
  checkpoint: { label: "Checkpoint", icon: "🛑", color: "#D97706", bgColor: "#78350F" },
  traffic: { label: "Traffic Stop", icon: "🚦", color: "#7C3AED", bgColor: "#4C1D95" },
  other: { label: "Community Alert", icon: "📢", color: "#059669", bgColor: "#064E3B" },
};

const RETIRED_MESSAGE = "Location-based activity alerts are unavailable because Kinfolk does not collect or share member location.";

export function useActivityAlerts({ enabled = true }: { enabled?: boolean } = {}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const unsupported = useCallback(async (_type: AlertType): Promise<boolean> => false, []);
  const noOp = useCallback(async (_id: string): Promise<void> => undefined, []);
  const dismissAlert = useCallback((alertId: string) => {
    setDismissed((current) => new Set([...current, alertId]));
  }, []);

  return {
    alerts: [] as ActivityAlert[],
    error: enabled ? RETIRED_MESSAGE : null,
    reportAlert: unsupported,
    confirmAlert: noOp,
    clearAlert: noOp,
    dismissAlert,
  };
}
