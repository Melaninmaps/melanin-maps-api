import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, FileText, Film, AlertCircle, CheckCircle2 } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

interface UploadedFile {
  url: string;
  assetId: string;
  type: "image" | "video" | "document";
  name: string;
}

interface MediaUploaderProps {
  purpose?: string;
  maxFiles?: number;
  accept?: "images" | "images+video" | "images+docs";
  label?: string;
  onFilesChange?: (files: UploadedFile[]) => void;
}

const ACCEPT_MAP: Record<string, string> = {
  images: "image/jpeg,image/png,image/webp,image/heic,image/heif",
  "images+video":
    "image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm",
  "images+docs":
    "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf",
};

export function MediaUploader({
  purpose = "general",
  maxFiles = 6,
  accept = "images",
  label = "Upload photos",
  onFilesChange,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append("file", file);

    const resp = await authenticatedFetch(`${BASE}api/media/upload?purpose=${encodeURIComponent(purpose)}`, {
      method: "POST",
      body: formData,
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({})) as { error?: string };
      throw new Error(data.error ?? `Upload failed (${resp.status})`);
    }

    const data = await resp.json() as { url: string; assetId: string; type: "image" | "video" | "document" };
    return { ...data, name: file.name };
  };

  const handleFiles = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    const remaining = maxFiles - files.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxFiles} file${maxFiles !== 1 ? "s" : ""} allowed.`);
      return;
    }

    const toUpload = Array.from(selected).slice(0, remaining);
    setUploading(true);
    setError(null);

    const results: UploadedFile[] = [];
    for (const file of toUpload) {
      try {
        const uploaded = await uploadFile(file);
        results.push(uploaded);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setError(msg);
        break;
      }
    }

    const updated = [...files, ...results];
    setFiles(updated);
    onFilesChange?.(updated);
    setUploading(false);
  };

  const remove = (idx: number) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    onFilesChange?.(updated);
    setError(null);
  };

  const canAdd = files.length < maxFiles && !uploading;

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-2 transition-colors cursor-pointer ${
            dragOver
              ? "border-[#CA922B] bg-[#CA922B]/8"
              : "border-[#3A1F0E]/15 hover:border-[#CA922B]/50 hover:bg-[#FAF6EF]"
          }`}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-[#CA922B]" />
          )}
          <span className="text-sm font-medium text-[#3A1F0E]/70">
            {uploading
              ? "Uploading…"
              : label + (maxFiles > 1 ? ` (up to ${maxFiles - files.length} more)` : "")}
          </span>
          <span className="text-xs text-[#3A1F0E]/40">
            {accept === "images"
              ? "JPEG, PNG, WebP, HEIC"
              : accept === "images+video"
              ? "JPEG, PNG, WebP, MP4 · video ≤ 50 MB"
              : "JPEG, PNG, WebP, PDF"}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[accept] ?? ACCEPT_MAP.images}
        multiple={maxFiles > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded file thumbnails */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div
              key={f.assetId}
              className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[#3A1F0E]/10 bg-[#FAF6EF]"
            >
              {f.type === "image" ? (
                <img
                  src={f.url}
                  alt={f.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                  {f.type === "video" ? (
                    <Film className="w-6 h-6 text-[#CA922B]" />
                  ) : (
                    <FileText className="w-6 h-6 text-[#CA922B]" />
                  )}
                  <span className="text-[10px] text-[#3A1F0E]/50 text-center truncate w-full px-1">
                    {f.name}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-[#3A1F0E]" />
              </button>
              <div className="absolute bottom-1 right-1">
                <CheckCircle2 className="w-4 h-4 text-green-500 drop-shadow" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Returns just the URLs from the uploaded files — convenient for form submission
export function getMediaUrls(files: UploadedFile[]): string[] {
  return files.map((f) => f.url);
}
