const base = import.meta.env.BASE_URL;

const interests = [
  ["Soul Food","Brunch","Fine Dining","Coffee Shops"],
  ["Natural Hair","Spas & Wellness","Fitness","Boutiques"],
  ["Music & Events","Art & Culture","Travel","Community"],
];
const selected = [0,1,4,5,8,10];

export default function DemoS05OnboardingScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>05</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Personalized.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          The app shapes itself around the member.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Onboarding captures lifestyle, interests, and city — so every recommendation, feed, and KinfolkAI response is calibrated from the very first session.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Your vibe, reflected back.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Progress */}
            <div className="px-[1.1vw] pt-[1.3vw] pb-[0.7vw]" style={{ flexShrink: 0 }}>
              <div className="flex gap-[0.35vw] mb-[1vw]">
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ flex: 1, height: "0.25vw", borderRadius: "0.15vw", background: i <= 3 ? "#CA922B" : "#DDD0B8" }} />
                ))}
              </div>
              <div className="font-body" style={{ fontSize: "0.6vw", color: "#A87A40", letterSpacing: "0.1em", fontWeight: 600 }}>STEP 3 OF 5</div>
              <div className="font-display mt-[0.3vw]" style={{ fontSize: "1.1vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.2 }}>What are your interests?</div>
              <div className="font-body mt-[0.2vw]" style={{ fontSize: "0.62vw", color: "#7A5530" }}>Pick everything that fits your lifestyle</div>
            </div>
            {/* Interest chips */}
            <div className="px-[1.1vw] flex-1" style={{ overflow: "hidden" }}>
              {interests.map((row, ri) => (
                <div key={ri} className="flex flex-wrap gap-[0.4vw] mb-[0.5vw]">
                  {row.map((item, ci) => {
                    const idx = ri * 4 + ci;
                    const isSel = selected.includes(idx);
                    return (
                      <div key={item} style={{ padding: "0.38vw 0.75vw", borderRadius: "2vw", background: isSel ? "#CA922B" : "#FFFFFF", border: isSel ? "none" : "1px solid #DDD0B8", flexShrink: 0 }}>
                        <span className="font-body" style={{ fontSize: "0.6vw", fontWeight: isSel ? 700 : 500, color: isSel ? "#FAF6EF" : "#7A5530" }}>{item}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* CTA */}
            <div className="px-[1.1vw] pb-[1.4vw]" style={{ flexShrink: 0 }}>
              <div className="w-full flex items-center justify-center rounded-[0.8vw] py-[0.75vw]" style={{ background: "#CA922B" }}>
                <span className="font-body" style={{ fontSize: "0.78vw", fontWeight: 700, color: "#FAF6EF" }}>Continue →</span>
              </div>
              <div className="font-body mt-[0.5vw]" style={{ fontSize: "0.58vw", color: "#A87A40", textAlign: "center" }}>6 of 12 selected</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>12 interest categories</strong> across food, wellness, culture, and community.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>5-step flow</strong> also captures lifestyle, city, and safety preferences.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Powers KinfolkAI</strong> — selections feed directly into the AI prompt layer.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
