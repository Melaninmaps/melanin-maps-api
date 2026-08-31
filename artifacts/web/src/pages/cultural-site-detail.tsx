import { useRoute, Link } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, ExternalLink, BookOpen, Users, CheckCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function normalizeExternalHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (schemeMatch && !/^https?$/i.test(schemeMatch[1])) return null;
  const candidate = schemeMatch ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

const HERITAGE_COLORS: Record<string, string> = {
  HBCU: "#7C3AED",
  hbcu: "#7C3AED",
  "African American Heritage": "#CA922B",
  "Civil Rights": "#DC2626",
  "Native American Heritage": "#15803D",
  "Hispanic & Latino Heritage": "#D97706",
  "LGBTQ+ History": "#DB2777",
  "Women's History": "#7C3AED",
  "Cultural Neighborhood": "#CA922B",
  "Immigrant Heritage": "#0284C7",
  "Caribbean Heritage": "#059669",
};

// ─── Heritage category SVG banners ───────────────────────────────────────────
// Shown when a site has no imageUrl. Each banner uses the heritage accent color,
// a subtle geometric pattern, and a category-specific line-art icon.

const HERITAGE_ICONS: Record<string, React.ReactNode> = {
  HBCU: (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="20" y="44" width="40" height="26" rx="2" />
      <path d="M14 44 L40 28 L66 44" />
      <rect x="33" y="54" width="14" height="16" rx="1" />
      <circle cx="40" cy="22" r="6" />
      <path d="M34 22 Q40 16 46 22" />
    </svg>
  ),
  "African American Heritage": (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="40" r="22" />
      <path d="M40 18 L40 62M18 40 L62 40" />
      <path d="M24 24 L56 56M56 24 L24 56" strokeOpacity="0.4" />
      <circle cx="40" cy="40" r="6" fill="currentColor" fillOpacity="0.3" />
    </svg>
  ),
  "Civil Rights": (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28 60 C28 60 28 40 40 32 C52 24 52 12 52 12" />
      <path d="M52 12 L68 28 M52 12 L36 28" />
      <circle cx="28" cy="64" r="4" fill="currentColor" fillOpacity="0.4" />
      <path d="M20 72 L80 72" strokeOpacity="0.3" />
    </svg>
  ),
  "Native American Heritage": (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="40" r="20" />
      <circle cx="40" cy="40" r="8" />
      <path d="M40 20 L40 12M40 68 L40 60M20 40 L12 40M68 40 L60 40" />
      <path d="M26 26 L20 20M54 54 L60 60M54 26 L60 20M26 54 L20 60" strokeOpacity="0.5" />
    </svg>
  ),
  "Hispanic & Latino Heritage": (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 60 L40 20 L60 60 Z" />
      <path d="M28 48 L52 48" />
      <circle cx="40" cy="36" r="4" fill="currentColor" fillOpacity="0.3" />
      <path d="M12 68 L68 68M16 64 L64 64" strokeOpacity="0.3" />
    </svg>
  ),
  "LGBTQ+ History": (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M40 64 C40 64 16 48 16 32 C16 22 24 16 32 20 C36 22 38 26 40 28 C42 26 44 22 48 20 C56 16 64 22 64 32 C64 48 40 64 40 64Z" />
      <path d="M32 36 L36 40 L48 28" strokeOpacity="0.7" />
    </svg>
  ),
  "Women's History": (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="32" r="18" />
      <path d="M40 50 L40 68M30 60 L50 60" />
      <path d="M30 28 L40 20 L50 28" strokeOpacity="0.6" />
    </svg>
  ),
  "Cultural Neighborhood": (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 64 L10 38 L28 26 L28 64M28 64 L52 64 L52 34 L40 22 L28 34M52 64 L70 64 L70 44 L61 36 L52 44" />
      <rect x="34" y="48" width="12" height="16" />
    </svg>
  ),
  "Immigrant Heritage": (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="40" cy="40" rx="22" ry="16" />
      <ellipse cx="40" cy="40" rx="10" ry="16" />
      <path d="M18 40 L62 40M40 24 L40 56" />
      <ellipse cx="40" cy="40" rx="22" ry="16" strokeOpacity="0.3" strokeDasharray="4 4" />
    </svg>
  ),
  "Caribbean Heritage": (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M40 16 Q52 28 52 40 Q52 56 40 64 Q28 56 28 40 Q28 28 40 16Z" />
      <path d="M20 52 Q32 44 40 40 Q48 44 60 52" />
      <path d="M20 28 Q32 36 40 40 Q48 36 60 28" strokeOpacity="0.5" />
    </svg>
  ),
};

