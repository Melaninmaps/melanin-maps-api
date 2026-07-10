const base = import.meta.env.BASE_URL;

const JOURNEY = [
  "He tells his story",
  "Community discovers him",
  "Neighbors become customers",
  "Customers return",
  "Customers recommend him",
  "Business grows",
];

export default function Slide23MeetMarcus() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>23</div>

      <div className="absolute left-0 top-0 w-[38vw] h-full overflow-hidden">
        <img src={`${base}photos/entrepreneur-restaurant-owner.png`} crossOrigin="anonymous" alt="Marcus" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(28,14,6,0.05), rgba(28,14,6,0.55))" }} />
      </div>

      <div className="absolute right-[5vw] top-[5vh]" style={{ left: "42vw" }}>
        <div className="font-body mb-[1.4vh]" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          A BUSINESS STORY
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#1C0E06" }}>
          Meet Marcus.
        </h1>
        <div className="font-body" style={{ fontSize: "1.4vw", color: "#7B5408", fontWeight: 500 }}>
          Restaurant Owner
        </div>

        <div className="mt-[2vh] pl-[1vw]" style={{ borderLeft: "2px solid rgba(202,146,43,0.35)" }}>
          <div className="font-body mb-[0.6vh]" style={{ fontSize: "1vw", color: "#A6720F", letterSpacing: "0.1em", fontWeight: 600 }}>
            BEFORE MAPPING WITH MELANIN&trade;
          </div>
          <div className="font-body" style={{ fontSize: "1.3vw", color: "#3A1F0E", fontWeight: 500 }}>
            Great business. Great service. Hard to be discovered.
          </div>
        </div>

        <div className="mt-[2.8vh]" style={{ display: "flex", flexDirection: "column", gap: "0.9vh" }}>
          {JOURNEY.map((item, i) => (
            <div key={item}>
              <div className="font-display" style={{ fontSize: "1.6vw", color: "#3A1F0E", fontWeight: 700 }}>{item}</div>
              {i < JOURNEY.length - 1 && (
                <div style={{ color: "#CA922B", fontSize: "1.2vw", fontWeight: 700, lineHeight: 1 }}>&#8595;</div>
              )}
            </div>
          ))}
        </div>

        <div className="font-body mt-[2.4vh]" style={{ fontSize: "1.15vw", color: "#3A1F0E", fontWeight: 500 }}>
          Every recommendation helps someone else find a place they&rsquo;ll love.
        </div>

        <div className="font-display mt-[1.6vh]" style={{ fontSize: "1.4vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>
          There are thousands of businesses like Marcus&rsquo;s. Great businesses deserve more than great luck.
        </div>
        <div className="font-display mt-[1vh]" style={{ fontSize: "1.4vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>
          Marcus came looking for customers. Now he&rsquo;s building a community.
        </div>
      </div>
    </div>
  );
}
