import { useCallback, useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

export type AgeAssuranceBand = "unknown" | "13_15" | "16_17" | "18_plus";
type AttestableAgeBand = Exclude<AgeAssuranceBand, "unknown">;

function isAgeAssuranceBand(value: unknown): value is AgeAssuranceBand {
  return value === "unknown" || value === "13_15" || value === "16_17" || value === "18_plus";
}

export function useAgeAssurance(enabled = true) {
  const [ageBand, setAgeBand] = useState<AgeAssuranceBand>("unknown");
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/age-assurance`, { credentials: "include" });
      if (!response.ok) throw new Error("AGE_ASSURANCE_LOAD_FAILED");
      const body = await response.json() as { ageBand?: unknown };
      setAgeBand(isAgeAssuranceBand(body.ageBand) ? body.ageBand : "unknown");
    } catch {
      setAgeBand("unknown");
      setError("Age assurance could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { void load(); }, [load]);

  const attest = useCallback(async (band: AttestableAgeBand): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/age-assurance`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageBand: band, attested: true }),
      });
      if (!response.ok) throw new Error("AGE_ASSURANCE_SAVE_FAILED");
      const body = await response.json() as { ageBand?: unknown };
      if (body.ageBand !== band) throw new Error("AGE_ASSURANCE_RESPONSE_MISMATCH");
      setAgeBand(band);
      return true;
    } catch {
      setError("Age assurance could not be saved. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { ageBand, loading, saving, error, attest, reload: load };
}