function HeritageBanner({ category, color, name }: { category: string; color: string; name: string }) {
  const icon = HERITAGE_ICONS[category] ?? (
    <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M40 16 L44 30 L58 30 L46 38 L50 52 L40 44 L30 52 L34 38 L22 30 L36 30 Z" />
      <circle cx="40" cy="40" r="28" strokeOpacity="0.25" />
    </svg>
  );

  return (
    <div
      className="w-full h-52 relative overflow-hidden flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}10 50%, ${color}1a 100%)` }}
      aria-label={`${category} site`}
    >
      {/* Subtle geometric background rings */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 80% 20%, ${color}18 0%, transparent 50%),
                            radial-gradient(circle at 20% 80%, ${color}12 0%, transparent 40%)`,
        }}
      />
      {/* Faint grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`grid-${category.replace(/\s+/g, "")}`} x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke={color} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${category.replace(/\s+/g, "")})`} />
      </svg>
      {/* Icon */}
      <div className="relative z-10 flex flex-col items-center gap-3" style={{ color }}>
        {icon}
        <span
          className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border"
          style={{ borderColor: `${color}40`, background: `${color}15`, color }}
        >
          {category}
        </span>
      </div>
    </div>
  );
}

const RELATIONSHIP_TYPES = [
  { value: "alumnus", label: "Alumnus / Alumna" },
  { value: "student", label: "Current Student" },
  { value: "faculty", label: "Faculty / Staff" },
  { value: "community_member", label: "Community Member" },
  { value: "family", label: "Family Connection" },
  { value: "visitor", label: "Visitor" },
  { value: "researcher", label: "Researcher / Historian" },
  { value: "other", label: "Other Connection" },
];

interface CulturalSite {
  id: string;
  name: string;
  description: string;
  category: string;
  heritageCategory?: string | null;
  subcategory?: string | null;
  ethnicCommunity?: string | null;
  culturalCommunity?: string | null;
  visitTip?: string | null;
  contentNote?: string | null;
  city: string;
  state: string;
  address?: string | null;
  era?: string | null;
  significance?: string | null;
  imageUrl?: string | null;
  externalUrl?: string | null;
  learnMoreUrl?: string | null;
  detailUrl?: string | null;
  stateCode?: string | null;
  isVerified?: boolean;
  yearEstablished?: number | null;
  isAccessible?: boolean;
  isFamilyFriendly?: boolean;
  admissionFree?: boolean;
  audioGuide?: boolean;
  verifiedSource?: string | null;
  country?: string;
  createdAt?: string;
}

interface Story {
  id: string;
  authorName?: string | null;
  relationshipType: string;
  content: string;
  isAmbassador?: boolean;
  createdAt: string;
}

interface SupportLink {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  category?: string | null;
}

