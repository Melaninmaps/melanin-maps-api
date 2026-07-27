export default function BizSlide07BusinessEcosystem() {
  const TOOLS = [
    { label: "Business Profile", desc: "Photos, hours, contact, bio, category tags — your full presence on the platform", tier: "free" },
    { label: "Community Reviews", desc: "Verified reviews from real community members with owner response tools", tier: "free" },
    { label: "Trust Score", desc: "Composite score built from reviews, saves, and community recommendations", tier: "free" },
    { label: "Verified Badge", desc: "Platform-verified status signals legitimacy to every customer who finds you", tier: "free" },
    { label: "Performance Analytics", desc: "Views, saves, search ranking, and weekly performance trends", tier: "standard" },
    { label: "Customer Insights", desc: "Neighborhood breakdowns, review sentiment, and demand signals", tier: "standard" },
    { label: "Events &amp; Calendar", desc: "Create and promote events that appear in community feeds and city calendars", tier: "standard" },
    { label: "KinfolkAI™", desc: "AI-assisted marketing, review responses, and community trend alerts", tier: "standard" },
    { label: "Featured Promotions", desc: "Placement at the top of search results, category pages, and explore feeds", tier: "premium" },
    { label: "Priority Placement", desc: "First position in relevant neighborhood and category searches", tier: "premium" },
    { label: "Community Spotlight", desc: "Featured business story distributed to the community feed citywide", tier: "premium" },
    { label: "Founding Status", desc: "Permanent recognition as a platform founder with exclusive benefits", tier: "founding" },
  ];

  const tierColor: Record<string, string> = { free: "#5A9A6F", standard: "#CA922B", premium: "#3D2417", founding: "#1C0E06" };
  const tierLabel: Record<string, string> = { free: "FREE", standard: "STANDARD", premium: "PREMIUM", founding: "FOUNDING" };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, rgba(202,146,43,0.1), transparent 60%)" }} />

      {/* Header */}
      <div className="absolute left-[6vw] top-[3vw]">
        <div className="font-body" style={{ fontSize: "1.2vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.5vw" }}>EVERYTHING INCLUDED</div>
        <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.08 }}>
          The full business ecosystem.
        </div>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#A87A40", marginTop: "0.5vw" }}>
          12 tools built specifically for minority-owned businesses.
        </div>
      </div>

      {/* Tier legend */}
      <div className="absolute flex gap-[1.5vw]" style={{ right: "6vw", top: "3.5vw" }}>
        {[
          { label: "FREE", color: "#5A9A6F" },
          { label: "STANDARD", color: "#CA922B" },
          { label: "PREMIUM", color: "#D9C4A3" },
          { label: "FOUNDING", color: "#FAF6EF" },
        ].map((t) => (
          <div key={t.label} style={{ display: "flex", alignItems: "center", gap: "0.4vw" }}>
            <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "50%", background: t.color }} />
            <span className="font-body" style={{ fontSize: "0.72vw", color: t.color, fontWeight: 700, letterSpacing: "0.08em" }}>{t.label}</span>
          </div>
        ))}
      </div>

      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "12.5vw", height: "1px", background: "rgba(202,146,43,0.2)" }} />

      {/* Tool grid */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "14vw", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.9vw" }}>
        {TOOLS.map((tool) => (
          <div key={tool.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(202,146,43,0.12)", borderRadius: "0.7vw", padding: "1.1vw", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2.5px", background: tierColor[tool.tier] }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5vw", marginBottom: "0.5vw" }}>
              <div style={{ background: tierColor[tool.tier], borderRadius: "2vw", padding: "0.15vw 0.55vw", flexShrink: 0 }}>
                <span className="font-body" style={{ fontSize: "0.55vw", color: tool.tier === "free" || tool.tier === "standard" ? "#1C0E06" : "#FAF6EF", fontWeight: 800 }}>{tierLabel[tool.tier]}</span>
              </div>
            </div>
            <div className="font-display" style={{ fontSize: "0.95vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.2, marginBottom: "0.35vw" }} dangerouslySetInnerHTML={{ __html: tool.label }} />
            <div className="font-body" style={{ fontSize: "0.75vw", color: "#A87A40", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: tool.desc }} />
          </div>
        ))}
      </div>
    </div>
  );
}
