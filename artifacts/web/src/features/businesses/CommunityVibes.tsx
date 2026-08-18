/**
 * CommunityVibes — dynamic, evidence-backed community signals.
 *
 * Fetches approved vibe tags from /api/businesses/:businessId/community-vibes.
 * A business with no approved evidence shows an honest empty state.
 * Static hardcoded tags are never rendered as evidence.
 *
 * Confidence tiers (from the API):
 *   emerging   — 1 unique approved voice
 *   growing    — 2 unique approved voices
 *   established — 3+ unique approved voices
 */

import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Vibe = {
  vibeKey: string;
  label: string;
  voices: number;
  evidenceCount: number;
  confidence: "emerging" | "growing" | "established";
  lastEvidenceAt: string;
};

type Payload = {
  businessId: string;
  voices: number;
  vibes: Vibe[];
  contributionChoices: Array<{ vibeKey: string; label: string }>;
  updatedAt: string | null;
};

type Props = {
  businessId: string;
  /** True when a session cookie is present — enables the contribution control. */
  isAuthenticated: boolean;
  /** ID of the member's active check-in or review for this business, used as the evidence sourceId. */
  checkinId?: string;
};

const CONFIDENCE_BADGE: Record<Vibe["confidence"], string> = {
  emerging: "border-white/10 bg-[#241810] text-white/60",
  growing: "border-[#CA922B]/40 bg-[#CA922B]/10 text-[#CA922B]",
  established: "border-[#CA922B] bg-[#CA922B] text-white",
};

const CONFIDENCE_LABEL: Record<Vibe["confidence"], string> = {
  emerging: "Emerging signal",
  growing: "Growing",
  established: "Established",
};

export function CommunityVibes({ businessId, isAuthenticated, checkinId }: Props) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [state, setState] = useState<
    "loading" | "ready" | "error" | "contributing" | "submitted"
  >("loading");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    setState("loading");
    setPayload(null);
    setSelectedKeys([]);

    fetch(`${BASE}/api/businesses/${encodeURIComponent(businessId)}/community-vibes`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((res) =>
        res.ok ? (res.json() as Promise<Payload>) : Promise.reject(new Error("FETCH_FAILED")),
      )
      .then((result) => {
        if (!active) return;
        setPayload(result);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => {
      active = false;
    };
  }, [businessId]);

  function toggleChoice(key: string) {
    setSelectedKeys((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : prev.length < 3
          ? [...prev, key]
          : prev,
    );
  }

  async function submit() {
    if (!checkinId || selectedKeys.length === 0) return;
    try {
      const res = await fetch(
        `${BASE}/api/businesses/${encodeURIComponent(businessId)}/community-vibes`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceId: checkinId, vibeKeys: selectedKeys }),
        },
      );
      setState(res.status === 202 ? "submitted" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="bg-[#1E1510] rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-serif font-bold text-xl text-white">Community Vibes</h3>
          <p className="text-xs text-white/40 mt-0.5">
            What approved community voices say about this place.
          </p>
        </div>
        {payload && payload.voices > 0 && (
          <span className="shrink-0 text-xs font-bold text-[#CA922B] bg-[#CA922B]/10 px-2.5 py-1 rounded-full">
            {payload.voices} {payload.voices === 1 ? "voice" : "voices"}
          </span>
        )}
      </div>

      {/* Loading */}
      {state === "loading" && (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-white/40">Loading community evidence…</span>
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <p className="text-sm text-white/50 py-2">
          Community Vibes are temporarily unavailable. Please try again.
        </p>
      )}

      {/* Empty — zero approved evidence */}
      {state === "ready" && payload?.vibes.length === 0 && (
        <div className="py-3">
          <p className="text-sm font-semibold text-white/70">
            The community is still building this story.
          </p>
          <p className="text-xs text-white/40 mt-1">
            No approved vibe tags have been recorded for this place yet.
          </p>
        </div>
      )}

      {/* Approved vibe chips */}
      {state === "ready" && payload && payload.vibes.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-4" aria-label="Approved community vibes">
          {payload.vibes.map((vibe) => (
            <li key={vibe.vibeKey} className="flex flex-col items-start gap-0.5">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${CONFIDENCE_BADGE[vibe.confidence]}`}
              >
                {vibe.label}
              </span>
              <span className="text-[10px] text-white/40 pl-1">
                {vibe.confidence === "emerging"
                  ? CONFIDENCE_LABEL.emerging
                  : `${vibe.voices} ${CONFIDENCE_LABEL[vibe.confidence]}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Submitted confirmation */}
      {state === "submitted" && (
        <p className="text-sm text-[#CA922B] py-2">
          Thank you. Your experience is queued for moderation before it contributes to the
          community view.
        </p>
      )}

      {/* Contribution gate — authenticated with active checkin */}
      {state === "ready" && isAuthenticated && checkinId && (
        <button
          className="mt-2 text-xs font-semibold text-[#CA922B] hover:text-[#B38024] transition-colors"
          onClick={() => setState("contributing")}
          type="button"
        >
          + Add your experience
        </button>
      )}

      {/* Contribution gate — authenticated without checkin */}
      {state === "ready" && isAuthenticated && !checkinId && (
        <p className="mt-2 text-xs text-white/40">
          Check in or add a review to contribute a verified experience.
        </p>
      )}

      {/* Contribution gate — unauthenticated */}
      {state === "ready" && !isAuthenticated && (
        <a
          className="mt-2 inline-block text-xs font-semibold text-[#CA922B] hover:text-[#B38024] transition-colors"
          href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
        >
          Sign in to share your experience
        </a>
      )}

      {/* Contribution form */}
      {state === "contributing" && payload && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-xs text-white/60 mb-3">
            Select up to three tags that match your visit. These are contribution choices,
            not existing community claims.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {payload.contributionChoices.map((choice) => {
              const selected = selectedKeys.includes(choice.vibeKey);
              return (
                <label
                  key={choice.vibeKey}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border cursor-pointer transition-all ${
                    selected
                      ? "border-[#CA922B] bg-[#CA922B]/10 text-[#CA922B]"
                      : "border-white/10 bg-[#241810] text-white/60 hover:border-[#CA922B]/40"
                  }`}
                >
                  <input
                    checked={selected}
                    className="sr-only"
                    onChange={() => toggleChoice(choice.vibeKey)}
                    type="checkbox"
                  />
                  {choice.label}
                </label>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
              onClick={() => setState("ready")}
              type="button"
            >
              Cancel
            </button>
            <button
              className="text-xs font-semibold px-4 py-1.5 rounded-full bg-[#CA922B] text-white hover:bg-[#B38024] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={selectedKeys.length === 0}
              onClick={submit}
              type="button"
            >
              Submit for review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
