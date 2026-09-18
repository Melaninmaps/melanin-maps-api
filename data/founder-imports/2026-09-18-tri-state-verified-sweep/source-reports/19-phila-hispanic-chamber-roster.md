# Source-method report: Greater Philadelphia Hispanic Chamber corporate roster

**Record count:** 273 public corporate-member records.

**Source URLs:** [Corporate membership directory](https://www.philahispanicchamber.org/membership-directory/corporate); each `directoryUrl` in the JSONL points to the corresponding publicly accessible member detail route under `https://www.philahispanicchamber.org/membership-directory/corporate/{id}`.

**Method:** The public corporate directory was fetched and its publicly rendered member links were enumerated. Each linked public detail page was traversed without login. The roster records the displayed business name, detail-page URL, and any external official website/social destination exposed as a public hyperlink on that detail page. A total of 273 linked member records were captured; 194 detail pages exposed an external destination URL.

**Field availability:** `name` and `directoryUrl` are populated for all records. `officialDestination` is populated only when a non-chamber external hyperlink was visibly exposed on the public detail page. `category`, `publicPhone`, `publicEmail`, and `publicLocationText` are blank because the fetched public member detail pages did not visibly expose member-specific category/NAICS or contact/location fields; the directory’s generic chamber footer contact information was not attributed to members.

**Limitations:** This is a source roster only, not address verification or publication-candidate creation. It excludes member-only fields, browser-login content, search snippets, and invented or inferred data. External destinations were recorded as displayed links and were not individually searched or verified. Directory contents may change after the collection date (2026-09-18), and some public pages may be dynamically rendered or incomplete in non-browser retrieval.
