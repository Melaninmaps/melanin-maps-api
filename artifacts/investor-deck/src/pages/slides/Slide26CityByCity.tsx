const CITIES = ["Philadelphia", "Baltimore", "Washington DC", "Atlanta", "Houston", "Chicago", "Los Angeles"];
const LAUNCH_WITH = ["Businesses", "Community", "AI", "Local content", "Safety intelligence"];

export default function Slide26CityByCity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>26</div>

      <div className="absolute left-[6vw] top-[7vh] max-w-[46vw]">
        <div className="font-body mb-[1.6vh]" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE ROLLOUT
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#1C0E06" }}>
          Every city becomes smarter.
        </h1>

        <div className="mt-[4vh]">
          <div className="font-body mb-[1.4vh]" style={{ fontSize: "1.2vw", color: "#7B5408", letterSpacing: "0.1em", fontWeight: 600 }}>
            EACH CITY LAUNCHES WITH
          </div>
          <div className="flex flex-col gap-[0.9vh]">
            {LAUNCH_WITH.map((item) => (
              <div key={item} className="flex items-start gap-[1vw]">
                <div style={{ width: "3px", height: "2.8vh", background: "#CA922B", flexShrink: 0, marginTop: "0.2vh" }} />
                <div className="font-body" style={{ fontSize: "1.5vw", color: "#3A1F0E", fontWeight: 500 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute right-[7vw] top-1/2 -translate-y-1/2 flex flex-col items-start gap-[1vh]">
        {CITIES.map((city, i) => (
          <div key={city} className="flex flex-col items-start">
            <div className="font-display" style={{ fontSize: "2vw", fontWeight: 700, color: "#1C0E06" }}>{city}</div>
            {i < CITIES.length - 1 && (
              <div style={{ color: "#CA922B", fontSize: "1.3vw", fontWeight: 400, lineHeight: 1, opacity: 0.5, marginLeft: "0.4vw" }}>&#8595;</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
