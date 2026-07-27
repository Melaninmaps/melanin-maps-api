export default function DemoS50BizGrowthText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(202,146,43,0.09), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />
      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "10%", bottom: "10%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>BUSINESS OWNER JOURNEY · GROWTH TOOLS</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0.8vw" }}>
          Beyond listed.<br />Grow with purpose.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#A87A40", lineHeight: 1.75, marginBottom: "3vw", maxWidth: "62vw" }}>
          Paying for visibility on most platforms means paying to appear above your peers regardless of quality. On Mapping With Melanin, promotions are additive — they increase your reach while your Trust Score still determines your perceived standing. Community trust is not for sale. Visibility is.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.2vw 4vw" }}>
          {[
            { head: "5 promotion placement types", body: "Search feature spot, category front page, map pin highlight, KinfolkAI recommendation injection, and community feed sponsored post. Each targets a different moment in the member's journey." },
            { head: "Promotion does not affect the Trust Score", body: "Paid placement is labeled 'Promoted.' It increases visibility, but the Trust Score beside the listing is always real and unaffected by spend. Community integrity is protected." },
            { head: "Dynamic Stripe checkout — no pre-set price IDs", body: "Marcus sets his own budget, selects placement type and duration, and checks out in four taps. No sales call, no annual contract required. Start with $49." },
            { head: "Integrated with analytics", body: "Promotion performance appears in the same dashboard as organic metrics. Marcus can see exactly how much additional traffic his spend generated — and whether it converted to saves and reviews." },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
              <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vw" }}>
                <span className="font-body" style={{ color: "#CA922B", fontSize: "0.65vw", fontWeight: 800 }}>{i + 1}</span>
              </div>
              <div>
                <div className="font-display" style={{ color: "#FAF6EF", fontSize: "1.05vw", fontWeight: 700, marginBottom: "0.35vw" }}>{p.head}</div>
                <div className="font-body" style={{ color: "#7B5408", fontSize: "0.9vw", lineHeight: 1.65 }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>50 / 58</div>
    </div>
  );
}
