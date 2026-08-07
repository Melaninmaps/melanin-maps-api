import React, { useState } from "react";

const GOLD = "#CA922B";

const SITES = [
  {
    id: "1",
    name: "Mother Bethel A.M.E. Church",
    heritageCategory: "Religious Heritage",
    pinType: "cultural_site",
    listingStatus: "live_unclaimed",
    city: "Philadelphia",
    state: "PA",
    culturalCommunity: "African American",
    description:
      "Founded in 1794 by Richard Allen, Mother Bethel is the oldest parcel of land continuously owned by African Americans in the United States. The church was a key stop on the Underground Railroad.",
    visitTip:
      "Sunday services are open to visitors. The museum in the lower level has original Allen artifacts and freedom documents.",
    externalUrl: "https://www.motherbethel.org",
  },
  {
    id: "2",
    name: "Clark Park Farmers Market",
    heritageCategory: "Community Gathering",
    pinType: "farmers_market",
    listingStatus: "live_unclaimed",
    city: "Philadelphia",
    state: "PA",
    culturalCommunity: "West Philly",
    description:
      "Weekly outdoor market anchoring the Clark Park neighborhood. Black and immigrant-owned vendors, fresh produce, hot food, and live music every Saturday morning.",
    visitTip:
      "Arrive before 11am for the best selection. The Jamaican beef patty stand sells out by noon.",
    externalUrl: null,
  },
  {
    id: "3",
    name: "Mural Arts — 'All Things Bright and Beautiful'",
    heritageCategory: "Public Art",
    pinType: "mural_or_public_art",
    listingStatus: "live_unclaimed",
    city: "Philadelphia",
    state: "PA",
    culturalCommunity: "African American",
    description:
      "One of Philadelphia's most celebrated murals, painted in North Philly. Captures the spirit of the community through vibrant imagery of everyday life.",
    visitTip: "Best photographed in morning light from the east side of the street.",
    externalUrl: null,
  },
  {
    id: "4",
    name: "Lincoln University",
    heritageCategory: "HBCU",
    pinType: "HBCU",
    listingStatus: "live_unclaimed",
    city: "Lincoln University",
    state: "PA",
    culturalCommunity: "HBCU",
    description:
      "The first degree-granting HBCU in the United States, founded 1854. Alumni include Thurgood Marshall, Langston Hughes, and Kwame Nkrumah.",
    visitTip:
      "Visit the Langston Hughes Memorial Library. Campus tours available weekdays — call ahead.",
    externalUrl: null,
  },
];

type Site = typeof SITES[0];

const PIN_STYLES: Record<string, { color: string; label: string; shape: string }> = {
  cultural_site:      { color: "#92400E", label: "Cultural Site",   shape: "◆" },
  heritage_landmark:  { color: "#B45309", label: "Heritage Landmark", shape: "◆" },
  farmers_market:     { color: "#16A34A", label: "Farmers Market",  shape: "◆" },
  pop_up_market:      { color: "#16A34A", label: "Pop-Up Market",   shape: "◆" },
  mural_or_public_art:{ color: "#0891B2", label: "Public Art",      shape: "◆" },
  community_org:      { color: "#D97706", label: "Community Org",   shape: "◆" },
  HBCU:               { color: "#7C3AED", label: "HBCU",            shape: "◆" },
  festival_or_event:  { color: "#7C3AED", label: "Event",           shape: "◆" },
  heritage_district:  { color: "#D97706", label: "Heritage District", shape: "◆" },
};

function getPinStyle(site: Site) {
  return PIN_STYLES[site.pinType] ?? PIN_STYLES["cultural_site"];
}

function DiamondPin({ color, selected }: { color: string; selected: boolean }) {
  return (
    <div
      style={{
        width: selected ? 22 : 16,
        height: selected ? 22 : 16,
        backgroundColor: color,
        transform: "rotate(45deg)",
        boxShadow: selected
          ? `0 0 0 3px ${color}40, 0 2px 8px ${color}80`
          : "0 1px 4px rgba(0,0,0,0.3)",
        border: "2px solid white",
        transition: "all 0.15s ease",
        cursor: "pointer",
        flexShrink: 0,
      }}
    />
  );
}

function BusinessPin() {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: "50%",
      backgroundColor: GOLD, border: "2.5px solid #2B1507",
      boxShadow: "0 1px 4px rgba(0,0,0,0.25)", flexShrink: 0,
    }} />
  );
}

