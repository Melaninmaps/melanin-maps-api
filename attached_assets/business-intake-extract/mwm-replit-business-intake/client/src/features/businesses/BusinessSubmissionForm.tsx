import { FormEvent, useMemo, useState } from "react";

const CATEGORIES = ["Food & Drink", "Beauty & Personal Care", "Health & Wellness", "Professional Services", "Retail & Shopping", "Arts & Culture", "Faith & Community", "Home & Trades"];
const COMMUNITY_TAGS = ["Black-owned", "Women-owned", "Diaspora-owned", "Family-friendly", "Accessibility-minded", "Natural hair", "Hair loss support", "Community staple", "HBCU-connected", "LGBTQIA+ welcoming", "Veteran-owned", "Youth-friendly"];

export function BusinessSubmissionForm() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("submitting");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/community/business-submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      ...body, specialties: String(body.specialties ?? "").split(",").map((item) => item.trim()).filter(Boolean), communityTags: selectedTags,
      source: params.get("source") ?? "website", sourceCampaign: params.get("campaign") ?? undefined,
    }) });
    setStatus(response.ok ? "submitted" : "error");
  }

  if (status === "submitted") return <section><h1>Thank you for putting your people on.</h1><p>Your business suggestion is now in the founder review queue. It will appear publicly only after review.</p></section>;
  return <form onSubmit={submit}>
    <h1>Share a business with the community</h1><p>Tell us what they do, who is behind the business, and what community members should know. Every submission is reviewed before publication.</p>
    <label>Business name<input name="businessName" required maxLength={160} /></label>
    <label>What does this business do?<textarea name="businessDescription" required minLength={20} maxLength={3000} /></label>
    <label>Primary category<select name="primaryCategory" required><option value="">Choose a category</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
    <label>Specialties (optional)<input name="specialties" placeholder="e.g., Barbers, hair loss support, tax preparation" /></label>
    <fieldset><legend>What should the community know? Choose up to 8.</legend>{COMMUNITY_TAGS.map((tag) => <label key={tag}><input checked={selectedTags.includes(tag)} onChange={() => setSelectedTags((previous) => previous.includes(tag) ? previous.filter((value) => value !== tag) : previous.length < 8 ? [...previous, tag] : previous)} type="checkbox" />{tag}</label>)}</fieldset>
    <h2>Owner or founder (optional)</h2><label>Name<input name="ownerName" maxLength={160} /></label><label>Role<input name="ownerRole" placeholder="Owner, founder, manager" /></label><label>Anything they would like represented?<input name="ownerIdentityText" placeholder="Only if they choose to share" /></label>
    <h2>Where and how to find them</h2><label>City<input name="city" required /></label><label>State or region<input name="stateRegion" required /></label><label>Address (optional)<input name="addressLine1" /></label><label>Website<input name="websiteUrl" type="url" /></label><label>Instagram<input name="instagramHandle" placeholder="@business" /></label><label>Phone<input name="phone" type="tel" /></label><label>Business email<input name="email" type="email" /></label>
    <h2>Your contact (optional)</h2><label>Your name<input name="submitterName" /></label><label>Your email<input name="submitterEmail" type="email" /></label>
    <button disabled={status === "submitting"} type="submit">{status === "submitting" ? "Sending…" : "Submit for founder review"}</button>{status === "error" ? <p role="alert">We could not submit this yet. Please check the required fields and try again.</p> : null}
  </form>;
}
