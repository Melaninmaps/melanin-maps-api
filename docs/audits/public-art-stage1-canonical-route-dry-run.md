# Canonical Route Dry Run — All Revised Candidates

The existing universal non-business pattern is `/places/{map-entity-uuid}/{slug}`. No entity ID exists for any revised candidate; every URL below is a **format-only future route** and would 404 today. No route was created or called with a fabricated ID.

| Candidate | Expected slug | Format-only future route | Refresh-safe result now |
|---|---|---|---|
| `stage1-atl-auburn-avenue-bas-reliefs` | `auburn-avenue-bas-reliefs-atlanta` | `/places/{unassigned-uuid}/auburn-avenue-bas-reliefs-atlanta` | 404 risk: no entity, no final point. |
| `stage1-phl-black-family-reunion` | `black-family-reunion-heavenly-hall-philadelphia` | `/places/{unassigned-uuid}/black-family-reunion-heavenly-hall-philadelphia` | 404 risk: no entity. |
| `stage1-phl-our-voice-our-strength` | `our-voice-our-strength-philadelphia` | `/places/{unassigned-uuid}/our-voice-our-strength-philadelphia` | 404 risk: no entity. |
| `stage1-phl-mallkuanka` | `mallkuanka-vuelo-surnorte-de-colores-the-south-north-flight-of-colors-philadelphia` | `/places/{unassigned-uuid}/mallkuanka-vuelo-surnorte-de-colores-the-south-north-flight-of-colors-philadelphia` | 404 risk: no entity, conflicting label. |
| `stage1-chi-paul-laurence-dunbar-monument` | `paul-laurence-dunbar-monument-chicago` | `/places/{unassigned-uuid}/paul-laurence-dunbar-monument-chicago` | 404 risk: no entity. |
| `stage1-chi-indian-land-dancing` | `indian-land-dancing-chicago` | `/places/{unassigned-uuid}/indian-land-dancing-chicago` | 404 risk: no entity, no final pin. |

No public or non-public detail route can be refresh-tested without creating data, which is outside this authorization.