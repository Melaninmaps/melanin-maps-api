export default function Slide03SameQuestion() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>03</div>
      <div className="absolute left-[10vw] right-[10vw] top-1/2 -translate-y-1/2 text-center">
        <div className="font-display leading-tight" style={{ fontSize: "2.2vw", color: "#7B5408", letterSpacing: "0.14em", fontWeight: 500 }}>
          THEY&rsquo;RE ALL LOOKING FOR THE SAME THING&mdash;A PLACE WHERE THEY BELONG.
        </div>
        <div className="mx-auto mt-[3.5vh] mb-[3.5vh]" style={{ width: "6vw", height: "2px", background: "#CA922B", opacity: 0.75 }} />
        <div className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          Businesses make belonging possible.
        </div>
      </div>
    </div>
  );
}
