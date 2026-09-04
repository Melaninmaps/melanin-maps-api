import { useCallback, useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Loader2, MapPin, RefreshCw, ShieldCheck } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type SharedLocation = {
  label: string;
  currentLat: number | null;
  currentLng: number | null;
  lastUpdatedAt: string | null;
  expiresAt: string;
};

type ViewState =
  | { status: "loading"; share: null }
  | { status: "ready"; share: SharedLocation }
  | { status: "expired"; share: null }
  | { status: "error"; share: null };

export default function LocationShareView() {
  const [, params] = useRoute("/safety/location/:token");
  const token = params?.token;
  const [state, setState] = useState<ViewState>({ status: "loading", share: null });

  const loadShare = useCallback(async () => {
    if (!token) {
      setState({ status: "error", share: null });
      return;
    }

    setState((current) => current.share ? current : { status: "loading", share: null });
    try {
      const response = await fetch(`${BASE}api/safety/location-shares/${encodeURIComponent(token)}/view`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-store" },
      });
      if (response.status === 404 || response.status === 410) {
        setState({ status: "expired", share: null });
        return;
      }
      if (!response.ok) throw new Error("Unable to load location");
      const data = await response.json() as { share?: SharedLocation };
      if (!data.share) throw new Error("Location unavailable");
      setState({ status: "ready", share: data.share });
    } catch {
      setState({ status: "error", share: null });
    }
  }, [token]);

  useEffect(() => {
    document.title = "Shared Live Location | Mapping With Melanin";
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", "View a temporary live location shared with you.");
    void loadShare();
    const interval = window.setInterval(() => { void loadShare(); }, 30_000);
    return () => window.clearInterval(interval);
  }, [loadShare]);

  const share = state.share;
  const hasCoordinates = share?.currentLat != null && share?.currentLng != null;
  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${share.currentLat},${share.currentLng}`)}`
    : null;

  return (
    <main className="min-h-screen bg-[#FAF6EF] px-4 py-16 flex items-center justify-center">
      <section className="w-full max-w-md rounded-3xl border border-[#3A1F0E]/10 bg-white p-7 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB]/10">
          <MapPin className="h-7 w-7 text-[#2563EB]" aria-hidden="true" />
        </div>
        {state.status === "loading" && (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#2563EB]" />
            <p className="mt-4 text-sm text-[#3A1F0E]/65">Loading shared location…</p>
          </>
        )}
        {state.status === "expired" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-[#2B1507]">This share is no longer active</h1>
            <p className="mt-3 text-sm leading-6 text-[#3A1F0E]/65">The person sharing their location stopped the share or its time limit ended.</p>
          </>
        )}
        {state.status === "error" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-[#2B1507]">Location unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-[#3A1F0E]/65">Check that the link is complete, then try again.</p>
            <button onClick={() => void loadShare()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white">
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </>
        )}
        {state.status === "ready" && share && (
          <>
            <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Live location shared with you</p>
            <h1 className="mt-2 font-serif text-2xl font-bold text-[#2B1507]">{share.label}</h1>
            {hasCoordinates ? (
              <a href={mapUrl!} target="_blank" rel="noreferrer" className="mt-6 flex min-h-36 flex-col items-center justify-center rounded-2xl bg-[#2563EB]/10 px-5 text-[#1748A8] hover:bg-[#2563EB]/15">
                <MapPin className="h-8 w-8" />
                <span className="mt-2 text-sm font-bold">Open current location in Maps</span>
              </a>
            ) : (
              <div className="mt-6 rounded-2xl bg-[#3A1F0E]/5 p-5 text-sm text-[#3A1F0E]/65">
                Waiting for the sharer&apos;s first location update.
              </div>
            )}
            <p className="mt-5 text-xs text-[#3A1F0E]/50">
              {share.lastUpdatedAt ? `Updated ${new Date(share.lastUpdatedAt).toLocaleString()}` : "Not updated yet"}
            </p>
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#3A1F0E]/5 p-3 text-left text-xs leading-5 text-[#3A1F0E]/60">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
              This temporary link expires {new Date(share.expiresAt).toLocaleString()}. Location data is not stored by this page.
            </div>
          </>
        )}
      </section>
    </main>
  );
}