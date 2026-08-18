import { useEffect, useState } from "react";

type Submission = { id: string; business_name: string; business_description: string; primary_category: string; specialties: string[]; community_tags: string[]; owner_name?: string; city?: string; state_region?: string; website_url?: string; instagram_handle?: string; source: string; created_at: string };

export function BusinessSubmissionReviewQueue() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); const response = await fetch("/api/founder/business-submissions?status=pending_review"); if (response.ok) setSubmissions((await response.json()).submissions); setLoading(false); }
  useEffect(() => { void load(); }, []);
  async function decide(id: string, decision: "approved" | "declined" | "needs_more_info") { await fetch(`/api/founder/business-submissions/${id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) }); await load(); }
  if (loading) return <p>Loading community submissions…</p>;
  return <section><h1>Community Business Submissions</h1><p>{submissions.length} waiting for your review. Pending items are not public.</p>{submissions.map((item) => <article key={item.id}><h2>{item.business_name}</h2><p>{item.primary_category} · {item.city}, {item.state_region}</p><p>{item.business_description}</p><p>Owner: {item.owner_name || "Not provided"}</p><p>Specialties: {item.specialties?.join(", ") || "None"}</p><p>Community tags: {item.community_tags?.join(", ") || "None"}</p><p>Submitted from: {item.source}</p><a href={item.website_url} rel="noreferrer" target="_blank">Visit website</a>{item.instagram_handle ? <p>{item.instagram_handle}</p> : null}<button onClick={() => decide(item.id, "approved")}>Approve and publish</button><button onClick={() => decide(item.id, "needs_more_info")}>Request more information</button><button onClick={() => decide(item.id, "declined")}>Decline</button></article>)}</section>;
}
