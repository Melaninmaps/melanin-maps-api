import { Link, Redirect, useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";

const BASE = import.meta.env.BASE_URL;

type Place = {
  id: string;
  entity_kind: string;
  title: string;
  slug: string;
  summary: string | null;
  address_line1: string | null;
  city: string;
  state_region: string | null;
  postal_code: string | null;
  website_url: string | null;
  source_url: string | null;
  source_label: string | null;
  detail_url: string;
};

function safePublicUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function titleCase(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function UniversalPlaceDetailPage() {
  const [location, navigate] = useLocation();
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [place, setPlace] = useState<Place | null>(null);
  const { id, slug } = useMemo(() => {
    const segments = location.split("?")[0].split("/").filter(Boolean);
    return { id: segments[1] ?? "", slug: segments[2] ?? "" };
  }, [location]);

  useEffect(() => {
    if (!id) {
      setState("missing");
      return;
    }
    const controller = new AbortController();
    setState("loading");
    fetch(`${BASE}api/places/${encodeURIComponent(id)}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<Place>;
      })
      .then((record) => {
        setPlace(record);
        setState("ready");
        if (slug !== record.slug) navigate(record.detail_url, { replace: true });
      })
      .catch((error) => {
        if (error.name !== "AbortError") setState("missing");
      });
    return () => controller.abort();
  }, [id, navigate, slug]);

  if (state === "loading") {
    return <main className="mx-auto min-h-[58vh] max-w-3xl px-5 py-16 text-[#2B1507]"><p>Loading this place…</p></main>;
  }

  if (state === "missing" || !place) {
    return (
      <main className="mx-auto min-h-[58vh] max-w-3xl px-5 py-16 text-[#2B1507]">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#8D5C17]">Place unavailable</p>
        <h1 className="mt-3 font-serif text-3xl font-bold">We could not find this published place.</h1>
        <Link href="/map" className="mt-6 inline-flex rounded-full bg-[#3A1F0E] px-5 py-2.5 text-sm font-bold text-white">
          Return to the Map
        </Link>
      </main>
    );
  }

  const address = [place.address_line1, place.city, place.state_region, place.postal_code].filter(Boolean).join(", ");
  const website = safePublicUrl(place.website_url);
  const source = safePublicUrl(place.source_url);

  return (
    <main className="min-h-[68vh] bg-[#FBF6EC] py-10 text-[#2B1507]">
      <article className="mx-auto max-w-3xl rounded-3xl border border-[#3A1F0E]/10 bg-white px-6 py-8 shadow-[0_18px_60px_rgba(58,31,14,0.08)] sm:px-10 sm:py-12">
        <Link href="/map" className="text-sm font-bold text-[#8D5C17] hover:underline">← Back to Map</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#8D5C17]">{titleCase(place.entity_kind)}</p>
        <h1 className="mt-2 font-serif text-4xl font-bold leading-tight sm:text-5xl">{place.title}</h1>
        {place.summary && <p className="mt-6 max-w-2xl text-base leading-8 text-[#3A1F0E]/75">{place.summary}</p>}
        <section className="mt-8 border-t border-[#3A1F0E]/10 pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#3A1F0E]/50">Location</p>
          <p className="mt-2 text-sm leading-6 text-[#3A1F0E]/80">{address}</p>
        </section>
        {(website || source) && (
          <section className="mt-8 flex flex-wrap gap-3">
            {website && (
              <a href={website} target="_blank" rel="noreferrer" className="rounded-full bg-[#3A1F0E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#5C3417]">
                Visit official website ↗
              </a>
            )}
            {source && (
              <a href={source} target="_blank" rel="noreferrer" className="rounded-full border border-[#8D5C17]/35 px-5 py-2.5 text-sm font-bold text-[#8D5C17] hover:bg-[#8D5C17]/[0.07]">
                Source: {place.source_label ?? "Learn more"} ↗
              </a>
            )}
          </section>
        )}
      </article>
    </main>
  );
}

export function LegacyPlaceRedirect() {
  const [location] = useLocation();
  const id = location.split("?")[0].split("/").filter(Boolean)[1];
  return <Redirect to={id ? `/places/${encodeURIComponent(id)}` : "/map"} />;
}