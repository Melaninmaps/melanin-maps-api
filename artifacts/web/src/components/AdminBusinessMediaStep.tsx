/**
 * AdminBusinessMediaStep — post-save media upload step for the Admin Add Business form.
 *
 * Displayed AFTER a business is created so we have the business ID to attach media to.
 * Allows:
 *   - Multi-photo upload (from file library or direct camera capture on mobile)
 *   - Social media link paste (YouTube, TikTok, Instagram, Facebook, Pinterest, Vimeo)
 *
 * Built for the tour workflow: admin opens on phone, creates business, uploads a few
 * photos on the spot, pastes a social link — all without needing Replit or the DB.
 */
import { useState, useRef } from "react";
import {
  Camera, Image, Link2, CheckCircle, X, Loader2, Trash2, ExternalLink, AlertTriangle, Upload
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function detectPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("facebook") || host.includes("fb.watch")) return "Facebook";
    if (host.includes("pinterest")) return "Pinterest";
    if (host.includes("vimeo")) return "Vimeo";
    return "Social";
  } catch {
    return "Link";
  }
}

interface Props {
  businessId: string;
  businessName: string;
  onDone: () => void;
  /** Set false when embedding inside edit modal (success banner already shown by parent) */
  showSuccessBanner?: boolean;
}

