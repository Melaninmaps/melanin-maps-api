# KinfolkAI Screenshot-Defect Fix: Walkthrough

This walkthrough fixes the two failures shown in the user's screenshot:
1.  **"Brunch in DC"** misclassified as pop culture.
2.  **11-second voice message** rejected as "too long."

It also adds the **diaspora brunch context** and **audible special-voice response** requirements.

## 1. Intent Routing & Brunch Context

**File:** `routes/kinfolk.ts` (or the module containing `classifyIntent`)

**Action:** Insert the `classifyKinfolkRequest` logic *before* the generic LLM classifier.

1.  Add the `DiscoveryKind` and `KinfolkRequestDecision` types.
2.  Add the regex patterns for `LOCATION`, `OWNERSHIP`, `BRUNCH`, `FOOD`, `NIGHTLIFE`, `TRAVEL`, and `BUSINESS`.
3.  Implement `classifyKinfolkRequest(message)` to prioritize brunch and travel discovery.
4.  **Crucial:** If the decision is `clarification`, return the response immediately without calling the LLM.
5.  **Brunch Context:** Ensure the prompt sent to the LLM includes the instruction: *"Brunch may be a post-church Sunday social meal in the diaspora; treat it as a food/discovery request, not pop culture."*

## 2. Voice Duration & Transcription

**File:** `routes/kinfolk.ts` (POST `/kinfolk/transcribe`)

**Action:** Replace the duration validation and timeout message.

1.  **Accept 11 seconds:** Ensure the server does not reject based on a client-side duration estimate. Only reject if `durationSeconds > 60`.
2.  **Timeout Message:** Change the 503 timeout message from *"Try a shorter clip"* to *"Transcription timed out. Please try again or type your question."* An 11-second clip timing out is a provider issue, not a length issue.
3.  **Empty Transcript:** If transcription returns no text, return a 422 with a helpful message: *"I couldn't hear any words. Please try again or type your question."*

## 3. Audible Special-Voice Response

**File:** `routes/kinfolk.ts` (POST `/kinfolk/speak`)

**Action:** Expose the used voice and ensure playback.

1.  **Return Voice:** The JSON response must include the `voice` field (e.g., `"onyx"`) so the UI can confirm the selection.
2.  **UI Playback:** The web client must call `playKinfolkAudio(payload)` after a user gesture (like tapping "Listen") to avoid browser autoplay blocks.

## 4. Acceptance Tests (Redacted)

Replit must prove these pass against the deployed Railway app:

| Test | Input | Expected Result |
|---|---|---|
| **Brunch Intent** | "Brunch in DC" | Routes to business discovery; returns DC brunch spots. |
| **Brunch Context** | "After church brunch in Atlanta" | Recognizes diaspora context; returns Atlanta brunch spots. |
| **Clarification** | "Brunch spots?" | Returns: *"Which city or neighborhood should I search...?"* |
| **Voice Length** | 11-second recording | Reaches transcription; returns text; no "too long" error. |
| **Audible Voice** | Tap "Listen" | Audio plays in the selected voice (e.g., Onyx). |

**Proof Required:** Redacted HTTP 200 responses for all cases, a screenshot of the "Brunch in DC" results, and a confirmation that audio was heard in the browser.
