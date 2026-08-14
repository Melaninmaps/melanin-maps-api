# KinfolkAI Four-Purpose Gap Report

## Executive conclusion

KinfolkAI has important pieces of the flywheel, Library, safety, and promotion systems, but the current route does not enforce one consistent contract across all four purposes. The most important gaps are below.

| Purpose | Confirmed or likely gap | Risk |
|---|---|---|
| Flywheel | Growth capture is fire-and-forget and stores only a derived subject, but there is no visible idempotency contract in the route for repeated requests. | Repeated questions or retries can overcount learning demand and distort recommendations. |
| Flywheel | Recommendation enrichment queries `businesses` by `status = 'active'` without consistently excluding `is_duplicate` or permanently hidden records. | Engagement can point users to duplicate or hidden businesses. |
| Educational | Library actions are generated from intent/category matching, while the response `sources` array is assembled from entity/health sources and may be empty for a Library-grounded answer. | “Open in Library” can be offered without a source-backed educational answer. |
| Educational | The LLM is allowed to answer when the Library match is absent; the route does not impose one universal source requirement for factual cultural education. | Kinfolk may sound authoritative without enough evidence. |
| Safety | High-consequence provenance notes exist, but safety/community summaries need freshness, source labels, and a consistent “not emergency services” envelope. | Users can mistake community averages or generated advice for current official safety information. |
| Promotional | `smartPromotion` is parsed directly from model output without a server-side proof that the business is active, non-duplicate, source-backed, and correctly labeled. | Kinfolk can promote unsupported, duplicate, or unverified listings. |
| Promotional | The model can produce business recommendations before local enrichment; server validation is not universal for every recommendation path. | A recommendation may be generated from model knowledge rather than the MWM catalog/provider evidence. |
| Privacy | Raw session messages are persisted unless memory is disabled; growth capture is safer but the purpose boundary is not obvious at every call site. | Unnecessary retention or sensitive-topic leakage is possible if future code bypasses the helper. |

## Release principle

Kinfolk must use server-authoritative business records for promotion and discovery, source-backed Library material for education, deterministic safety envelopes for high-consequence topics, and idempotent derived events for the flywheel. A model response alone is never sufficient proof.
