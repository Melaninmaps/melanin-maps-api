export default function DemoS14KinfolkText() {
  const capabilities = [
    { icon: "map-pin", head: "Local Discovery", body: "Finds minority-owned businesses, community events, and cultural sites tailored to each member's Taste Profile — categories, budget range, travel companion, lifestyle preferences." },
    { icon: "navigation", head: "Personalized Trip Planning", body: "Builds multi-city itineraries with culturally relevant stops and insider recommendations. Learns from thumbs-up and thumbs-down feedback on every suggested spot." },
    { icon: "shield", head: "Community Safety Intel", body: "Summarises neighborhood confidence scores and community alerts so diaspora members can move with genuine awareness — not false optimism, not fear." },
    { icon: "users", head: "Community + Cultural Connections", body: "Surfaces Kinfolk Circles, upcoming events, heritage sites nearby, and people aligned with the member's interests — without a social media algorithm deciding relevance." },
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

      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "8%", bottom: "8%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · KINFOLKAI™</div>
        <div className="font-display" style={{ fontSize: "4.6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0.8vw" }}>
          AI that speaks<br />your language.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "1.2vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", lineHeight: 1.7, marginBottom: "2.2vw", maxWidth: "62vw" }}>
          Not a generic chatbot rebranded. KinfolkAI&trade; is culture-aware from the ground up — it learns from your Taste Profile, remembers past sessions, takes feedback on every spot it suggests, and now speaks your response back through Kinfolk Voice.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.6vw 4vw", marginBottom: "2vw" }}>
          {capabilities.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: "1.2vw", alignItems: "flex-start" }}>
              <div style={{ width: "2.4vw", height: "2.4vw", borderRadius: "0.7vw", background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icons[c.icon]}
              </div>
              <div>
                <div className="font-display" style={{ color: "#FAF6EF", fontSize: "1.0vw", fontWeight: 700, marginBottom: "0.3vw" }}>{c.head}</div>
                <div className="font-body" style={{ color: "#7B5408", fontSize: "0.84vw", lineHeight: 1.6 }}>{c.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: "1px", background: "rgba(202,146,43,0.2)", marginBottom: "1.4vw" }} />

        <div style={{ display: "flex", gap: "4vw" }}>
          <div style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>
            <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: "0.15vw" }}><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
            <div>
              <div className="font-display" style={{ color: "#FAF6EF", fontSize: "0.95vw", fontWeight: 700, marginBottom: "0.2vw" }}>Kinfolk Voice</div>
              <div className="font-body" style={{ color: "#7B5408", fontSize: "0.8vw", lineHeight: 1.5 }}>"Listen" button on every AI message. Free: 10k chars/month. Navigator: 100k. Trailblazer: 300k. Voice meter shows usage in real time.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>
            <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: "0.15vw" }}><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
            <div>
              <div className="font-display" style={{ color: "#FAF6EF", fontSize: "0.95vw", fontWeight: 700, marginBottom: "0.2vw" }}>Taste Profile &amp; Session History</div>
              <div className="font-body" style={{ color: "#7B5408", fontSize: "0.8vw", lineHeight: 1.5 }}>Set category preferences, budget, travel style, and who you travel with. Every past conversation is saved and accessible — AI context carries forward.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>
            <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: "0.15vw" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div>
              <div className="font-display" style={{ color: "#FAF6EF", fontSize: "0.95vw", fontWeight: 700, marginBottom: "0.2vw" }}>Neighbor Voice</div>
              <div className="font-body" style={{ color: "#7B5408", fontSize: "0.8vw", lineHeight: 1.5 }}>Toggle to surface responses informed by the lived experience of people in your network — community insight layered into every answer.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
