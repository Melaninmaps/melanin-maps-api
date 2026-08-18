import { ChangeEvent, useRef, useState } from "react";

type Props = { value: string[]; onChange(assetIds: string[]): void; maxFiles?: number; label?: string };
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime";

export function MediaUploader({ value, onChange, maxFiles = 5, label = "Add photos or video" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, maxFiles - value.length));
    if (!files.length) return;
    setState("uploading"); setMessage(`Uploading ${files.length} file${files.length === 1 ? "" : "s"}…`);
    try {
      const assetIds: string[] = [];
      for (const file of files) {
        const sign = await fetch("/api/media/uploads/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, mimeType: file.type, byteSize: file.size }) });
        const signed = await sign.json(); if (!sign.ok) throw new Error(signed.message ?? "UPLOAD_SIGN_FAILED");
        const put = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type, ...signed.headers }, body: file });
        if (!put.ok) throw new Error("UPLOAD_TRANSFER_FAILED");
        const complete = await fetch(`/api/media/uploads/${signed.assetId}/complete`, { method: "POST" }); if (!complete.ok) throw new Error("UPLOAD_COMPLETE_FAILED");
        assetIds.push(signed.assetId);
      }
      onChange([...value, ...assetIds]); setState("idle"); setMessage(`${assetIds.length} file${assetIds.length === 1 ? "" : "s"} added.`);
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Upload failed. Please try again."); }
    finally { if (inputRef.current) inputRef.current.value = ""; }
  }

  return <section className="media-uploader"><input accept={ACCEPT} aria-label={label} hidden multiple onChange={choose} ref={inputRef} type="file" /><button disabled={state === "uploading" || value.length >= maxFiles} onClick={() => inputRef.current?.click()} type="button">{state === "uploading" ? "Uploading…" : label}</button><span>{value.length}/{maxFiles}</span>{message ? <p aria-live="polite" role={state === "error" ? "alert" : undefined}>{message}</p> : null}</section>;
}
