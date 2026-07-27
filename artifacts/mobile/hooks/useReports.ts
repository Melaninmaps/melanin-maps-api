import { useState, useEffect, useCallback } from "react";

export interface ModerationItem {
  id: string;
  kind: "report" | "survey";
  category: string;
  targetName: string;
  targetType: string;
  reporterName: string;
  description: string | null;
  severity: "low" | "medium" | "high";
  status: "pending" | "approved" | "rejected";
  moderatorNotes: string | null;
  createdAt: string;
}

interface UseReportsResult {
  items: ModerationItem[];
  pendingCount: number;
  highCount: number;
  isLoading: boolean;
  refetch: () => void;
  moderate: (
    id: string,
    kind: "report" | "survey",
    status: "approved" | "rejected" | "pending",
    notes?: string,
  ) => Promise<void>;
}

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
}

export function useReports(statusFilter: string = "pending"): UseReportsResult {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [highCount, setHighCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(
        `${apiBase}/api/moderation/reports?status=${encodeURIComponent(statusFilter)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        items: ModerationItem[];
        pendingCount: number;
        highCount: number;
      };
      setItems(data.items ?? []);
      setPendingCount(data.pendingCount ?? 0);
      setHighCount(data.highCount ?? 0);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const moderate = useCallback(
    async (
      id: string,
      kind: "report" | "survey",
      status: "approved" | "rejected" | "pending",
      notes?: string,
    ) => {
      const apiBase = getApiBaseUrl();
      await fetch(`${apiBase}/api/moderation/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, kind, moderatorNotes: notes }),
      });
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item)),
      );
      setPendingCount((c) => Math.max(0, c - 1));
    },
    [],
  );

  return { items, pendingCount, highCount, isLoading, refetch: fetchReports, moderate };
}
