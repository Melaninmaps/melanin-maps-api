const apiBase = (process.env.API_BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const webBase = (process.env.WEB_BASE_URL ?? "").replace(/\/$/, "");
const kinds = ["cultural_site", "hbcu", "festival", "community_event", "market", "public_art", "heritage_marker"];

type MapEntity = {
  id: string;
  detail_url: string;
  latitude: number;
  longitude: number;
};

async function request(url: string): Promise<Response> {
  let response: Response | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    response = await fetch(url, { redirect: "manual" });
    if (response.ok || ![500, 503].includes(response.status)) break;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  if (!response?.ok) throw new Error(`${response?.status ?? "NO_RESPONSE"} ${url}`);
  return response;
}

async function verifyKind(kind: string, city: string): Promise<number> {
  const response = await request(`${apiBase}/api/map/entities?kind=${kind}&city=${encodeURIComponent(city)}`);
  const payload = await response.json() as { items?: MapEntity[] };
  for (const item of payload.items ?? []) {
    if (!item.id || !item.detail_url || !Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
      throw new Error(`UNROUTABLE_OR_UNPINNABLE_ENTITY ${kind}:${item.id}`);
    }
    await request(`${apiBase}/api/places/${encodeURIComponent(item.id)}`);
    if (webBase) await request(`${webBase}${item.detail_url}`);
  }
  return payload.items?.length ?? 0;
}

async function main(): Promise<void> {
  const atlantaHbcus = await verifyKind("hbcu", "Atlanta");
  if (atlantaHbcus < 6) {
    throw new Error(`ATLANTA_HBCU_BASELINE_FAILED expected>=6 actual=${atlantaHbcus}`);
  }
  for (const kind of kinds) await verifyKind(kind, "Atlanta");
  console.log("UNIVERSAL_MAP_ENTITY_INTEGRITY_OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});