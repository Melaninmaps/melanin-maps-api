export default function DemoS48KinfolkResponseScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>48</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Drafted.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Marcus picks Option A. Edits two words. Posts it in 30 seconds.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Zara gets a notification: "Marcus from Copper &amp; Oak Bistro responded to your review." She opens it. He thanked her by name, mentioned the jerk eggs benedict, and invited her to come back on a day he'll be there. That's not a template. That's a relationship.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Community to owner. Owner to community. Loop closed.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.2vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              <div className="flex items-center gap-[0.5vw]">
                <div style={{ width: "1.1vw", height: "1.1vw", borderRadius: "0.3vw", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.55vw", color: "#FFF", fontWeight: 800 }}>K</span>
                </div>
                <div>
                  <div className="font-display" style={{ fontSize: "0.88vw", fontWeight: 800, color: "#1C0E06" }}>KinfolkAI — Response Drafts</div>
                  <div className="font-body" style={{ fontSize: "0.46vw", color: "#A87A40" }}>For Zara M.'s review · 3 variations generated</div>
                </div>
              </div>
            </div>

            {/* Response options */}
            <div className="flex flex-col gap-[0.5vw] px-[1vw] flex-1" style={{ overflow: "hidden" }}>
              {[
                {
                  label: "A · Warm & Personal", selected: true,
                  text: "Zara, thank you so much for this — reading this made my whole week. The jerk eggs benedict are my personal favorite, and knowing you felt welcome at our table is everything. Come back soon — I'll be in the kitchen next Sunday and would love to say hi in person. — Marcus",
                },
                {
                  label: "B · Brief & Grateful", selected: false,
                  text: "Thank you Zara! Comments like yours remind us exactly why we do this. The community's support means everything to us. See you next Sunday! — Marcus & the C&O team",
                },
                {
                  label: "C · Community-Forward", selected: false,
                  text: "Zara, this is exactly what we built Copper & Oak for — a space where you feel as welcome as family. Your support of minority-owned spaces creates the community we all want to live in. Thank you, truly. — Marcus",
                },
              ].map((opt, i) => (
                <div key={i} className="rounded-[0.75vw] p-[0.65vw]" style={{ background: opt.selected ? "linear-gradient(135deg,#FEF9EE,#FAF6EF)" : "#FFFFFF", border: opt.selected ? "1.5px solid #CA922B" : "1px solid #E8DDC8" }}>
                  <div className="flex items-center justify-between mb-[0.3vw]">
                    <span className="font-body" style={{ fontSize: "0.48vw", fontWeight: 700, color: opt.selected ? "#CA922B" : "#A87A40" }}>{opt.label}</span>
                    {opt.selected && <div className="rounded-full flex items-center justify-center" style={{ width: "0.9vw", height: "0.9vw", background: "#CA922B" }}><svg width="0.45vw" height="0.45vw" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg></div>}
                  </div>
                  <div className="font-body" style={{ fontSize: "0.5vw", color: opt.selected ? "#3A1F0E" : "#A87A40", lineHeight: 1.55 }}>{opt.text}</div>
                </div>
              ))}

              {/* Edit & post */}
              <div className="flex gap-[0.5vw] mt-[0.2vw]">
                <div className="flex-1 flex items-center justify-center rounded-[0.65vw] py-[0.6vw]" style={{ background: "#FFFFFF", border: "1px solid #DDD0B8" }}>
                  <span className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#7A5530" }}>Edit →</span>
                </div>
                <div className="flex-1 flex items-center justify-center rounded-[0.65vw] py-[0.6vw]" style={{ background: "#CA922B" }}>
                  <span className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#FFF" }}>Post Response</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Three voice-matched drafts</strong> — warm, brief, or community-forward. Marcus chooses.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Mentions Zara by name</strong> and references the specific dish she praised — not a form letter.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>30 seconds to post</strong> — from Zara's review to Marcus's response, loop complete.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
