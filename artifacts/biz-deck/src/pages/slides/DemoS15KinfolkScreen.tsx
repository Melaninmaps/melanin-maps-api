const base = import.meta.env.BASE_URL;

const msgs = [
  { from: "ai", text: "Hey Zara — I know DC, I know the culture, and I know what matters to you. 14 minority-owned spots near Shaw match your vibe right now. Where should we start?" },
  { from: "user", text: "Find me a great brunch spot on U Street — something with real energy." },
  { from: "ai", text: "Top pick: Copper & Oak Bistro — Trust Score 97, verified minority-owned, outdoor patio, jerk eggs benedict. Community says 'Welcoming Vibe' and 'Safe Space'. 0.4 mi away. Added to favorites. Directions?" },
  { from: "user", text: "Yes, and add it to Saturday's itinerary." },
  { from: "ai", text: "Done. I also added Melanin & More Salon (94) nearby. Want me to build out the full Saturday?" },
];

export default function DemoS15KinfolkScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>15</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>KinfolkAI™.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          AI that speaks your language from the first word.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Not a generic chatbot with a new name. Culture-aware from the ground up — trained with community context, tone, and the insider knowledge that generic AI skips entirely.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>The concierge the diaspora deserves.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#0D0805" }}>
            {/* Header */}
            <div className="flex items-center gap-[0.65vw] px-[1vw] py-[1.1vw]" style={{ borderBottom: "1px solid rgba(202,146,43,0.18)", flexShrink: 0 }}>
              <div className="rounded-full flex-shrink-0 flex items-center justify-center" style={{ width: "2.2vw", height: "2.2vw", background: "linear-gradient(135deg,#CA922B,#7B5408)" }}>
                <span className="font-display" style={{ fontSize: "0.82vw", color: "#FAF6EF", fontWeight: 800 }}>K</span>
              </div>
              <div>
                <div className="font-body" style={{ fontSize: "0.72vw", color: "#FAF6EF", fontWeight: 700 }}>KinfolkAI</div>
                <div className="font-body" style={{ fontSize: "0.55vw", color: "#CA922B" }}>Culture-aware · Online</div>
              </div>
              <div className="ml-auto rounded-[0.35vw] px-[0.45vw] py-[0.15vw]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)" }}>
                <span className="font-body" style={{ fontSize: "0.42vw", color: "#CA922B", fontWeight: 700 }}>NAVIGATOR</span>
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 px-[0.9vw] py-[0.8vw] flex flex-col gap-[0.65vw]" style={{ overflow: "hidden" }}>
              {msgs.map((m, i) => (
                <div key={i} className="flex" style={{ justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "84%", background: m.from === "user" ? "#CA922B" : "rgba(255,255,255,0.07)", borderRadius: m.from === "user" ? "0.85vw 0.85vw 0.12vw 0.85vw" : "0.85vw 0.85vw 0.85vw 0.12vw", padding: "0.6vw 0.75vw", border: m.from === "ai" ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <span className="font-body" style={{ color: m.from === "user" ? "#FFF" : "#D9C4A3", fontSize: "0.52vw", lineHeight: 1.5 }}>{m.text}</span>
                  </div>
                </div>
              ))}
              {/* Chips */}
              <div className="flex gap-[0.38vw] flex-wrap">
                {["Yes, build Saturday","Add more stops","Open the map"].map((chip, i) => (
                  <div key={i} className="rounded-[2vw] px-[0.6vw] py-[0.28vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.35)", flexShrink: 0 }}>
                    <span className="font-body" style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 600 }}>{chip}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Input */}
            <div className="px-[0.9vw] pb-[1vw]" style={{ flexShrink: 0 }}>
              <div className="rounded-[2vw] px-[0.85vw] py-[0.58vw] flex justify-between items-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(202,146,43,0.3)" }}>
                <span className="font-body" style={{ fontSize: "0.52vw", color: "rgba(250,246,239,0.25)" }}>Ask anything about DC...</span>
                <div className="rounded-full flex items-center justify-center" style={{ width: "1.5vw", height: "1.5vw", background: "#CA922B" }}>
                  <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="none" stroke="#0D0805" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Local Discovery, Safety Intel,</strong> Trip Planning, and Community Connections built in.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Free: 10 queries/month.</strong> Navigator &amp; Trailblazer: unlimited.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Quick-reply chips</strong> — no typing needed for common follow-ups.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
