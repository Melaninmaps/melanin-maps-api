import { FormEvent, useState } from "react";
import { MediaUploader } from "../../components/media/MediaUploader";

export function DirectBusinessForm() {
  const [mediaAssetIds, setMediaAssetIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "published" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("saving"); const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/admin/businesses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, specialties: String(values.specialties ?? "").split(",").map((item) => item.trim()).filter(Boolean), communityTags: String(values.communityTags ?? "").split(",").map((item) => item.trim()).filter(Boolean), mediaAssetIds }) });
    setStatus(response.ok ? "published" : "error");
  }
  if (status === "published") return <section><h1>Business published.</h1><p>The listing is live now and remains available for the business owner to claim.</p></section>;
  return <form onSubmit={submit}><h1>Add a business directly</h1><p>Founder and admin entries publish immediately. Add accurate location details so local discovery can index the listing correctly.</p><label>Business name<input name="businessName" required /></label><label>What does this business do?<textarea name="businessDescription" required minLength={20} /></label><label>Category<input name="primaryCategory" required /></label><label>Specialties<input name="specialties" /></label><label>Community tags<input name="communityTags" /></label><label>Owner/founder name<input name="ownerName" /></label><label>Owner role<input name="ownerRole" /></label><label>City<input name="city" required /></label><label>State/region<input name="stateRegion" required /></label><label>Address<input name="addressLine1" /></label><label>Website<input name="websiteUrl" type="url" /></label><label>Instagram<input name="instagramHandle" /></label><MediaUploader label="Add business photos or video" maxFiles={12} onChange={setMediaAssetIds} value={mediaAssetIds} /><button disabled={status === "saving"} type="submit">{status === "saving" ? "Publishing…" : "Publish business now"}</button>{status === "error" ? <p role="alert">The listing did not publish. Check required fields and uploaded media, then try again.</p> : null}</form>;
}