function SiteCard({ site, onClose }: { site: Site; onClose: () => void }) {
  const ps = getPinStyle(site);
  const isUnclaimed = site.listingStatus === "live_unclaimed";

  return (
    <div style={{
      background: "#fff",
      borderRadius: 20,
      border: `1.5px solid ${ps.color}40`,
      boxShadow: "0 -2px 24px rgba(0,0,0,0.12)",
      padding: "20px 20px 16px",
      maxWidth: 380,
      width: "100%",
      fontFamily: "'Inter', system-ui, sans-serif",
      position: "relative",
    }}>
      {/* Handle */}
      <div style={{
        width: 36, height: 4, background: "#DDD0B8",
        borderRadius: 2, margin: "0 auto 16px", opacity: 0.6,
      }} />

      {/* Close */}
      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 16,
        background: "none", border: "none", cursor: "pointer",
        color: "#7A5530", fontSize: 18, lineHeight: 1, padding: 4,
      }}>✕</button>

      {/* Unclaimed banner */}
      {isUnclaimed && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 7,
          border: `1px solid ${GOLD}50`, borderRadius: 10,
          padding: "8px 12px", marginBottom: 14,
          background: "rgba(202,146,43,0.07)",
        }}>
          <span style={{ fontSize: 12, color: GOLD, marginTop: 1 }}>ℹ</span>
          <span style={{ fontSize: 11, color: GOLD, lineHeight: 1.5 }}>
            Community Listed — This place has not yet claimed its profile. Info provided by the MWM community.
          </span>
        </div>
      )}

      {/* Category pill + community chip */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: `${ps.color}18`, color: ps.color,
          fontSize: 10, fontWeight: 700, padding: "3px 9px",
          borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.04em",
        }}>
          {ps.shape} {ps.label}
        </span>
        {site.culturalCommunity && (
          <span style={{
            display: "inline-flex", alignItems: "center",
            background: "#F0E8D8", color: "#7A5530",
            fontSize: 10, fontWeight: 600, padding: "3px 9px",
            borderRadius: 99, border: "1px solid #DDD0B8",
          }}>
            {site.culturalCommunity}
          </span>
        )}
      </div>

      {/* Name */}
      <div style={{ fontSize: 17, fontWeight: 700, color: "#2B1507", lineHeight: 1.3, marginBottom: 3 }}>
        {site.name}
      </div>
      <div style={{ fontSize: 12, color: "#7A5530", marginBottom: 12 }}>
        {site.city}, {site.state}
      </div>

      {/* Description */}
      <div style={{ fontSize: 13, color: "#3A1F0E", lineHeight: 1.6, marginBottom: 10 }}>
        {site.description}
      </div>

      {/* Visit tip */}
      {site.visitTip && (
        <div style={{
          borderLeft: `3px solid ${ps.color}`,
          paddingLeft: 10, paddingTop: 6, paddingBottom: 6,
          marginBottom: 14,
          background: `${ps.color}0D`,
          borderRadius: "0 6px 6px 0",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: ps.color, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Visitor Tip
          </div>
          <div style={{ fontSize: 12, color: "#3A1F0E", lineHeight: 1.55, fontStyle: "italic" }}>
            {site.visitTip}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button style={{
          flex: 1, padding: "9px 0",
          border: `1.5px solid ${ps.color}`, borderRadius: 10,
          background: "transparent", color: ps.color,
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          ↗ Directions
        </button>
        <button style={{
          flex: 1, padding: "9px 0",
          border: "none", borderRadius: 10,
          background: ps.color, color: "#fff",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          ◆ View Site
        </button>
      </div>

      {/* Secondary links */}
      <div style={{ display: "flex", gap: 16 }}>
        {site.externalUrl && (
          <a href={site.externalUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: ps.color, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
            ↗ Learn More
          </a>
        )}
        <span style={{ fontSize: 12, color: "#7A5530", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
          🗺 {site.city}'s Living Legacy
        </span>
      </div>
    </div>
  );
}

export default function Task101PinDemo() {
  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const selected = SITES.find((s) => s.id === selectedId && !dismissed.has(s.id)) ?? null;

  const legend = [
    { color: GOLD, label: "Community Business", round: true },
    { color: "#92400E", label: "Cultural Site" },
    { color: "#7C3AED", label: "HBCU / Event" },
    { color: "#16A34A", label: "Farmers Market" },
    { color: "#0891B2", label: "Public Art" },
    { color: "#D97706", label: "Community Org" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1C1208",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 24px",
        background: "rgba(0,0,0,0.4)",
        borderBottom: "1px solid rgba(202,146,43,0.2)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
          <span style={{ color: GOLD, fontWeight: 700, fontSize: 14 }}>Mapping With Melanin™ — Philadelphia Map Demo</span>
        </div>
        <span style={{ color: "#7A5530", fontSize: 11 }}>Task #101 · Cultural Pin Experience</span>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Fake map */}
        <div style={{
          flex: 1,
          background: "linear-gradient(135deg, #2D3A2E 0%, #1F2D20 50%, #2A3520 100%)",
          position: "relative",
          overflow: "hidden",
          minHeight: 520,
        }}>
          {/* Grid lines */}
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={`h${i}`} style={{ position: "absolute", top: `${i*14+3}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.04)" }} />
          ))}
          {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
            <div key={`v${i}`} style={{ position: "absolute", left: `${i*10+2}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.04)" }} />
          ))}

          {/* Road lines */}
          <div style={{ position: "absolute", top: "38%", left: "5%", right: "5%", height: 3, background: "rgba(80,70,50,0.6)", borderRadius: 2 }} />
          <div style={{ position: "absolute", top: "60%", left: "10%", right: "10%", height: 2, background: "rgba(80,70,50,0.4)" }} />
          <div style={{ position: "absolute", left: "30%", top: "10%", bottom: "10%", width: 2, background: "rgba(80,70,50,0.4)" }} />
          <div style={{ position: "absolute", left: "65%", top: "15%", bottom: "15%", width: 3, background: "rgba(80,70,50,0.6)", borderRadius: 2 }} />

          {/* Business pins (round) */}
          {[{x:20,y:45},{x:42,y:25},{x:55,y:70},{x:72,y:30},{x:80,y:55}].map((p,i) => (
            <div key={i} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", cursor: "pointer" }}>
              <BusinessPin />
            </div>
          ))}

          {/* Cultural site pins (diamond) — click to show card */}
          {SITES.map((site, i) => {
            const positions = [{x:35,y:38},{x:52,y:55},{x:68,y:22},{x:18,y:65}];
            const pos = positions[i];
            const ps = getPinStyle(site);
            const isSel = selectedId === site.id && !dismissed.has(site.id);
            return (
              <div
                key={site.id}
                style={{
                  position: "absolute",
                  left: `${pos.x}%`, top: `${pos.y}%`,
                  transform: "translate(-50%,-50%)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: isSel ? 10 : 2,
                }}
                onClick={() => { setSelectedId(site.id); setDismissed(prev => { const n = new Set(prev); n.delete(site.id); return n; }); }}
              >
                <DiamondPin color={ps.color} selected={isSel} />
                {isSel && (
                  <div style={{
                    position: "absolute", bottom: "calc(100% + 6px)",
                    background: ps.color, color: "#fff",
                    fontSize: 10, fontWeight: 700, padding: "3px 8px",
                    borderRadius: 6, whiteSpace: "nowrap", pointerEvents: "none",
                  }}>
                    {site.name.length > 24 ? site.name.slice(0,24)+"…" : site.name}
                  </div>
                )}
              </div>
            );
          })}

          {/* Legend */}
          <div style={{
            position: "absolute", bottom: 16, left: 16,
            background: "rgba(255,255,255,0.93)", borderRadius: 12,
            padding: "10px 14px",
            display: "flex", flexWrap: "wrap", gap: "8px 16px",
            maxWidth: 420, boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          }}>
            {legend.map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {l.round
                  ? <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, border: "1.5px solid #2B1507" }} />
                  : <div style={{ width: 10, height: 10, background: l.color, transform: "rotate(45deg)", border: "1.5px solid white" }} />
                }
                <span style={{ fontSize: 10, fontWeight: 600, color: "#3A1F0E" }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Instruction overlay if nothing selected */}
          {!selected && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              background: "rgba(0,0,0,0.6)",
              color: "#fff", borderRadius: 12,
              padding: "12px 20px", fontSize: 13, textAlign: "center",
              pointerEvents: "none",
              backdropFilter: "blur(4px)",
            }}>
              ◆ Tap a diamond pin to see the new site card
            </div>
          )}
        </div>

        {/* Side panel with site selectors */}
        <div style={{
          width: 220, background: "#FAF6EF",
          borderLeft: "1px solid #DDD0B8",
          padding: "16px 12px",
          display: "flex", flexDirection: "column", gap: 8,
          overflowY: "auto",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7A5530", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Philadelphia Pins
          </div>
          {SITES.map((site) => {
            const ps = getPinStyle(site);
            const isSel = selectedId === site.id;
            return (
              <button
                key={site.id}
                onClick={() => { setSelectedId(site.id); setDismissed(prev => { const n = new Set(prev); n.delete(site.id); return n; }); }}
                style={{
                  textAlign: "left", border: isSel ? `1.5px solid ${ps.color}` : "1.5px solid #DDD0B8",
                  borderRadius: 10, padding: "10px 10px",
                  background: isSel ? `${ps.color}0C` : "#fff",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <div style={{ width: 9, height: 9, background: ps.color, transform: "rotate(45deg)", border: "1.5px solid white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: ps.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{ps.label}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#2B1507", lineHeight: 1.35 }}>{site.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom card */}
      {selected && (
        <div style={{
          padding: "0 0 0 0",
          background: "#F5EFE4",
          borderTop: "1px solid #DDD0B8",
          display: "flex", justifyContent: "center",
          paddingTop: 0,
        }}>
          <div style={{ width: "100%", maxWidth: 640 }}>
            <SiteCard site={selected} onClose={() => setDismissed(prev => new Set([...prev, selected.id]))} />
          </div>
        </div>
      )}
    </div>
  );
}
