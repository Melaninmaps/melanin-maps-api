export default function DemoS34OfficerWatchScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>34</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Accountable.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          We built the features no other app would.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Report Police or ICE, track officers flagged for violence, flag unsafe or discriminatory spaces — anonymously if needed. These features exist because the diaspora deserves tools that reflect their actual relationship with institutions.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>The community protects the community.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.3vw] pb-[0.7vw]" style={{ flexShrink: 0 }}>
              <div className="font-display" style={{ fontSize: "0.95vw", fontWeight: 800, color: "#1C0E06" }}>Safety Hub — Critical Tools</div>
            </div>

            {/* Feature blocks */}
            <div className="flex flex-col gap-[0.5vw] px-[1vw] flex-1" style={{ overflow: "hidden" }}>
              {[
                {
                  title: "Report Police or ICE Activity",
                  desc: "Geo-tag an encounter or checkpoint. Appears immediately on the community map as a verified alert. 3 fields: location, type, details.",
                  color: "#DC2626",
                  action: "File a Report",
                },
                {
                  title: "Anonymous Report",
                  desc: "Submit any safety tip, unsafe space, or discriminatory encounter without your name or profile attached. Encrypted and forwarded to relevant community channels.",
                  color: "#7C3AED",
                  action: "Report Anonymously",
                },
                {
                  title: "Report an Unsafe Space",
                  desc: "Flag a business for discriminatory service, harassment, or safety concerns. Reviewed by community moderators before any action affects the Trust Score.",
                  color: "#7C2D12",
                  action: "Flag This Space",
                },
                {
                  title: "Officer Watch",
                  desc: "Search officers flagged by community members for racial profiling or excessive force. Track transfers to your neighborhood. Based on public record and community testimony.",
                  color: "#1E3A5F",
                  action: "Search Officer Database",
                },
                {
                  title: "Sex Offender Registry",
                  desc: "National registry search by neighborhood or address. Surfaced directly in the Safety Hub — no leaving the app.",
                  color: "#4338CA",
                  action: "Search Registry",
                },
              ].map((f, i) => (
                <div key={i} className="rounded-[0.7vw] p-[0.6vw]" style={{ background: "#FFFFFF", border: `1px solid ${f.color}30` }}>
                  <div className="flex items-center gap-[0.45vw] mb-[0.2vw]">
                    <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: f.color, flexShrink: 0 }} />
                    <span className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#1C0E06" }}>{f.title}</span>
                  </div>
                  <div className="font-body mb-[0.25vw]" style={{ fontSize: "0.48vw", color: "#7A5530", lineHeight: 1.45 }}>{f.desc}</div>
                  <div className="inline-block rounded-[0.4vw] px-[0.5vw] py-[0.12vw]" style={{ background: `${f.color}15`, border: `1px solid ${f.color}40` }}>
                    <span className="font-body" style={{ fontSize: "0.42vw", fontWeight: 700, color: f.color }}>{f.action} →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>5 accountability features</strong> in one tab — unprecedented for a consumer app.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Full anonymity</strong> available for sensitive reports — encrypted, no profile attached.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Community moderation</strong> — reports reviewed before any Trust Score impact.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
