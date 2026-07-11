export default function DemoS36ArticleScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>36</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Read.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Information the diaspora always deserved — finally in one place.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Zara opens "Your rights when stopped by police" from the Know Your Rights topic. The article has a guidance rating, an author, community-verified accuracy, and a discussion section at the bottom. Reading is the beginning. Acting is the goal.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>The knowledge was always yours to have.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.2vw] pb-[0.5vw]" style={{ flexShrink: 0, borderBottom: "1px solid #E8DDC8" }}>
              <div className="flex items-center gap-[0.6vw] mb-[0.5vw]">
                <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#A87A40" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                <span className="font-body" style={{ fontSize: "0.52vw", color: "#A87A40" }}>Know Your Rights</span>
              </div>
              {/* Guidance badge */}
              <div className="inline-flex items-center gap-[0.3vw] rounded-[0.4vw] px-[0.5vw] py-[0.15vw] mb-[0.4vw]" style={{ background: "#FEF2F2", border: "1px solid #DC262640" }}>
                <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#DC2626" }} />
                <span className="font-body" style={{ fontSize: "0.42vw", fontWeight: 700, color: "#DC2626" }}>ADULT GUIDANCE · 18+</span>
              </div>
              <div className="font-display" style={{ fontSize: "0.95vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.25 }}>Your rights when stopped by police: a legal guide for diaspora members</div>
              <div className="flex items-center gap-[0.5vw] mt-[0.3vw]">
                <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "#CA922B", flexShrink: 0 }} />
                <div>
                  <div className="font-body" style={{ fontSize: "0.48vw", fontWeight: 700, color: "#1C0E06" }}>Maya Johnson, Esq.</div>
                  <div className="font-body" style={{ fontSize: "0.42vw", color: "#A87A40" }}>Civil Rights Attorney · Community Verified</div>
                </div>
                <div className="ml-auto flex items-center gap-[0.25vw]">
                  <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#16A34A" }} />
                  <span className="font-body" style={{ fontSize: "0.42vw", color: "#16A34A", fontWeight: 600 }}>Verified</span>
                </div>
              </div>
            </div>

            {/* Article body */}
            <div className="flex-1 px-[1vw] pt-[0.7vw]" style={{ overflow: "hidden" }}>
              <div className="font-body" style={{ fontSize: "0.52vw", color: "#3A1F0E", lineHeight: 1.7 }}>
                <strong>You have the right to remain silent.</strong> In every traffic stop, in every encounter, before a lawyer is present — this applies to you. Exercising this right is not obstruction. It is the law.
              </div>
              <div className="font-body mt-[0.5vw]" style={{ fontSize: "0.52vw", color: "#3A1F0E", lineHeight: 1.7 }}>
                You are not required to consent to a vehicle search. If an officer asks "Mind if I look around?" — that is a request, not a command. "I do not consent to a search" is a complete, legal answer.
              </div>
              <div className="font-body mt-[0.5vw]" style={{ fontSize: "0.52vw", color: "#3A1F0E", lineHeight: 1.7 }}>
                You have the right to ask, "Am I being detained or am I free to go?" If not detained, you may leave. Record the interaction if safe to do so.
              </div>

              {/* Read more / save actions */}
              <div className="flex gap-[0.5vw] mt-[0.7vw]">
                <div className="flex-1 flex items-center justify-center rounded-[0.6vw] py-[0.55vw]" style={{ background: "#CA922B" }}>
                  <span className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#FFF" }}>Continue Reading →</span>
                </div>
                <div className="flex items-center justify-center rounded-[0.6vw] px-[0.65vw]" style={{ background: "#FFFFFF", border: "1px solid #DDD0B8" }}>
                  <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </div>
              </div>

              {/* Progress + stats */}
              <div className="flex items-center gap-[0.7vw] mt-[0.6vw]">
                <div style={{ flex: 1, height: "0.25vw", background: "#E8DDC8", borderRadius: "0.15vw" }}>
                  <div style={{ width: "28%", height: "100%", background: "#CA922B", borderRadius: "0.15vw" }} />
                </div>
                <span className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>28% · ~4 min left</span>
              </div>

              {/* Community reaction */}
              <div className="flex items-center gap-[1vw] mt-[0.5vw]">
                <span className="font-body" style={{ fontSize: "0.48vw", color: "#A87A40" }}>&#10084; 312 found this helpful</span>
                <span className="font-body" style={{ fontSize: "0.48vw", color: "#A87A40" }}>&#128172; 47 comments</span>
                <span className="font-body" style={{ fontSize: "0.48vw", color: "#CA922B", fontWeight: 600 }}>Share →</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Guidance rating</strong> on every article — families can filter appropriately.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Community verified authors</strong> — credentialed contributors, not anonymous posts.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Save and share</strong> — members spread knowledge through their circles.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
