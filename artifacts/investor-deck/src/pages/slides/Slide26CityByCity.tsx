const PHASE_ONE = ["Philadelphia", "Baltimore", "Washington DC"];
const PHASE_TWO = ["Atlanta", "Houston", "Chicago", "Los Angeles"];
const LAUNCH_WITH = [
  "Verified businesses",
  "Founding community members",
  "Kinfolk AI",
  "Local recommendations",
  "Safety intelligence",
];

export default function Slide26CityByCity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>28</div>

      {/* LEFT COLUMN */}
      <div className="absolute left-[6vw] top-[3.9vw]" style={{ width: "44vw" }}>
        <div className="font-body mb-[0.9vw]" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE ROLLOUT
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06" }}>
          Every new city strengthens the network.
        </h1>

        <div className="mt-[2.3vw]">
          <div className="font-body mb-[1vw]" style={{ fontSize: "1.15vw", color: "#7B5408", letterSpacing: "0.1em", fontWeight: 600 }}>
            EVERY CITY LAUNCHES WITH THE COMPLETE COMMUNITY FLYWHEEL
          </div>
          <div className="flex flex-col" style={{ gap: "0.56vw" }}>
            {LAUNCH_WITH.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "1vw" }}>
                <div style={{ fontSize: "1.2vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✓</div>
                <div className="font-body" style={{ fontSize: "1.45vw", color: "#3A1F0E", fontWeight: 500 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[1.7vw]" style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <div className="font-body" style={{ fontSize: "1.1vw", fontStyle: "italic", color: "#7B5408", lineHeight: 1.6 }}>
            Each city strengthens the data, recommendations, and community that power the next launch.
          </div>
        </div>

        <div className="mt-[1.4vw]" style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <div className="font-body" style={{ fontSize: "1.15vw", fontStyle: "italic", color: "#7B5408", lineHeight: 1.6 }}>
            We don't just launch an app.<br />
            We launch the entire ecosystem.
          </div>
        </div>
      </div>

      {/* CENTER CONNECTOR */}
      <div className="absolute flex flex-col items-center justify-center" style={{ left: "50vw", transform: "translateX(-50%)", top: "48%", gap: "0.45vw" }}>
        {["Repeat.", "Scale.", "Expand."].map((word) => (
          <div key={word} className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#CA922B", opacity: 0.55, letterSpacing: "0.06em" }}>{word}</div>
        ))}
      </div>

      {/* RIGHT COLUMN — city phases */}
      <div className="absolute flex flex-col justify-center" style={{ right: "6vw", top: "5.6vw", bottom: "5.6vw", width: "36vw" }}>

        <div className="mb-[1.97vw]">
          <div className="font-body mb-[0.79vw]" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.12em", fontWeight: 600 }}>
            PILOT CITIES
          </div>
          <div className="flex flex-col" style={{ gap: "0.34vw" }}>
            {PHASE_ONE.map((city) => (
              <div key={city} className="font-display" style={{ fontSize: "2vw", fontWeight: 700, color: "#1C0E06" }}>{city}</div>
            ))}
          </div>
        </div>

        <div className="flex items-center mb-[1.97vw]" style={{ gap: "0.8vw" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(202,146,43,0.3)" }} />
          <div style={{ fontSize: "1.6vw", color: "#CA922B", opacity: 0.6 }}>↓</div>
          <div style={{ flex: 1, height: "1px", background: "rgba(202,146,43,0.3)" }} />
        </div>

        <div>
          <div className="font-body mb-[0.79vw]" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.12em", fontWeight: 600 }}>
            EXPANSION CITIES
          </div>
          <div className="flex flex-col" style={{ gap: "0.34vw" }}>
            {PHASE_TWO.map((city) => (
              <div key={city} className="font-display" style={{ fontSize: "2vw", fontWeight: 700, color: "#1C0E06", opacity: 0.65 }}>{city}</div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
