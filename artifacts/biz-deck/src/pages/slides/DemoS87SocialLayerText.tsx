export default function DemoS87SocialLayerText() {
  const points = [
    { head: "Link previews — rich cards, not raw URLs", body: "When a member pastes a URL into a post, the platform fetches the title, description, domain, and favicon automatically. Posts render a clean, branded link card — not a bare link nobody clicks." },
    { head: "Reposts with context", body: "Members can repost any community post to their feed, with an optional personal caption added above the original. The original author's attribution is always preserved in the repost card." },
    { head: "Post visibility — Public, Followers, or Private", body: "Every post carries a visibility selector: Public (index-visible), Followers Only (following feed only), or Private (saved to profile only). Authors control their reach at composition time." },
    { head: "Status Composer and Saved Spots sharing", body: "Quick status posts with text and emoji-free icons. Members can share curated saved place lists with the community — with a health-keyword double-confirm before any private save goes public." },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 70%, rgba(202,146,43,0.08), transparent 58%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "12%", bottom: "12%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>COMMUNITY JOURNEY · SOCIAL LAYER</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1.5vw", textShadow: "0 0 40px rgba(202,146,43,0.15)" }}>
          Share with<br />intention.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "3vw", opacity: 0.8 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.2vw 4vw" }}>
          {points.map((p, i) => (
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
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>87 / 88</div>
    </div>
  );
}
