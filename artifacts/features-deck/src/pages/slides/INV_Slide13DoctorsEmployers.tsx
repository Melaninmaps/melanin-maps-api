const CHECKLIST = [
  "A doctor she feels comfortable with.",
  "A mentor who helps her navigate a new city.",
  "An employer where she can thrive.",
  "Businesses trusted by the community.",
  "People who make Houston feel like home.",
];

export default function Slide12DoctorsEmployers() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>13</div>

      <div className="mx-auto flex flex-col items-center text-center" style={{ maxWidth: "48vw" }}>
        <div className="font-body mb-[0.9vw]" style={{ fontSize: "1.05vw", color: "#A6720F", letterSpacing: "0.16em", fontWeight: 500 }}>
          JASMINE&rsquo;S JOURNEY &mdash; SHE BUILDS HER LIFE
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "4vw", fontWeight: 700, color: "#1C0E06" }}>
          One app.
          <br />
          Every new beginning.
        </h1>
        <div className="inv-rule w-[7vw] mt-[1.2vw] mb-[1.2vw]" />

        <div className="font-body mb-[1.5vw]" style={{ fontSize: "1.15vw", color: "#3A1F0E", fontWeight: 400, lineHeight: 1.4, textWrap: "balance" }}>
          Moving to Houston wasn&rsquo;t just about finding a restaurant.
          <br />
          It was about building a life.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.62vw", alignItems: "flex-start" }}>
          {CHECKLIST.map((item) => (
            <div key={item} className="font-body" style={{ fontSize: "1.15vw", color: "#7B5408", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.8vw" }}>
              <span style={{ color: "#CA922B", fontSize: "1.1vw", fontWeight: 700 }}>&#10003;</span>
              {item}
            </div>
          ))}
        </div>

        <div className="font-display mt-[1.8vw]" style={{ fontSize: "1.5vw", color: "#1C0E06", fontWeight: 700, fontStyle: "italic", textWrap: "balance" }}>
          Because belonging isn&rsquo;t one decision &mdash; it&rsquo;s hundreds of little ones.
        </div>
      </div>
    </div>
  );
}