export function AdminBusinessMediaStep({ businessId, businessName, onDone, showSuccessBanner = true }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  const [socialUrl, setSocialUrl] = useState("");
  const [addingLink, setAddingLink] = useState(false);
  const [socialLinks, setSocialLinks] = useState<string[]>([]);
  const [socialError, setSocialError] = useState("");

  async function handlePhotoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError("");
    setUploading(true);

    const form = new FormData();
    Array.from(files).forEach(f => form.append("photos", f));

    try {
      const res = await fetch(`${BASE}/api/admin/businesses/${businessId}/photos/upload`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json() as { uploaded?: string[]; photos?: string[]; error?: string };
      if (!res.ok) { setUploadError(data.error ?? "Upload failed."); return; }
      setPhotos(data.photos ?? []);
    } catch {
      setUploadError("Network error — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(url: string) {
    setDeletingUrl(url);
    try {
      const res = await fetch(`${BASE}/api/admin/businesses/${businessId}/photos/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url }),
      });
      const data = await res.json() as { photos?: string[] };
      if (res.ok) setPhotos(data.photos ?? []);
    } finally {
      setDeletingUrl(null);
    }
  }

  async function addSocialLink() {
    setSocialError("");
    if (!socialUrl.trim()) return;
    setAddingLink(true);
    try {
      const res = await fetch(`${BASE}/api/admin/businesses/${businessId}/social-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: socialUrl.trim() }),
      });
      const data = await res.json() as { videos?: string[]; error?: string };
      if (!res.ok) { setSocialError(data.error ?? "Could not add link."); return; }
      setSocialLinks(data.videos ?? []);
      setSocialUrl("");
    } finally {
      setAddingLink(false);
    }
  }

  const inputCls = "w-full border border-[#2B1507]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B] bg-white";

  return (
    <div className="space-y-8">
      {/* Success header — only shown when used as standalone post-save step */}
      {showSuccessBanner && <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-green-800">"{businessName}" saved</p>
          <p className="text-xs text-green-700 mt-0.5">
            Add photos and social links now, or skip and come back later from the Businesses tab.
          </p>
        </div>
      </div>}

      {/* ── Photos ────────────────────────────────────────────────────────── */}
      <div>
        <h3 className="font-serif font-bold text-[#3A1F0E] text-base mb-1">Photos</h3>
        <p className="text-xs text-[#3A1F0E]/50 mb-4">
          Up to 20 photos. First photo becomes the cover image. Select multiple files at once or take a photo with your camera.
        </p>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={e => void handlePhotoFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => void handlePhotoFiles(e.target.files)}
        />

        {/* Upload buttons */}
        <div className="flex gap-3 flex-wrap mb-4">
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-[#2B1507] text-[#F5EBD8] rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-[#3A1F0E] disabled:opacity-50 transition-colors"
          >
            <Camera className="w-4 h-4" /> Take Photo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 border border-[#2B1507]/20 text-[#3A1F0E] rounded-xl px-4 py-2.5 text-sm font-bold hover:border-[#CA922B]/50 disabled:opacity-50 transition-colors"
          >
            <Image className="w-4 h-4" /> Choose from Library
          </button>
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-[#CA922B]">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
            </div>
          )}
        </div>

        {uploadError && (
          <div className="mb-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {uploadError}
          </div>
        )}

        {/* Photo thumbnails */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((url, i) => (
              <div key={url} className="relative group aspect-square rounded-xl overflow-hidden bg-[#FAF6EF]">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute top-1 left-1 bg-[#CA922B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                    Cover
                  </div>
                )}
                <button
                  onClick={() => void deletePhoto(url)}
                  disabled={deletingUrl === url}
                  className="absolute top-1 right-1 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  {deletingUrl === url
                    ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
            ))}
            {/* Add more slot */}
            {photos.length < 20 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-[#2B1507]/15 flex flex-col items-center justify-center gap-1 hover:border-[#CA922B]/50 transition-colors text-[#3A1F0E]/40 hover:text-[#CA922B]"
              >
                <Upload className="w-5 h-5" />
                <span className="text-[10px] font-bold">Add More</span>
              </button>
            )}
          </div>
        )}

        {photos.length === 0 && !uploading && (
          <div className="border-2 border-dashed border-[#2B1507]/10 rounded-2xl py-10 text-center text-[#3A1F0E]/30 text-sm">
            No photos yet — use the buttons above to add some
          </div>
        )}
      </div>

      {/* ── Social Media Links ──────────────────────────────────────────── */}
      <div>
        <h3 className="font-serif font-bold text-[#3A1F0E] text-base mb-0.5">
          Already posted it somewhere else?
        </h3>
        <p className="text-sm text-[#3A1F0E]/70 mb-1">Paste the link here. No need to upload it again.</p>
        <p className="text-xs text-[#3A1F0E]/40 mb-4">
          Supports YouTube, TikTok, Instagram, Facebook, Pinterest, and Vimeo.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A1F0E]/30" />
            <input
              type="url"
              className={`${inputCls} pl-9`}
              value={socialUrl}
              onChange={e => { setSocialUrl(e.target.value); setSocialError(""); }}
              onKeyDown={e => e.key === "Enter" && void addSocialLink()}
              placeholder="https://www.instagram.com/reel/… or YouTube, TikTok…"
            />
          </div>
          <button
            onClick={() => void addSocialLink()}
            disabled={addingLink || !socialUrl.trim()}
            className="flex items-center gap-1.5 bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-50 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors shrink-0"
          >
            {addingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
          </button>
        </div>
        <p className="text-[11px] text-[#3A1F0E]/40 mt-1.5 ml-1">
          Tip on mobile: open the post → Share → Copy link → come back here and paste.
        </p>

        {socialError && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {socialError}
          </div>
        )}

        {socialLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {socialLinks.map(link => (
              <div key={link} className="flex items-center gap-3 bg-[#FAF6EF] border border-[#2B1507]/8 rounded-xl px-3 py-2.5">
                <span className="text-xs font-bold text-[#CA922B] bg-[#CA922B]/10 rounded-full px-2 py-0.5 shrink-0">
                  {detectPlatform(link)}
                </span>
                <span className="text-xs text-[#3A1F0E]/60 truncate flex-1">{link}</span>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[#CA922B] hover:text-[#B38024]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Done button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onDone}
          className="bg-[#2B1507] text-[#F5EBD8] rounded-full px-8 py-2.5 text-sm font-bold hover:bg-[#3A1F0E] transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
