import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type MemberTeaching = {
  title: string;
  text: string;
  sourceLabel: string;
};

function isMemberTeaching(value: unknown): value is MemberTeaching {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.title === "string" && typeof candidate.text === "string" && typeof candidate.sourceLabel === "string";
}

/**
 * A single-business, voluntary read choice. The choice is component-local only:
 * it is not saved, sent, profiled, or used outside this detail surface.
 */
export function BusinessCulturalTeachingCard({
  businessId,
  isAuthenticated,
}: {
  businessId: string;
  isAuthenticated: boolean;
}) {
  const [teaching, setTeaching] = useState<MemberTeaching | null>(null);
  const [checked, setChecked] = useState(false);
  const [reading, setReading] = useState(false);
  const [notNow, setNotNow] = useState(false);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !businessId) {
      setTeaching(null);
      setChecked(true);
      return () => {
        active = false;
      };
    }
    async function load() {
      try {
        const response = await authenticatedFetch(
          `${BASE}api/businesses/${encodeURIComponent(businessId)}/cultural-teaching`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const payload = (await response.json().catch(() => ({}))) as { teaching?: unknown };
        if (active && isMemberTeaching(payload.teaching)) setTeaching(payload.teaching);
      } catch {
        // Nonavailability is intentionally quiet; no teaching card is shown.
      } finally {
        if (active) setChecked(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [businessId, isAuthenticated]);

  if (!isAuthenticated || !checked || !teaching || notNow) return null;

  return (
    <section className="mt-5 max-w-3xl rounded-2xl border border-[#CA922B]/35 bg-[#1E1510]/90 p-4" data-testid="business-cultural-teaching-card">
      {!reading ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#CA922B]" aria-hidden="true" />
            <p className="text-sm leading-5 text-[#F5EBD8]/85">
              This business chose to share a short teaching in its own words. Reading is optional.
            </p>
          </div>
          <div className="flex shrink-0 gap-3 text-sm font-bold">
            <button type="button" onClick={() => setReading(true)} className="text-[#CA922B] hover:text-white">Read optional teaching</button>
            <button type="button" onClick={() => setNotNow(true)} className="text-[#F5EBD8]/65 hover:text-white">Not now</button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#CA922B]">{teaching.sourceLabel}</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-white">{teaching.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#F5EBD8]/90">{teaching.text}</p>
          <button type="button" onClick={() => setNotNow(true)} className="mt-3 text-sm font-bold text-[#CA922B] hover:text-white">Not now</button>
        </div>
      )}
    </section>
  );
}
