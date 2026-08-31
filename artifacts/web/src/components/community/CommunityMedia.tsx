import { useState } from "react";
import { AlertCircle, ExternalLink, Link2, X } from "lucide-react";

export type CommunityMediaKind =
  | { type: "youtube"; embedUrl: string }
  | { type: "provider-link"; provider: "TikTok" | "Instagram" | "External media" }
  | { type: "native-video" }
  | { type: "image" };

const VIDEO_EXTENSIONS = new Set(["mp4", "m4v", "mov", "webm", "ogv"]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "jpe", "png", "webp", "gif", "heic", "heif", "avif"]);

function hostMatches(hostname: string, domain: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return normalized === domain || normalized.endsWith(`.${domain}`);
}

function safeHttpUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(rawUrl: string): string | null {
  const url = safeHttpUrl(rawUrl);
  if (!url) return null;

  let videoId: string | null = null;
  if (hostMatches(url.hostname, "youtu.be")) {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (hostMatches(url.hostname, "youtube.com")) {
    if (url.pathname === "/watch") videoId = url.searchParams.get("v");
    if (!videoId && /^\/(shorts|embed)\//.test(url.pathname)) {
      videoId = url.pathname.split("/").filter(Boolean)[1] ?? null;
    }
  }

  if (!videoId || !/^[A-Za-z0-9_-]{6,}$/.test(videoId)) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

export function classifyCommunityMedia(rawUrl: string): CommunityMediaKind {
  const url = safeHttpUrl(rawUrl);
  if (!url) return { type: "provider-link", provider: "External media" };

  const youtubeEmbed = getYouTubeEmbedUrl(rawUrl);
  if (youtubeEmbed) return { type: "youtube", embedUrl: youtubeEmbed };
  if (hostMatches(url.hostname, "tiktok.com")) return { type: "provider-link", provider: "TikTok" };
  if (hostMatches(url.hostname, "instagram.com")) return { type: "provider-link", provider: "Instagram" };

  const filename = url.pathname.split("/").pop() ?? "";
  const extension = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() ?? "" : "";
  if (VIDEO_EXTENSIONS.has(extension)) return { type: "native-video" };
  if (IMAGE_EXTENSIONS.has(extension)) return { type: "image" };

  // Unknown/watch-page URLs are links, not guessed media sources. This prevents
  // arbitrary HTML pages containing words such as "video" from reaching <video>.
  return { type: "provider-link", provider: "External media" };
}

function NativeVideo({ url, compact }: { url: string; compact: boolean }) {
  const [unavailable, setUnavailable] = useState(false);

  if (unavailable) {
    return (
      <div
        data-testid="community-native-video-unavailable"
        role="status"
        className={`flex flex-col items-center justify-center gap-2 rounded-xl bg-[#2B1507] px-4 text-center text-[#F5EBD8] ${compact ? "h-24 w-44" : "min-h-40 w-full"}`}
      >
        <AlertCircle className="h-5 w-5 text-[#CA922B]" aria-hidden="true" />
        <span className="text-xs font-semibold">Video unavailable</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#F5EBD8] underline underline-offset-2">
          Open video
        </a>
      </div>
    );
  }

  return (
    <video
      data-testid="community-native-video"
      src={url}
      controls
      playsInline
      preload="metadata"
      onError={() => setUnavailable(true)}
      aria-label="Community post video"
      className={compact ? "h-24 w-44 rounded-xl bg-black object-cover" : "max-h-72 w-full rounded-xl bg-black object-cover"}
    >
      Your browser cannot play this video. <a href={url}>Open the video instead.</a>
    </video>
  );
}

export function CommunityMedia({
  url,
  index,
  compact = false,
  onRemove,
}: {
  url: string;
  index: number;
  compact?: boolean;
  onRemove?: () => void;
}) {
  const media = classifyCommunityMedia(url);
  const safeUrl = safeHttpUrl(url)?.toString();
  const removeButton = onRemove ? (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove attachment ${index + 1}`}
      className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-700"
    >
      <X className="h-3 w-3" aria-hidden="true" />
    </button>
  ) : null;

  if (media.type === "provider-link") {
    return (
      <div className={`relative ${compact ? "w-auto" : "w-full"}`}>
        {safeUrl ? (
          <a
            data-testid={`community-media-provider-${index}`}
            data-provider={media.provider}
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${media.provider} attachment in a new tab`}
            className={`flex items-center gap-3 rounded-xl border border-[#CA922B]/25 bg-[#FAF6EF] text-[#3A1F0E] hover:border-[#CA922B]/60 ${compact ? "min-h-11 py-2 pl-3 pr-10" : "min-h-24 p-4"}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#CA922B]/12 text-[#CA922B]">
              <Link2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{media.provider}</span>
              {!compact && <span className="block truncate text-xs text-[#3A1F0E]/60">View this attachment on its provider</span>}
            </span>
            {!compact && <ExternalLink className="h-4 w-4 shrink-0 text-[#3A1F0E]/45" aria-hidden="true" />}
          </a>
        ) : (
          <div data-testid={`community-media-provider-${index}`} data-provider={media.provider} role="status" className={`flex items-center gap-3 rounded-xl border border-[#CA922B]/25 bg-[#FAF6EF] text-[#3A1F0E] ${compact ? "min-h-11 py-2 pl-3 pr-10" : "min-h-24 p-4"}`}>
            <AlertCircle className="h-4 w-4 shrink-0 text-[#CA922B]" aria-hidden="true" />
            <span className="text-sm font-bold">Attachment link unavailable</span>
          </div>
        )}
        {removeButton}
      </div>
    );
  }

  if (media.type === "youtube") {
    return (
      <div className={`relative overflow-hidden rounded-xl ${compact ? "h-24 w-44" : "aspect-video w-full"}`}>
        <iframe
          data-testid="community-youtube-embed"
          src={media.embedUrl}
          title={`YouTube attachment ${index + 1}`}
          className="h-full w-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
        {removeButton}
      </div>
    );
  }

  if (media.type === "native-video") {
    return (
      <div className="relative">
        <NativeVideo url={url} compact={compact} />
        {removeButton}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${compact ? "h-20 w-20" : "w-full"}`}>
      <img src={url} alt={`Community attachment ${index + 1}`} className={compact ? "h-full w-full object-cover" : "max-h-72 w-full object-cover"} />
      {removeButton}
    </div>
  );
}
