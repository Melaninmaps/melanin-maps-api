# Atlanta Identity and Coordinate Conflict Report

## Split decision

`stage1-atl-auburn-avenue-bas-reliefs` is **only** Brian Owens’s *Auburn Avenue Bas Reliefs*, as documented by the City of Atlanta at Auburn Avenue NE and Courtland Street NE.

Curtis Patterson’s *Cometh The Sun* is a **separate discovery lead**. It has no revised candidate ID, no approved independent package, and no route/map dry run in this Gate 1 revision. It is not included in the six-candidate manifest.

## Coordinate result

| Item | ID | Coordinate | Basis |
|---|---|---|---|
| Brian Owens work | `stage1-atl-auburn-avenue-bas-reliefs` | **No final coordinate asserted** | City source supplies an intersection, not an authoritative work-level point. |
| Old provisional intersection point | N/A | `33.7555565, -84.3842706` | Road-intersection derivation only; removed from the candidate. |
| Existing unrelated entity | `93521043-f35f-4b8e-8355-f410485032b5` | `33.75554427453884, -84.38441199426781` | Existing `map_entities` row: *Open Mic at Café Circa*, 464 Edgewood Ave SE. |

The old provisional point is **13.14 m** from the unrelated existing entity. This is a coordinate-proximity flag, not duplicate evidence.

## No-merge decision

**Do not merge.** Titles, source records, and addresses are different. No row was changed, created, merged, or hidden.

## Required next evidence

An official collection map, City-provided coordinate, or field-confirmed point must identify the physical location of the Brian Owens work. Until then, the candidate remains `in_review` and is not suitable for a public pin.