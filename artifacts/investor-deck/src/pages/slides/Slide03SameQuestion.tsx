export default function Slide03SameQuestion() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>03</div>
      <div className="absolute left-[10vw] right-[10vw] top-1/2 -translate-y-1/2 text-center">
        <div className="font-display leading-tight" style={{ fontSize: "4.4vw", fontWeight: 700, color: "#7B5408", textWrap: "balance" }}>
          None of them are asking the same question.
        </div>
        <div className="mx-auto mt-[3vh] mb-[3vh]" style={{ width: "6vw", height: "3px", background: "#CA922B" }} />
        <div className="font-display leading-tight" style={{ fontSize: "5vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          Yet they&rsquo;re all searching for the same answer.
        </div>
      </div>
    </div>
  );
}
