import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

const THUMBS_UP_THRESHOLD = 3;

interface ThumbsUpAlert {
  businessName: string;
  thumbsUpCount: number;
}

export function useThumbsUpAlerts() {
  const [alerts, setAlerts] = useState<ThumbsUpAlert[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/reviews/thumbs-up`)
      .then((r) => r.json())
      .then((data: { alerts?: ThumbsUpAlert[] }) => {
        if (data.alerts) setAlerts(data.alerts);
      })
      .catch(() => {});
  }, []);

  const getThumbsUpCount = useCallback(
    (name: string): number => {
      const match = alerts.find(
        (a) => a.businessName.toLowerCase() === name.toLowerCase(),
      );
      return match?.thumbsUpCount ?? 0;
    },
    [alerts],
  );

  const isHighlyRecommended = useCallback(
    (name: string): boolean => getThumbsUpCount(name) >= THUMBS_UP_THRESHOLD,
    [getThumbsUpCount],
  );

  return { getThumbsUpCount, isHighlyRecommended };
}
