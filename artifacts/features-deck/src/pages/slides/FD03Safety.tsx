export default function FD03Safety() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 70%, rgba(202,146,43,0.12) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.25 }}>02</div>

      <div className="absolute" style={{ left: "7vw", top: "6vw" }}>
        <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "0.8vw" }}>COMMUNITY INTELLIGENCE</div>
        <div className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.5vw" }}>
          Know what your community knows.
        </div>
        <div className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.05, marginBottom: "2.5vw" }}>
          Before you arrive.
        </div>
      </div>

      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "22vw", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5vw" }}>
        <div style={{ padding: "1.8vw 2vw", border: "1px solid rgba(202,146,43,0.3)", background: "rgba(202,146,43,0.08)" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1vw" }}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.6vw" }}>Confidence Layer</div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#7B5408", lineHeight: 1.55, fontWeight: 400 }}>Neighborhood community scores sourced from people who actually live and travel there</div>
        </div>
        <div style={{ padding: "1.8vw 2vw", border: "1px solid rgba(202,146,43,0.18)", background: "rgba(250,246,239,0.03)" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1vw" }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.6vw" }}>Community Alerts</div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#7B5408", lineHeight: 1.55, fontWeight: 400 }}>Hyper-local, community-reported awareness delivered to your network in real time</div>
        </div>
        <div style={{ padding: "1.8vw 2vw", border: "1px solid rgba(202,146,43,0.18)", background: "rgba(250,246,239,0.03)" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1vw" }}><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.6vw" }}>Move Alerts</div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#7B5408", lineHeight: 1.55, fontWeight: 400 }}>Know when a neighborhood shifts &mdash; insight for relocation decisions before you commit</div>
        </div>
        <div style={{ padding: "1.8vw 2vw", border: "1px solid rgba(202,146,43,0.18)", background: "rgba(250,246,239,0.03)" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1vw" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.6vw" }}>Safe Spaces</div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#7B5408", lineHeight: 1.55, fontWeight: 400 }}>Community-verified welcoming venues, gathering spots, and supportive spaces</div>
        </div>
        <div style={{ padding: "1.8vw 2vw", border: "1px solid rgba(202,146,43,0.18)", background: "rgba(250,246,239,0.03)" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1vw" }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.6vw" }}>Emergency Resources</div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#7B5408", lineHeight: 1.55, fontWeight: 400 }}>Vetted support services, urgent care, and contacts available wherever you are</div>
        </div>
        <div style={{ padding: "1.8vw 2vw", border: "1px solid rgba(202,146,43,0.3)", background: "rgba(202,146,43,0.06)" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1vw" }}><path d="M1 6l5.5 5.5L12 6l5.5 5.5L23 6" /><path d="M1 12l5.5 5.5L12 12l5.5 5.5L23 12" /></svg>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.6vw" }}>Officer Watch</div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#7B5408", lineHeight: 1.55, fontWeight: 400 }}>Community-reported encounters shared so members can travel with informed awareness</div>
        </div>
      </div>

      <div className="absolute left-[7vw] right-[7vw]" style={{ bottom: "3vw" }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.2)", marginBottom: "1.2vw" }} />
        <div className="font-quote" style={{ fontSize: "1.1vw", fontStyle: "italic", color: "#A87A40", textAlign: "center" }}>
          Community-powered awareness &mdash; not a police scanner.
        </div>
      </div>
    </div>
  );
}
