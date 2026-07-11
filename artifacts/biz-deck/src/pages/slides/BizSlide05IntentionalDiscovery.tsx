export default function BizSlide05IntentionalDiscovery() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 20%, rgba(202,146,43,0.08), transparent 45%)" }} />

      {/* Left */}
      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "6%", bottom: "6%", maxWidth: "44vw" }}>
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "1vw" }}>HOW IT WORKS</div>

        <div className="font-body" style={{ fontSize: "1.6vw", color: "#7B5408", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "0.5vw" }}>
          WE DON'T SELL ATTENTION.
        </div>
        <div className="font-display" style={{ fontSize: "4vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.5vw" }}>
          We build<br />
          <span style={{ color: "#CA922B" }}>intentional introductions.</span>
        </div>

        <div className="font-body" style={{ fontSize: "1.1vw", color: "#5C3A1A", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          When someone finds your business on Mapping with Melanin™, they weren't served an ad. They came looking for a business exactly like yours — because someone in their community told them you were trustworthy.
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: "1vw", padding: "1.6vw", border: "1px solid rgba(58,31,14,0.1)", marginBottom: "1.8vw" }}>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "1vw" }}>THE DIFFERENCE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8vw 1.5vw" }}>
            <div>
              <div className="font-body" style={{ fontSize: "0.82vw", color: "#A87A40", fontWeight: 600, marginBottom: "0.3vw" }}>Advertising platforms</div>
              <div className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408", lineHeight: 1.5 }}>Pay to interrupt people who didn't ask</div>
            </div>
            <div>
              <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginBottom: "0.3vw" }}>Mapping with Melanin™</div>
              <div className="font-body" style={{ fontSize: "0.82vw", color: "#1C0E06", lineHeight: 1.5 }}>Get found by people who are already looking</div>
            </div>
            <div>
              <div className="font-body" style={{ fontSize: "0.82vw", color: "#A87A40", lineHeight: 1.5 }}>Ranked by budget, not quality</div>
            </div>
            <div>
              <div className="font-body" style={{ fontSize: "0.82vw", color: "#1C0E06", lineHeight: 1.5 }}>Ranked by community trust score</div>
            </div>
            <div>
              <div className="font-body" style={{ fontSize: "0.82vw", color: "#A87A40", lineHeight: 1.5 }}>Strangers see your ad</div>
            </div>
            <div>
              <div className="font-body" style={{ fontSize: "0.82vw", color: "#1C0E06", lineHeight: 1.5 }}>Your community finds you</div>
            </div>
          </div>
        </div>

        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#A6720F", fontStyle: "italic", lineHeight: 1.4 }}>
            Every search begins with purpose.<br />Every recommendation strengthens a community.
          </div>
        </div>
      </div>

      {/* Right — intent journey */}
      <div className="absolute right-[5vw] flex flex-col justify-center" style={{ top: "6%", bottom: "6%", width: "43vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "1.5vw" }}>A CUSTOMER'S JOURNEY TO YOUR DOOR</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {[
            { step: "01", title: "They have a need", body: "Looking for a trusted restaurant for a family dinner this weekend", color: "#1C0E06" },
            { step: "02", title: "They open the app", body: "Searching for soul food in their neighborhood on Mapping with Melanin™", color: "#3D2417" },
            { step: "03", title: "They find you", body: "Your verified profile appears with community reviews and a 4.9 trust score", color: "#CA922B" },
            { step: "04", title: "They trust you", body: "214 community members recommended you — that's more convincing than any ad", color: "#3D2417" },
            { step: "05", title: "They become regulars", body: "They save your business, write a review, and tell three friends", color: "#1C0E06" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "1.2vw", padding: "1.1vw 1.4vw", background: "#FFFFFF", borderBottom: i < 4 ? "1px solid rgba(58,31,14,0.06)" : "none", borderRadius: i === 0 ? "1vw 1vw 0 0" : i === 4 ? "0 0 1vw 1vw" : "0", border: "1px solid rgba(58,31,14,0.08)", marginBottom: i < 4 ? "-1px" : "0" }}>
              <div style={{ width: "2.4vw", height: "2.4vw", borderRadius: "50%", background: i === 2 ? "#CA922B" : "#F5EBD8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="font-display" style={{ fontSize: "0.78vw", color: i === 2 ? "#1C0E06" : "#7B5408", fontWeight: 800 }}>{item.step}</span>
              </div>
              <div>
                <div className="font-body" style={{ fontSize: "0.92vw", color: "#1C0E06", fontWeight: 700, marginBottom: "0.2vw" }}>{item.title}</div>
                <div className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408", lineHeight: 1.5 }}>{item.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
