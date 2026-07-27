import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

interface Warning {
  spaceName: string;
  city: string;
  category: string;
  reportCount: number;
}

export function useSpaceWarnings() {
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/space-reports/warnings`)
      .then((r) => r.json())
      .then((data: { warnings?: Warning[] }) => {
        if (data.warnings) setWarnings(data.warnings);
      })
      .catch(() => {});
  }, []);

  const isWarned = useCallback(
    (name: string, city: string): number => {
      const match = warnings.find(
        (w) =>
          w.spaceName.toLowerCase() === name.toLowerCase() &&
          w.city.toLowerCase().split(",")[0].trim() === city.toLowerCase().split(",")[0].trim()
      );
      return match?.reportCount ?? 0;
    },
    [warnings]
  );

  return { isWarned };
}
