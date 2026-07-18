export default function SlideInv39GoToMarket() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>

      {/* Header */}
      <div className="absolute left-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 600 }}>GO-TO-MARKET</div>
        <div className="font-display" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.1, marginTop: "0.5vw" }}>
          Every city strengthens the next.
        </div>
      </div>

      {/* Left column — Rollout phases (vertical timeline) */}
      <div className="absolute" style={{ left: "6vw", top: "16vw", width: "38vw" }}>

        {/* Phase 1 */}
        <div className="flex" style={{ gap: "1.5vw", marginBottom: "0.6vw" }}>
          <div className="flex flex-col items-center" style={{ flexShrink: 0, width: "1.8vw" }}>
            <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#FAF6EF" }}>1</div>
            </div>
            <div style={{ width: "2px", height: "3.5vw", background: "rgba(202,146,43,0.4)" }} />
          </div>
          <div style={{ paddingBottom: "1.2vw" }}>
            <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#1C0E06" }}>Philadelphia</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", marginTop: "0.3vw", lineHeight: 1.5 }}>
              Full launch — founding businesses, community members, KinfolkAI™ live
            </div>
          </div>
        </div>

        {/* Phase 2 */}
        <div className="flex" style={{ gap: "1.5vw", marginBottom: "0.6vw" }}>
          <div className="flex flex-col items-center" style={{ flexShrink: 0, width: "1.8vw" }}>
            <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#FAF6EF" }}>2</div>
            </div>
            <div style={{ width: "2px", height: "3.5vw", background: "rgba(202,146,43,0.4)" }} />
          </div>
          <div style={{ paddingBottom: "1.2vw" }}>
            <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#1C0E06" }}>Baltimore &amp; Washington DC</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", marginTop: "0.3vw", lineHeight: 1.5 }}>
              Regional expansion — flywheel data from Philly accelerates launch
            </div>
          </div>
        </div>

        {/* Phase 3 */}
        <div className="flex" style={{ gap: "1.5vw", marginBottom: "0.6vw" }}>
          <div className="flex flex-col items-center" style={{ flexShrink: 0, width: "1.8vw" }}>
            <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#FAF6EF" }}>3</div>
            </div>
            <div style={{ width: "2px", height: "3.5vw", background: "rgba(202,146,43,0.4)" }} />
          </div>
          <div style={{ paddingBottom: "1.2vw" }}>
            <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#1C0E06" }}>Atlanta · Houston · Chicago · LA</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", marginTop: "0.3vw", lineHeight: 1.5 }}>
              Major cultural cities — high-density minority communities and businesses
            </div>
          </div>
        </div>

        {/* Phase 4 */}
        <div className="flex" style={{ gap: "1.5vw", marginBottom: "0.6vw" }}>
          <div className="flex flex-col items-center" style={{ flexShrink: 0, width: "1.8vw" }}>
            <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "#3D2417", border: "2px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#CA922B" }}>4</div>
            </div>
            <div style={{ width: "2px", height: "3.5vw", background: "rgba(202,146,43,0.2)" }} />
          </div>
          <div style={{ paddingBottom: "1.2vw" }}>
            <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#5C3A1A" }}>Multi-City Expansion</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", marginTop: "0.3vw", lineHeight: 1.5 }}>
              Full US rollout — creator network, ambassador program, enterprise partnerships
            </div>
          </div>
        </div>

        {/* Phase 5 */}
        <div className="flex" style={{ gap: "1.5vw" }}>
          <div className="flex flex-col items-center" style={{ flexShrink: 0, width: "1.8vw" }}>
            <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "#FAF6EF", border: "2px solid rgba(202,146,43,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#CA922B", opacity: 0.6 }}>5</div>
            </div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#A6720F", opacity: 0.7 }}>International</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", marginTop: "0.3vw", lineHeight: 1.5 }}>
              Caribbean, UK, West Africa — the melanated diaspora is global
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] bottom-[2vw]">
        <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#A6720F", fontStyle: "italic" }}>
          We don't start over in every city. Every launch begins with the momentum of the last.
        </div>
      </div>

      {/* Vertical divider */}
      <div className="absolute" style={{ left: "49vw", top: "16vw", bottom: "5vw", width: "1px", background: "rgba(58,31,14,0.12)" }} />

      {/* Right column — Growth drivers */}
      <div className="absolute" style={{ left: "52vw", top: "16vw", right: "6vw" }}>
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 600, marginBottom: "1.4vw" }}>WHY GROWTH COMPOUNDS</div>

        <div style={{ marginBottom: "1.8vw" }}>
          <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Community Referrals</div>
          <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", marginTop: "0.4vw", lineHeight: 1.5 }}>
            Every member becomes a new acquisition channel.
          </div>
        </div>

        <div style={{ marginBottom: "1.8vw" }}>
          <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Founding Businesses</div>
          <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", marginTop: "0.4vw", lineHeight: 1.5 }}>
            Every business brings customers before marketing begins.
          </div>
        </div>

        <div style={{ marginBottom: "1.8vw" }}>
          <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Cultural Ambassador Network</div>
          <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", marginTop: "0.4vw", lineHeight: 1.5 }}>
            Trusted voices introduce communities, businesses, and experiences through authentic local perspective.
          </div>
        </div>

        <div style={{ marginBottom: "1.8vw" }}>
          <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>KinfolkAI™ Gets Smarter</div>
          <div className="font-body" style={{ fontSize: "1.05vw", color: "#1C0E06", fontWeight: 700, marginTop: "0.4vw", lineHeight: 1.5 }}>
            Every city improves recommendations for every future city.
          </div>
        </div>

        <div>
          <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Employer &amp; Tourism Partnerships</div>
          <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", marginTop: "0.4vw", lineHeight: 1.5 }}>
            Enterprise relocation deals and tourism boards open B2B distribution at scale.
          </div>
        </div>
      </div>
    </div>
  );
}
