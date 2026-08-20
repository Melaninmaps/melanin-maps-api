# Gate 1 Public-Art Source Review Decision

## Decision: approve **no candidates** from this manifest yet

Leave **all six checkboxes unchecked**. Do not use **Submit** with a blank or partial selection. Use **Decline** (or close the selection) with the note below, because every candidate is still marked `in_review` and every one has at least one unresolved requirement under the approved Stage 1 rules.

This is not a rejection of the works or their cultural importance. It is a decision to preserve the integrity of the first seed batch: a record should move to staging only after its precise physical location, source tier/corroboration, access status, and documented cultural context meet the shared standard.

## Candidate-by-candidate decision

| Candidate ID | Gate 1 decision | Why it must remain `in_review` | Required next evidence — read-only |
|---|---|---|---|
| `stage1-atl-auburn-avenue-bas-reliefs` | **Hold** | The candidate identity is internally inconsistent: its ID/evidence describe Brian Owens’s Sweet Auburn bas-reliefs, while the workspace view showed a `Cometh The Sun` title/artist/source. Its coordinate also conflicts with an unrelated Open Mic at Café Circa entity. The City of Atlanta page does support the Sweet Auburn work and Brian Owens, but not the current dry-run entity mapping. [1] | Reconcile title, artist, source URL, and candidate ID; obtain an official map/authoritative coordinate or field confirmation; show no conflict with the unrelated entity; then rerun the route/map dry run. |
| `stage1-phl-black-family-reunion` | **Hold** | Mural Arts supports the work, Parkside address, National Council of Negro Women commission, and African American family context, but it is the sole Tier 2 source in the submitted package. [2] | Add an independent corroborating source for artist/team/location/access, such as an artist, commissioner, municipal, archive, or other qualified cultural record. |
| `stage1-chi-paul-laurence-dunbar-monument` | **Hold** | The Chicago Park District is a strong Tier 1 source and supports Debra Hand, the monument, and the African American-history context. The submitted record nevertheless states current access/work condition is not yet verified and does not authorize staging. [3] | Add current official park/site access confirmation and verify the final pin against the monument’s exact location; then rerun the local map and refresh-safe route check. |
| `stage1-phl-our-voice-our-strength` | **Hold** | Mural Arts clearly supports the Haitian-community collaboration, location, artists, and cultural context, but it is the sole Tier 2 source in the submitted package. [4] | Add an independent corroborating source for location/access or project/artist context before it can advance. |
| `stage1-chi-indian-land-dancing` | **Hold** | The Chicago Park District supports the Native-community collaboration and Potawatomi/community-history context without identity inference. Its submitted dry-run still requires final point validation and current access/work verification. [5] | Confirm the exact public point for the Foster Street underpass rather than relying on the facility address/dry-run coordinate; add current access/status confirmation; then rerun local map placement. |
| `stage1-phl-mallkuanka` | **Hold** | Mural Arts supports Roberto Mamani Mamani’s Aymara Indigenous descent, Andean context, and project partners, but the submitted package has only this Tier 2 source. [6] | Add an independent corroborating artist, institutional, commissioner, or archive source for the location/access or documented Indigenous/Hispanic-Latine context. Preserve the source’s own terminology. |

## Exact action in the Gate 1 interface

1. Leave every candidate checkbox **unchecked**.
2. Click **Decline**, not **Submit**.
3. Paste the following note.

> **Owner Gate 1 decision — no candidates advance yet.**
>
> I am keeping all Stage 1 public-art candidates `in_review`. This is not a rejection of the artworks; it is a provenance, location, and route-quality hold.
>
> Do not edit code, schema, database rows, seed data, routes, media, map behavior, mobile, Kinfolk, preview, configuration, builds, or deployments. Do not create staging records.
>
> Return a revised non-public evidence package only after resolving the following: (1) reconcile and accurately geocode `stage1-atl-auburn-avenue-bas-reliefs` without merging it into the unrelated Open Mic entity; (2) add independent corroboration for the three Mural Arts candidates; (3) provide current public access/work confirmation and final pin validation for the Chicago monument and Foster Street underpass records; and (4) rerun duplicate, canonical-route, and local-map dry runs for every revised record.
>
> Indigenous and Hispanic/Latine context must remain source-documented and use the source’s own terminology; do not infer identity from names, imagery, neighborhood, language, or geography. Return the changed-file list as `none` and leave all candidates non-public.

## What can advance next

After Replit supplies the missing evidence, resubmit the revised manifest for a new review. The likely first records to clear will be those for which the evidence matrix establishes all of the following:

```text
exact title/work label
artist credit or explicit unconfirmed status
precise public location and validated map coordinate
current access/work status
one complete Tier 1 source OR two independent qualified sources
source-supported community/cultural context
no duplicate and a refresh-safe universal non-business canonical route
no unlicensed imagery
```

No data or implementation change is authorized by this review.

## References

[1]: https://ocaatlanta.com/archives/public_art/james-tate-carrie-steele-logan "City of Atlanta Office of Cultural Affairs — James Tate / Carrie Steele Logan"
[2]: https://muralarts.org/artworks/black-family-reunion-heavenly-hall/ "Mural Arts Philadelphia — Black Family Reunion / Heavenly Hall"
[3]: https://www.chicagoparkdistrict.com/parks-facilities/paul-laurence-dunbar-monument "Chicago Park District — Paul Laurence Dunbar Monument"
[4]: https://muralarts.org/artworks/our-voice-our-strength/ "Mural Arts Philadelphia — Our Voice, Our Strength"
[5]: https://www.chicagoparkdistrict.com/parks-facilities/indian-land-dancing-artwork "Chicago Park District — Indian Land Dancing"
[6]: https://muralarts.org/artworks/mallkuanka-vuelo-surnorte-de-colores-the-south-north-flight-of-colors/ "Mural Arts Philadelphia — MALLKUANKA"
