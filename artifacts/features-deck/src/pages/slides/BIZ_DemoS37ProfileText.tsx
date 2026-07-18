export default function DemoS37ProfileText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#130A03" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 85% 50%, rgba(202,146,43,0.09), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />
      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "10%", bottom: "10%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>COMMUNITY JOURNEY · PROFILE TAB</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0.8vw" }}>
          Zara taps Profile.<br />She sees herself.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#A87A40", lineHeight: 1.75, marginBottom: "3vw", maxWidth: "62vw" }}>
          The Profile tab is not just account management. It's the member's identity in the community — their saved places, their membership tier, their Kinfolk Circles, their contribution history. Everything they've built here is reflected back to them.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.8vw 3vw" }}>
          {[
            { head: "My Profile", body: "Name, avatar, bio, home city, and public visibility. Members choose how much to share with the broader community." },
            { head: "Saved Places", body: "Every business and spot they've saved, organized into custom collections and synced with Kinfolk Circles." },
            { head: "My Reviews", body: "Every review they've written, the points they've earned from them, and any owner responses they've received." },
            { head: "Kinfolk Circles", body: "All their circles — the ones they created and the ones they've joined. One tap to open any circle's shared planning board." },
            { head: "Life Journey", body: "A timeline of major moves and transitions — helps KinfolkAI understand long-term context and surface relevant community resources." },
            { head: "Membership & Settings", body: "Current tier, billing, notification preferences, privacy controls, Family Mode, and account management — all in one place." },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "0.75vw", alignItems: "flex-start" }}>
              <div style={{ width: "1.6vw", height: "1.6vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vw" }}>
                <span className="font-body" style={{ color: "#CA922B", fontSize: "0.6vw", fontWeight: 800 }}>{i + 1}</span>
              </div>
              <div>
                <div className="font-display" style={{ color: "#FAF6EF", fontSize: "1vw", fontWeight: 700, marginBottom: "0.3vw" }}>{p.head}</div>
                <div className="font-body" style={{ color: "#7B5408", fontSize: "0.85vw", lineHeight: 1.6 }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>37 / 58</div>
    </div>
  );
}
