export default function DemoS81OpportunityText() {
  const points = [
    { head: "Jobs board with Near Me radius filter", body: "Post or browse open roles filtered by distance, pay range, job type, and remote availability. Haversine-distance sorting puts the closest opportunities first — not sponsored listings." },
    { head: "Mentorship profiles — find your guide", body: "Mentors set their specialty (finance, tech, creative, legal), preferred session type (video, in-person, async), and book via Calendly links embedded directly in their profile card." },
    { head: "Post a job in 3 steps", body: "Business owners and community organizers can list open roles with pay range, category, and remote/in-person flag — visible immediately to nearby members. No resume upload wall." },
    { head: "Register as a mentor in 3 steps", body: "Complete the mentor profile with specialties, background, and availability — and go live for the community within minutes. No application review delays." },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 75% 25%, rgba(202,146,43,0.07), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "12%", bottom: "12%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>COMMUNITY JOURNEY · OPPORTUNITY CENTER</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1.5vw", textShadow: "0 0 40px rgba(202,146,43,0.15)" }}>
          Work within<br />the community.
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
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>81 / 88</div>
    </div>
  );
}
