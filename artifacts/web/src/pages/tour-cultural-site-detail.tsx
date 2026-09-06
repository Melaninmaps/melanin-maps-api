import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, MapPin } from "lucide-react";
import { Link, useRoute } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type TourCulturalSite = {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string | null;
  description: string;
  site_type: string;
  contributionCount: number;
};

export default function TourCulturalSiteDetail() {
  const [, params] = useRoute("/tour-cultural-sites/:id");
  const id = params?.id ?? "";
  const [site, setSite] = useState<TourCulturalSite | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not_found" | "error">("loading");

  useEffect(() => {
    if (!id) {
      setStatus("not_found");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    fetch(`${BASE}/api/tour-cultural-sites/${encodeURIComponent(id)}`, {
      credentials: "include",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Unable to load this cultural place.");
        return await response.json() as TourCulturalSite;
      })
      .then((record) => {
        if (!record) {
          setStatus("not_found");
          return;
        }
        setSite(record);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, [id]);

  const mapUrl = useMemo(() => {
    if (!site) return null;
    const query = [site.address, site.city, site.state].filter(Boolean).join(", ");
    return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
  }, [site]);

  if (status === "loading") {
    return (
      <main className="min-h-[60vh] bg-[#FBF6EC] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#CA922B] border-t-transparent" aria-label="Loading cultural place" />
      </main>
    );
  }

  if (status !== "ready" || !site) {
    return (
      <main className="min-h-[60vh] bg-[#FBF6EC] px-6 py-20 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-[#CA922B]" />
        <h1 className="mt-4 font-serif text-3xl font-bold text-[#2B1507]">
          {status === "not_found" ? "Cultural place not found" : "We could not load this cultural place"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[#3A1F0E]/65">
          Return to Explore and try the search again.
        </p>
        <Link href="/explore" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#CA922B] px-5 py-3 font-semibold text-white hover:bg-[#B38024]">
          <ArrowLeft className="h-4 w-4" /> Back to Explore
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBF6EC]">
      <section className="bg-[#2B1507] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-[#E5B94B] hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Explore
          </Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#E5B94B]">
            {(site.site_type || "Cultural place").replace(/_/g, " ")}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold md:text-5xl">{site.name}</h1>
          <p className="mt-4 flex items-center gap-2 text-white/75">
            <MapPin className="h-4 w-4 text-[#E5B94B]" />
            {[site.address, site.city, site.state].filter(Boolean).join(", ")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-3xl border border-[#3A1F0E]/10 bg-white p-7 shadow-sm md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8D5C17]">Why this place matters</p>
          <p className="mt-5 whitespace-pre-line text-lg leading-8 text-[#3A1F0E]/85">{site.description}</p>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-[#3A1F0E]/10 pt-6">
            {mapUrl ? (
              <a href={mapUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#CA922B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#B38024]">
                Open in Maps ↗
              </a>
            ) : null}
            <span className="rounded-full border border-[#CA922B]/30 bg-[#CA922B]/5 px-4 py-3 text-sm font-semibold text-[#8D5C17]">
              Community cultural record
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
