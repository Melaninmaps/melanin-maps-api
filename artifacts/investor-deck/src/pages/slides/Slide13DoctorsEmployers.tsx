const CHECKLIST = [
  "A doctor she feels comfortable with.",
  "A mentor who helps her navigate a new city.",
  "Employers whose culture reflects her values.",
  "Businesses trusted by the community.",
  "Friends who make Houston feel like home.",
];

export default function Slide12DoctorsEmployers() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>13</div>

      <div className="mx-auto flex flex-col items-center text-center" style={{ maxWidth: "48vw" }}>
        <div className="font-body mb-[1.6vh]" style={{ fontSize: "1.05vw", color: "#A6720F", letterSpacing: "0.16em", fontWeight: 500 }}>
          JASMINE&rsquo;S JOURNEY &mdash; SHE BUILDS HER LIFE
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "4vw", fontWeight: 700, color: "#1C0E06" }}>
          One app.
          <br />
          Every new beginning.
        </h1>
        <div className="inv-rule w-[7vw] mt-[2.2vh] mb-[2.2vh]" />

        <div className="font-body mb-[2.6vh]" style={{ fontSize: "1.15vw", color: "#3A1F0E", fontWeight: 400, lineHeight: 1.4, textWrap: "balance" }}>
          Moving to Houston wasn&rsquo;t just about finding a restaurant.
          <br />
          It was about building a life.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.1vh", alignItems: "flex-start" }}>
          {CHECKLIST.map((item) => (
            <div key={item} className="font-body" style={{ fontSize: "1.15vw", color: "#7B5408", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.8vw" }}>
              <span style={{ color: "#CA922B", fontSize: "1.1vw", fontWeight: 700 }}>&#10003;</span>
              {item}
            </div>
          ))}
        </div>

        <div className="font-display mt-[2.8vh]" style={{ fontSize: "1.3vw", color: "#1C0E06", fontWeight: 700, fontStyle: "italic", textWrap: "balance" }}>
          Because belonging isn&rsquo;t one decision &mdash; it&rsquo;s hundreds of little ones.
        </div>
        <div className="font-display mt-[1.4vh]" style={{ fontSize: "1.4vw", color: "#A6720F", fontWeight: 700, textWrap: "balance" }}>
          One search becomes one relationship. One relationship becomes community.
        </div>
      </div>
    </div>
  );
}
