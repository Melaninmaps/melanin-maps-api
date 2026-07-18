export default function DemoS73LifeJourneyText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#0D0805" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 50%, rgba(202,146,43,0.14) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "12%", bottom: "12%", maxWidth: "54vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "2vw" }}>LIFE JOURNEYS</div>
        <div className="font-display" style={{ fontSize: "5.6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "2vw" }}>
          Your big moves,<br /><span style={{ color: "#CA922B" }}>mapped.</span>
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2.5vw", opacity: 0.8 }} />
        <div style={{ fontSize: "1.15vw", color: "#C4A06A", lineHeight: 1.75, marginBottom: "2.5vw", maxWidth: "46vw" }}>
          Whether you're relocating to a new city, starting a business, going through a health journey, or rebuilding after a loss — Life Journeys connect your personal milestones to community resources and minority-owned businesses that have walked the same road.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2vw 3vw", maxWidth: "46vw" }}>
          {[
            ["Relocating", "Zara is moving to DC — her journey connects movers, neighborhoods, and early community."],
            ["Starting a Business", "Find vendors, legal support, and banking through community-vetted businesses."],
            ["Health & Wellness", "Navigate culturally competent providers, wellness spaces, and support networks."],
            ["Major Life Events", "New parent, graduate, caregiver — any milestone can become a mapped journey."],
          ].map(([h, b], i) => (
            <div key={i}>
              <div style={{ color: "#CA922B", fontSize: "0.78vw", fontWeight: 800, marginBottom: "0.25vw" }}>{h}</div>
              <div style={{ color: "#8C6A3A", fontSize: "0.7vw", lineHeight: 1.5 }}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "2.5vw", paddingLeft: "1.2vw", borderLeft: "0.18vw solid #CA922B" }}>
          <div style={{ color: "#CA922B", fontSize: "1.0vw", fontStyle: "italic", fontWeight: 600 }}>
            KinfolkAI injects your active journey into every conversation — so advice is always in context.
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.3 }}>73</div>
    </div>
  );
}
