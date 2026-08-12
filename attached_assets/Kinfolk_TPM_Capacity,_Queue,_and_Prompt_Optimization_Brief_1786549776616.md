# Kinfolk TPM Capacity, Queue, and Prompt Optimization Brief

## Verified Capacity Finding

The production provider reported a **200,000 token-per-minute (TPM)** limit during the 30-account audit. Each failed Kinfolk request reserved approximately **11,113 to 12,344 tokens**, and the full burst therefore required roughly **333,390 to 370,320 TPM** before any safety margin.

The live source confirms why requests are that large. The base Kinfolk prompt assembly contains approximately **22,787 characters** before dynamic context and history, which is roughly 5,700 English-language tokens. The request also carries up to the last **12 conversation messages**, dynamic profile/saves/business/catalog/city/Library/Circle context, and a **1,000-token** completion limit. The provider-reported 11–12k request amount is the authoritative production measurement.

## Immediate Recommendation

Do both actions together:

1. Request or configure at least **500,000 TPM** for the production Kinfolk model before testing 30 simultaneous full-context chats without prompt reduction. This covers the observed 370,320 TPM burst plus approximately 25% headroom. Prefer **1,000,000 TPM** if real launch traffic can overlap with the 30 testers or if long conversations are expected.
2. Reduce normal chat request budget to **4,500 tokens or less**. Then 30 simultaneous chats require at most 135,000 TPM and fit within the present 200,000 TPM tier with operating headroom.

A queue alone cannot create tokens that the provider does not permit. It prevents unhandled bursts, but at the current 11–12k demand it would make many of 30 people wait more than a minute. Capacity plus reduction is required.

## Token Budget Target

| Component | Current behavior | New hard budget |
|---|---|---:|
| Base system prompt | Approx. 5,700 tokens before dynamic context | 1,500 tokens maximum, selected by intent |
| Conversation history | Last 12 raw messages | Last 4 turns or 800 tokens maximum; keep a compact rolling summary |
| Dynamic user context | Multiple unbounded/independent sections | 600 tokens maximum, selected for relevance only |
| Retrieval/evidence context | Can be added alongside other context | 600 tokens maximum; three sources/snippets maximum |
| Completion reserve | 1,000 tokens | 600 tokens for normal response; 1,000 only for explicit deep-research mode |
| Safety margin | None enforced before sending | 10% token-estimate safety margin |
| **Total request reservation** | **11,113–12,344 observed** | **4,500 maximum** |

## Required Prompt Changes

1. Split the monolithic prompt into a short universal Kinfolk core plus intent modules. Attach only one module: safety, medical/legal, business, travel, culture, or general knowledge.
2. Move smart-promotion rules, tier marketing rules, cultural phrase lists, and extensive city/catalog instructions out of every ordinary chat. Invoke them only when relevant.
3. For ordinary prompts, include at most: three saved places, three profile preferences, three relevant business results, three evidence snippets, and four recent conversation turns.
4. Replace older raw conversation messages with a compact server-side session summary of at most 400 tokens. Do not send prior assistant essays back to the model.
5. Cap serialized database-derived context before message construction. Do not rely on prompt wording alone to limit it.
6. Use a 600-token normal completion budget and ask Kinfolk to answer first, then expose “Go deeper” for follow-up detail.
7. Measure and log estimated input, reserved output, total reservation, and source-context budget on every production request.

## Token-Aware Queue: Required Design

The existing queue limits concurrent generations but does not reserve TPM before calls. Replace it with a global rolling-window token bucket.

### Configuration at Current 200k TPM

```ts
const PROVIDER_TPM_LIMIT = 200_000;
const TOKEN_BUCKET_TARGET = 160_000; // 80% safety ceiling
const MAX_REQUEST_TOKEN_RESERVATION = 4_500;
const NORMAL_MAX_OUTPUT_TOKENS = 600;
const MAX_ACTIVE_GENERATIONS = 4;
const MAX_QUEUED_REQUESTS = 30;
const MAX_QUEUE_WAIT_MS = 25_000;
const MAX_IN_FLIGHT_PER_USER = 1;
```

The queue must estimate `input_tokens + max_output_tokens + 10% margin` before dispatch. It may dispatch a request only when the rolling one-minute token ledger remains at or below `TOKEN_BUCKET_TARGET`. If not, it queues FIFO, respects one active request per user, and sends the client queue position / estimated wait. At 25 seconds, it returns a controlled HTTP 503 with `code: KINFOLK_BUSY`, `retryAfterSeconds`, and no false success content.

### Configuration if prompt reduction is delayed

If 11–12k requests remain, configure provider capacity to at least **500k TPM** and set the token-bucket target to **400k TPM**. Do not claim 30-user readiness at 200k TPM with the current prompt size.

## Response Behavior

- A genuine provider 429 becomes `503 KINFOLK_RATE_LIMITED` with `Retry-After`.
- A queue deadline becomes `503 KINFOLK_BUSY` with `Retry-After` and an honest client message such as: “Kinfolk is helping a few people right now. Your question is saved—try again in about 20 seconds.”
- The client must retain the unsent/failed question and offer a one-tap retry. It must not discard the question or show a generic internal-error message.
- Rate-limited and queued requests do not increment AI usage, community feedback, demand signals, or Library Growth signals.

## Release Tests

1. Assert the normal prompt reservation is no greater than 4,500 tokens for every audit scenario.
2. Simulate 30 concurrent requests at a 200k TPM model limit; all must either receive a real reply within the deadline or a classified `KINFOLK_BUSY` response—never HTTP 500.
3. With the optimized prompt and 200k TPM, the 30-account production audit must return 30 successful Kinfolk replies; any queued response is a launch failure for the simultaneous tester gate.
4. Verify no user has more than one active Kinfolk generation.
5. Verify all permits and token reservations release on success, 429, cancellation, timeout, parse error, and database error.
6. Log prompt reservation distributions and maximum rolling TPM during the audit.

## Decision Rule

The immediate fastest correct route is **prompt reduction plus token-aware queuing**. A provider TPM increase is the safety cushion and should be requested in parallel. After deployment, repeat the exact 1 → 5 → 15 → 30 audit; pass requires 30 successful Kinfolk responses, no pool abort, no unhandled errors, and no 503 response under the prescribed launch scenario.
