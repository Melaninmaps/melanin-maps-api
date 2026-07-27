export default function BizSlide06HowBusinessesGrow() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 100%, rgba(202,146,43,0.08), transparent 55%)" }} />

      {/* Header */}
      <div className="absolute left-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1.2vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.5vw" }}>YOUR GROWTH TOOLKIT</div>
        <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.08 }}>
          How businesses grow<br />
          <span style={{ color: "#CA922B" }}>on Mapping With Melanin™.</span>
        </div>
      </div>

      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "15vw", height: "1px", background: "rgba(202,146,43,0.2)" }} />

      {/* 5-tool grid */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "16.5vw", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.2vw" }}>

        {/* Business Dashboard */}
        <div style={{ background: "#FFFFFF", borderRadius: "1vw", padding: "1.8vw 1.4vw", border: "1px solid rgba(58,31,14,0.08)", borderTop: "3px solid #CA922B" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1vw" }}>
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
          <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.4vw" }}>DASHBOARD</div>
          <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.2, marginBottom: "0.8vw" }}>Business Dashboard</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408", lineHeight: 1.6 }}>Your command center. Manage your profile, respond to reviews, and track performance — all in one place.</div>
          <div style={{ marginTop: "1vw", paddingTop: "0.8vw", borderTop: "1px solid rgba(58,31,14,0.06)" }}>
            <div className="font-body" style={{ fontSize: "0.72vw", color: "#A87A40" }}>Profile editor · Media uploads · Hours &amp; contact · Category tags</div>
          </div>
        </div>

        {/* Analytics */}
        <div style={{ background: "#FFFFFF", borderRadius: "1vw", padding: "1.8vw 1.4vw", border: "1px solid rgba(58,31,14,0.08)", borderTop: "3px solid #CA922B" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1vw" }}>
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.4vw" }}>ANALYTICS</div>
          <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.2, marginBottom: "0.8vw" }}>Performance Analytics</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408", lineHeight: 1.6 }}>See who's viewing, saving, and sharing your business. Understand which searches are landing on your profile.</div>
          <div style={{ marginTop: "1vw", paddingTop: "0.8vw", borderTop: "1px solid rgba(58,31,14,0.06)" }}>
            <div className="font-body" style={{ fontSize: "0.72vw", color: "#A87A40" }}>Views · Saves · Search rank · Weekly trends</div>
          </div>
        </div>

        {/* Customer Insights */}
        <div style={{ background: "#FFFFFF", borderRadius: "1vw", padding: "1.8vw 1.4vw", border: "1px solid rgba(58,31,14,0.08)", borderTop: "3px solid #CA922B" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1vw" }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.4vw" }}>CUSTOMER INSIGHTS</div>
          <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.2, marginBottom: "0.8vw" }}>Know Your Community</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408", lineHeight: 1.6 }}>Understand who your customers are, what they say about you, and what the community wants from businesses like yours.</div>
          <div style={{ marginTop: "1vw", paddingTop: "0.8vw", borderTop: "1px solid rgba(58,31,14,0.06)" }}>
            <div className="font-body" style={{ fontSize: "0.72vw", color: "#A87A40" }}>Review sentiment · Neighborhood breakdown · Category demand</div>
          </div>
        </div>

        {/* Events */}
        <div style={{ background: "#FFFFFF", borderRadius: "1vw", padding: "1.8vw 1.4vw", border: "1px solid rgba(58,31,14,0.08)", borderTop: "3px solid #CA922B" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1vw" }}>
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.4vw" }}>EVENTS</div>
          <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.2, marginBottom: "0.8vw" }}>Host &amp; Promote Events</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408", lineHeight: 1.6 }}>Create events that appear in community feeds and the Mapping With Melanin™ events calendar. Drive foot traffic directly.</div>
          <div style={{ marginTop: "1vw", paddingTop: "0.8vw", borderTop: "1px solid rgba(58,31,14,0.06)" }}>
            <div className="font-body" style={{ fontSize: "0.72vw", color: "#A87A40" }}>Event creation · Community feed · RSVPs · Recurring events</div>
          </div>
        </div>

        {/* KinfolkAI */}
        <div style={{ background: "#3D2417", borderRadius: "1vw", padding: "1.8vw 1.4vw", border: "1px solid rgba(202,146,43,0.3)", borderTop: "3px solid #CA922B" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1vw" }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.4vw" }}>AI</div>
          <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.2, marginBottom: "0.8vw" }}>KinfolkAI™</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#A87A40", lineHeight: 1.6 }}>AI trained on your community. Drafts marketing copy, suggests responses to reviews, and surfaces what your customers want to see.</div>
          <div style={{ marginTop: "1vw", paddingTop: "0.8vw", borderTop: "1px solid rgba(202,146,43,0.15)" }}>
            <div className="font-body" style={{ fontSize: "0.72vw", color: "#7B5408" }}>Marketing drafts · Review responses · Trend alerts · Audience insights</div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] right-[6vw] bottom-[2vw]">
        <div className="font-display" style={{ fontSize: "1vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic" }}>
          Every tool designed around how your community actually discovers and supports businesses.
        </div>
      </div>
    </div>
  );
}
