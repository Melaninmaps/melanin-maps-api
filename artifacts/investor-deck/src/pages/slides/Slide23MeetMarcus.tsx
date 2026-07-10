const base = import.meta.env.BASE_URL;

const JOURNEY = [
  "Claims her profile",
  "Tells her story",
  "Community discovers her",
  "Customers save her",
  "Customers recommend her",
  "Kinfolk AI learns",
  "Business grows",
];

export default function Slide23MeetAngela() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>23</div>

      <div className="absolute left-0 top-0 w-[42vw] h-full overflow-hidden">
        <img src={`${base}photos/entrepreneur-storefront.jpg`} crossOrigin="anonymous" alt="Angela" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(28,14,6,0.05), rgba(28,14,6,0.55))" }} />
      </div>

      <div className="absolute right-[6vw] top-1/2 -translate-y-1/2" style={{ left: "46vw" }}>
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          A BUSINESS STORY
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "4.4vw", fontWeight: 700, color: "#1C0E06" }}>
          Meet Angela.
        </h1>
        <div className="inv-rule w-[8vw] mt-[2.9vh] mb-[2.2vh]" />
        <div className="font-body" style={{ fontSize: "1.7vw", color: "#3A1F0E", fontWeight: 400, lineHeight: 1.4 }}>
          She owns a natural hair salon. She doesn&rsquo;t need a million customers &mdash; she needs the right customers, the ones already looking for what she offers.
        </div>

        <div className="mt-[3vh]" style={{ display: "flex", flexDirection: "column", gap: "1.1vh" }}>
          {JOURNEY.map((item) => (
            <div key={item} className="font-body" style={{ fontSize: "1.35vw", color: "#7B5408", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.9vw" }}>
              <span style={{ color: "#CA922B", fontSize: "1.3vw", fontWeight: 700 }}>&#10003;</span>
              {item}
            </div>
          ))}
        </div>

        <div className="font-display mt-[3.6vh]" style={{ fontSize: "1.7vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>
          This is Angela&rsquo;s journey. It&rsquo;s every business owner&rsquo;s journey.
        </div>
      </div>
    </div>
  );
}
