export default function SlideInv34ProductEcosystem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 30%, rgba(202,146,43,0.15), transparent 60%)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>34</div>

      {/* Header */}
      <div className="absolute left-[6vw] top-[4vw]">
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1 }}>
          One Platform.
        </div>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 700, color: "#CA922B", marginTop: "0.5vw" }}>
          Six Core Experiences.
        </div>
        <div className="font-body" style={{ fontSize: "1.2vw", color: "#A87A40", marginTop: "0.7vw", fontWeight: 400 }}>
          Everything the community needs — designed to work together.
        </div>
      </div>

      {/* Divider */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "17vw", height: "1px", background: "rgba(202,146,43,0.25)" }} />

      {/* 6 Cards — 3 columns × 2 rows */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "19vw", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2.5vw 3vw" }}>

        {/* 1 — Discover */}
        <div>
          <div style={{ fontSize: "2.2vw", marginBottom: "0.5vw" }}>🏙️</div>
          <div className="font-display" style={{ fontSize: "1.7vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.4vw" }}>Discover</div>
          <div className="font-body" style={{ fontSize: "1.15vw", color: "#D9C4A3", lineHeight: 1.5 }}>
            Businesses, neighborhoods, and hidden gems trusted by the community.
          </div>
        </div>

        {/* 2 — Safety */}
        <div>
          <div style={{ fontSize: "2.2vw", marginBottom: "0.5vw" }}>🛡️</div>
          <div className="font-display" style={{ fontSize: "1.7vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.4vw" }}>Safety</div>
          <div className="font-body" style={{ fontSize: "1.15vw", color: "#D9C4A3", lineHeight: 1.5 }}>
            Community-powered confidence — know before you go.
          </div>
        </div>

        {/* 3 — Community */}
        <div>
          <div style={{ fontSize: "2.2vw", marginBottom: "0.5vw" }}>👥</div>
          <div className="font-display" style={{ fontSize: "1.7vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.4vw" }}>Community</div>
          <div className="font-body" style={{ fontSize: "1.15vw", color: "#D9C4A3", lineHeight: 1.5 }}>
            Find your people — circles, events, and shared spaces.
          </div>
        </div>

        {/* 4 — Experiences */}
        <div>
          <div style={{ fontSize: "2.2vw", marginBottom: "0.5vw" }}>📅</div>
          <div className="font-display" style={{ fontSize: "1.7vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.4vw" }}>Experiences</div>
          <div className="font-body" style={{ fontSize: "1.15vw", color: "#D9C4A3", lineHeight: 1.5 }}>
            Events, local culture, and life that pulses through every city.
          </div>
        </div>

        {/* 5 — KinfolkAI */}
        <div>
          <div style={{ fontSize: "2.2vw", marginBottom: "0.5vw" }}>🤖</div>
          <div className="font-display" style={{ fontSize: "1.7vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.4vw" }}>KinfolkAI™</div>
          <div className="font-body" style={{ fontSize: "1.15vw", color: "#D9C4A3", lineHeight: 1.5 }}>
            Personalized recommendations powered by community intelligence.
          </div>
        </div>

        {/* 6 — Relocation */}
        <div>
          <div style={{ fontSize: "2.2vw", marginBottom: "0.5vw" }}>🚚</div>
          <div className="font-display" style={{ fontSize: "1.7vw", fontWeight: 700, color: "#CA922B", marginBottom: "0.4vw" }}>Relocation</div>
          <div className="font-body" style={{ fontSize: "1.15vw", color: "#D9C4A3", lineHeight: 1.5 }}>
            Know before you move — community insight before the boxes are unpacked.
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] right-[6vw] bottom-[3.5vw]">
        <div style={{ height: "1px", background: "rgba(202,146,43,0.2)", marginBottom: "1.2vw" }} />
        <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#A87A40", fontStyle: "italic" }}>
          One subscription. One ecosystem. Everything you need to belong — wherever you are.
        </div>
      </div>
    </div>
  );
}
