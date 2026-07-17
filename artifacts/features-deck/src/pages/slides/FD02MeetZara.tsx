export default function FD02MeetZara() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(202,146,43,0.12) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.28 }}>02</div>

      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "10%", bottom: "10%", width: "44vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "2.5vw" }}>
          MEET ZARA
        </div>
        <h2 className="font-display" style={{ fontSize: "4.4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "2.5vw" }}>
          She just landed<br />in Chicago.
        </h2>
        <div style={{ width: "4vw", height: "3px", background: "#CA922B", marginBottom: "2.5vw" }} />
        <p className="font-body" style={{ fontSize: "1.25vw", color: "#8A6030", lineHeight: 1.75, marginBottom: "1.8vw" }}>
          New city. New neighborhood. No idea which salon will handle her hair, which restaurant will feel like home, or which block she can walk at night without second-guessing herself.
        </p>
        <p className="font-body" style={{ fontSize: "1.25vw", color: "#6B4420", lineHeight: 1.75 }}>
          She&rsquo;s not looking for a list of places.<br />
          She&rsquo;s looking for a community that already knows.
        </p>
      </div>

      <div className="absolute flex flex-col justify-center gap-[1.6vw]" style={{ right: "7vw", top: "12%", bottom: "12%", width: "32vw" }}>
        {[
          { icon: "M12 2a7 7 0 1 1 0 14A7 7 0 0 1 12 2zm0 16c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z", label: "27 years old" },
          { icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", label: "New to Chicago" },
          { icon: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z", label: "Traveling solo" },
          { icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", label: "Building her network" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "1.2vw", padding: "1.2vw 1.6vw", borderRadius: "0.7vw", border: "1px solid rgba(202,146,43,0.18)", background: "rgba(202,146,43,0.04)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.6vw", height: "1.6vw", flexShrink: 0 }}>
              <path d={item.icon} />
            </svg>
            <span className="font-body" style={{ fontSize: "1.1vw", color: "#A07840", fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
