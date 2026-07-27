const JOBS = [
  { title: "Marketing Coordinator", biz: "Nubian Heritage", pay: "$48k–$55k", type: "Full-time", dist: "0.8 mi" },
  { title: "Event Production Asst.", biz: "BLK Capital Events", pay: "$22/hr", type: "Part-time", dist: "2.1 mi" },
  { title: "UI/UX Designer", biz: "FinFlo Tech", pay: "$80k–$95k", type: "Remote", dist: "Remote" },
];

const MENTORS = [
  { name: "David A.", specialty: "Finance & Investing", sessions: "Video · Async", avail: "Open" },
  { name: "Keesha L.", specialty: "Tech & Startups", sessions: "In-person · Video", avail: "Waitlist" },
];

export default function DemoS82OpportunityScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>82</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Opportunity.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Jobs and mentorship, inside the community.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Browse open roles ranked by distance. Find a mentor in finance, tech, or creative fields. Post a job or register as a mentor in 3 steps. No gatekeepers — just the community helping each other grow.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>The next opportunity is already in your community.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.28)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[0.9vw] pb-[0.6vw]" style={{ background: "#1C0E06", flexShrink: 0 }}>
              <span className="font-display" style={{ fontSize: "0.82vw", color: "#FAF6EF", fontWeight: 700 }}>Opportunity Center</span>
              <div className="flex gap-[0.35vw] mt-[0.5vw]">
                {["Jobs","Mentorship","Post a Job"].map((t, i) => (
                  <span key={t} className="font-body" style={{ fontSize: "0.46vw", fontWeight: 700, color: i === 0 ? "#1C0E06" : "#A87A40", background: i === 0 ? "#CA922B" : "#2A1408", padding: "0.2vw 0.5vw", borderRadius: "0.6vw" }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Near me filter */}
            <div className="flex items-center gap-[0.4vw] px-[0.7vw] py-[0.4vw]" style={{ background: "#FAF6EF", borderBottom: "1px solid #E8DDC8", flexShrink: 0 }}>
              <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span className="font-body" style={{ fontSize: "0.5vw", color: "#A6720F", fontWeight: 600 }}>Near Me · 5 mi radius</span>
              <div className="flex gap-[0.3vw]" style={{ marginLeft: "auto" }}>
                {["All","Full-time","Remote"].map((f, i) => (
                  <span key={f} className="font-body" style={{ fontSize: "0.42vw", fontWeight: 700, color: i === 0 ? "#FAF6EF" : "#A87A40", background: i === 0 ? "#CA922B" : "rgba(202,146,43,0.1)", padding: "0.1vw 0.4vw", borderRadius: "0.5vw" }}>{f}</span>
                ))}
              </div>
            </div>

            {/* Jobs list */}
            <div className="flex flex-col gap-[0.4vw] px-[0.55vw] pt-[0.5vw]" style={{ flexShrink: 0 }}>
              {JOBS.map((j, i) => (
                <div key={i} className="rounded-[0.75vw] p-[0.55vw]" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-body" style={{ fontSize: "0.6vw", fontWeight: 700, color: "#1C0E06" }}>{j.title}</div>
                      <div className="font-body" style={{ fontSize: "0.48vw", color: "#A87A40" }}>{j.biz}</div>
                    </div>
                    <span className="font-body" style={{ fontSize: "0.44vw", color: "#7B5408", background: "rgba(202,146,43,0.1)", padding: "0.12vw 0.35vw", borderRadius: "0.5vw" }}>{j.dist}</span>
                  </div>
                  <div className="flex items-center gap-[0.4vw] mt-[0.25vw]">
                    <span className="font-body" style={{ fontSize: "0.48vw", color: "#CA922B", fontWeight: 700 }}>{j.pay}</span>
                    <span style={{ width: "2px", height: "0.5vw", background: "#E8DDC8" }} />
                    <span className="font-body" style={{ fontSize: "0.46vw", color: "#A87A40" }}>{j.type}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mentorship divider */}
            <div className="flex items-center gap-[0.4vw] px-[0.7vw] py-[0.35vw] mt-[0.4vw]" style={{ background: "rgba(202,146,43,0.08)", borderTop: "1px solid #E8DDC8", borderBottom: "1px solid #E8DDC8", flexShrink: 0 }}>
              <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: "#A6720F" }}>Mentorship</span>
            </div>

            <div className="flex flex-col gap-[0.35vw] px-[0.55vw] pt-[0.4vw]" style={{ flexShrink: 0 }}>
              {MENTORS.map((m, i) => (
                <div key={i} className="flex items-center gap-[0.5vw] rounded-[0.75vw] p-[0.5vw]" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)" }}>
                  <div style={{ width: "2vw", height: "2vw", borderRadius: "50%", background: i === 0 ? "#CA922B" : "#1C5C3A", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="font-display" style={{ fontSize: "0.65vw", fontWeight: 800, color: "#FAF6EF" }}>{m.name[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#1C0E06" }}>{m.name}</div>
                    <div className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>{m.specialty}</div>
                    <div className="font-body" style={{ fontSize: "0.42vw", color: "#7B5408" }}>{m.sessions}</div>
                  </div>
                  <span className="font-body" style={{ fontSize: "0.44vw", fontWeight: 700, color: m.avail === "Open" ? "#2D7A4F" : "#A87A40", background: m.avail === "Open" ? "rgba(45,122,79,0.15)" : "rgba(168,122,64,0.1)", padding: "0.12vw 0.4vw", borderRadius: "0.5vw" }}>{m.avail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          {[
            { bold: "Near Me sorting", rest: " — Haversine distance ranks local jobs first. No promoted listings." },
            { bold: "3-step job post", rest: " — business owners publish roles immediately with pay range, type, and location." },
            { bold: "Mentor booking", rest: " — Calendly link embedded directly in mentor cards for instant scheduling." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-[0.5vw]">
              <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4, marginTop: "0.55vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}>
                <strong style={{ fontWeight: 700, color: "#A6720F" }}>{item.bold}</strong>{item.rest}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
