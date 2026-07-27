export default function DemoS30TrustScoreText() {
  const inputs = [
    { label: "Member Reviews", desc: "Volume, recency, reviewer reputation, and written depth — not just star average.", color: "#CA922B" },
    { label: "Community Feedback Chips", desc: "Which chips are selected across all reviews. 'Safe Space' and 'Welcoming Vibe' carry cultural weight.", color: "#A6720F" },
    { label: "Safety Reports", desc: "Absence of safety incident reports filed against the space by community members.", color: "#16A34A" },
    { label: "Verification Status", desc: "Whether the business has completed ownership verification. Unverified listings score lower.", color: "#2563EB" },
    { label: "Owner Engagement", desc: "Response rate to reviews and response quality. A responsive owner signals investment in community.", color: "#7C3AED" },
    { label: "Community Saves & Shares", desc: "How many members saved, shared, or added this business to their Kinfolk Circles.", color: "#DC2626" },
    { label: "Check-In & Visit Activity", desc: "Real visit confirmations from members — not fake clicks or impressions.", color: "#0891B2" },
    { label: "Business Tenure & Consistency", desc: "How long the business has been listed and whether its score has been consistently high.", color: "#CA922B" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(202,146,43,0.12), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />

      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "8%", bottom: "8%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · TRUST SCORE</div>

        <div className="flex items-baseline gap-[1.2vw] mb-[0.8vw]">
          <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0 }}>What Builds the</div>
          <div className="rounded-[0.6vw] px-[1.2vw] py-[0.3vw]" style={{ background: "#CA922B" }}>
            <span className="font-display" style={{ fontSize: "4vw", fontWeight: 800, color: "#FFF", lineHeight: 1.1 }}>Trust Score.</span>
          </div>
        </div>

        <div className="font-body mb-[2.5vw]" style={{ fontSize: "1.05vw", color: "#7B5408", lineHeight: 1.65, maxWidth: "55vw" }}>
          We don't reveal the formula — that's a trade secret. What we can tell you: the Trust Score is a composite of eight community-sourced signals. Paying for a listing doesn't improve it. Only being genuinely good for the community does.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.2vw" }}>
          {inputs.map((inp, i) => (
            <div key={i} className="rounded-[0.8vw] p-[1vw]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-[0.5vw] mb-[0.5vw]">
                <div style={{ width: "0.65vw", height: "0.65vw", borderRadius: "50%", background: inp.color, flexShrink: 0 }} />
                <span className="font-display" style={{ fontSize: "0.75vw", fontWeight: 700, color: "#FAF6EF" }}>{inp.label}</span>
              </div>
              <div className="font-body" style={{ fontSize: "0.7vw", color: "#7B5408", lineHeight: 1.55 }}>{inp.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-[1.8vw] rounded-[0.8vw] px-[1.5vw] py-[0.9vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.3)" }}>
          <span className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", fontWeight: 600 }}>
            The more a business serves the community, the more the community serves back. The Trust Score makes that loop visible.
          </span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>30 / 58</div>
    </div>
  );
}
