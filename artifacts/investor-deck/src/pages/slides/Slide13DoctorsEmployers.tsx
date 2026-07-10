const CHECKLIST = [
  "A primary care physician who understands her.",
  "An employer whose culture actually fits her.",
  "A mentor in her new city.",
  "Businesses recommended by people she trusts.",
];

export default function Slide12DoctorsEmployers() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>13</div>

      <div className="mx-auto flex flex-col items-center text-center" style={{ maxWidth: "52vw" }}>
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.4vw", color: "#A6720F", letterSpacing: "0.16em", fontWeight: 500 }}>
          JASMINE&rsquo;S JOURNEY &mdash; SHE BUILDS HER LIFE
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "4.6vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          One app.
          <br />
          Every new beginning.
        </h1>
        <div className="inv-rule w-[8vw] mt-[3.2vh] mb-[3vh]" />

        <div className="font-body mb-[3.6vh]" style={{ fontSize: "1.5vw", color: "#3A1F0E", fontWeight: 400, lineHeight: 1.5, textWrap: "balance" }}>
          Moving to a new city means more than finding a restaurant. Jasmine also finds:
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.7vh", alignItems: "flex-start" }}>
          {CHECKLIST.map((item) => (
            <div key={item} className="font-body" style={{ fontSize: "1.5vw", color: "#7B5408", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.9vw" }}>
              <span style={{ color: "#CA922B", fontSize: "1.4vw", fontWeight: 700 }}>&#10003;</span>
              {item}
            </div>
          ))}
        </div>

        <div className="font-display mt-[4.2vh]" style={{ fontSize: "2vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>
          As life changes, Mapping with Melanin&trade; changes with her.
        </div>
      </div>
    </div>
  );
}
