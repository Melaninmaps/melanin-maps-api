export default function DemoS83ResourcesHubText() {
  const hubs = [
    {
      name: "Community Marketplace",
      color: "#CA922B",
      points: [
        "Buy, sell, or trade within the community. 6 categories: goods, services, housing, rideshare, tutoring, events. No external payment processor required — contact happens inside the platform.",
        "Listings include photos, price, condition, and location. Members filter by category and distance.",
      ],
    },
    {
      name: "Wellness Tracker",
      color: "#2D7A4F",
      points: [
        "Log daily wellness check-ins with mood and notes. Set personal goals with target dates and categories — physical, mental, spiritual, social. Streak tracking shows consistency over time.",
        "Private by default. Never shared, never sold. A quiet space to show up for yourself.",
      ],
    },
    {
      name: "Financial Hub",
      color: "#5A6FCA",
      points: [
        "Set financial goals (emergency fund, homeownership, debt freedom) with target amounts and dates. Track progress with check-ins. Access 10 curated resources: credit, investing, generational wealth.",
        "Built for communities historically excluded from mainstream financial literacy tooling.",
      ],
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(202,146,43,0.06), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", right: "7vw", top: "9%", bottom: "9%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "1.8vw" }}>COMMUNITY JOURNEY · RESOURCES HUB</div>
        <div className="font-display" style={{ fontSize: "4.5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1.2vw", textShadow: "0 0 40px rgba(202,146,43,0.15)" }}>
          Three tools for<br />community wealth.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2.8vw", opacity: 0.8 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vw" }}>
          {hubs.map((hub, idx) => (
            <div key={idx} className="rounded-[0.8vw] p-[1.4vw]" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${hub.color}33` }}>
              <div className="flex items-center gap-[0.6vw] mb-[1.2vw]">
                <div style={{ width: "0.4vw", height: "2.2vw", background: hub.color, borderRadius: "0.2vw" }} />
                <div className="font-display" style={{ color: hub.color, fontSize: "1.05vw", fontWeight: 800 }}>{hub.name}</div>
              </div>
              {hub.points.map((pt, pi) => (
                <div key={pi} className="flex gap-[0.65vw] mb-[0.9vw]">
                  <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: hub.color, opacity: 0.6, flexShrink: 0, marginTop: "0.35vw" }} />
                  <div className="font-body" style={{ color: "#7B5408", fontSize: "0.85vw", lineHeight: 1.6 }}>{pt}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>83 / 88</div>
    </div>
  );
}
