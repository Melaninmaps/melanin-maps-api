const base = import.meta.env.BASE_URL;

const CHECKLIST = [
  "Starting over in a new city",
  "Looking for a neighborhood that feels like home",
  "Wants to support businesses that reflect her values",
  "Looking to build meaningful connections",
  "Hopes she\u2019ll feel like she belongs",
];

export default function Slide11MeetJasmine() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>11</div>

      <div className="absolute left-0 top-0 w-[42vw] h-full overflow-hidden">
        <img src={`${base}photos/traveler-airport.jpg`} crossOrigin="anonymous" alt="Jasmine" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(28,14,6,0.05), rgba(28,14,6,0.55))" }} />
      </div>

      <div className="absolute right-[6vw] flex flex-col justify-center" style={{ left: "46vw", top: "8%", bottom: "8%" }}>
        <div className="font-body mb-[1.1vw]" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          A USER STORY
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "4.4vw", fontWeight: 700, color: "#1C0E06" }}>
          Meet Jasmine.
        </h1>
        <div className="inv-rule w-[8vw] mt-[1.6vw] mb-[1.2vw]" />
        <div className="font-body" style={{ fontSize: "1.7vw", color: "#3A1F0E", fontWeight: 400, lineHeight: 1.4 }}>
          Jasmine just accepted her dream job in Houston.
        </div>

        <div className="mt-[1.7vw]" style={{ display: "flex", flexDirection: "column", gap: "0.73vw" }}>
          {CHECKLIST.map((item) => (
            <div key={item} className="font-body" style={{ fontSize: "1.35vw", color: "#7B5408", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.9vw" }}>
              <span style={{ color: "#CA922B", fontSize: "1.3vw", fontWeight: 700 }}>&#10003;</span>
              {item}
            </div>
          ))}
        </div>

        <div className="font-display mt-[2vw]" style={{ fontSize: "2vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>
          Then she opens Mapping With Melanin&trade;.
        </div>
      </div>
    </div>
  );
}
