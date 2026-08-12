# Cultural-Site Learn More / Full-Page Navigation Repair

**Scope:** Fix only cultural-site outbound and internal-detail navigation. Do not touch business links, login, Kinfolk, Library, map initialization, pin data, safety content, or any unrelated routing.

## Independent findings

The authenticated live API returned **247** cultural sites with an `externalUrl`. All 247 values parsed as valid `http:` or `https:` external URLs; none were relative, malformed, unsupported, or internal MWM URLs. A representative production cultural-site page—Alabama A&M University—also rendered successfully at:

```text
/sites/35b16629-239e-4df6-b593-673eebbc8026
```

Its **Official Website** link was correctly direct to `https://www.aamu.edu`.

Therefore, there is **not** evidence of a universal external-URL data corruption problem. The reported white page is most likely either:

1. confusion between the external **Learn More** link and the internal **View Full Page** link;
2. one target external website rendering a blank/blocked page outside MWM; or
3. a route-construction edge case from raw string concatenation in the map page.

The app must make the two destinations unambiguous and make the internal route construction router-native.

---

## Exact allowed file scope

```text
artifacts/web/src/pages/map.tsx
one focused navigation test file
compiled web artifact only
```

Do not change the cultural-site database, backend route, business page, or other map behavior.

---

## Required implementation

### 1. Make the two destinations explicit

On cultural-site list cards and Google Maps info windows:

| Destination | Exact label | Required behavior |
| --- | --- | --- |
| MWM cultural-site detail | **Learn more on MWM →** or **View full cultural-site page →** | Internal SPA navigation to `/sites/:id`. |
| Cultural site’s own public website | **Official website →** | Direct external `https:`/`http:` URL in a separate safe tab. |

Do not use the same “Learn More” label for both destinations.

### 2. Use router-native internal links

`map.tsx` already imports `Link` from `wouter`. Replace raw string construction:

```tsx
<a href={`${BASE}sites/${site.id}`}>View Full Page →</a>
```

with router-native navigation:

```tsx
<Link
  href={`/sites/${site.id}`}
  className="text-[10px] font-bold mt-0.5 block hover:underline text-[#CA922B]"
  onClick={(event) => event.stopPropagation()}
>
  Learn more on MWM →
</Link>
```

This removes any deployment-base-path ambiguity and guarantees the canonical SPA route is `/sites/:id`.

### 3. Guard external URLs before rendering

Add one local helper in `map.tsx`; do not create a new global utility for this one repair.

```ts
function safePublicUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
```

For each cultural-site card and info window, render the official-site link only when `safePublicUrl(site.externalUrl)` returns a value:

```tsx
const officialUrl = safePublicUrl(site.externalUrl);

{officialUrl && (
  <a
    href={officialUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="text-[10px] font-bold mt-1 block hover:underline"
    style={{ color }}
    onClick={(event) => event.stopPropagation()}
  >
    Official website ↗
  </a>
)}
```

For the Google Maps info-window HTML string, apply the same `safePublicUrl` result before interpolation and use the explicit label **Official website ↗**.

If a public URL is invalid or absent, hide the external link. Never send the member to an empty internal page, `about:blank`, or a malformed URL.

### 4. Preserve the existing canonical detail page

Do not rename or remove `/sites/:id`. The canonical detail component already renders a cultural site and its official website link correctly. Keep the legacy `/cultural-sites/:id` redirect as a compatibility path.

---

## Required tests

| Test | Required result |
| --- | --- |
| Internal link generated for cultural site ID | Exact href is `/sites/<id>`; no reliance on `BASE + 'sites'`. |
| Valid external URL | Renders **Official website ↗** with original absolute URL, `target="_blank"`, and `rel="noopener noreferrer"`. |
| Malformed, relative, `javascript:`, or blank URL | Does not render an external-link element. |
| Representative production site | Alabama A&M internal route renders site title and official link. |
| Map cultural card | Shows two clearly different links where both destinations exist. |
| Google Maps info window | Shows only a safe external official-site link when present. |

## Required production proof

1. Changed-file list limited to `map.tsx`, the focused test, and generated web artifact.
2. Test output for every test above.
3. `/api/version` showing matching bundle hashes and `stale_bundle: false`.
4. Authenticated browser proof for one HBCU, one museum/historic site, and one cultural site without an external URL.
5. For the originally reported white page, provide the cultural-site name/ID and final destination URL in the bug note. If it is an external third-party website that itself renders blank, retain the direct safe external link and record it as a source-health issue rather than replacing it with a fake MWM page.

## Definition of done

Every cultural-site card makes its two destinations unmistakable: **Learn more on MWM** opens a valid MWM detail page, while **Official website** opens the owner/institution’s real external URL safely. No missing or invalid URL can create a white page.
