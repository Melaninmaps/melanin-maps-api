import { useRoute, Link } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, ExternalLink, BookOpen, Users, CheckCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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
  const [, params] = useRoute("/sites/:id");
  const id = params?.id;
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
        if (siteData.error || !siteData.site) { setNotFound(true); return; }
        setSite(siteData.site);
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
          {site.imageUrl && (
            <img
              src={site.imageUrl}
              alt={site.name}
              className="w-full h-52 object-cover"
            />
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

            {site.externalUrl && (
              <a
                href={site.externalUrl}
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
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
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
              ))}
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
