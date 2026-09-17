# 55-city source-backed business candidate package

This package combines one research file per configured Kinfolk launch city. A row is included only when it retained a public street address, an attributable source URL, and an official business destination (website or official social profile). Rows that did not meet those requirements were held out rather than fabricated.

The JSONL manifest is deliberately a **candidate** import, not a direct production write. Before publication, the existing founder directory workflow must: check duplicate identity; validate current links; confirm any ownership designation against its evidence URL; validate required regulated-service credentials; obtain an address-backed coordinate; and record the review decision. The current public business lifecycle, authentication, and business-claim controls remain unchanged.

Ordinary business candidates may proceed after those checks. Regulated or age-governed candidates are flagged as `regulated_review`; candidates with identity designations have a separate ownership-evidence gate. This preserves searchable, truthful directory results without treating sourced data as MWM verification.
