export default function DemoS14KinfolkText() {
  const capabilities = [
    { icon: "map-pin", head: "Local Discovery", body: "Finds minority-owned businesses, community events, and cultural spots tailored to each member's vibe and interest profile." },
    { icon: "shield", head: "Safety Intel", body: "Summarises community safety reports so diaspora members can travel and move with genuine confidence — not false optimism." },
    { icon: "navigation", head: "Trip Planning", body: "Builds personalised itineraries with culturally relevant stops and insider recommendations. Full multi-city trip, not just a Google Maps pin." },
    { icon: "users", head: "Community Connections", body: "Surfaces Kinfolk Circles, upcoming events, and people aligned with the member's interests and lifestyle — without a social media algorithm." },
  ];

  const icons: Record<string, React.ReactNode> = {
    "map-pin": <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    shield: <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    navigation: <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
    users: <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#130A03" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(202,146,43,0.1), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "10%", bottom: "10%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>COMMUNITY JOURNEY · KINFOLKAI™</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0.8vw" }}>
          AI that speaks<br />your language.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "1.5vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.7, marginBottom: "2.8vw", maxWidth: "60vw" }}>
          Not a generic chatbot rebranded. KinfolkAI is culture-aware from the ground up — trained with the context, tone, and community knowledge that generic AI skips. Free members get 10 queries/month. Navigator and Trailblazer members get unlimited access.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2vw 4vw" }}>
          {capabilities.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: "1.2vw", alignItems: "flex-start" }}>
              <div style={{ width: "2.4vw", height: "2.4vw", borderRadius: "0.7vw", background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icons[c.icon]}
              </div>
              <div>
                <div className="font-display" style={{ color: "#FAF6EF", fontSize: "1.05vw", fontWeight: 700, marginBottom: "0.35vw" }}>{c.head}</div>
                <div className="font-body" style={{ color: "#7B5408", fontSize: "0.88vw", lineHeight: 1.65 }}>{c.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>14 / 36</div>
    </div>
  );
}
