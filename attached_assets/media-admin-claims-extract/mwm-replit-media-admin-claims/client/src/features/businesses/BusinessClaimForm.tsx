import { FormEvent, useState } from "react";
import { MediaUploader } from "../../components/media/MediaUploader";

export function BusinessClaimForm({ businessId }: { businessId: string }) {
  const [mediaAssetIds, setMediaAssetIds] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("sending"); const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch(`/api/businesses/${businessId}/claim`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, mediaAssetIds }) });
    setState(response.ok ? "sent" : "error");
  }
  if (state === "sent") return <section><h2>Claim received</h2><p>Your claim is awaiting verification. The listing stays visible while our team reviews the details.</p></section>;
  return <form onSubmit={submit}><h2>Own this business?</h2><p>Ask to claim this listing. Claims are reviewed before ownership tools are granted.</p><label>Your name<input name="claimantName" required /></label><label>Business email<input name="claimantEmail" required type="email" /></label><label>Your role<input name="claimantRole" placeholder="Owner, founder, authorized manager" required /></label><label>Phone (optional)<input name="claimantPhone" type="tel" /></label><label>How can we verify your connection?<textarea name="verificationMessage" placeholder="Share a public business contact, website, or other verification detail." /></label><MediaUploader label="Add verification documents or photos" maxFiles={6} onChange={setMediaAssetIds} value={mediaAssetIds} /><button disabled={state === "sending"} type="submit">{state === "sending" ? "Sending…" : "Request business claim"}</button>{state === "error" ? <p role="alert">We could not submit the claim. Please try again.</p> : null}</form>;
}
