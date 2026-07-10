const base = import.meta.env.BASE_URL;

const JOURNEY = [
  "Claims his business.",
  "Adds his story.",
  "Community finds him.",
  "People save him.",
  "People visit.",
  "People recommend him.",
  "Kinfolk AI learns.",
  "Business grows.",
];

export default function Slide23MeetMarcus() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>23</div>

      <div className="absolute left-0 top-0 w-[38vw] h-full overflow-hidden">
        <img src={`${base}photos/entrepreneur-restaurant-owner.png`} crossOrigin="anonymous" alt="Marcus" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(28,14,6,0.05), rgba(28,14,6,0.55))" }} />
      </div>

      <div className="absolute right-[5vw] top-[6vh]" style={{ left: "42vw" }}>
        <div className="font-body mb-[1.6vh]" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          A BUSINESS STORY
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#1C0E06" }}>
          Meet Marcus.
        </h1>
        <div className="font-body" style={{ fontSize: "1.4vw", color: "#7B5408", fontWeight: 500 }}>
          Restaurant Owner
        </div>

        <div className="mt-[2.6vh] p-[1.6vw]" style={{ borderRadius: "0.6vw", background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
          <div className="font-body mb-[0.8vh]" style={{ fontSize: "1.1vw", color: "#A6720F", letterSpacing: "0.1em", fontWeight: 600 }}>
            BEFORE MAPPING WITH MELANIN&trade;
          </div>
          <div className="font-display" style={{ fontSize: "1.5vw", color: "#3A1F0E", fontWeight: 700 }}>
            Great business. Great service. Hard to be discovered.
          </div>
        </div>

        <div className="mt-[2.4vh] grid grid-cols-2 gap-x-[2vw] gap-y-[0.9vh]">
          {JOURNEY.map((item) => (
            <div key={item} className="font-body" style={{ fontSize: "1.15vw", color: "#7B5408", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <span style={{ color: "#CA922B", fontSize: "1.1vw", fontWeight: 700 }}>&#8595;</span>
              {item}
            </div>
          ))}
        </div>

        <div className="font-display mt-[2.4vh]" style={{ fontSize: "1.5vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>
          This is Marcus&rsquo;s journey. It&rsquo;s every business owner&rsquo;s journey.
        </div>
      </div>
    </div>
  );
}
