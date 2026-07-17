export default function FD01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(202,146,43,0.18) 0%, transparent 65%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 10% 90%, rgba(202,146,43,0.09) 0%, transparent 50%)" }} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.4),transparent)" }} />

      <div className="absolute" style={{ left: "7vw", top: "8vw", right: "7vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "3vw" }}>
          MAPPING WITH MELANIN&trade; &mdash; PLATFORM OVERVIEW
        </div>

        <div className="font-display" style={{ fontSize: "8.5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 0.95, marginBottom: "1.5vw" }}>
          Every feature.
        </div>
        <div className="font-display" style={{ fontSize: "8.5vw", fontWeight: 800, color: "#CA922B", lineHeight: 0.95, marginBottom: "4vw" }}>
          One platform.
        </div>

        <div style={{ width: "6vw", height: "3px", background: "#CA922B", marginBottom: "3vw", opacity: 0.8 }} />

        <div className="font-body" style={{ fontSize: "1.4vw", color: "#A87A40", lineHeight: 1.7, maxWidth: "44vw", fontWeight: 300 }}>
          Discovery. Community Intelligence. KinfolkAI&trade;. Heritage. Events. Opportunity. Business Growth. Everything the melanated diaspora needs to live, move, and thrive with intention.
        </div>
      </div>

      <div className="absolute" style={{ right: "7vw", top: "50%", transform: "translateY(-50%)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.6vw" }}>
          <div style={{ padding: "1.2vw 1.8vw", border: "1px solid rgba(202,146,43,0.25)", background: "rgba(202,146,43,0.05)" }}>
            <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.3vw" }}>Intentional Discovery&trade;</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", fontWeight: 400 }}>Search · Trust Score · Verified Listings</div>
          </div>
          <div style={{ padding: "1.2vw 1.8vw", border: "1px solid rgba(202,146,43,0.25)", background: "rgba(202,146,43,0.05)" }}>
            <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.3vw" }}>Community Intelligence</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", fontWeight: 400 }}>Confidence Layer · Move Alerts · Safe Spaces</div>
          </div>
          <div style={{ padding: "1.2vw 1.8vw", border: "1px solid rgba(202,146,43,0.25)", background: "rgba(202,146,43,0.05)" }}>
            <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.3vw" }}>KinfolkAI&trade;</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", fontWeight: 400 }}>Personalized · Multi-turn · Context-aware</div>
          </div>
          <div style={{ padding: "1.2vw 1.8vw", border: "1px solid rgba(202,146,43,0.25)", background: "rgba(202,146,43,0.05)" }}>
            <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.3vw" }}>Events &amp; Kinfolk Circles</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", fontWeight: 400 }}>Community · Group Planning · Social Feed</div>
          </div>
          <div style={{ padding: "1.2vw 1.8vw", border: "1px solid rgba(202,146,43,0.25)", background: "rgba(202,146,43,0.05)" }}>
            <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.3vw" }}>Business Growth Tools</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", fontWeight: 400 }}>Dashboard · Analytics · Promotions</div>
          </div>
          <div style={{ padding: "1.2vw 1.8vw", border: "1px solid rgba(202,146,43,0.25)", background: "rgba(202,146,43,0.05)" }}>
            <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.3vw" }}>Opportunity Center</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", fontWeight: 400 }}>Jobs · Mentorship · Marketplace</div>
          </div>
        </div>
      </div>

      <div className="absolute" style={{ left: "7vw", bottom: "3.5vw" }}>
        <div className="font-body" style={{ fontSize: "0.75vw", color: "rgba(202,146,43,0.38)", letterSpacing: "0.2em", fontWeight: 600 }}>
          MAPPINGWITHMELANIN.COM
        </div>
      </div>
    </div>
  );
}