export default function CulturalSiteDetail() {
  const [, legacyParams] = useRoute("/sites/:id");
  const [, canonicalParams] = useRoute("/cultural-sites/:id");
  const [, canonicalSlugParams] = useRoute("/cultural-sites/:id/:slug");
  const id =
    canonicalSlugParams?.id ??
    canonicalParams?.id ??
    legacyParams?.id ??
    "";
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();

  const [site, setSite] = useState<CulturalSite | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [links, setLinks] = useState<SupportLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [storyOpen, setStoryOpen] = useState(false);
  const [storyRelType, setStoryRelType] = useState("visitor");
  const [storyContent, setStoryContent] = useState("");
  const [storyAuthor, setStoryAuthor] = useState("");
  const [storySubmitting, setStorySubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`${BASE}/api/cultural-sites/${id}`).then((r) => r.json()),
      fetch(`${BASE}/api/cultural-sites/${id}/stories`).then((r) => r.json()),
      fetch(`${BASE}/api/cultural-sites/${id}/support-links`).then((r) => r.json()),
    ])
      .then(([siteData, storyData, linkData]) => {
        const rawSite = siteData?.site ?? (siteData?.id ? siteData : null);
        if (siteData?.error || !rawSite) { setNotFound(true); return; }
        setNotFound(false);
        setSite({
          ...rawSite,
          state: rawSite.state ?? rawSite.stateCode ?? "",
          externalUrl: rawSite.externalUrl ?? rawSite.learnMoreUrl ?? null,
        });
        setStories(storyData.stories ?? []);
        setLinks(linkData.links ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function submitStory() {
    if (!storyContent.trim() || storyContent.trim().length < 20) {
      toast({ title: "Story too short", description: "Please share at least 20 characters about your connection." });
      return;
    }
    setStorySubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/cultural-sites/${id}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          relationshipType: storyRelType,
          content: storyContent.trim(),
          authorName: storyAuthor.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: "Could not submit", description: data.error ?? "Please try again." }); return; }
      toast({ title: "Story submitted", description: "Your story is pending review. Thank you for sharing." });
      setStoryOpen(false);
      setStoryContent("");
      setStoryAuthor("");
    } catch {
      toast({ title: "Network error", description: "Please check your connection and try again." });
    } finally {
      setStorySubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !site) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center gap-4 px-4">
        <MapPin className="w-12 h-12 text-[#CA922B]/40" />
        <h1 className="font-serif text-2xl font-bold text-[#2B1507]">Site not found</h1>
        <p className="text-[#3A1F0E]/60 text-center">This cultural site may have been removed or the link is incorrect.</p>
        <Link href="/map"><Button variant="outline">Back to Map</Button></Link>
      </div>
    );
  }

  const heritage = site.heritageCategory ?? "";
  const accentColor = HERITAGE_COLORS[heritage] ?? "#CA922B";
  const externalSiteUrl = normalizeExternalHttpUrl(site.externalUrl ?? site.learnMoreUrl);

  const relLabel = (rt: string) =>
    RELATIONSHIP_TYPES.find((r) => r.value === rt)?.label ?? rt.replace(/_/g, " ");

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Back nav */}
      <div className="sticky top-0 z-10 bg-[#FAF6EF]/95 backdrop-blur-sm border-b border-[#2B1507]/8 px-4 py-3 flex items-center gap-3">
        <Link href="/map">
          <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3A1F0E]/60 hover:text-[#CA922B] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </button>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header card */}
        <div className="bg-white rounded-2xl overflow-hidden border border-[#2B1507]/5 shadow-sm">
          {site.imageUrl ? (
            <img
              src={site.imageUrl}
              alt={site.name}
              className="w-full h-52 object-cover"
            />
          ) : (
            <HeritageBanner category={site.heritageCategory ?? site.category} color={accentColor} name={site.name} />
          )}
          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                style={{ background: `${accentColor}18`, color: accentColor }}
              >
                {heritage || site.category}
              </span>
              {site.isVerified && (
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
              {site.subcategory && (
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#2B1507]/10">
                  {site.subcategory}
                </span>
              )}
            </div>

            <h1 className="font-serif font-bold text-2xl text-[#2B1507] leading-tight mb-1">
              {site.name}
            </h1>

            <div className="flex items-center gap-1.5 text-sm text-[#3A1F0E]/60 mb-1">
              <MapPin className="w-4 h-4 shrink-0" />
              {site.address ? `${site.address}, ` : ""}{site.city}, {site.state}
            </div>

            {site.era && (
              <p className="text-xs font-semibold text-[#CA922B] mt-1">{site.era}</p>
            )}

            {externalSiteUrl && (
              <a
                href={externalSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold hover:underline"
                style={{ color: accentColor }}
              >
                <ExternalLink className="w-4 h-4" />
                Official Website
              </a>
            )}
          </div>
        </div>

        {/* Quick facts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Accessible", value: site.isAccessible, icon: "♿" },
            { label: "Family Friendly", value: site.isFamilyFriendly, icon: "👨‍👩‍👧" },
            { label: "Free Admission", value: site.admissionFree, icon: "🎟" },
            { label: "Audio Guide", value: site.audioGuide, icon: "🔊" },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className={`rounded-xl p-3 border text-center text-xs font-semibold ${
                value
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-[#FAF6EF] border-[#2B1507]/10 text-[#3A1F0E]/40"
              }`}
            >
              <div className="text-lg mb-1">{icon}</div>
              {label}
              <div className="text-[10px] font-bold mt-0.5">{value ? "Yes" : "Not confirmed"}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {site.description && (
          <div className="bg-white rounded-2xl p-6 border border-[#2B1507]/5">
            <h2 className="font-serif font-bold text-lg text-[#2B1507] mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: accentColor }} />
              About This Place
            </h2>
            <p className="text-sm text-[#3A1F0E]/80 leading-relaxed">{site.description}</p>
          </div>
        )}

        {/* Significance */}
        {site.significance && (
          <div className="rounded-2xl p-6 border" style={{ background: `${accentColor}08`, borderColor: `${accentColor}25` }}>
            <h2 className="font-serif font-bold text-lg mb-2" style={{ color: accentColor }}>
              Why This Place Matters
            </h2>
            <p className="text-sm text-[#3A1F0E]/80 leading-relaxed">{site.significance}</p>
          </div>
        )}

        {/* Visit tip */}
        {site.visitTip && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5">Visit Tip</p>
            <p className="text-sm text-[#3A1F0E]/80 leading-relaxed italic">{site.visitTip}</p>
          </div>
        )}

        {/* Content note */}
        {site.contentNote && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1.5">Content Note</p>
            <p className="text-sm text-[#3A1F0E]/80 leading-relaxed">{site.contentNote}</p>
          </div>
        )}

        {/* Support links */}
        {links.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-[#2B1507]/5">
            <h2 className="font-serif font-bold text-lg text-[#2B1507] mb-4">Resources & Support</h2>
            <div className="space-y-3">
              {links.map((link) => {
                const supportUrl = normalizeExternalHttpUrl(link.url);
                if (!supportUrl) return null;
                return (
                  <a
                    key={link.id}
                    href={supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF6EF] border border-[#2B1507]/8 hover:border-[#CA922B]/30 hover:bg-[#CA922B]/5 transition-colors group"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 text-[#CA922B] group-hover:scale-110 transition-transform" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#2B1507] group-hover:text-[#CA922B] transition-colors">{link.title}</div>
                      {link.description && (
                        <div className="text-xs text-[#3A1F0E]/60 mt-0.5 leading-relaxed">{link.description}</div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Stories from the community */}
        <div className="bg-white rounded-2xl p-6 border border-[#2B1507]/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-bold text-lg text-[#2B1507] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#CA922B]" />
              Living Stories
            </h2>
            {auth?.user && !storyOpen && (
              <button
                onClick={() => setStoryOpen(true)}
                className="text-sm font-semibold px-4 py-1.5 rounded-full border border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white transition-colors"
              >
                Share Your Story
              </button>
            )}
            {!auth?.user && (
              <Link href="/login">
                <span className="text-xs text-[#CA922B] font-semibold hover:underline cursor-pointer">
                  Sign in to share
                </span>
              </Link>
            )}
          </div>

          {/* Story submission form */}
          {storyOpen && (
            <div className="mb-6 p-4 rounded-xl bg-[#FAF6EF] border border-[#2B1507]/10 space-y-3">
              <p className="text-sm font-semibold text-[#2B1507]">Share your connection to {site.name}</p>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider block mb-1">Your Connection</label>
                <select
                  value={storyRelType}
                  onChange={(e) => setStoryRelType(e.target.value)}
                  className="w-full text-sm border border-[#2B1507]/15 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#CA922B] text-[#3A1F0E]"
                >
                  {RELATIONSHIP_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider block mb-1">Your Name (optional)</label>
                <input
                  type="text"
                  value={storyAuthor}
                  onChange={(e) => setStoryAuthor(e.target.value)}
                  placeholder="How you'd like to be credited"
                  className="w-full text-sm border border-[#2B1507]/15 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#CA922B] text-[#3A1F0E]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider block mb-1">Your Story</label>
                <Textarea
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                  placeholder="Share what this place means to you — a memory, a connection, something you want people to know..."
                  maxLength={2000}
                  rows={4}
                  className="text-sm resize-none"
                />
                <div className="text-right text-xs text-[#3A1F0E]/40 mt-1">{storyContent.length}/2000</div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setStoryOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  onClick={submitStory}
                  disabled={storySubmitting || storyContent.trim().length < 20}
                  style={{ background: accentColor }}
                  className="text-white hover:opacity-90"
                >
                  {storySubmitting ? "Submitting…" : "Submit Story"}
                </Button>
              </div>
            </div>
          )}

          {stories.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-[#3A1F0E]/15 mx-auto mb-3" />
              <p className="text-sm text-[#3A1F0E]/50">No stories yet.</p>
              <p className="text-xs text-[#3A1F0E]/40 mt-1">Be the first to share your connection to this place.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
                <div key={story.id} className="p-4 rounded-xl bg-[#FAF6EF] border border-[#2B1507]/8">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-bold text-[#2B1507]">
                        {story.authorName || "Community Member"}
                      </span>
                      {story.isAmbassador && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${accentColor}18`, color: accentColor }}>
                          Ambassador
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${accentColor}12`, color: accentColor }}
                    >
                      {relLabel(story.relationshipType)}
                    </span>
                  </div>
                  <p className="text-sm text-[#3A1F0E]/80 leading-relaxed">{story.content}</p>
                  <p className="text-[10px] text-[#3A1F0E]/40 mt-2">
                    {new Date(story.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Source attribution */}
        {site.verifiedSource && (
          <p className="text-[10px] text-[#3A1F0E]/40 text-center px-4">
            Verified source: {site.verifiedSource}
          </p>
        )}

        {/* View on map */}
        <div className="text-center pb-8">
          <Link href="/map">
            <Button variant="outline" className="gap-2">
              <MapPin className="w-4 h-4" />
              View on Map
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
