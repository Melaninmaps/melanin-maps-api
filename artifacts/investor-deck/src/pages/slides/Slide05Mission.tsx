const GOLD = "#A6720F";

function Icon({ name }: { name: string }) {
  const common = {
    width: "2.2vw",
    height: "2.2vw",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: GOLD,
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "discover":
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <line x1="15.3" y1="15.3" x2="21" y2="21" />
        </svg>
      );
    case "connect":
      return (
        <svg {...common}>
          <circle cx="8.5" cy="12" r="5" />
          <circle cx="15.5" cy="12" r="5" />
        </svg>
      );
    case "grow":
      return (
        <svg {...common}>
          <path d="M12 21V10" />
          <path d="M12 10C12 10 6 9.5 6 4C11.5 4 12 10 12 10Z" />
          <path d="M12 13C12 13 18 12.5 18 7C12.5 7 12 13 12 13Z" />
        </svg>
      );
    case "travel":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.2 8.8L13 13L8.8 15.2L11 11L15.2 8.8Z" />
        </svg>
      );
    case "belong":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="2.6" />
          <path d="M4.5 18.5C4.5 15 6.5 12.8 9 12.8C11.5 12.8 13.5 15 13.5 18.5" />
          <circle cx="16" cy="9" r="2.2" />
          <path d="M12.8 18.5C13 15.6 14.4 13.8 16.3 13.8C18.5 13.8 20 15.9 20 18.5" />
        </svg>
      );
    default:
      return null;
  }
}

const pillars = [
  { icon: "discover", title: "Discover" },
  { icon: "connect", title: "Connect" },
  { icon: "grow", title: "Thrive" },
  { icon: "travel", title: "Travel" },
  { icon: "belong", title: "Belong" },
];

export default function Slide05Mission() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>05</div>

      <div className="absolute left-[6vw] right-[6vw] top-[14vh] text-center">
        <div className="font-body" style={{ fontSize: "1.5vw", color: "#7B5408", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE JOURNEY TO BELONGING
        </div>
        <h1 className="font-display leading-tight mt-[2.6vh]" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          Everything we built starts here.
        </h1>
      </div>

      <div className="absolute left-[12vw] right-[12vw] top-[45vh]" style={{ height: "1px", background: GOLD, opacity: 0.3 }} />

      <div className="absolute left-[6vw] right-[6vw] top-[39vh] grid grid-cols-5 gap-[1.6vw]">
        {pillars.map((p) => (
          <div key={p.title} className="flex flex-col items-center text-center gap-[1.6vh]">
            <div
              className="flex items-center justify-center"
              style={{
                width: "4.5vw",
                height: "4.5vw",
                borderRadius: "50%",
                border: `1.3px solid ${GOLD}`,
                background: "#FAF6EF",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Icon name={p.icon} />
            </div>
            <div className="font-display" style={{ fontSize: "2vw", fontWeight: 700, color: "#1C0E06" }}>{p.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
