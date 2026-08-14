/* Concrete HTTP adapters for replit_business_ingestion_pipeline.ts.
 * Configure provider URLs and secrets as Replit Secrets. Do not commit keys.
 * Expected provider responses should be mapped into Candidate/Evidence objects.
 */
import type { Candidate, Evidence, PageAdapter, SearchAdapter, SearchSpec, VisionAdapter } from './replit_business_ingestion_pipeline';

const now = () => new Date().toISOString();
const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing Replit secret: ${name}`);
  return value;
};

async function postJson(url: string, body: unknown, headers: Record<string,string> = {}) {
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

export class HttpBusinessSearchAdapter implements SearchAdapter {
  async search(spec: SearchSpec): Promise<Candidate[]> {
    const endpoint = required('BUSINESS_SEARCH_API_URL');
    const key = required('BUSINESS_SEARCH_API_KEY');
    const data = await postJson(endpoint, { query: spec.rawRequest, category: spec.category, city: spec.city, state: spec.state, keywords: spec.keywords }, { authorization: `Bearer ${key}` });
    return (data.results ?? []).map((r: any) => ({
      name: String(r.name ?? '').trim(), address: r.address, city: r.city ?? spec.city, state: r.state ?? spec.state,
      postalCode: r.postalCode, website: r.website, phone: r.phone, latitude: Number(r.latitude), longitude: Number(r.longitude),
      category: r.category ?? spec.category, subcategory: r.subcategory, ownershipAttributes: r.ownershipAttributes ?? [],
      sourceProvider: r.provider ?? 'business-search', sourceRecordId: r.id, sourceUrl: r.url,
      evidence: [{ sourceType: 'web_search', sourceUrl: r.url, sourceId: r.id, field: 'business_result', value: JSON.stringify(r), retrievedAt: now(), confidence: Number(r.confidence ?? 0.5) }],
    }));
  }
}

export class HttpVisionAdapter implements VisionAdapter {
  async extractBusinesses(fileUrl: string) {
    const endpoint = required('VISION_API_URL');
    const key = required('VISION_API_KEY');
    const data = await postJson(endpoint, { imageUrl: fileUrl, task: 'Extract every visible business name, address, phone, website, category, and explicit ownership claim. Do not infer ownership.' }, { authorization: `Bearer ${key}` });
    const evidence: Evidence[] = [{ sourceType: 'image', sourceUrl: fileUrl, field: 'image_extraction', value: JSON.stringify(data), retrievedAt: now(), confidence: Number(data.confidence ?? 0.5) }];
    const candidates: Candidate[] = (data.businesses ?? []).map((r: any) => ({
      name: String(r.name ?? '').trim(), address: r.address, city: r.city, state: r.state, postalCode: r.postalCode,
      website: r.website, phone: r.phone, category: r.category, subcategory: r.subcategory,
      ownershipAttributes: r.explicitOwnershipClaims ?? [], sourceProvider: 'image-vision', sourceUrl: fileUrl, evidence,
    }));
    return { candidates, evidence };
  }
}

export class SimplePageAdapter implements PageAdapter {
  async fetchAndExtract(url: string) {
    const response = await fetch(url, { headers: { 'user-agent': 'BusinessAuditBot/1.0 (+contact configured in Replit)' } });
    if (!response.ok) throw new Error(`Could not fetch ${url}: ${response.status}`);
    const html = await response.text();
    const jsonLd = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
    const text = `${title}\n${html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, ' ').replace(/\s+/g, ' ').trim()}`;
    const evidence: Evidence[] = [{ sourceType: 'official_website', sourceUrl: url, field: 'page', value: text.slice(0, 20000), retrievedAt: now(), confidence: 0.6 }];
    const candidates: Candidate[] = [];
    for (const raw of jsonLd) {
      try {
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const r of items) {
          if (!r.name) continue;
          const address = typeof r.address === 'object' ? [r.address.streetAddress, r.address.addressLocality, r.address.addressRegion, r.address.postalCode].filter(Boolean).join(', ') : r.address;
          candidates.push({ name: r.name, address, city: r.address?.addressLocality, state: r.address?.addressRegion, postalCode: r.address?.postalCode, website: r.url ?? url, phone: r.telephone, category: r.servesCuisine ?? r['@type'], sourceProvider: 'url-jsonld', sourceUrl: url, evidence: [...evidence, { sourceType: 'official_website', sourceUrl: url, field: 'jsonld', value: JSON.stringify(r), retrievedAt: now(), confidence: 0.85 }] });
        }
      } catch { /* Ignore malformed JSON-LD and retain page evidence for review. */ }
    }
    return { text, candidates, evidence };
  }
}
