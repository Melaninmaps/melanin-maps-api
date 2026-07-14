const base = import.meta.env.BASE_URL;

export default function DemoS38ProfileScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>38</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Identity.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Zara's profile is her community footprint.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Navigator member. 12 saved places. 3 circles. 7 reviews written. 340 points earned. Her Life Journey shows she relocated from Atlanta 8 months ago — KinfolkAI remembers that when it recommends next steps for her in DC.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Everything she's built here, reflected back.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Profile header */}
            <div className="flex flex-col items-center pt-[1.5vw] pb-[0.8vw]" style={{ background: "#1C0E06", flexShrink: 0 }}>
              <div style={{ width: "3.8vw", height: "3.8vw", borderRadius: "50%", overflow: "hidden", border: "0.2vw solid #CA922B", position: "relative" }}>
                <img src={`${base}photos/feed-woman-movein.jpg`} crossOrigin="anonymous" alt="Zara" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="font-display mt-[0.5vw]" style={{ fontSize: "0.88vw", fontWeight: 800, color: "#FAF6EF" }}>Zara M.</div>
              <div className="font-body" style={{ fontSize: "0.5vw", color: "#A87A40" }}>Washington, DC · Relocated from Atlanta</div>
              <div className="flex items-center gap-[0.4vw] mt-[0.35vw] rounded-[0.4vw] px-[0.65vw] py-[0.2vw]" style={{ background: "rgba(202,146,43,0.2)", border: "1px solid rgba(202,146,43,0.4)" }}>
                <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B" }} />
                <span className="font-body" style={{ fontSize: "0.46vw", fontWeight: 700, color: "#CA922B" }}>Navigator Member</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex justify-around py-[0.7vw]" style={{ borderBottom: "1px solid #E8DDC8", flexShrink: 0 }}>
              {[["12","Saved"],["7","Reviews"],["3","Circles"],["340","Points"]].map(([val, label], i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="font-display" style={{ fontSize: "1.05vw", fontWeight: 800, color: "#CA922B" }}>{val}</span>
                  <span className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Menu items */}
            <div className="flex flex-col flex-1" style={{ overflow: "hidden" }}>
              {[
                { label: "Saved Places", sub: "12 spots in 3 collections", icon: "♡" },
                { label: "My Reviews", sub: "7 reviews · 340 points earned", icon: "✎" },
                { label: "Kinfolk Circles", sub: "3 circles · DC Crew, Foodie Fam, ATL Squad", icon: "◎" },
                { label: "Life Journey", sub: "Atlanta → Washington DC (8 months)", icon: "→" },
                { label: "Notifications", sub: "Safety alerts, circle updates, new reviews", icon: "◉" },
                { label: "Privacy & Visibility", sub: "Profile public · Saved spots private", icon: "◈" },
                { label: "Family Mode", sub: "Off · Manage guidance settings", icon: "⊕" },
                { label: "Membership", sub: "Navigator · Renews Aug 1", icon: "★" },
                { label: "Settings & Account", sub: "Password, email, connected apps", icon: "⚙" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-[0.65vw] px-[1vw] py-[0.5vw]" style={{ borderBottom: i < 8 ? "1px solid #F0E8D8" : "none" }}>
                  <span style={{ fontSize: "0.75vw", color: "#CA922B", width: "0.9vw", textAlign: "center" }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#1C0E06" }}>{item.label}</div>
                    <div className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>{item.sub}</div>
                  </div>
                  <svg width="0.5vw" height="0.5vw" viewBox="0 0 24 24" fill="none" stroke="#DDD0B8" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>9 profile sections</strong> — from circles to family mode, all in one place.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Life Journey</strong> — long-term context that makes KinfolkAI smarter over time.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Points visible</strong> — earned through reviews, saves, check-ins, and referrals.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
