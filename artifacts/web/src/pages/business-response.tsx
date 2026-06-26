import { useState, useEffect } from "react";
import { useRoute } from "wouter";

interface LinkData {
  status: "pending" | "responded" | "expired";
  businessName: string;
  reportCategory?: string;
  categoryLabel?: string;
  expiresAt?: string;
  respondedAt?: string;
  message?: string;
}

function getApiBase() {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "";
  }
  return "";
}

export default function BusinessResponse() {
  const [, params] = useRoute("/business-response/:token");
  const token = params?.token ?? "";

  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    responseStatement: "",
    correctiveActions: "",
    trustPlan: "",
    disputesFacts: false,
    disputeDetails: "",
  });

  useEffect(() => {
    if (!token) return;
    fetch(`${getApiBase()}/api/business-response/${token}`)
      .then((r) => r.json())
      .then((data: LinkData & { error?: string }) => {
        if (data.error) { setError(data.error); }
        else { setLinkData(data); }
      })
      .catch(() => setError("Unable to load this page. Please check your link and try again."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.responseStatement.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBase()}/api/business-response/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (res.ok) { setSubmitted(true); }
      else { setError(data.error ?? "Submission failed. Please try again."); }
    } catch {
      setError("Unable to submit. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const brandBrown = "#2B1507";
  const gold = "#CA922B";
  const lightBg = "#FAF6EF";
  const cardBg = "#FFFFFF";
  const mutedText = "#6B5744";
  const borderColor = "#E8DDD0";

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh", backgroundColor: lightBg,
    fontFamily: "'Inter', system-ui, sans-serif",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "0 16px 60px",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%", maxWidth: 600,
    backgroundColor: cardBg,
    borderRadius: 16,
    border: `1px solid ${borderColor}`,
    padding: "36px 32px",
    boxShadow: "0 4px 24px rgba(43,21,7,0.08)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", color: brandBrown, fontSize: 14,
    fontWeight: 600, marginBottom: 6,
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    borderRadius: 10, border: `1px solid ${borderColor}`,
    backgroundColor: lightBg, color: brandBrown,
    fontSize: 14, lineHeight: 1.6,
    resize: "vertical" as const, boxSizing: "border-box" as const,
    fontFamily: "inherit", outline: "none", minHeight: 100,
  };

  const btnStyle: React.CSSProperties = {
    width: "100%", padding: "14px 0",
    borderRadius: 12, border: "none",
    backgroundColor: brandBrown, color: "#FBF7F0",
    fontSize: 16, fontWeight: 700,
    cursor: submitting ? "not-allowed" : "pointer",
    opacity: submitting ? 0.7 : 1,
    fontFamily: "inherit",
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 600, padding: "28px 0 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: brandBrown, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 18 }}>🗺️</span>
        </div>
        <div>
          <p style={{ color: brandBrown, fontSize: 14, fontWeight: 800, margin: 0 }}>Mapping With Melanin™</p>
          <p style={{ color: mutedText, fontSize: 11, margin: 0 }}>Community Accountability Portal</p>
        </div>
      </div>

      {loading && (
        <div style={cardStyle}>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${gold}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: mutedText, fontSize: 14 }}>Loading your response form…</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div style={cardStyle}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <p style={{ color: brandBrown, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Link Unavailable</p>
            <p style={{ color: mutedText, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && linkData?.status === "responded" && !submitted && (
        <div style={cardStyle}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <p style={{ color: brandBrown, fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Response Already Submitted</p>
            <p style={{ color: mutedText, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              A response on behalf of <strong>{linkData.businessName}</strong> has already been received.
              Our moderation team will review it and it will appear alongside the community report.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && submitted && (
        <div style={cardStyle}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#2D7A4F20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px" }}>✅</div>
            <p style={{ color: brandBrown, fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>Response Submitted</p>
            <p style={{ color: mutedText, fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>
              Thank you for taking the time to respond. Our moderation team will review your submission.
              Once approved, your response will appear publicly alongside the community concern.
            </p>
            <div style={{ backgroundColor: gold + "15", border: `1px solid ${gold}30`, borderRadius: 12, padding: "16px 20px", textAlign: "left" }}>
              <p style={{ color: brandBrown, fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>What happens next</p>
              <ul style={{ color: mutedText, fontSize: 13, lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
                <li>Moderation reviews your response (typically within 48 hours)</li>
                <li>Your response is published alongside the community report</li>
                <li>The original reporter may update their concern if the issue is resolved</li>
                <li>Your response history remains part of the public record</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && linkData?.status === "pending" && !submitted && (
        <div style={{ width: "100%", maxWidth: 600, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Intro card */}
          <div style={cardStyle}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>⚖️</div>
              <div>
                <p style={{ color: brandBrown, fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
                  Community Concern Response
                </p>
                <p style={{ color: gold, fontSize: 13, fontWeight: 600, margin: 0 }}>
                  {linkData.businessName}
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: lightBg, borderRadius: 12, padding: "14px 16px", marginBottom: 16, border: `1px solid ${borderColor}` }}>
              <p style={{ color: mutedText, fontSize: 12, fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Concern Type</p>
              <p style={{ color: brandBrown, fontSize: 14, fontWeight: 600, margin: 0 }}>{linkData.categoryLabel}</p>
            </div>

            <p style={{ color: mutedText, fontSize: 14, lineHeight: 1.7, margin: "0 0 16px" }}>
              A community member has submitted a concern involving your business through Mapping With Melanin™. 
              This is not an accusation — it is an opportunity for your voice to be part of the record.
            </p>
            <p style={{ color: mutedText, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              You may submit a statement, describe any corrective actions, and explain how you plan to rebuild trust.
              Your response will be reviewed by our moderation team before being published alongside the community concern.
            </p>
          </div>

          {/* Form card */}
          <div style={cardStyle}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>
                  Your Response Statement <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <p style={{ color: mutedText, fontSize: 12, margin: "0 0 8px", lineHeight: 1.5 }}>
                  Describe your perspective on the concern. You may explain, provide context, or acknowledge the experience. This will be published.
                </p>
                <textarea
                  style={textareaStyle}
                  minLength={30}
                  maxLength={5000}
                  required
                  placeholder="Describe your perspective on this concern…"
                  value={form.responseStatement}
                  onChange={(e) => setForm({ ...form, responseStatement: e.target.value })}
                />
                <p style={{ color: mutedText, fontSize: 11, marginTop: 4, textAlign: "right" as const }}>
                  {form.responseStatement.length}/5000
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Corrective Actions Taken or Planned</label>
                <p style={{ color: mutedText, fontSize: 12, margin: "0 0 8px", lineHeight: 1.5 }}>
                  What specific steps have you taken, or are planning to take, in response to this concern?
                </p>
                <textarea
                  style={textareaStyle}
                  maxLength={3000}
                  placeholder="e.g. Staff retraining, policy updates, direct outreach to the customer…"
                  value={form.correctiveActions}
                  onChange={(e) => setForm({ ...form, correctiveActions: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>How Will You Earn Back Community Trust?</label>
                <p style={{ color: mutedText, fontSize: 12, margin: "0 0 8px", lineHeight: 1.5 }}>
                  What lasting changes will you make to ensure this community feels safe and respected at your business?
                </p>
                <textarea
                  style={{ ...textareaStyle, minHeight: 120 }}
                  maxLength={3000}
                  placeholder="Share your commitment to the community — what will be different going forward…"
                  value={form.trustPlan}
                  onChange={(e) => setForm({ ...form, trustPlan: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}
                  onClick={() => setForm({ ...form, disputesFacts: !form.disputesFacts, disputeDetails: form.disputesFacts ? "" : form.disputeDetails })}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                    border: `2px solid ${form.disputesFacts ? brandBrown : borderColor}`,
                    backgroundColor: form.disputesFacts ? brandBrown : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                  }}>
                    {form.disputesFacts && <span style={{ color: "#FBF7F0", fontSize: 11 }}>✓</span>}
                  </div>
                  <div>
                    <p style={{ color: brandBrown, fontSize: 14, fontWeight: 600, margin: 0 }}>
                      I wish to dispute specific factual inaccuracies in this report
                    </p>
                    <p style={{ color: mutedText, fontSize: 12, margin: "2px 0 0", lineHeight: 1.5 }}>
                      Only check this if you believe the report contains verifiably incorrect facts, not if you simply disagree with the experience.
                    </p>
                  </div>
                </div>

                {form.disputesFacts && (
                  <div style={{ marginTop: 14, paddingLeft: 28 }}>
                    <label style={{ ...labelStyle, marginBottom: 6 }}>Disputed Facts</label>
                    <textarea
                      style={textareaStyle}
                      maxLength={3000}
                      placeholder="Describe specifically what is factually inaccurate and provide any supporting context…"
                      value={form.disputeDetails}
                      onChange={(e) => setForm({ ...form, disputeDetails: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {error && (
                <div style={{ backgroundColor: "#DC262615", border: "1px solid #DC262630", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <p style={{ color: "#DC2626", fontSize: 13, margin: 0 }}>{error}</p>
                </div>
              )}

              <button type="submit" style={btnStyle} disabled={submitting || !form.responseStatement.trim()}>
                {submitting ? "Submitting…" : "Submit Response"}
              </button>
              <p style={{ color: mutedText, fontSize: 11, textAlign: "center" as const, marginTop: 10, lineHeight: 1.5 }}>
                By submitting, you agree your response will be reviewed by our moderation team and published alongside the community report.
              </p>
            </form>
          </div>

          {/* What happens next */}
          <div style={{ ...cardStyle, backgroundColor: brandBrown }}>
            <p style={{ color: gold, fontSize: 13, fontWeight: 700, margin: "0 0 12px" }}>What happens after you submit</p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
              {[
                ["📋", "Moderation review", "Our team reviews your response for community guidelines (typically 48 hours)."],
                ["📢", "Published with the report", "Your response appears publicly alongside the community concern — not hidden, not minimized."],
                ["🔄", "Reporter may update", "If the issue is resolved, the original reporter can update their concern status."],
                ["📊", "Transparent record", "The full history — concern, response, and any updates — remains visible to the community."],
              ].map(([icon, title, body]) => (
                <div key={title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <p style={{ color: "#FBF7F0", fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>{title}</p>
                    <p style={{ color: "#FBF7F0", fontSize: 12, margin: 0, opacity: 0.75, lineHeight: 1.5 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ color: mutedText, fontSize: 12, textAlign: "center" as const, lineHeight: 1.6, maxWidth: 480, alignSelf: "center" }}>
            This link expires on {linkData.expiresAt ? new Date(linkData.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}.
            Questions? Contact <a href="mailto:hello@mappingwithmelanin.com" style={{ color: gold }}>hello@mappingwithmelanin.com</a>
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
