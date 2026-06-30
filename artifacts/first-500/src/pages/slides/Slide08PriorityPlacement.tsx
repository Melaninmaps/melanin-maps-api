export default function Slide08PriorityPlacement() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Founding Member Benefit 02</span>
      </div>

      <div className="flex flex-col gap-[5vh] px-[8vw] w-full">
        <div className="flex items-end gap-[3vw]">
          <h1 className="text-[5.5vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
            Founding Members<br /><span style={{ color: "#C4622D" }}>appear first.</span>
          </h1>
          <div className="pb-[1.5vh] font-body text-[1.5vw]" style={{ color: "rgba(250,246,239,0.5)" }}>Always.</div>
        </div>

        <div className="grid grid-cols-2 gap-[2vw]">
          <div className="flex items-center gap-[2vw] rounded-xl p-[2vw]" style={{ background: "rgba(196,98,45,0.12)", border: "1px solid rgba(196,98,45,0.3)" }}>
            <div className="text-[3vw] flex-shrink-0">🔍</div>
            <div>
              <div className="font-body text-[1.4vw] font-semibold mb-[0.5vh]" style={{ color: "#FAF6EF" }}>Category Search Results</div>
              <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Top of every relevant search — before non-founding listings</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw] rounded-xl p-[2vw]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="text-[3vw] flex-shrink-0">✨</div>
            <div>
              <div className="font-body text-[1.4vw] font-semibold mb-[0.5vh]" style={{ color: "#FAF6EF" }}>Discovery Feed Featured Slot</div>
              <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Highlighted in the home feed when users browse your city</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw] rounded-xl p-[2vw]" style={{ background: "rgba(45,122,79,0.12)", border: "1px solid rgba(45,122,79,0.3)" }}>
            <div className="text-[3vw] flex-shrink-0">📍</div>
            <div>
              <div className="font-body text-[1.4vw] font-semibold mb-[0.5vh]" style={{ color: "#FAF6EF" }}>Map Pin Prominence</div>
              <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Founding badge visible on the map — stands out from standard pins</div>
            </div>
          </div>
          <div className="flex items-center gap-[2vw] rounded-xl p-[2vw]" style={{ background: "rgba(196,98,45,0.12)", border: "1px solid rgba(196,98,45,0.3)" }}>
            <div className="text-[3vw] flex-shrink-0">🤖</div>
            <div>
              <div className="font-body text-[1.4vw] font-semibold mb-[0.5vh]" style={{ color: "#FAF6EF" }}>KinfolkAI™ Boosted</div>
              <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Prioritized in AI-generated travel plans and recommendations</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>07 / 18</span>
      </div>
    </div>
  );
}
