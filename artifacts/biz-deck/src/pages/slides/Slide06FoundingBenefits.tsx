export default function Slide06FoundingBenefits() {
  const benefits = [
    { n: "01", title: "Permanent Gold Badge",      body: "Founding business seal displayed on your profile forever",   hi: true },
    { n: "02", title: "Priority Listing",          body: "Top placement in search, map, and category results",        hi: false },
    { n: "03", title: "Locked-In Rate",            body: "Founding member pricing stays fixed as the platform grows", hi: true },
    { n: "04", title: "Early Feature Access",      body: "First to use new business tools and dashboard features",    hi: false },
    { n: "05", title: "Featured in Launch",        body: "Included in city launch marketing and press",               hi: true },
  ];

  return (
    <div className="w-screen h-screen overflow-hidden flex" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(90,45,10,0.4) 0%, transparent 55%)" }} />

      {/* Gold left column */}
      <div className="flex-shrink-0 w-[8vw] flex flex-col items-center justify-center" style={{ background: "#CA922B" }}>
        <div className="font-display" style={{ fontSize: "1.8vw", fontWeight: 800, letterSpacing: "0.2em", writingMode: "vertical-rl", transform: "rotate(180deg)", color: "#1C0E06" }}>
          FOUNDING 500
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col pl-[4vw] pr-[6vw] pt-[5vh] pb-[5vh]">
        {/* Header */}
        <div className="mb-[2vh]">
          <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.15 }}>
            Founding benefits.
          </h2>
          <div className="biz-bar w-[13vw] mt-[1.2vh]" />
        </div>

        {/* 5 benefits */}
        <div className="flex-1 flex flex-col justify-evenly">
          {benefits.map(({ n, title, body, hi }) => (
            <div
              key={n}
              className="flex items-center gap-[2.5vw] py-[1.5vh] px-[2.5vw]"
              style={{
                background: hi ? "rgba(202,146,43,0.12)" : "rgba(202,146,43,0.06)",
                border: `1px solid ${hi ? "rgba(202,146,43,0.35)" : "rgba(202,146,43,0.2)"}`,
              }}
            >
              <div className="font-display flex-shrink-0" style={{ fontSize: "3vw", fontWeight: 800, color: "#CA922B" }}>{n}</div>
              <div>
                <div className="font-display" style={{ fontSize: "2.5vw", fontWeight: 800, color: "#FAF6EF" }}>{title}</div>
                <div className="font-body" style={{ fontSize: "2.1vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.75, lineHeight: 1.3 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
