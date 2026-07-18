export default function DemoS49TrustScoreBizText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(202,146,43,0.12), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "8%", bottom: "8%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "1.5vw" }}>BUSINESS OWNER JOURNEY · TRUST SCORE FROM THE OWNER SIDE</div>
        <div className="font-display" style={{ fontSize: "4.6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1vw" }}>
          Marcus didn't create his 97.<br />His community did.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw", maxWidth: "58vw" }}>
          Every action a community member takes creates a signal. Those signals, aggregated and weighted, form the Trust Score. The dashboard shows Marcus which actions are actively moving his score — so he knows exactly where to focus his energy.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.6vw" }}>
          {[
            { icon: "★", label: "New 5-star review with chips", impact: "+High", color: "#CA922B", desc: "A review from a high-reputation member with three or more chips has the strongest single-action impact." },
            { icon: "◎", label: "Business saved to a Circle", impact: "+Medium", color: "#A6720F", desc: "When a member shares a business to their Kinfolk Circle, it signals trusted recommendation to multiple members at once." },
            { icon: "✓", label: "Owner responds to a review", impact: "+Medium", color: "#16A34A", desc: "Response rate and response quality are both tracked. Responding within 48 hours is the benchmark." },
            { icon: "♡", label: "Business saved as a favorite", impact: "+Low", color: "#2563EB", desc: "Saves accumulate. Thirty saves from distinct members becomes a meaningful Trust Score signal." },
            { icon: "✓", label: "Ownership verification complete", impact: "+Significant", color: "#7C3AED", desc: "Verified businesses score notably higher than unverified. It's a one-time action with long-term compounding value." },
            { icon: "⚑", label: "Safety incident report filed against business", impact: "–High", color: "#DC2626", desc: "Community-moderated. One unverified report has minimal impact. Multiple confirmed reports are significant." },
          ].map((item, i) => (
            <div key={i} className="rounded-[0.8vw] p-[1vw]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-[0.6vw] mb-[0.5vw]">
                <div style={{ width: "1.6vw", height: "1.6vw", borderRadius: "0.4vw", background: `${item.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "0.7vw", color: item.color }}>{item.icon}</span>
                </div>
                <span className="font-display" style={{ fontSize: "0.78vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.2 }}>{item.label}</span>
              </div>
              <div className="inline-block rounded-[0.35vw] px-[0.55vw] py-[0.12vw] mb-[0.45vw]" style={{ background: `${item.color}20`, border: `1px solid ${item.color}50` }}>
                <span className="font-body" style={{ fontSize: "0.5vw", fontWeight: 700, color: item.color }}>Impact: {item.impact}</span>
              </div>
              <div className="font-body" style={{ fontSize: "0.68vw", color: "#7B5408", lineHeight: 1.55 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-[1.5vw] rounded-[0.8vw] px-[1.5vw] py-[0.8vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.3)" }}>
          <span className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", fontWeight: 600 }}>
            We don't reveal how these inputs are weighted or combined — that's our proprietary model. But Marcus can see which actions are moving his score in real time, and what the community is saying when it does.
          </span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>49 / 58</div>
    </div>
  );
}
