/**
 * CulturalSiteDetailsPage — canonical cultural-site detail view.
 *
 * Fetches by ID from the directory API. If a slug is stale or absent the page
 * still loads, then replaces the URL with the canonical slug so that refreshes
 * and shares always resolve correctly.
 *
 * Route: /cultural-sites/:id/:slug?
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type CulturalSiteDetail = {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  state?: string | null;
  summary?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  websiteUrl?: string | null;
  detailUrl: string;
};

function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function culturalSiteDetailUrl(site: Pick<CulturalSiteDetail, "id" | "slug">): string {
  return `/cultural-sites/${encodeURIComponent(site.id)}/${encodeURIComponent(site.slug)}`;
}

export default function CulturalSiteDetailsPage() {
  // Match either /cultural-sites/:id/:slug or /cultural-sites/:id
  const [matchWithSlug, paramsWithSlug] = useRoute("/cultural-sites/:id/:slug");
  const [matchIdOnly, paramsIdOnly] = useRoute("/cultural-sites/:id");

  const id = (matchWithSlug ? paramsWithSlug?.id : paramsIdOnly?.id) ?? "";

  const [, navigate] = useLocation();
  const [site, setSite] = useState<CulturalSiteDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">("loading");
  const [currentPath] = useLocation();

  useEffect(() => {
    if (!id) {
      setStatus("not-found");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    fetch(`${BASE}/api/directory/cultural-sites/${encodeURIComponent(id)}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 404) {
          setStatus("not-found");
          return null;
        }
        if (!response.ok) throw new Error("Unable to load this cultural site.");
        return (await response.json()) as CulturalSiteDetail;
      })
      .then((payload) => {
        if (!payload) return;
        setSite(payload);
        setStatus("ready");

        // Redirect stale or missing slugs to the canonical URL
        if (currentPath !== payload.detailUrl) {
          navigate(payload.detailUrl, { replace: true });
        }
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") {
          setStatus("error");
        }
      });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const externalLearnMoreUrl = useMemo(
    () => safeExternalUrl(site?.websiteUrl),
    [site?.websiteUrl],
  );

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (status === "not-found") {
    return (
      <main className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center px-6 text-center gap-4">
        <h1 className="text-3xl font-serif font-bold text-[#2B1507]">Cultural site not found</h1>
        <p className="text-[#3A1F0E]/60">
          This site may be unpublished or the link may be outdated.
        </p>
        <Link
          href="/map"
          className="mt-4 px-6 py-2 bg-[#CA922B] text-white rounded-full font-semibold hover:bg-[#B38024] transition-colors"
        >
          Return to the map
        </Link>
      </main>
    );
  }

  if (status === "error" || !site) {
    return (
      <main className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center px-6 text-center gap-4">
        <h1 className="text-3xl font-serif font-bold text-[#2B1507]">
          We could not load this cultural site
        </h1>
        <p className="text-[#3A1F0E]/60">Please return to the map and try again.</p>
        <Link
          href="/map"
          className="mt-4 px-6 py-2 bg-[#CA922B] text-white rounded-full font-semibold hover:bg-[#B38024] transition-colors"
        >
          Return to the map
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF6EF]">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/map"
          className="inline-flex items-center gap-1 text-sm text-[#CA922B] font-semibold hover:underline"
        >
          ← Back to map
        </Link>

        {site.imageUrl ? (
          <img
            className="mt-5 aspect-[16/7] w-full rounded-xl object-cover"
            src={site.imageUrl}
            alt=""
          />
        ) : (
          <div className="mt-5 aspect-[16/7] w-full rounded-xl bg-[#CA922B]/10 flex items-center justify-center">
            <span className="text-[#CA922B] font-serif text-2xl opacity-40">Cultural Site</span>
          </div>
        )}

        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#CA922B]">
          Cultural site
          {site.city ? ` · ${site.city}${site.state ? `, ${site.state}` : ""}` : ""}
        </p>

        <h1 className="mt-2 text-4xl font-serif font-bold text-[#2B1507]">{site.name}</h1>

        <p className="mt-6 whitespace-pre-line text-lg leading-8 text-[#3A1F0E]">
          {site.description ||
            site.summary ||
            "More information about this cultural site is coming soon."}
        </p>

        {externalLearnMoreUrl ? (
          <a
            className="mt-8 inline-block rounded-full bg-[#CA922B] px-5 py-3 font-semibold text-white hover:bg-[#B38024] transition-colors"
            href={externalLearnMoreUrl}
            target="_blank"
            rel="noreferrer"
          >
            Learn more on the official site ↗
          </a>
        ) : null}
      </div>
    </main>
  );
}
