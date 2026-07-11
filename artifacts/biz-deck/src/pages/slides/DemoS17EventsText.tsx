export default function DemoS17EventsText() {
  const points = [
    { head: "Curated by the diaspora, for the diaspora", body: "Events are submitted and verified by community organizers — not aggregated from Eventbrite or ticketing APIs that miss most minority-produced cultural programming." },
    { head: "Category, date, and vibe filters", body: "Jazz nights, poetry slams, natural hair expos, business mixers, Afrobeats parties, community town halls. Filter to exactly what fits the member's lifestyle and calendar." },
    { head: "Safety-rated venues", body: "Every event venue inherits the Trust Score and community safety context from the business or space it's hosted in. Members know the vibe before they RSVP." },
    { head: "KinfolkAI event planning integration", body: "Ask KinfolkAI to build a weekend itinerary and it will surface relevant events, pair them with melanated-owned dining and experiences, and add them to the member's calendar." },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#130A03" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(202,146,43,0.09), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />
      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "12%", bottom: "12%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>COMMUNITY JOURNEY · EVENTS TAB</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1.5vw" }}>
          Events the algorithm<br />never shows you.
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
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>17 / 36</div>
    </div>
  );
}
