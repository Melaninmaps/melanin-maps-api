export default function SlideInv43TheProblem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 110%, rgba(202,146,43,0.08), transparent 60%)" }} />

      {/* Header */}
      <div className="absolute left-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 600 }}>FOR YOUR BUSINESS</div>
        <div className="font-display" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.1, marginTop: "0.5vw" }}>
          The tools that exist<br />
          <span style={{ color: "#CA922B" }}>weren't built for you.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.2vw", color: "#7B5408", lineHeight: 1.6, marginTop: "0.9vw", maxWidth: "52vw" }}>
          General platforms weren't designed with your community in mind. They can't solve a trust problem with a bigger ad budget.
        </div>
      </div>

      {/* Horizontal divider */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "17vw", height: "1px", background: "rgba(202,146,43,0.25)" }} />

      {/* Three-column problem grid */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "19vw", display: "flex", gap: "3vw" }}>

        {/* Column 1 */}
        <div style={{ flex: 1, background: "#FFFFFF", borderRadius: "1vw", padding: "2.2vw", border: "1px solid rgba(58,31,14,0.08)", borderTop: "3px solid #CA922B" }}>
          <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1.2vw" }}>
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" strokeDasharray="1.5 1.5" opacity="0.5" />
          </svg>
          <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 700, marginBottom: "0.6vw" }}>THE VISIBILITY GAP</div>
          <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.2, marginBottom: "1vw" }}>
            Invisible to your own community
          </div>
          <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.7 }}>
            Generic platforms rank businesses by ad spend and review volume — not by community trust. Your neighbors are searching for businesses like yours every day and not finding you.
          </div>
          <div style={{ marginTop: "1.5vw", paddingTop: "1.2vw", borderTop: "1px solid rgba(58,31,14,0.08)" }}>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#1C0E06", fontWeight: 700 }}>The result:</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#A87A40", marginTop: "0.3vw", lineHeight: 1.5 }}>Word-of-mouth happens without you — on text threads, group chats, and Facebook groups you'll never see.</div>
          </div>
        </div>

        {/* Column 2 */}
        <div style={{ flex: 1, background: "#FFFFFF", borderRadius: "1vw", padding: "2.2vw", border: "1px solid rgba(58,31,14,0.08)", borderTop: "3px solid #CA922B" }}>
          <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1.2vw" }}>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
            <line x1="6" y1="14" x2="10" y2="14" />
            <line x1="14" y1="14" x2="16" y2="14" />
          </svg>
          <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 700, marginBottom: "0.6vw" }}>THE TRUST GAP</div>
          <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.2, marginBottom: "1vw" }}>
            Ads don't build trust
          </div>
          <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.7 }}>
            Paid placements feel transactional. This community decides where to spend based on who their neighbors, friends, and family actually recommend — not who paid to appear first.
          </div>
          <div style={{ marginTop: "1.5vw", paddingTop: "1.2vw", borderTop: "1px solid rgba(58,31,14,0.08)" }}>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#1C0E06", fontWeight: 700 }}>The result:</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#A87A40", marginTop: "0.3vw", lineHeight: 1.5 }}>Ad spend goes up. Real community trust doesn't follow. You can't buy a recommendation.</div>
          </div>
        </div>

        {/* Column 3 */}
        <div style={{ flex: 1, background: "#FFFFFF", borderRadius: "1vw", padding: "2.2vw", border: "1px solid rgba(58,31,14,0.08)", borderTop: "3px solid #CA922B" }}>
          <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1.2vw" }}>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <line x1="10" y1="14" x2="14" y2="14" />
          </svg>
          <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 700, marginBottom: "0.6vw" }}>THE TOOLS GAP</div>
          <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.2, marginBottom: "1vw" }}>
            No tools built for your growth
          </div>
          <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.7 }}>
            Existing platforms offer generic analytics with no cultural context. No community insights, no reputation tools designed around how this community discovers and shares, no AI built for your market.
          </div>
          <div style={{ marginTop: "1.5vw", paddingTop: "1.2vw", borderTop: "1px solid rgba(58,31,14,0.08)" }}>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#1C0E06", fontWeight: 700 }}>The result:</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#A87A40", marginTop: "0.3vw", lineHeight: 1.5 }}>You're managing your business on tools that don't understand your customers or your community.</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] right-[8vw] bottom-[2vw]">
        <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic" }}>
          The platform your community deserves has always been missing. Until now.
        </div>
      </div>
    </div>
  );
}
