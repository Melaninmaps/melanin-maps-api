export default function Slide07Dashboard() {
  const cards = [
    { title: "Analytics",          body: "Views, clicks, saves, and engagement over time",      hi: true },
    { title: "Review Management",  body: "Respond to reviews and flag inaccurate content",      hi: false },
    { title: "Profile Editor",     body: "Update photos, hours, menu, and owner story",         hi: true },
    { title: "Event Posting",      body: "Create and promote events to local members",          hi: false },
    { title: "Verification",       body: "Submit ownership docs to earn the verified badge",    hi: true },
    { title: "Promotions",         body: "Boost placement with targeted paid promotion slots",  hi: false },
  ];

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(90,45,10,0.35) 0%, transparent 55%)" }} />
      <div className="absolute top-0 left-0 right-0 h-[0.5vh]" style={{ background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>07</div>

      {/* Header */}
      <div className="relative px-[7vw] pt-[5vh] pb-[2.5vh]">
        <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.15 }}>
          Business Dashboard.
        </h2>
        <div className="biz-bar w-[14vw] mt-[1.2vh]" />
      </div>

      {/* 3×2 grid */}
      <div className="relative flex-1 px-[7vw] pb-[6vh]">
        <div className="grid grid-cols-3 gap-[2vw] h-full">
          {cards.map(({ title, body, hi }) => (
            <div
              key={title}
              className="min-w-0 overflow-hidden flex flex-col justify-start px-[2vw] py-[2.5vh]"
              style={{
                background: hi ? "rgba(202,146,43,0.12)" : "rgba(202,146,43,0.06)",
                border: `1px solid ${hi ? "rgba(202,146,43,0.4)" : "rgba(202,146,43,0.2)"}`,
              }}
            >
              <div className="font-display mb-[1vh]" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#CA922B" }}>{title}</div>
              <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.45 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
