export default function DemoS33SafetyToolsScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>33</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Check In.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Zara is meeting someone new. She activates Check-In.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          She schedules a check-in for 10 PM with her sister. If Zara doesn't tap "I'm safe" by then, her sister gets an automatic alert with her last known location. No app needed on the sister's end.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Someone always knows where you are.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.3vw] pb-[0.7vw]" style={{ flexShrink: 0 }}>
              <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 800, color: "#1C0E06" }}>Safety Check-In</div>
              <div className="font-body mt-[0.1vw]" style={{ fontSize: "0.55vw", color: "#16A34A", fontWeight: 600 }}>Active — monitoring until 10:00 PM</div>
            </div>

            {/* Active check-in card */}
            <div className="mx-[1vw] mb-[0.7vw] rounded-[0.8vw] p-[0.8vw]" style={{ background: "linear-gradient(135deg,#F0FDF4,#ECFDF5)", border: "1px solid #16A34A40", flexShrink: 0 }}>
              <div className="flex items-center gap-[0.5vw] mb-[0.4vw]">
                <div style={{ width: "0.7vw", height: "0.7vw", borderRadius: "50%", background: "#16A34A" }} />
                <span className="font-body" style={{ fontSize: "0.55vw", fontWeight: 700, color: "#16A34A" }}>CHECK-IN ACTIVE</span>
              </div>
              <div className="font-body" style={{ fontSize: "0.58vw", color: "#1C0E06", fontWeight: 700 }}>Zara's first meetup with Javier from the app</div>
              <div className="font-body mt-[0.12vw]" style={{ fontSize: "0.5vw", color: "#7A5530" }}>Location: Copper & Oak Bistro, Shaw DC</div>
              <div className="font-body mt-[0.12vw]" style={{ fontSize: "0.5vw", color: "#7A5530" }}>Check-in deadline: 10:00 PM</div>
              <div className="font-body mt-[0.1vw]" style={{ fontSize: "0.5vw", color: "#A87A40" }}>Trusted contact: Maya (sister) — will be notified if missed</div>
              <div className="w-full flex items-center justify-center rounded-[0.6vw] py-[0.55vw] mt-[0.6vw]" style={{ background: "#16A34A" }}>
                <span className="font-body" style={{ fontSize: "0.62vw", fontWeight: 700, color: "#FFF" }}>✓ I'm Safe — Check In Now</span>
              </div>
            </div>

            {/* Location sharing */}
            <div className="px-[1vw] flex-1">
              <div className="font-body mb-[0.4vw]" style={{ fontSize: "0.48vw", color: "#A87A40", fontWeight: 600 }}>LOCATION SHARING — ALSO ACTIVE</div>
              <div className="rounded-[0.75vw] p-[0.7vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                <div className="flex items-center justify-between mb-[0.4vw]">
                  <span className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#1C0E06" }}>Live link shared with Maya</span>
                  <div className="rounded-[0.25vw] px-[0.4vw] py-[0.1vw]" style={{ background: "#16A34A" }}>
                    <span className="font-body" style={{ fontSize: "0.42vw", fontWeight: 700, color: "#FFF" }}>LIVE</span>
                  </div>
                </div>
                <div className="font-body" style={{ fontSize: "0.5vw", color: "#7A5530", marginBottom: "0.3vw" }}>Maya can see your exact location in real time. No app install needed on her end. Expires at 11 PM.</div>
                <div className="flex gap-[0.4vw]">
                  <div className="flex-1 flex items-center justify-center rounded-[0.5vw] py-[0.45vw]" style={{ background: "#F0E8D8", border: "1px solid #DDD0B8" }}>
                    <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: "#7B5408" }}>Extend time</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center rounded-[0.5vw] py-[0.45vw]" style={{ background: "#FEF2F2", border: "1px solid #DC262640" }}>
                    <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: "#DC2626" }}>Stop sharing</span>
                  </div>
                </div>
              </div>

              {/* Meetup verification */}
              <div className="rounded-[0.75vw] p-[0.65vw] mt-[0.5vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                <div className="font-display mb-[0.2vw]" style={{ fontSize: "0.65vw", fontWeight: 700, color: "#1C0E06" }}>Meetup Verification</div>
                <div className="font-body" style={{ fontSize: "0.5vw", color: "#7A5530" }}>Both parties tap "Verify Meetup" when they arrive. Mutual confirmation logged for safety context.</div>
                <div className="w-full flex items-center justify-center rounded-[0.5vw] py-[0.45vw] mt-[0.4vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.35)" }}>
                  <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: "#CA922B" }}>Verify We're Together →</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Automatic alert</strong> if the check-in deadline passes without confirmation.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>No app required</strong> for the trusted contact — just a live link.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Meetup Verification</strong> — both people confirm arrival for mutual safety.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
