export default function SlideInv38Traction() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>38</div>

      {/* Header */}
      <div className="absolute left-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 600 }}>TRACTION</div>
        <div className="font-display" style={{ fontSize: "4vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.1, marginTop: "0.5vw" }}>
          We're executing.
        </div>
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#7B5408", marginTop: "0.7vw" }}>
          Pre-revenue. Fully operational. Community already forming.
        </div>
      </div>

      {/* Divider */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "17vw", height: "1px", background: "rgba(202,146,43,0.3)" }} />

      {/* Two-column proof points */}

      {/* Left column — Product & Technical */}
      <div className="absolute" style={{ left: "6vw", top: "19vw", width: "41vw" }}>
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 600, marginBottom: "1.4vw" }}>PRODUCT &amp; TECHNICAL</div>

        <div className="flex items-start" style={{ gap: "1vw", marginBottom: "1.3vw" }}>
          <div className="font-display" style={{ fontSize: "1.4vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✅</div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06" }}>iOS app submitted to App Store</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408" }}>Full review underway — first submission approved</div>
          </div>
        </div>

        <div className="flex items-start" style={{ gap: "1vw", marginBottom: "1.3vw" }}>
          <div className="font-display" style={{ fontSize: "1.4vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✅</div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06" }}>Google Play testing active</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408" }}>Android internal testing live, Play store submission in progress</div>
          </div>
        </div>

        <div className="flex items-start" style={{ gap: "1vw", marginBottom: "1.3vw" }}>
          <div className="font-display" style={{ fontSize: "1.4vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✅</div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06" }}>KinfolkAI™ built and live</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408" }}>Multi-turn AI personalization, safety intel, business insights</div>
          </div>
        </div>

        <div className="flex items-start" style={{ gap: "1vw", marginBottom: "1.3vw" }}>
          <div className="font-display" style={{ fontSize: "1.4vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✅</div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06" }}>Business dashboard complete</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408" }}>Analytics, KinfolkAI™, growth tools — all live</div>
          </div>
        </div>

        <div className="flex items-start" style={{ gap: "1vw" }}>
          <div className="font-display" style={{ fontSize: "1.4vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✅</div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06" }}>Community safety reporting live</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408" }}>Neighborhood survey system actively collecting data</div>
          </div>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="absolute" style={{ left: "50vw", top: "19vw", bottom: "5.5vw", width: "1px", background: "rgba(58,31,14,0.12)" }} />

      {/* Right column — Community & Market */}
      <div className="absolute" style={{ left: "53vw", top: "19vw", right: "6vw" }}>
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 600, marginBottom: "1.4vw" }}>COMMUNITY &amp; MARKET</div>

        <div className="flex items-start" style={{ gap: "1vw", marginBottom: "1.3vw" }}>
          <div className="font-display" style={{ fontSize: "1.4vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✅</div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06" }}>Waitlist open and growing</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408" }}>Early adopters signed up ahead of public launch</div>
          </div>
        </div>

        <div className="flex items-start" style={{ gap: "1vw", marginBottom: "1.3vw" }}>
          <div className="font-display" style={{ fontSize: "1.4vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✅</div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06" }}>Founding businesses enrolled</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408" }}>Philadelphia pilot businesses onboarded and verified</div>
          </div>
        </div>

        <div className="flex items-start" style={{ gap: "1vw", marginBottom: "1.3vw" }}>
          <div className="font-display" style={{ fontSize: "1.4vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✅</div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06" }}>Founding community members</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408" }}>Early members seeding content, recommendations, and trust</div>
          </div>
        </div>

        <div className="flex items-start" style={{ gap: "1vw", marginBottom: "1.3vw" }}>
          <div className="font-display" style={{ fontSize: "1.4vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✅</div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06" }}>Brand &amp; IP established</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408" }}>Mapping With Melanin™, KinfolkAI™, Intentional Discovery™ protected</div>
          </div>
        </div>

        <div className="flex items-start" style={{ gap: "1vw" }}>
          <div className="font-display" style={{ fontSize: "1.4vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✅</div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06" }}>Philadelphia pilot program</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408" }}>First city launch underway — community flywheel activating</div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute left-[6vw] bottom-[2vw]">
        <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#A6720F", fontStyle: "italic" }}>
          The infrastructure is built. The community is forming. The flywheel is ready to spin.
        </div>
      </div>
    </div>
  );
}
