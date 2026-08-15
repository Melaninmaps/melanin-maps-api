# Kinfolk Live Regression Diagnosis

## Why the previous audit passed while production failed

The previous audit was **not a production audit**. It tested an isolated Kinfolk starter package with mocked search responses. It did not test `mappingwithmelanin.com`, its deployed `/api/kinfolk/chat` and `/api/kinfolk/transcribe` routes, reverse-proxy request limits, actual voice payloads, or Philadelphia city-alias behavior. Calling that result a confirmation of the live experience was incorrect.

The current inspection used the deployed client bundle plus the user-provided production screen. The results below are therefore specific to the live regression paths.

## Confirmed failure 1: a payload rejection is falsely labeled as a 60-second limit

The deployed client serializes a `MediaRecorder` blob into a base64 string and sends it in JSON to `POST /api/kinfolk/transcribe`. It maps **all** HTTP `413` responses to: “That clip is too long — try under 60 seconds.” The client does not send an actual duration to the server, nor does it validate actual media duration before displaying that message.

> A `413 Payload Too Large` response does not establish that audio exceeded 60 seconds. It can be caused by base64 expansion, JSON request-body limits, a proxy limit, unsupported container overhead, or a server-side byte limit.

This explains how a roughly two-second recording can be described as “over 60 seconds.” The exact source of the 413 still must be confirmed in the deployed server/proxy logs, but the client’s duration statement is already proven false and must be removed.

## Confirmed failure 2: “Philly” is not resolved before the missing-location check

The deployed client sends the raw text, `Tell me about Philly nightlife`, to `POST /api/kinfolk/chat`. It does not delete or transform `Philly`. The displayed response is a backend-generated clarification. Therefore, the regression is in the server’s local-intent/city-resolution or prompt/tool-routing path.

The backend should have recognized all of the following before it considered location missing:

| Raw phrase | Canonical location | Result required |
| --- | --- | --- |
| `Philly` | Philadelphia, Pennsylvania | Run local/nightlife retrieval immediately. |
| `Philly nightlife` | Philadelphia, Pennsylvania + nightlife category | Return nightlife information and relevant business/event results. |
| `tonight in Philly` | Philadelphia, Pennsylvania + time-sensitive event intent | Run city/event retrieval immediately. |
| `Black-owned nightlife in Philly` | Philadelphia, Pennsylvania + nightlife + Black-owned preference | Put Black-owned and diaspora-relevant options first. |

## Required invariant

A recognized location alias is a valid location. Kinfolk may ask a clarifying question only when it cannot resolve a city, metro, neighborhood, or a sufficiently precise prior location from the message/session.

For this user’s product requirement, local discovery must also apply the member’s explicit community profile before retrieval. It must not make “minority-owned” an extra burden that the user has to request after the city is already known.

## Production checks that must be run after deployment

1. Review the logs for `/api/kinfolk/transcribe` responses where `status=413`. Record `content-length`, decoded-byte count, proxy/service that returned 413, and request ID.
2. Run the text prompt `Tell me about Philly nightlife` as an unauthenticated and an authenticated user. Confirm `intentClass=local_discovery`, `location.city=Philadelphia`, `location.state=PA`, and `locationSource=alias` in server telemetry.
3. Run a verified 2-second recording. Confirm an audio duration below 60,000 ms never returns a duration-limit code. If the payload is too large, return `AUDIO_PAYLOAD_TOO_LARGE`, not a duration claim.
4. Confirm the client never asks for a location when the deterministic resolver provides one.
